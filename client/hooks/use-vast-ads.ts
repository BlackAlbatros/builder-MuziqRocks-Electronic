import { useEffect, useRef, useState } from "react";
import { buildVastUrl, type VastUrlParams } from "@/lib/vast-url-builder";

declare global {
  interface Window {
    google?: {
      ima?: {
        AdDisplayContainer: new (
          container: HTMLElement,
          video: HTMLVideoElement,
        ) => any;
        AdsLoader: new (container: any) => AdsLoaderType;
        ImaSdkSettings: new () => any;
        AdsRequest: new () => any;
        AdEvent: { Type: { [key: string]: string } };
        AdErrorEvent: { Type: { [key: string]: string } };
        AdsManagerLoadedEvent: { Type: { [key: string]: string } };
        ViewMode: { LINEAR: string; NONLINEAR: string };
      };
    };
  }
}

interface AdsLoaderType {
  contentComplete(): void;
  requestAds(adsRequest: any): void;
  destroy(): void;
  addEventListener(type: string, handler: Function): void;
  removeEventListener(type: string, handler: Function): void;
}

interface UseVastAdsProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  containerRef: React.RefObject<HTMLElement>;
  vastUrlParams?: VastUrlParams;
  onPreRollStart?: () => void;
  onPreRollEnd?: () => void;
  onMidRollStart?: () => void;
  onMidRollEnd?: () => void;
  onAdError?: (error: any) => void;
}

interface AdsManager {
  init(width: number, height: number, viewMode: string): void;
  start(): void;
  pause(): void;
  resume(): void;
  destroy(): void;
  getRemainingTime(): number;
  addEventListener(type: string, handler: Function): void;
  removeEventListener(type: string, handler: Function): void;
}

let imaScriptLoaded = false;
let imaScriptLoadPromise: Promise<void> | null = null;

function loadImaScript(): Promise<void> {
  if (imaScriptLoaded) return Promise.resolve();
  if (imaScriptLoadPromise) return imaScriptLoadPromise;

  imaScriptLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://imasdk.googleapis.com/js/sdkloader/ima3.js";
    script.async = true;
    script.onload = () => {
      imaScriptLoaded = true;
      resolve();
    };
    script.onerror = () => {
      reject(new Error("Failed to load IMA SDK script"));
    };
    document.head.appendChild(script);
  });

  return imaScriptLoadPromise;
}

