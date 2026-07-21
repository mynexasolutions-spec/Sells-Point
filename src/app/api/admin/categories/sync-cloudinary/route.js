import { NextResponse } from "next/server";
import { listCategoryImages } from "@/lib/cloudinary";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireAdminSession } from "@/lib/adminSession";

const CATEGORY_IMAGE_ALIASES = {
  "08b17b98-45f4-48b7-9ead-584238cb0a28": "appliances",
  "18d9827a-72a0-4405-8f7e-ad7947c1e327": "tablets",
  "1f42aaff-db68-47b9-8084-6ec6d5fe58d3": "realestate",
  "27c366d5-57fc-4111-9970-f3643673f521": "smartwatches",
  "2bc14610-01f2-4b2f-8b20-e39b06c5cfe7": "earbuds",
  "353a02bb-ff80-4d60-bfa5-ecc4ecabd73d": "mobiles",
  "35faef41-784e-4330-bc69-d55c99ebf89c": "cameras",
  "3d49a92c-aa7d-41fb-bc07-efb32faa3b52": "gaming",
  "4bd97bd6-0bc2-48de-9539-844b87ff5e69": "vehicles",
  "4cf44bf9-1e76-4530-908c-b8ee408e597e": "appliances",
  "92045626-2bd8-4be0-ae1b-90857ba90d31": "books",
  "9b44e114-64a7-430f-9150-ac41ae934798": "laptops",
  "a656f9b7-4ef6-4fd6-8db7-abf520a6310b": "laptops",
  "aa52430c-0e3e-481a-9109-89a4a1eb4b8e": "furniture",
  "ac042092-855e-4f84-943c-0268d2f29a85": "fashion",
  "b0fb6aca-2b3a-446f-8548-049aa7125525": "fashion",
  "c8d181fd-584b-41b4-b6aa-76d4449afa5b": "appliances",
  "e9d1a370-3076-4c75-b37b-1a7fb73c94d6": "mobiles",
  "accessories-chargers": "accessories",
  accessories: "accessories",
  "bags-briefcase": "bags",
  bags: "bags",
  "books": "books",
  "cameras": "cameras",
  "earbuds": "earbuds",
  "fashion-dress": "fashion",
  fashion: "fashion",
  "furniture-chair": "furniture",
  furniture: "furniture",
  "gaming-controller": "gaming",
  gaming: "gaming",
  "laptops-1": "laptops",
  "laptops-2": "laptops",
  laptop: "laptops",
  laptops: "laptops",
  "mobiles-iphone-1": "mobiles",
  "mobiles-iphone-2": "mobiles",
  mobile: "mobiles",
  mobiles: "mobiles",
  "real-estate": "realestate",
  realestate: "realestate",
  "smartwatches": "smartwatches",
  "speakers": "speakers",
  "tablets": "tablets",
  "tools-services": "appliances",
  appliances: "appliances",
  "vehicles-car": "vehicles",
  vehicles: "vehicles",
};

function normalizeSlug(value = "") {
  return value
    .split("/")
    .pop()
    .replace(/\.[a-z0-9]+$/i, "")
    .toLowerCase()
    .replace(/[_\s]+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

function candidateSlugs(image) {
  const values = [
    image.public_id,
    image.display_name,
    image.filename,
    image.original_filename,
    image.secure_url,
  ];
  return [...new Set(values.filter(Boolean).map(normalizeSlug).filter(Boolean))];
}

function categoryIdForImage(image, categoryIds) {
  for (const slug of candidateSlugs(image)) {
    const alias = CATEGORY_IMAGE_ALIASES[slug] || slug;
    if (categoryIds.has(alias)) return { categoryId: alias, slug };

    for (const [prefix, mappedCategoryId] of Object.entries(CATEGORY_IMAGE_ALIASES)) {
      if (slug === prefix || slug.startsWith(`${prefix}-`)) {
        if (categoryIds.has(mappedCategoryId)) return { categoryId: mappedCategoryId, slug };
      }
    }

    for (const categoryId of categoryIds) {
      if (slug === categoryId || slug.startsWith(`${categoryId}-`)) {
        return { categoryId, slug };
      }
    }
  }
  const slugs = candidateSlugs(image);
  return { categoryId: CATEGORY_IMAGE_ALIASES[slugs[0]] || slugs[0], slug: slugs[0] };
}

export async function POST(request) {
  await request.json();
  const session = await requireAdminSession(request);
  if (!session.ok) return session.response;

  const [{ data: categories, error: categoryError }, images] = await Promise.all([
    supabaseAdmin.from("categories").select("id"),
    listCategoryImages(),
  ]);

  if (categoryError) {
    return NextResponse.json({ error: categoryError.message }, { status: 500 });
  }

  const categoryIds = new Set((categories || []).map((category) => category.id));
  const updates = [];
  const skipped = [];

  for (const image of images) {
    const { categoryId, slug } = categoryIdForImage(image, categoryIds);
    if (!categoryIds.has(categoryId)) {
      skipped.push({ publicId: image.public_id, slug, categoryId });
      continue;
    }
    updates.push({ categoryId, imageUrl: image.secure_url, publicId: image.public_id, slug });
  }

  const latestByCategory = new Map();
  for (const update of updates) {
    latestByCategory.set(update.categoryId, update);
  }

  for (const update of latestByCategory.values()) {
    const { error } = await supabaseAdmin
      .from("categories")
      .update({ image_url: update.imageUrl })
      .eq("id", update.categoryId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    updated: Array.from(latestByCategory.values()),
    skipped,
  });
}
