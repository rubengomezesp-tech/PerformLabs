/**
 * Cloudinary delivery helper.
 *
 * The base exercise library (Free Exercise DB) and other surfaces ship with
 * remote image URLs (e.g. raw.githubusercontent.com). Instead of bulk-uploading
 * thousands of files into the (Free plan) media library, we deliver them through
 * Cloudinary's *fetch* layer: the remote image is fetched once, transformed,
 * optimized (f_auto/q_auto) and served from the CDN — with zero storage cost.
 *
 *   https://res.cloudinary.com/<cloud>/image/fetch/<transformations>/<remote_url>
 *
 * This is the single place where the image CDN lives, mirroring the recipe-image
 * resolver: callers ask for an optimized URL and never see the provider.
 */

/**
 * Read the configured cloud at call time. When no cloud is set we return the
 * remote URL untouched rather than routing it through a hardcoded foreign
 * account — so an unconfigured deploy serves images from their origin instead
 * of a Cloudinary cloud nobody owns.
 */
function cloudName(): string {
  return process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME?.trim() ?? "";
}

export type CloudinaryFetchOptions = {
  /** Target width in pixels. */
  width?: number;
  /** Target height in pixels. */
  height?: number;
  /** Crop mode. Defaults to "fill" so cards keep a consistent aspect ratio. */
  crop?: "fill" | "fit" | "limit" | "pad" | "scale";
  /** Gravity for "fill"/"pad" crops. */
  gravity?: "auto" | "center";
};

function isHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

/**
 * Wrap a remote image URL in an optimized Cloudinary fetch URL.
 *
 * Returns the original URL untouched when it can't (or shouldn't) be wrapped:
 *  - empty / not an absolute http(s) URL,
 *  - no cloud name configured,
 *  - already a Cloudinary URL (avoids double-wrapping).
 */
export function cloudinaryFetch(remoteUrl: string | null | undefined, options: CloudinaryFetchOptions = {}): string {
  const url = remoteUrl?.trim() ?? "";
  if (!url || !isHttpUrl(url)) return url;
  const cloud = cloudName();
  if (!cloud || url.includes("res.cloudinary.com")) return url;

  const { width, height, crop = "fill", gravity = "auto" } = options;

  const transforms = ["f_auto", "q_auto"];
  if (width) transforms.push(`w_${width}`);
  if (height) transforms.push(`h_${height}`);
  if (width || height) {
    transforms.push(`c_${crop}`);
    if (crop === "fill" || crop === "pad") transforms.push(`g_${gravity}`);
  }
  // Serve crisp images on retina screens.
  transforms.push("dpr_auto");

  return `https://res.cloudinary.com/${cloud}/image/fetch/${transforms.join(",")}/${encodeURI(url)}`;
}

/**
 * Pick the first usable image from an exercise's image_urls list and return an
 * optimized, card-sized Cloudinary fetch URL. Returns "" when there are none.
 */
export function exerciseCardImage(
  imageUrls: string[] | null | undefined,
  options: CloudinaryFetchOptions = {},
): string {
  const first = (imageUrls ?? []).find((value) => typeof value === "string" && value.trim().length > 0);
  if (!first) return "";
  return cloudinaryFetch(first, { width: 640, height: 480, ...options });
}

export const cloudinaryCloudName = cloudName();
