import { NextResponse } from "next/server";
import { uploadMedia } from "@/lib/cloudinary";

export async function POST(request) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const resourceType = file.type?.startsWith("video/") ? "video" : "image";
  const folder = formData.get("folder") === "sells-point/products" ? "sells-point/products" : "sellspoint";

  try {
    const result = await uploadMedia(buffer, resourceType, folder);
    return NextResponse.json({ url: result.secure_url });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Upload failed" }, { status: 500 });
  }
}
