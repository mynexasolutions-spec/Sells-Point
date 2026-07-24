import { NextResponse } from "next/server";
import { uploadMedia } from "@/lib/cloudinary";
import { classifyMediaRatio } from "@/lib/listingMedia";

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const VIDEO_TYPES = new Set(["video/mp4", "video/webm", "video/quicktime"]);
const MAX_VIDEO_BYTES = 50 * 1024 * 1024;

export async function POST(request) {
  const formData = await request.formData();
  const file = formData.get("file");
  if (!file || typeof file.arrayBuffer !== "function") return NextResponse.json({ error: "No file provided" }, { status: 400 });

  const resourceType = file.type?.startsWith("video/") ? "video" : "image";
  if (resourceType === "image" && !IMAGE_TYPES.has(file.type)) {
    return NextResponse.json({ error: "Use a JPEG, PNG, WebP, or AVIF image." }, { status: 422 });
  }
  if (resourceType === "image" && file.size > MAX_IMAGE_BYTES) {
    return NextResponse.json({ error: "Images must be 10 MB or smaller." }, { status: 413 });
  }
  if (resourceType === "video" && (!VIDEO_TYPES.has(file.type) || file.size > MAX_VIDEO_BYTES)) {
    return NextResponse.json({ error: "Use an MP4, WebM, or MOV video no larger than 50 MB." }, { status: file.size > MAX_VIDEO_BYTES ? 413 : 422 });
  }

  const folder = formData.get("folder") === "sells-point/products" ? "sells-point/products" : "sellspoint";
  try {
    const result = await uploadMedia(Buffer.from(await file.arrayBuffer()), resourceType, folder);
    if (resourceType === "video") return NextResponse.json({ url: result.secure_url });
    const classification = classifyMediaRatio(result.width, result.height);
    const needsCrop = classification.previewMode === "padded";
    return NextResponse.json({
      url: result.secure_url,
      originalUrl: result.secure_url,
      width: result.width,
      height: result.height,
      aspectRatio: classification.aspectRatio,
      recommendedRatio: "9:16",
      previewMode: needsCrop ? "contain" : "cover",
      warning: needsCrop ? "This image is not 9:16. The complete image will be fitted inside the portrait listing frame." : null,
    });
  } catch {
    return NextResponse.json({ error: "Upload failed. Please try again." }, { status: 500 });
  }
}
