import type { FeedItem } from "@shared/api";
import { Banner } from "@/components/Banner";
import { Link, useSearchParams } from "react-router-dom";
import { parseDate, slugify, formatDuration } from "@/lib/utils";
import { useFeedQuery } from "@/hooks/use-feed-query";
import { useEffect } from "react";

export default function Index() {
  const { data, isLoading, error } = useFeedQuery();

  const [params] = useSearchParams();
  const q = (params.get("q") ?? "").trim().toLowerCase();

  const total = data?.shortFormVideos.length ?? 0;

  // If searching, show flat results
  let searchResults: FeedItem[] = [];
  if (q && data?.shortFormVideos) {
    searchResults = data.shortFormVideos.filter((v) => {
      const hay =
        `${v.title} ${v.shortDescription ?? ""} ${(v.tags || []).join(" ")}`.toLowerCase();
      return hay.includes(q);
    });
  }

  // Group by first tag (category)
  const byCategory = new Map<string, FeedItem[]>();
  if (!q && data?.shortFormVideos) {
    for (const item of data.shortFormVideos) {
      const tag = (item.tags?.[0] ?? "Other").toString();
      if (!byCategory.has(tag)) byCategory.set(tag, []);
      byCategory.get(tag)!.push(item);
    }
  }

  const categories = Array.from(byCategory.entries()).map(([name, items]) => ({
    name,
    slug: slugify(name),
    items: [...items].sort(
      (a, b) =>
        parseDate(b.content?.dateAdded) - parseDate(a.content?.dateAdded),
    ),
  }));

  // Focus first video on load and enable D-pad style navigation
  useEffect(() => {
    const focusFirst = () => {
      const first =
        document.querySelector<HTMLAnchorElement>("[data-video-card]");
      if (first) first.focus();
    };
    const t = setTimeout(focusFirst, 0);
    return () => clearTimeout(t);
  }, [q, data]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const container = document.querySelector<HTMLDivElement>(".container");
      if (!container) return;
      // collect focusable elements inside container (links, buttons, cards)
      const els = Array.from(
        container.querySelectorAll<HTMLElement>(
          "a[href], button, [data-video-card], [tabindex]:not([tabindex='-1'])",
        ),
      ).filter((el) => {
        const style = window.getComputedStyle(el);
        return style.display !== "none" && style.visibility !== "hidden";
      });
      if (!els.length) return;

      const active = (document.activeElement as HTMLElement) || els[0];

      const ok = ["Enter", "OK", "Select"].includes(e.key);
      if (ok && active) {
        e.preventDefault();
        (active as HTMLAnchorElement | HTMLElement).click?.();
        return;
      }

      const dir = (() => {
        if (["ArrowRight", "Right"].includes(e.key)) return { x: 1, y: 0 };
        if (["ArrowLeft", "Left"].includes(e.key)) return { x: -1, y: 0 };
        if (["ArrowDown", "Down"].includes(e.key)) return { x: 0, y: 1 };
        if (["ArrowUp", "Up"].includes(e.key)) return { x: 0, y: -1 };
        return null;
      })();
      if (!dir) return;

      e.preventDefault();
      const rects = els.map((el) => ({ el, r: el.getBoundingClientRect(), cx: el.getBoundingClientRect().left + el.getBoundingClientRect().width / 2, cy: el.getBoundingClientRect().top + el.getBoundingClientRect().height / 2 }));
      const activeRect = active.getBoundingClientRect();
      const ax = activeRect.left + activeRect.width / 2;
      const ay = activeRect.top + activeRect.height / 2;

      // Filter candidates in the direction
      const candidates = rects.filter(({ r, cx, cy }) => {
        if (dir.x === 1) return cx > ax - 1; // right
        if (dir.x === -1) return cx < ax + 1; // left
        if (dir.y === 1) return cy > ay - 1; // down
        if (dir.y === -1) return cy < ay + 1; // up
        return false;
      });
      if (!candidates.length) return;

      // score by angular/distance preference
      const scored = candidates.map((c) => {
        const dx = c.cx - ax;
        const dy = c.cy - ay;
        const dot = dx * dir.x + dy * dir.y;
        const dist = Math.hypot(dx, dy);
        const score = dot / (dist + 1e-6) - dist * 0.01;
        return { c, score };
      });
      scored.sort((a, b) => b.score - a.score);
      const best = scored[0]?.c?.el;
      if (best) best.focus();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [q, data]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-background via-background to-black/20">
      <div className="container mx-auto px-4 py-6 space-y-8">
        <Banner total={total} />

        {isLoading && <div className="p-6">Loading…</div>}
        {error && (
          <div className="p-6 text-destructive">
            Failed to load feed. Please refresh. If it persists, share
            console/network logs.
          </div>
        )}

        {q && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg md:text-xl font-bold">
                Search results for “{q}”
              </h2>
              <Link
                to="/"
                className="inline-flex items-center gap-1 rounded-md bg-secondary px-3 py-2 text-xs font-medium text-secondary-foreground hover:bg-secondary/80"
              >
                Clear
              </Link>
            </div>
            {searchResults.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No matches. Try a different keyword.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {searchResults.map((item) => (
                  <VideoCard key={item.id} item={item} />
                ))}
              </div>
            )}
          </section>
        )}

        {!q &&
          categories.map(({ name, slug, items }) => (
            <section key={slug} className="space-y-4">
              <div className="flex items-center justify-between rounded-md bg-black/30 px-3 py-2">
                <h2 className="text-lg md:text-xl font-bold">{name}</h2>
                <Link
                  to={`/category/${slug}`}
                  className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:opacity-90"
                  aria-label={`View all videos in ${name}`}
                >
                  View all
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {items.slice(0, 3).map((item) => (
                  <VideoCard key={item.id} item={item} />
                ))}
              </div>
            </section>
          ))}
      </div>
    </main>
  );
}

function VideoCard({ item }: { item: FeedItem }) {
  const watchHref = `/watch/${encodeURIComponent(item.id)}`;
  return (
    <Link
      to={watchHref}
      data-video-card
      tabIndex={0}
      className="group block overflow-hidden rounded-xl border bg-card hover:shadow-lg transition relative outline-none focus:ring-4 focus:ring-primary"
      aria-label={`Open ${item.title}`}
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
        <p className="mt-1 text-xs text-muted-foreground">
          {new Date(item.content.dateAdded).toLocaleDateString()}
        </p>
      </div>
    </Link>
  );
}
