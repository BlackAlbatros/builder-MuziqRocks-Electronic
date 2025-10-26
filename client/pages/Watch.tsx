import { useEffect } from "react";
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
    // Keyboard / remote handlers: Enter/Select or Back/Escape should show Home overlay
    const onKey = (e: KeyboardEvent) => {
      const showKeys = ["Enter", "OK", "Select", " "]; // include space
      const backKeys = ["Backspace", "Escape", "BrowserBack"];
      if (showKeys.includes(e.key)) {
        setShowHome(true);
      }
      if (backKeys.includes(e.key)) {
        e.preventDefault();
        setShowHome(true);
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
  }, [videoRef.current]);

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
          <div className="absolute bottom-0 left-0 right-0 flex items-center gap-2 bg-gradient-to-t from-black to-transparent p-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="rounded-md bg-white/20 px-3 py-2 text-sm font-medium text-white hover:bg-white/30"
            >
              ← Back
            </button>
            <Link
              to="/"
              className="rounded-md bg-white/20 px-3 py-2 text-sm font-medium text-white hover:bg-white/30"
            >
              Home
            </Link>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center space-y-4">
          <p className="text-white">No video source available for this item.</p>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-md bg-white/20 px-3 py-2 text-sm font-medium text-white hover:bg-white/30"
          >
            ← Back
          </button>
        </div>
      )}
    </div>
  );
}
