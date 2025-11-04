import { useQuery } from "@tanstack/react-query";
import type { FeedResponse } from "@shared/api";

export function useFeedQuery() {
  return useQuery<FeedResponse>({
    queryKey: ["feed"],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      try {
        return await (await import("@/lib/feed")).getFeed();
      } catch (err) {
        console.warn('Feed query failed, falling back to local feed', err);
        try {
          const mod = await import("@/lib/feed-fallback.json");
          return (mod as any).default ?? (mod as any);
        } catch (e) {
          console.error('Failed to load local fallback feed', e);
          throw err; // rethrow original so caller can see it if needed
        }
      }
    },
  });
}