export function useVastAds({
  videoRef,
  containerRef,
  vastUrlParams = {},
  onPreRollStart,
  onPreRollEnd,
  onMidRollStart,
  onMidRollEnd,
  onAdError,
}: UseVastAdsProps) {
  const adsManagerRef = useRef<AdsManager | null>(null);
  const adsLoaderRef = useRef<AdsLoader | null>(null);
  const adDisplayContainerRef = useRef<any>(null);
  const midRollTriggeredRef = useRef(false);
  const [adsInitialized, setAdsInitialized] = useState(false);
  const [isPlayingAd, setIsPlayingAd] = useState(false);

  useEffect(() => {
    if (!videoRef.current || !containerRef.current) return;

    const initializeAds = async () => {
      try {
        await loadImaScript();

        const google = window.google;
        if (!google?.ima) {
          throw new Error("Google IMA SDK not available");
        }

        // Create ad display container
        adDisplayContainerRef.current = new google.ima.AdDisplayContainer(
          containerRef.current,
          videoRef.current,
        );

        // Initialize SDK settings
        const settings = new google.ima.ImaSdkSettings();
        settings.setAutoPlayAdBreaks(false);

        // Create ads loader
        adsLoaderRef.current = new google.ima.AdsLoader(
          adDisplayContainerRef.current,
        );

        // Set up event listeners for ads loader
        adsLoaderRef.current.addEventListener(
          google.ima.AdsManagerLoadedEvent.Type.ADS_MANAGER_LOADED,
          onAdsManagerLoaded,
        );

        adsLoaderRef.current.addEventListener(
          google.ima.AdErrorEvent.Type.AD_ERROR,
          onAdLoaderError,
        );

        setAdsInitialized(true);

        // Request pre-roll ads
        requestAds(true);

        // Handle mid-roll ads at 50% video duration
        const onTimeUpdate = () => {
          const video = videoRef.current;
          if (
            video &&
            !midRollTriggeredRef.current &&
            video.duration > 0 &&
            video.currentTime >= video.duration * 0.5
          ) {
            midRollTriggeredRef.current = true;
            onMidRollStart?.();
            requestAds(false);
          }
        };

        const onLoadedMetadata = () => {
          // Reset mid-roll trigger when video changes
          midRollTriggeredRef.current = false;
        };

        videoRef.current.addEventListener("timeupdate", onTimeUpdate);
        videoRef.current.addEventListener("loadedmetadata", onLoadedMetadata);

        return () => {
          videoRef.current?.removeEventListener("timeupdate", onTimeUpdate);
          videoRef.current?.removeEventListener(
            "loadedmetadata",
            onLoadedMetadata,
          );
        };
      } catch (error) {
        console.error("Failed to initialize IMA SDK:", error);
        onAdError?.(error);
      }
    };

    initializeAds();
  }, [videoRef, containerRef, onPreRollStart, onPreRollEnd, onMidRollStart, onMidRollEnd, onAdError]);

  const onAdsManagerLoaded = (event: any) => {
    try {
      const google = window.google!.ima;
      const viewMode = (google as any).ViewMode?.LINEAR || "linear";

      const adsManager = event.getAdsManager(videoRef.current, viewMode);

      adsManagerRef.current = adsManager;

      // Set up ads manager event listeners
      const adEventType = (google as any).AdEvent?.Type;
      const adErrorType = (google as any).AdErrorEvent?.Type;

      if (adEventType?.STARTED) {
        adsManager.addEventListener(adEventType.STARTED, () => {
          setIsPlayingAd(true);
        });
      }

      if (adEventType?.COMPLETE) {
        adsManager.addEventListener(adEventType.COMPLETE, () => {
          setIsPlayingAd(false);
        });
      }

      if (adEventType?.ALL_ADS_COMPLETED) {
        adsManager.addEventListener(adEventType.ALL_ADS_COMPLETED, () => {
          setIsPlayingAd(false);
        });
      }

      if (adErrorType?.AD_ERROR) {
        adsManager.addEventListener(adErrorType.AD_ERROR, onAdManagerError);
      }

      // Initialize the ads manager
      try {
        adsManager.init(
          videoRef.current!.clientWidth,
          videoRef.current!.clientHeight,
          viewMode,
        );
      } catch (error) {
        console.warn("Error initializing ads manager:", error);
      }

      // Start playing ads
      try {
        adsManager.start();
      } catch (error) {
        console.warn("Could not start ads playback:", error);
      }
    } catch (error) {
      console.error("Failed to setup ads manager:", error);
      onAdError?.(error);
    }
  };

  const onAdLoaderError = (event: any) => {
    console.error("Ad loader error:", event);
    onAdError?.(event.getError());
  };

  const onAdManagerError = (event: any) => {
    console.error("Ad manager error:", event);
    onAdError?.(event);
  };

  const requestAds = (isPreRoll: boolean) => {
    if (!adsLoaderRef.current || !adDisplayContainerRef.current) {
      console.warn("Ads loader or container not initialized");
      return;
    }

    try {
      const google = window.google;
      if (!google?.ima) return;

      const adsRequest = new google.ima.AdsRequest();
      const vastUrl = buildVastUrl(vastUrlParams);
      adsRequest.adTagUrl = vastUrl;

      // Event listeners for the request
      adDisplayContainerRef.current.initialize();

      if (isPreRoll) {
        onPreRollStart?.();
      }

      adsLoaderRef.current.requestAds(adsRequest);
    } catch (error) {
      console.error("Failed to request ads:", error);
      onAdError?.(error);
    }
  };

  const destroy = () => {
    if (adsManagerRef.current) {
      try {
        adsManagerRef.current.destroy();
      } catch (error) {
        console.error("Error destroying ads manager:", error);
      }
    }
    if (adsLoaderRef.current) {
      try {
        adsLoaderRef.current.destroy();
      } catch (error) {
        console.error("Error destroying ads loader:", error);
      }
    }
  };

  return {
    adsInitialized,
    isPlayingAd,
    destroy,
  };
}
