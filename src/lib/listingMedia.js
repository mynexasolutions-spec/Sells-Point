export const LISTING_MEDIA_RATIO = 9 / 16;

export function classifyMediaRatio(width, height) {
  const w = Number(width);
  const h = Number(height);
  if (!(w > 0) || !(h > 0)) return { aspectRatio: null, previewMode: "legacy" };
  const aspectRatio = w / h;
  const withinTolerance = Math.abs(aspectRatio - LISTING_MEDIA_RATIO) / LISTING_MEDIA_RATIO <= 0.05;
  return { aspectRatio, previewMode: withinTolerance ? "cover" : "padded" };
}

export function cloudinaryPaddedPreview(url) {
  if (typeof url !== "string" || !url.includes("/upload/")) return url;
  return url.replace("/upload/", "/upload/c_pad,w_1080,h_1920,b_auto,q_auto,f_auto/");
}

export function cloudinaryOriginalFromPaddedPreview(url) {
  if (typeof url !== "string" || !url.includes("/upload/")) return url;

  const [prefix, deliveryPath] = url.split("/upload/");
  const segments = deliveryPath.split("/");
  const transformationEnd = segments.findIndex((segment) => /^v\d+$/.test(segment));
  const transformationSegments = transformationEnd >= 0 ? segments.slice(0, transformationEnd) : segments.slice(0, 1);
  const isListingPad = transformationSegments.some(
    (segment) => segment.includes("c_pad") && segment.includes("w_1080") && segment.includes("h_1920")
  );

  if (!isListingPad) return url;

  const assetSegments = transformationEnd >= 0 ? segments.slice(transformationEnd) : segments.slice(1);
  return `${prefix}/upload/${assetSegments.join("/")}`;
}
