import { Link, useNavigate, useParams } from "react-router-dom";
import { useFeedQuery } from "@/hooks/use-feed-query";
import { Capacitor } from "@capacitor/core";
import { useEffect, useRef, useState } from "react";

export default function WatchPage() {
  const navigate = useNavigate();
  const params = useParams<{ id?: string }>();
  const videoId = params.id ? decodeURIComponent(params.id) : "";
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [showHome, setShowHome] = useState(false);

  useEffect(() => {
    // Intercept native back button: show Home overlay instead of navigating away immediately
    const handleBackButton = async () => {
      if (Capacitor?.isNativePlatform?.()) {
        try {
          const core = await import("@capacitor/core");
          const AppClass = (core as any).App;
          if (AppClass?.addListener) {
            const listener = AppClass.addListener("backButton", (ev: any) => {
              ev?.preventDefault?.();
              setShowHome(true);
              // do not remove listener; keep intercepting while on watch page
            });
          }
        } catch (err) {
          console.warn("Back button handler setup failed", err);
        }
      }
    };
    handleBackButton();
  }, []);

  useEffect(() => {
    // Keyboard / remote handlers: Enter/Select, Pause, or Back/Escape should show Home overlay and toggle play/pause
    const onKey = (e: KeyboardEvent) => {
      const showKeys = ["Enter", "OK", "Select", " "]; // include space
      const backKeys = ["Backspace", "Escape", "BrowserBack"];
      const code = (e as any).keyCode || (e as any).which || 0;
      // Media play/pause (remote) codes: 85 (KEYCODE_MEDIA_PLAY_PAUSE), 127 (KEYCODE_MEDIA_PAUSE), 126 (play), 23 center
      const mediaKeys = [85, 127, 126, 23, 66];

      const vid = videoRef.current;

      // Center button / Enter - toggle play/pause
      if (code === 23 || code === 66 || showKeys.includes(e.key)) {
        e.preventDefault();
        if (vid) {
          if (vid.paused) vid.play();
          else vid.pause();
        }
        return;
      }

      if (backKeys.includes(e.key)) {
        e.preventDefault();
        setShowHome(true);
        return;
      }

      if (mediaKeys.includes(code) || ["MediaPlayPause", "MediaPause", "MediaPlay"].includes(e.key)) {
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
                onClick={() => setShowHome(false)}
                className="rounded-md bg-white/20 px-5 py-2 text-sm font-medium text-white hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white"
              >
                Home
              </Link>
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
