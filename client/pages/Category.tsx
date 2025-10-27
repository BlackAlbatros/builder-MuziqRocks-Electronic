import { Link, useParams } from "react-router-dom";
import type { FeedItem } from "@shared/api";
import { slugify, formatDuration } from "@/lib/utils";
import { useFeedQuery } from "@/hooks/use-feed-query";
import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";

export default function CategoryPage() {
  const params = useParams();
  const slug = params.slug ?? "";
  const { data, isLoading, error } = useFeedQuery();

  if (isLoading) return <div className="p-6">Loading…</div>;
  if (error || !data) return <div className="p-6">Failed to load.</div>;

  const items = data.shortFormVideos.filter((v) => {
    const tag = (v.tags?.[0] ?? "").toString();
    return slugify(tag) === slug;
  });

  useEffect(() => {
    // ensure we start at top and focus first card for remote navigation
    setTimeout(() => {
      window.scrollTo({ top: 0 });
      const first = document.querySelector<HTMLElement>('[data-video-card]');
      if (first) first.focus();
    }, 0);
  }, [slug]);

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6 flex items-center justify-between rounded-md bg-black/30 px-3 py-2">
        <h2 className="text-xl md:text-2xl font-bold capitalize">
          {slug.replace(/-/g, " ")}
        </h2>
        <Link
          to="/"
          className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:opacity-90"
        >
          ← Back
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {items.map((item) => (
          <VideoCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}

function VideoCard({ item }: { item: FeedItem }) {
  const watchHref = `/watch/${encodeURIComponent(item.id)}`;
  return (
    <Link
      to={watchHref}
      data-video-card
      tabIndex={0}
      className="group block overflow-hidden rounded-lg border bg-card hover:shadow-lg transition relative outline-none focus:ring-4 focus:ring-primary"
    >
      <img
        src={item.thumbnail}
        alt={item.title}
        className="aspect-video w-full object-cover group-hover:opacity-90"
      />
      <span className="absolute right-2 top-2 rounded bg-black/70 px-2 py-0.5 text-xs text-white">
        {formatDuration(item.content.duration)}
      </span>
      <div className="p-3">
        <h3 className="line-clamp-2 font-medium">{item.title}</h3>
      </div>
    </Link>
  );
}
