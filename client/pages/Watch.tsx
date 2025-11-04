import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useFeedQuery } from "@/hooks/use-feed-query";
import { toast as showToast } from "@/hooks/use-toast";

export default function WatchPage() {
  const navigate = useNavigate();
  const params = useParams();
  const videoId = params.id ? decodeURIComponent(params.id) : "";

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const homeLinkRef = useRef<HTMLAnchorElement | null>(null);
  const videoStateRef = useRef<{ wasPlaying: boolean; wasMuted: boolean }>({
    wasPlaying: false,
    wasMuted: false,
  });

  const [showHome, setShowHome] = useState(false);

  const { data, isLoading, error } = useFeedQuery();

  useEffect(() => {
    // Focus home link when overlay is shown
    if (showHome && homeLinkRef.current) homeLinkRef.current.focus();
  }, [showHome]);

  useEffect(() => {
    // Keyboard handlers for remote/keyboard play/pause and back
    const onKey = (e: KeyboardEvent) => {
      const backKeys = ["Backspace", "Escape", "BrowserBack"];
      const mediaKeys = [85, 127, 126, 23, 66];
      const code = (e as any).keyCode || (e as any).which || 0;
      const vid = videoRef.current;

      if (backKeys.includes(e.key)) {
        e.preventDefault();
        navigate("/");
        return;
      }

      if (
        mediaKeys.includes(code) ||
        ["MediaPlayPause", "MediaPause", "MediaPlay"].includes(e.key) ||
        ["Enter", "OK", "Select", " "].includes(e.key)
      ) {
        e.preventDefault();
        if (vid) {
          if (vid.paused) vid.play();
          else vid.pause();
        }
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate]);

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

  if (isLoading) return <div className="p-6">Loading…</div>;
  if (error || !data)
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

  const video = data.shortFormVideos.find((item) => item.id === videoId);
  if (!video)
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
