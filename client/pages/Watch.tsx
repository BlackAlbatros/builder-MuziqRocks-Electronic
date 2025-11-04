import { Link, useNavigate, useParams } from "react-router-dom";
import { useFeedQuery } from "@/hooks/use-feed-query";
import { toast as showToast } from "@/hooks/use-toast";
import { Capacitor } from "@capacitor/core";
import { useEffect, useRef, useState } from "react";

export default function WatchPage() {
  const navigate = useNavigate();
  const params = useParams<{ id?: string }>();
  const videoId = params.id ? decodeURIComponent(params.id) : "";
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [showHome, setShowHome] = useState(false);
  const homeLinkRef = useRef<HTMLAnchorElement | null>(null);
  const videoStateRef = useRef<{ wasPlaying: boolean; wasMuted: boolean }>({
    wasPlaying: false,
    wasMuted: false,
  });

  useEffect(() => {
    // Intercept native back button: show Home overlay instead of navigating away immediately
    const handleBackButton = async () => {
      if (Capacitor?.isNativePlatform?.()) {
        try {
          const core = await import("@capacitor/core");
          const AppClass = (core as any).App;
          if (AppClass?.addListener) {
            AppClass.addListener("backButton", (ev: any) => {
              ev?.preventDefault?.();
              setShowHome(true);
            });
          }
        } catch (err) {
          console.warn("Back button handler setup failed", err);
        }
      }
    };
    handleBackButton();

    // Show an initial debug toast on native platforms so developers know native toasts will appear
    if (Capacitor?.isNativePlatform?.()) {
      try {
        showToast({
          title: "Ad SDK (native)",
          description:
            "Native SDK will display debug toasts when ads initialize and load.",
        });
      } catch (e) {
        console.warn("Failed to show native debug toast", e);
      }
    }

    // Listen for optional in-app events from native layer (dispatched by MainActivity)
    let receivedEmAdsEvent = false;
    const onEmAdsEvent = (e: Event) => {
      try {
        receivedEmAdsEvent = true;
        const detail = (e as CustomEvent)?.detail || {};
        const eventName =
          (detail && (detail.event || detail.type || detail.eventName)) || "";
        const payload = detail && detail.payload ? detail.payload : detail;
        const message =
          typeof payload === "string"
            ? payload
            : payload?.message || payload?.description;

        // General toasts for status events
        if (
          eventName === "adsLoaded" ||
          eventName === "adLoading" ||
          eventName === "adLoadError" ||
          eventName === "sdkMissing" ||
          eventName === "sdkError" ||
          eventName === "adTapped"
        ) {
          showToast({
            title: `EMAds: ${eventName}`,
            description: message ?? JSON.stringify(payload),
          });
        }

        // Handle SDK content pause/resume requests explicitly and let web layer control video element
        if (eventName === "pauseContent") {
          try {
            const v = videoRef.current;
            if (v) {
              videoStateRef.current = {
                wasPlaying: !v.paused,
                wasMuted: v.muted,
              };
              v.pause();
              v.muted = true;
            }
          } catch (err) {
            console.warn("pauseContent handling failed", err);
          }
          return;
        } else if (eventName === "resumeContent") {
          try {
            const v = videoRef.current;
            if (v) {
              v.muted = videoStateRef.current.wasMuted;
              if (videoStateRef.current.wasPlaying && v.paused)
                v.play().catch(() => {});
            }
          } catch (err) {
            console.warn("resumeContent handling failed", err);
          }
          return;
        }

        if (eventName === "adStarted") {
          // Native SDK started an ad — show persistent overlay with countdown
          const duration =
            payload && payload.duration ? Number(payload.duration) : 30;
          setNativeAdSeconds(duration || 30);
          setNativeAdActive(true);
          // if native SDK provided an ad URL, use it
          try {
            const possibleUrl = (payload && (payload.adUrl || payload.url || payload.videoUrl)) || null;
            setNativeAdUrl(possibleUrl);
          } catch (e) {
            setNativeAdUrl(null);
          }

          // start countdown timer (single global interval slot)
          try {
            if ((window as any).__nativeAdInterval)
              clearInterval((window as any).__nativeAdInterval);
            (window as any).__nativeAdInterval = setInterval(() => {
              setNativeAdSeconds((s) => {
                if (s <= 1) {
                  clearInterval((window as any).__nativeAdInterval);
                  setNativeAdActive(false);
                  showToast({
                    title: "EMAds",
                    description: "Native ad countdown finished",
                  });
                  return 0;
                }
                return s - 1;
              });
            }, 1000);
          } catch (err) {
            console.warn("native ad interval error", err);
          }
        } else if (eventName === "adEnded") {
          setNativeAdActive(false);
          showToast({ title: "EMAds", description: "Native ad ended" });
          if ((window as any).__nativeAdInterval) {
            clearInterval((window as any).__nativeAdInterval);
            (window as any).__nativeAdInterval = undefined;
          }
        } else if (!eventName) {
          // Fallback: show a toast with any provided detail
          showToast({
            title: detail.title || "EMAds",
            description: message ?? JSON.stringify(detail),
          });
        }
      } catch (err) {
        console.warn("emads event handler error", err);
      }
    };
    window.addEventListener("emads", onEmAdsEvent as EventListener);

    // If running on native and no native ad events appear shortly, simulate a debug ad
    let simTimer: number | undefined;
    if (Capacitor?.isNativePlatform?.()) {
      simTimer = window.setTimeout(() => {
        if (!receivedEmAdsEvent) {
          // start simulated ad
          startSimulatedAd();
        }
      }, 2000);
    }

    return () => {
      window.removeEventListener("emads", onEmAdsEvent as EventListener);
      if (simTimer) window.clearTimeout(simTimer);
    };
  }, []);

  const [simAdActive, setSimAdActive] = useState(false);
  const [simAdSeconds, setSimAdSeconds] = useState(30);

  // Native SDK ad indicator (triggered by emads events from native MainActivity)
  const [nativeAdActive, setNativeAdActive] = useState(false);
  const [nativeAdSeconds, setNativeAdSeconds] = useState(30);
  const [nativeAdUrl, setNativeAdUrl] = useState<string | null>(null);
  const adVideoRef = useRef<HTMLVideoElement | null>(null);

  const DEBUG_AD_URL = (import.meta.env.VITE_DEBUG_AD_URL as string) || "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4";

  function startSimulatedAd(duration = 30, url?: string) {
    try {
      const vid = videoRef.current;
      if (vid && !vid.paused) vid.pause();
    } catch (err) {
      // ignore
    }
    setSimAdActive(true);
    setSimAdSeconds(duration || 30);
    setNativeAdUrl(url ?? null);
    showToast({
      title: "Ad (simulated)",
      description: "Debug ad playing — 30s",
    });

    // Start countdown
    const iv = window.setInterval(() => {
      setSimAdSeconds((s) => {
        if (s <= 1) {
          window.clearInterval(iv);
          setSimAdActive(false);
          try {
            const v = videoRef.current;
            if (v && v.paused) v.play();
          } catch (e) {}
          showToast({
            title: "Ad finished",
            description: "Simulated ad ended",
          });
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }

  useEffect(() => {
    if (showHome && homeLinkRef.current) {
      try {
        homeLinkRef.current.focus();
      } catch (e) {}
    }
  }, [showHome]);

  useEffect(() => {
    // Keyboard / remote handlers: Enter/Select, Pause, or Back/Escape should show Home overlay and toggle play/pause
    const onKey = (e: KeyboardEvent) => {
      const showKeys = ["Enter", "OK", "Select", " "]; // include space
      const backKeys = ["Backspace", "Escape", "BrowserBack"];
      const code = (e as any).keyCode || (e as any).which || 0;
      // Media play/pause (remote) codes: 85 (KEYCODE_MEDIA_PLAY_PAUSE), 127 (KEYCODE_MEDIA_PAUSE), 126 (play), 23 center
      const mediaKeys = [85, 127, 126, 23, 66];

      const vid = videoRef.current;
      const active = (document.activeElement as HTMLElement) || null;

      const ok = code === 23 || code === 66 || showKeys.includes(e.key);
      if (ok && active) {
        // If Home link is focused allow it to be activated by default (so navigation works)
        try {
          if (
            active.matches &&
            (active as HTMLElement).matches("[data-home-link]")
          ) {
            return; // let the browser/React Router handle click
          }
        } catch (err) {}

        e.preventDefault();
        if (vid) {
          if (vid.paused) vid.play();
          else vid.pause();
        }
        return;
      }

      if (backKeys.includes(e.key)) {
        e.preventDefault();
        // when back pressed, exit to home
        window.location.href = "/";
        return;
      }

      if (
        mediaKeys.includes(code) ||
        ["MediaPlayPause", "MediaPause", "MediaPlay"].includes(e.key)
      ) {
        e.preventDefault();
        if (vid) {
          if (vid.paused) vid.play();
          else vid.pause();
        }
        return;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;
    const onPause = () => setShowHome(true);
    const onPlay = () => setShowHome(false);
    vid.addEventListener("pause", onPause);
    vid.addEventListener("play", onPlay);
    return () => {
      vid.removeEventListener("pause", onPause);
      vid.removeEventListener("play", onPlay);
    };
  }, [videoId]);

  // Ensure video is paused/muted during native or simulated ad overlays. Use a ref to persist previous state across effect runs.
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;

    if (nativeAdActive || simAdActive) {
      try {
        videoStateRef.current = {
          wasPlaying: !vid.paused,
          wasMuted: vid.muted,
        };
        vid.pause();
        vid.muted = true;
      } catch (err) {
        console.warn("failed to pause/mute video for ad", err);
      }
    } else {
      try {
        vid.muted = videoStateRef.current.wasMuted;
        if (videoStateRef.current.wasPlaying && vid.paused) {
          vid.play().catch(() => {});
        }
      } catch (err) {
        console.warn("failed to restore video state after ad", err);
      }
    }
  }, [nativeAdActive, simAdActive]);

  const { data, isLoading, error } = useFeedQuery();

  if (!videoId) {
    return (
      <div className="container mx-auto px-4 py-6 space-y-4">
        <p className="text-destructive">Missing video identifier.</p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          ← Back to home
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return <div className="p-6">Loading…</div>;
  }

  if (error || !data) {
    return (
      <div className="container mx-auto px-4 py-6 space-y-4">
        <p className="text-destructive">Failed to load video.</p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          ← Back to home
        </Link>
      </div>
    );
  }

  const video = data.shortFormVideos.find((item) => item.id === videoId);
  if (!video) {
    return (
      <div className="container mx-auto px-4 py-6 space-y-4">
        <p className="text-destructive">Video not found.</p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          ← Back to home
        </Link>
      </div>
    );
  }

  const source = video.content?.videos?.[0]?.url;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      {source ? (
        <>
          <video
            ref={videoRef}
            key={video.id}
            controls
            autoPlay
            playsInline
            poster={video.thumbnail ?? undefined}
            className="h-full w-full"
            src={source}
          >
            Your browser does not support HTML5 video.
          </video>

          {/* Home button positioned to the left above player controls */}
          {showHome && (
            <div className="absolute left-4 bottom-20 z-60">
              <Link
                to="/"
                ref={homeLinkRef}
                data-home-link
                tabIndex={0}
                className="rounded-md bg-white/20 px-5 py-2 text-sm font-medium text-white hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white"
              >
                Home
              </Link>
            </div>
          )}

          {/* Ad overlay: shown for native SDK ad or simulated ad */}
          {(nativeAdActive || simAdActive) && (
            <div className="absolute inset-0 z-70 flex items-center justify-center bg-black/80">
              <div className="max-w-3xl w-full px-4">
                <div className="bg-black rounded-md overflow-hidden shadow-xl">
                  <video
                    ref={adVideoRef}
                    src={nativeAdActive ? (nativeAdUrl || DEBUG_AD_URL) : (nativeAdUrl || DEBUG_AD_URL)}
                    autoPlay
                    playsInline
                    controls
                    className="w-full h-auto bg-black"
                    onEnded={() => {
                      // End ad and resume content
                      setNativeAdActive(false);
                      setSimAdActive(false);
                      try {
                        const v = videoRef.current;
                        if (v && v.paused) v.play();
                      } catch (e) {}
                    }}
                    onClick={() => {
                      // simulate ad tapped
                      showToast({ title: "EMAds", description: "Ad tapped" });
                    }}
                  />
                  <div className="p-3 text-white flex items-center justify-between">
                    <div className="font-medium">
                      {nativeAdActive ? "Native SDK Ad (debug)" : "Ad (simulated)"}
                    </div>
                    <div className="text-sm opacity-90">
                      {nativeAdActive ? `${nativeAdSeconds}s` : `${simAdSeconds}s`}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center space-y-4">
          <p className="text-white">No video source available for this item.</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Home
          </Link>
        </div>
      )}
    </div>
  );
}
