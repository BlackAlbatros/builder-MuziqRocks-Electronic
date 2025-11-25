/**
 * Shared code between client and server
 * Useful to share types between client and server
 * and/or small pure JS functions that can be used on both client and server
 */

/**
 * Example response type for /api/demo
 */
export interface DemoResponse {
  message: string;
}

// Feed types matching the external JSON structure
export interface FeedVideoVariant {
  url: string;
  quality: string;
  videoType: string;
  bitrate: number;
}

export interface FeedItemContent {
  dateAdded: string; // ISO timestamp
  duration: number; // seconds
  videos: FeedVideoVariant[];
}

export interface FeedItem {
  id: string;
  title: string;
  shortDescription?: string;
  tags?: string[]; // categories
  genres?: string[];
  content: FeedItemContent;
  thumbnail: string;
  releaseDate?: string;
}

export interface FeedResponse {
  providerName: string;
  vastUrl?: string; // VAST ad tag URL with placeholder parameters
  lastUpdated: string;
  language: string;
  shortFormVideos: FeedItem[];
}
