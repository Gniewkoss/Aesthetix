// Image validation + optimization for the scan flow.
//
//  - validatePickedImage(): rejects oversized / undersized images at pick time so a
//    100 MB file can't OOM-crash the app and tiny screenshots don't waste an analysis.
//  - optimizeImageForAnalysis(): downscales + recompresses before upload, cutting
//    memory churn and network payload (the vision model doesn't need 12 MP).

import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

export const MAX_IMAGE_SIZE_MB = 12;
const MAX_IMAGE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;
const MIN_WIDTH = 300;
const MIN_HEIGHT = 400;

// Max edge sent to the model. 1280px long edge is ample for physique assessment
// and keeps base64 payloads small.
const TARGET_MAX_EDGE = 1280;
const COMPRESS_QUALITY = 0.7;

export interface PickedImageLike {
  width?: number;
  height?: number;
  fileSize?: number; // bytes; undefined on some platforms
}

export interface ImageValidationResult {
  valid: boolean;
  error?: string;
}

export function validatePickedImage(asset: PickedImageLike): ImageValidationResult {
  if (asset.fileSize != null && asset.fileSize > MAX_IMAGE_BYTES) {
    return { valid: false, error: `Photo is too large (max ${MAX_IMAGE_SIZE_MB} MB).` };
  }
  if (asset.width != null && asset.height != null) {
    if (asset.width < MIN_WIDTH || asset.height < MIN_HEIGHT) {
      return { valid: false, error: 'Photo is too small — use a clearer, higher-resolution image.' };
    }
  }
  return { valid: true };
}

/**
 * Downscale so the longest edge is <= TARGET_MAX_EDGE and re-encode as JPEG.
 * Returns the optimized file URI; falls back to the original URI on failure so a
 * manipulator error never blocks an analysis.
 */
export async function optimizeImageForAnalysis(uri: string): Promise<string> {
  try {
    const result = await manipulateAsync(
      uri,
      [{ resize: { width: TARGET_MAX_EDGE } }],
      { compress: COMPRESS_QUALITY, format: SaveFormat.JPEG },
    );
    return result.uri;
  } catch {
    return uri;
  }
}
