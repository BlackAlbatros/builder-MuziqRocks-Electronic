/**
 * Builds a VAST URL with parameters filled in from device and video metadata
 */
export interface VastUrlParams {
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

const BASE_VAST_URL =
  "https://vast.engagemediatv.com/?channel=8bd6fca2&publisher=a8ce40dc";

export function buildVastUrl(params: VastUrlParams = {}): string {
  console.log("[VAST URL Builder] Building VAST URL with params:", params);

  const urlParams = new URLSearchParams();

  // Add base parameters
  urlParams.append("channel", "8bd6fca2");
  urlParams.append("publisher", "a8ce40dc");

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

  // Device information
  urlParams.append("ua", params.userAgent || navigator.userAgent);
  urlParams.append("device_model", params.deviceModel || getDeviceModel());

  // Privacy parameters
  urlParams.append("gdpr", params.gdpr || "0");
  urlParams.append("gdpr_consent", params.gdprConsent || "");
  urlParams.append("us_privacy", params.usPrivacy || "1YYN");
  urlParams.append("dnt", params.dnt || "0");

  // Cache buster for freshness
  urlParams.append("cb", params.cacheBuster || String(Date.now()));

  // IP address (web cannot access this, so it's left to the ads company to fill)
  if (params.ipAddress) {
    urlParams.append("ip", params.ipAddress);
  }

  // Location (requires user permission)
  if (params.latitude && params.longitude) {
    urlParams.append("lat", params.latitude);
    urlParams.append("lon", params.longitude);
  }

  // IFA (Identifier for Advertisers - requires user permission)
  if (params.ifa) {
    urlParams.append("ifa", params.ifa);
  }

  return `${BASE_VAST_URL}&${urlParams.toString()}`;
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
