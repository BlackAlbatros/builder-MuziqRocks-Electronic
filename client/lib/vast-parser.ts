/**
 * Lightweight VAST parser - extracts media URLs and tracking pixels from VAST XML
 */

export interface VastAd {
  id: string;
  title?: string;
  duration: number;
  mediaUrl: string;
  mediaType: string;
  trackingPixels: {
    impression: string[];
    start: string[];
    firstQuartile: string[];
    midpoint: string[];
    thirdQuartile: string[];
    complete: string[];
    click: string[];
  };
  clickThroughUrl?: string;
}

export interface VastResponse {
  ads: VastAd[];
  error?: string;
}

async function fetchVastXml(vastUrl: string): Promise<Document> {
  console.log("[VAST Parser] Fetching VAST from:", vastUrl);
  
  try {
    const response = await fetch(vastUrl);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const text = await response.text();
    console.log("[VAST Parser] Received VAST response, length:", text.length);
    
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, "application/xml");

    if (doc.documentElement.nodeName === "parsererror") {
      throw new Error("Failed to parse VAST XML");
    }

    return doc;
  } catch (error) {
    console.error("[VAST Parser] Failed to fetch VAST:", error);
    throw error;
  }
}

function extractTrackingPixels(
  element: Element,
  tagName: string,
): string[] {
  const urls: string[] = [];
  const elements = element.getElementsByTagName(tagName);

  for (let i = 0; i < elements.length; i++) {
    const text = elements[i].textContent?.trim();
    if (text) {
      urls.push(text);
    }
  }

  return urls;
}

function fireTrackingPixels(urls: string[]): void {
  urls.forEach((url) => {
    if (url) {
      console.log("[VAST Parser] Firing tracking pixel:", url);
      const img = new Image();
      img.src = url;
    }
  });
}

function parseInlineAd(adElement: Element): VastAd | null {
  try {
    const adId =
      adElement.getAttribute("id") || `ad_${Math.random().toString(36)}`;

    // Get Ad title
    const adTitle = adElement.querySelector("AdTitle")?.textContent || "";

    // Get Duration
    const durationStr = adElement.querySelector("Duration")?.textContent || "0";
    const duration = parseDuration(durationStr);

    // Get linear media
    const linearElement = adElement.querySelector("Linear");
    if (!linearElement) {
      console.warn("[VAST Parser] No Linear element found in ad");
      return null;
    }

    // Get MediaFile
    const mediaFile = linearElement.querySelector("MediaFile");
    if (!mediaFile) {
      console.warn("[VAST Parser] No MediaFile found");
      return null;
    }

    const mediaUrl = mediaFile.textContent?.trim() || "";
    const mediaType = mediaFile.getAttribute("type") || "video/mp4";

    if (!mediaUrl) {
      console.warn("[VAST Parser] No media URL found");
      return null;
    }

    // Get tracking pixels
    const trackingEvents = linearElement.querySelector("TrackingEvents");
    const trackingPixels = {
      impression: extractTrackingPixels(
        adElement.querySelector("Impression") || adElement,
        "Impression",
      ),
      start: trackingEvents
        ? extractTrackingPixels(trackingEvents, "Tracking")
        : [],
      firstQuartile: [],
      midpoint: [],
      thirdQuartile: [],
      complete: trackingEvents
        ? extractTrackingPixels(trackingEvents, "Tracking")
        : [],
      click: [],
    };

    // Get click through URL
    const clickThroughUrl = linearElement
      .querySelector("ClickThroughURL")
      ?.textContent?.trim();

    console.log("[VAST Parser] Parsed ad:", {
      id: adId,
      title: adTitle,
      duration,
      mediaUrl,
      mediaType,
    });

    return {
      id: adId,
      title: adTitle,
      duration,
      mediaUrl,
      mediaType,
      trackingPixels,
      clickThroughUrl,
    };
  } catch (error) {
    console.error("[VAST Parser] Error parsing inline ad:", error);
    return null;
  }
}

function parseDuration(durationStr: string): number {
  // Parse HH:MM:SS format
  const parts = durationStr.split(":");
  if (parts.length === 3) {
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    const seconds = parseInt(parts[2], 10);
    return hours * 3600 + minutes * 60 + seconds;
  }
  return 0;
}

export async function parseVast(vastUrl: string): Promise<VastResponse> {
  try {
    const doc = await fetchVastXml(vastUrl);

    const ads: VastAd[] = [];

    // Parse all Ad elements
    const adElements = doc.querySelectorAll("Ad");
    console.log("[VAST Parser] Found", adElements.length, "ad elements");

    adElements.forEach((adElement) => {
      const inlineElement = adElement.querySelector("InLine");
      if (inlineElement) {
        const ad = parseInlineAd(adElement);
        if (ad) {
          ads.push(ad);
        }
      }
    });

    if (ads.length === 0) {
      return {
        ads: [],
        error: "No valid ads found in VAST response",
      };
    }

    console.log("[VAST Parser] Successfully parsed", ads.length, "ads");
    return { ads };
  } catch (error) {
    const errorMsg = `Failed to parse VAST: ${error instanceof Error ? error.message : String(error)}`;
    console.error("[VAST Parser]", errorMsg);
    return {
      ads: [],
      error: errorMsg,
    };
  }
}

export { fireTrackingPixels };
