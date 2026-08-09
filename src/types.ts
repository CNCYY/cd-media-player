export type MediaType = 'image' | 'video';

export interface MediaContent {
  type: MediaType;
  url: string;
  title?: string;
}

export type CDSurfaceMode = 'full' | 'center-label' | 'minimal-white';

export interface CDStyleConfig {
  surfaceImage: string | null;
  mode: CDSurfaceMode;
  opacity: number;
  labelTitle?: string;
}

export interface CDItem {
  id: string;
  cdSurfaceImage: string | null; // URL of custom uploaded image, or null for default white
  mediaUrl: string | null;       // Image or Video URL
  mediaType: MediaType;
  cdText: string;                // Text label displayed on CD
  liveVideoUrl?: string | null;  // Live Photo short video (plays on long press)
}
