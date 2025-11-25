import { useEffect, useRef, useState } from "react";
import { buildVastUrl, type VastUrlParams } from "@/lib/vast-url-builder";
import { parseVast, fireTrackingPixels, type VastAd } from "@/lib/vast-parser";

interface UseSimpleVastAdsProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  vastUrlParams?: VastUrlParams;
  onPreRollStart?: () => void;
  onPreRollEnd?: () => void;
  onMidRollStart?: () => void;
  onMidRollEnd?: () => void;
  onAdError?: (error: any) => void;
}

interface AdState {
  isPlayingAd: boolean;
  currentAd: VastAd | null;
  adStartTime: number;
}

export function useSimpleVastAds({
  videoRef,
  vastUrlParams = {},
  onPreRollStart,
  onPreRollEnd,
  onMidRollStart,
  onMidRollEnd,
  onAdError,
}: UseSimpleVastAdsProps) {
  const originalSrcRef = useRef<string>("");
  const adStateRef = useRef<AdState>({
    isPlayingAd: false,
    currentAd: null,
    adStartTime: 0,
  });
  const midRollTriggeredRef = useRef(false);
  const adTimeoutRef = useRef<NodeJS.Timeout>();

  const [isPlayingAd, setIsPlayingAd] = useState(false);
  const [adsInitialized, setAdsInitialized] = useState(false);

  useEffect(() => {
    if (!videoRef.current) {
      console.warn("[SimpleVAST] No video ref");
      return;
    }

    const initializeAds = async () => {
      try {
        console.log("[SimpleVAST] Initializing ads");
        setAdsInitialized(true);

        // Request pre-roll ads
        await requestAds(true);

        // Set up mid-roll trigger at 50%
        const video = videoRef.current!;
        const onTimeUpdate = async () => {
          if (
            !midRollTriggeredRef.current &&
            video.duration > 0 &&
            video.currentTime >= video.duration * 0.5
          ) {
            midRollTriggeredRef.current = true;
            console.log("[SimpleVAST] Triggering mid-roll at 50%");
            onMidRollStart?.();
            await requestAds(false);
          }
        };

        const onLoadedMetadata = () => {
          midRollTriggeredRef.current = false;
        };

        video.addEventListener("timeupdate", onTimeUpdate);
        video.addEventListener("loadedmetadata", onLoadedMetadata);

        return () => {
          video.removeEventListener("timeupdate", onTimeUpdate);
          video.removeEventListener("loadedmetadata", onLoadedMetadata);
        };
      } catch (error) {
        console.error("[SimpleVAST] Initialization error:", error);
        onAdError?.(error);
      }
    };

    initializeAds();
  }, [
    videoRef,
    onPreRollStart,
    onPreRollEnd,
    onMidRollStart,
    onMidRollEnd,
    onAdError,
  ]);

  const playAd = async (ad: VastAd) => {
    if (!videoRef.current) return;

    const video = videoRef.current;

    console.log("[SimpleVAST] Playing ad:", ad.id);

    // Save original source
    originalSrcRef.current = video.src;
    adStateRef.current = {
      isPlayingAd: true,
      currentAd: ad,
      adStartTime: Date.now(),
    };

    setIsPlayingAd(true);

    // Fire impression pixels
    fireTrackingPixels(ad.trackingPixels.impression);

    // Set up ad video
    video.src = ad.mediaUrl;
    video.currentTime = 0;

    // Track ad progress
    let quartilesFired = {
      start: false,
      firstQuartile: false,
      midpoint: false,
      thirdQuartile: false,
      complete: false,
    };

    const onAdTimeUpdate = () => {
      if (video.duration <= 0) return;

      const progress = video.currentTime / video.duration;

      // Fire start pixel
      if (!quartilesFired.start && progress > 0) {
        console.log("[SimpleVAST] Ad started");
        fireTrackingPixels(ad.trackingPixels.start);
        quartilesFired.start = true;
      }

      // Fire quartile pixels
      if (!quartilesFired.firstQuartile && progress >= 0.25) {
        fireTrackingPixels(ad.trackingPixels.firstQuartile);
        quartilesFired.firstQuartile = true;
      }

      if (!quartilesFired.midpoint && progress >= 0.5) {
        fireTrackingPixels(ad.trackingPixels.midpoint);
        quartilesFired.midpoint = true;
      }

      if (!quartilesFired.thirdQuartile && progress >= 0.75) {
        fireTrackingPixels(ad.trackingPixels.thirdQuartile);
        quartilesFired.thirdQuartile = true;
      }
    };

    const onAdEnded = () => {
      console.log("[SimpleVAST] Ad ended");
      fireTrackingPixels(ad.trackingPixels.complete);

      // Clean up
      video.removeEventListener("timeupdate", onAdTimeUpdate);
      video.removeEventListener("ended", onAdEnded);

      // Restore original video
      video.src = originalSrcRef.current;
      video.currentTime = 0;

      setIsPlayingAd(false);
      adStateRef.current.isPlayingAd = false;

      if (ad.trackingPixels.impression.length > 0) {
        onPreRollEnd?.();
      } else {
        onMidRollEnd?.();
      }
    };

    video.addEventListener("timeupdate", onAdTimeUpdate);
    video.addEventListener("ended", onAdEnded);

    try {
      await video.play();
    } catch (error) {
      console.error("[SimpleVAST] Failed to play ad:", error);
      onAdError?.(error);
    }
  };

  const requestAds = async (isPreRoll: boolean) => {
    console.log(
      `[SimpleVAST] Requesting ${isPreRoll ? "pre-roll" : "mid-roll"} ads`,
    );

    try {
      const vastUrl = buildVastUrl(vastUrlParams);
      console.log("[SimpleVAST] VAST URL:", vastUrl);

      const response = await parseVast(vastUrl);

      if (response.error || response.ads.length === 0) {
        console.warn("[SimpleVAST] No ads in response:", response.error);
        if (isPreRoll) {
          onPreRollEnd?.();
        } else {
          onMidRollEnd?.();
        }
        return;
      }

      // Play the first ad
      const ad = response.ads[0];
      if (isPreRoll) {
        onPreRollStart?.();
      }

      await playAd(ad);
    } catch (error) {
      console.error("[SimpleVAST] Ad request failed:", error);
      onAdError?.(error);

      if (isPreRoll) {
        onPreRollEnd?.();
      } else {
        onMidRollEnd?.();
      }
    }
  };

  const destroy = () => {
    if (adTimeoutRef.current) {
      clearTimeout(adTimeoutRef.current);
    }
  };

  return {
    adsInitialized,
    isPlayingAd,
    destroy,
  };
}
