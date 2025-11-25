import type { FeedResponse } from "@shared/api";

import { Capacitor } from "@capacitor/core";

const UPSTREAM =
  "https://clickseffect.com/r7o1k1u130elect/electronicrocksr7o1k1u1303/feed/feed.json";

let fallbackCache: FeedResponse | null = null;

async function loadFallbackFeed() {
  if (fallbackCache) return fallbackCache;

  try {
    const mod = await import("@/lib/feed-fallback.json");
    fallbackCache =
      (mod as { default?: FeedResponse }).default ?? (mod as FeedResponse);
    return fallbackCache;
  } catch (err) {
    throw new Error(
      `Feed failed and local fallback could not load: ${String(
        (err as Error)?.message ?? err,
      )}`,
    );
  }
}

function isNativeCapacitor() {
  try {
    return Boolean(Capacitor?.isNativePlatform?.());
  } catch {
    return false;
  }
}

async function fetchWithTimeout(
  url: string,
  opts: RequestInit = {},
  ms = 12_000,
) {
  if (typeof AbortController === "undefined" || ms <= 0) {
    return fetch(url, opts);
  }

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);

  try {
    return await fetch(url, { ...opts, signal: ctrl.signal });
  } catch (err: any) {
    // Normalize AbortError to a regular Error so callers can handle it predictably.
    if (err?.name === "AbortError") {
      throw new Error("Fetch timed out or was aborted");
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchWithCapacitor(url: string, timeout = 12_000) {
  if (!isNativeCapacitor()) return null;
  try {
    const core = await import("@capacitor/core");
    const CapacitorHttp =
      (core as any).CapacitorHttp ?? (core as any).Plugins?.Http ?? null;
    if (!CapacitorHttp?.get) {
      return null;
    }
    const res = await CapacitorHttp.get({
      url,
      headers: { Accept: "application/json" },
      responseType: "json",
      readTimeout: timeout,
      connectTimeout: timeout,
    });
    if (res.status < 200 || res.status >= 300) {
      throw new Error(`HTTP ${res.status}`);
    }
    return res.data as FeedResponse;
  } catch (err) {
    throw new Error(
      `CapacitorHttp failed: ${String((err as Error)?.message || err)}`,
    );
  }
}

async function ensureJsonResponse(res: Response, context: string) {
  if (!res.ok) {
    let body: string | undefined;
    try {
      body = await res.text();
    } catch {}
    throw new Error(
      `${context} responded ${res.status}${body ? `: ${body.slice(0, 200)}` : ""}`,
    );
  }
  return (await res.json()) as FeedResponse;
}

export async function getFeed(): Promise<FeedResponse> {
  let proxyError: unknown;

  try {
    const res = await fetchWithTimeout("/api/feed", {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    return await ensureJsonResponse(res, "/api/feed");
  } catch (err) {
    proxyError = err;
  }

  if (isNativeCapacitor()) {
    try {
      const nativeData = await fetchWithCapacitor(UPSTREAM, 12_000);
      if (nativeData) return nativeData;
    } catch (err) {
      console.warn("Capacitor native fetch failed", err);
    }
  }

  try {
    const upstream = await fetchWithTimeout(UPSTREAM, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    return await ensureJsonResponse(upstream, "Upstream feed");
  } catch (err) {
    if (proxyError) {
      console.warn("/api/feed failed before upstream fallback", proxyError);
    }
    console.warn("Upstream feed failed, using baked fallback", err);
    return await loadFallbackFeed();
  }
}
