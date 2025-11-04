import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { FeedItem } from "@shared/api";
import { slugify, formatDuration } from "@/lib/utils";
import { useFeedQuery } from "@/hooks/use-feed-query";

export default function CategoryPage() {
  const params = useParams();
  const slug = params.slug ?? "";
  const { data, isLoading, error } = useFeedQuery();
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);

  useEffect(() => {
    // Scroll to top when category page loads
    window.scrollTo(0, 0);
  }, [slug]);

  useEffect(() => {
    // Set first video in category as active
    if (data?.shortFormVideos && slug) {
      const categoryItems = data.shortFormVideos.filter((v) => {
        const tag = (v.tags?.[0] ?? "").toString();
        return slugify(tag) === slug;
      });
      if (categoryItems.length > 0) {
        setActiveVideoId(categoryItems[0].id);
      }
    }
  }, [data, slug]);

  if (isLoading) return <div className="p-6">Loading…</div>;
  if (error || !data) return <div className="p-6">Failed to load.</div>;

  const items = data.shortFormVideos.filter((v) => {
    const tag = (v.tags?.[0] ?? "").toString();
    return slugify(tag) === slug;
  });

  return (
    <main className="min-h-screen bg-gradient-to-b from-background via-background to-black/20">
      <div
        className="container mx-auto px-4 py-6"
        style={{ marginTop: "80px" }}
      >
        <div className="mb-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 mb-4"
          >
            ← Back to Home
          </Link>
        </div>
        <div className="mb-6 rounded-md bg-black/30 px-3 py-2">
          <h2 className="text-xl md:text-2xl font-bold capitalize">
            {slug.replace(/-/g, " ")}
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((item) => (
            <VideoCard
              key={item.id}
              item={item}
              isActive={activeVideoId === item.id}
              onFocus={() => setActiveVideoId(item.id)}
            />
          ))}
        </div>
      </div>
    </main>
  );
}

function VideoCard({
  item,
  isActive,
  onFocus,
}: {
  item: FeedItem;
  isActive?: boolean;
  onFocus?: () => void;
}) {
  const watchHref = `/watch/${encodeURIComponent(item.id)}`;
  return (
    <Link
      to={watchHref}
      onMouseEnter={onFocus}
      onFocus={onFocus}
      className={`group block overflow-hidden rounded-xl border transition relative ${
        isActive
          ? "border-yellow-400 shadow-lg shadow-yellow-400/50 ring-2 ring-yellow-400/50"
          : "border-border bg-card hover:shadow-lg"
      }`}
    >
      <img
        src={item.thumbnail}
        alt={item.title}
        className={`aspect-video w-full object-cover transition ${
          isActive ? "opacity-100" : "group-hover:opacity-90 opacity-85"
        }`}
      />
      <span className="absolute right-2 top-2 rounded bg-black/70 px-2 py-0.5 text-xs text-white">
        {formatDuration(item.content.duration)}
      </span>
      <div
        className={`p-3 transition ${
          isActive ? "bg-yellow-400/10" : "bg-card"
        }`}
      >
        <h3
          className={`line-clamp-2 font-medium transition ${
            isActive ? "text-yellow-300 font-bold" : "text-foreground"
          }`}
        >
          {item.title}
        </h3>
      </div>
    </Link>
  );
}
