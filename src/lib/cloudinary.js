import "server-only";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export async function uploadMedia(buffer, resourceType = "auto", folder = "sellspoint") {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { resource_type: resourceType, folder },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    stream.end(buffer);
  });
}

export function paddedListingImageUrl(publicId) {
  return cloudinary.url(publicId, {
    secure: true,
    resource_type: "image",
    transformation: [{ width: 1080, height: 1920, crop: "pad", background: "auto", quality: "auto", fetch_format: "auto" }],
  });
}

export async function listCategoryImages() {
  try {
    const result = await cloudinary.search
      .expression('resource_type:image AND (folder="sellspoint/Categories" OR asset_folder="sellspoint/Categories" OR public_id:sellspoint/Categories/*)')
      .sort_by("created_at", "desc")
      .max_results(100)
      .execute();
    return result.resources || [];
  } catch {
    const result = await cloudinary.api.resources({
      type: "upload",
      resource_type: "image",
      prefix: "sellspoint/Categories",
      max_results: 100,
    });
    return result.resources || [];
  }
}
