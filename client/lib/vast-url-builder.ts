/**
 * Builds a VAST URL with parameters filled in from device and video metadata
 */
export interface VastUrlParams {
  baseVastUrl?: string; // VAST URL from feed (with placeholder tags)
  width?: number;
  height?: number;
  appName?: string;
  appBundle?: string;
  appURL?: string;
  appCategory?: string;
  appUid?: string;
  pubId?: string;
  country?: string;
  userAgent?: string;
  ipAddress?: string;
  latitude?: string;
  longitude?: string;
  deviceModel?: string;
  ifa?: string;
  usPrivacy?: string;
  dnt?: string;
  gdpr?: string;
  cacheBuster?: string;
  gdprConsent?: string;
}

export function buildVastUrl(params: VastUrlParams = {}): string {
  console.log("[VAST URL Builder] Building VAST URL with params:", params);

  // Use the VAST URL from the feed, or fall back to a default
  let vastUrl = params.baseVastUrl || "https://vast.engagemediatv.com/?channel=8bd6fca2&publisher=a8ce40dc";

  // Add device parameters
  urlParams.append("width", String(params.width || window.innerWidth));
  urlParams.append("height", String(params.height || window.innerHeight));
  urlParams.append("appName", params.appName || "MuziqRocks");
  urlParams.append("appBundle", params.appBundle || "rocks.muziq.electronic");
  urlParams.append("appURL", params.appURL || window.location.origin);
  urlParams.append("app_category", params.appCategory || "music");
  urlParams.append("appUid", params.appUid || generateDeviceId());
  urlParams.append("pubId", params.pubId || "muziq_rocks");

  // Geographic parameters
  urlParams.append("country", params.country || "US");

  // Prepare replacement values for placeholder tags
  const width = String(params.width || window.innerWidth);
  const height = String(params.height || window.innerHeight);
  const deviceId = generateDeviceId();
  const cacheBuster = String(params.cacheBuster || Date.now());
  const userAgent = encodeURIComponent(params.userAgent || navigator.userAgent);
  const usPrivacy = params.usPrivacy || "1YYN";
  const gdpr = params.gdpr || "0";
  const gdprConsent = params.gdprConsent || "";
  const playbackMethods = "[PLAYBACKMETHODS]";
  const continuousPlay = "[CONTINUOUSPLAY]";
  const timeSinceInteraction = "[TIMESINCEINTERACTION]";

  // Replace placeholder tags in the VAST URL
  vastUrl = vastUrl
    .replace(/\[WIDTH\]/g, width)
    .replace(/\[HEIGHT\]/g, height)
    .replace(/\[APP_NAME\]/g, params.appName || "MuziqRocks")
    .replace(/\[APP_BUNDLE_ID\]/g, params.appBundle || "rocks.muziq.electronic")
    .replace(/\[APP_STORE_URL\]/g, encodeURIComponent(params.appURL || window.location.origin))
    .replace(/\[APP_CATEGORY\]/g, params.appCategory || "music")
    .replace(/\[APP_ID\]/g, deviceId)
    .replace(/\[PUBID\]/g, params.pubId || "muziq_rocks")
    .replace(/\[COUNTRY\]/g, params.country || "US")
    .replace(/\[USER_AGENT\]/g, userAgent)
    .replace(/\[DEVICE_MODEL\]/g, params.deviceModel || getDeviceModel())
    .replace(/\[IP_ADDRESS\]/g, params.ipAddress || "")
    .replace(/\[LAT\]/g, params.latitude || "")
    .replace(/\[LON\]/g, params.longitude || "")
    .replace(/\[IFA\]/g, params.ifa || "")
    .replace(/\[US_PRIVACY\]/g, usPrivacy)
    .replace(/\[DNT\]/g, params.dnt || "0")
    .replace(/\[GDPR\]/g, gdpr)
    .replace(/\[GDPR_CONSENT\]/g, gdprConsent)
    .replace(/\[GDPR_CONSENT_78\]/g, gdprConsent) // Some systems use numbered placeholders
    .replace(/\[CACHEBUSTER\]/g, cacheBuster)
    .replace(/\[PLAYBACKMETHODS\]/g, playbackMethods)
    .replace(/\[CONTINUOUSPLAY\]/g, continuousPlay)
    .replace(/\[TIMESINCEINTERACTION\]/g, timeSinceInteraction);

  console.log("[VAST URL Builder] Final VAST URL:", vastUrl);
  return vastUrl;
}

/**
 * Generate a unique device ID for the user session
 */
function generateDeviceId(): string {
  const key = "muziq_device_id";
  let deviceId = localStorage.getItem(key);

  if (!deviceId) {
    deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(key, deviceId);
  }

  return deviceId;
}

/**
 * Get device model/type from user agent
 */
function getDeviceModel(): string {
  const ua = navigator.userAgent;

  if (/mobile/i.test(ua)) return "mobile";
  if (/tablet/i.test(ua)) return "tablet";
  if (/tv/i.test(ua)) return "tv";
  if (/roku/i.test(ua)) return "roku";

  return "desktop";
}
