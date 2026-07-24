import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { apiFailure, apiSuccess, resolveActor } from "@/lib/apiResponse";
import { validateListingInput } from "@/lib/listingValidation";

const WRITABLE_FIELDS = ["title", "description", "price", "original_price", "category", "subcategory_id", "specifications", "condition", "images", "video_url", "location", "latitude", "longitude", "featured", "featured_status", "status"];

async function getListing(id) {
  if (!id) return null;
  const { data } = await supabaseAdmin.from("listings").select("*").eq("id", id).maybeSingle();
  return data || null;
}

function cleanUpdates(updates = {}) {
  return Object.fromEntries(WRITABLE_FIELDS.filter((field) => Object.prototype.hasOwnProperty.call(updates, field)).map((field) => [field, updates[field]]));
}

async function validateTaxonomy(category, subcategoryId) {
  const { data: categoryRow, error } = await supabaseAdmin.from("categories").select("id").eq("id", category).maybeSingle();
  if (error) return { serverError: true };
  if (!categoryRow) return { fieldErrors: { category: "Choose a valid category." } };
  if (!subcategoryId) return {};
  const { data: subcategory, error: subError } = await supabaseAdmin.from("subcategories").select("id, category_id").eq("id", subcategoryId).maybeSingle();
  if (subError) return { serverError: true };
  if (!subcategory || subcategory.category_id !== category) return { fieldErrors: { subcategoryId: "Choose a subcategory from the selected category." } };
  return {};
}

export async function POST(request) {
  const body = await request.json().catch(() => null);
  if (!body) return apiFailure("VALIDATION_ERROR");
  const auth = await resolveActor(supabaseAdmin, body.actorId);
  if (auth.response) return auth.response;
  if (body.action !== "create") return apiFailure("VALIDATION_ERROR", { message: "Unknown listing action." });

  const checked = validateListingInput(body.listing);
  if (!checked.valid) return apiFailure("VALIDATION_ERROR", { fieldErrors: checked.fieldErrors });
  const taxonomy = await validateTaxonomy(checked.value.category, checked.value.subcategoryId);
  if (taxonomy.serverError) return apiFailure("SERVER_ERROR");
  if (taxonomy.fieldErrors) return apiFailure("VALIDATION_ERROR", { fieldErrors: taxonomy.fieldErrors });

  const listing = checked.value;
  const { data, error } = await supabaseAdmin.from("listings").insert({
    seller_id: auth.actor.id,
    title: listing.title,
    description: listing.description,
    price: listing.price,
    original_price: Number(listing.originalPrice) > 0 ? Number(listing.originalPrice) : listing.price,
    category: listing.category,
    subcategory_id: listing.subcategoryId || null,
    specifications: listing.specifications || {},
    condition: listing.condition,
    images: listing.images,
    video_url: listing.video || null,
    location: listing.location,
    latitude: listing.latitude,
    longitude: listing.longitude,
    featured: false,
    featured_status: listing.featured ? "pending" : "none",
    promotion_requested_at: listing.featured ? new Date().toISOString() : null,
    status: "active",
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    views: 0,
  }).select().single();
  if (error) return apiFailure("SERVER_ERROR");
  return apiSuccess({ listing: data }, 201);
}

export async function PATCH(request) {
  const body = await request.json().catch(() => null);
  if (!body) return apiFailure("VALIDATION_ERROR");
  const auth = await resolveActor(supabaseAdmin, body.actorId);
  if (auth.response) return auth.response;
  const listing = await getListing(body.listingId);
  if (!listing) return apiFailure("NOT_FOUND", { message: "Listing not found." });
  const ownsListing = listing.seller_id === auth.actor.id;
  if (!ownsListing && !auth.actor.is_admin) return apiFailure("NOT_FOUND", { message: "Listing not found." });

  if (body.action === "renew") {
    const { data, error } = await supabaseAdmin.from("listings").update({
      status: "active",
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    }).eq("id", listing.id).select().single();
    return error ? apiFailure("SERVER_ERROR") : apiSuccess({ listing: data });
  }

  const updates = cleanUpdates(body.updates);
  if (!Object.keys(updates).length) return apiFailure("VALIDATION_ERROR", { message: "No valid changes were supplied." });
  if (!auth.actor.is_admin) {
    const requestedPromotion = updates.featured_status === "pending";
    if (!requestedPromotion) delete updates.featured_status;
    if (updates.status && !["active", "sold"].includes(updates.status)) delete updates.status;
    if (requestedPromotion) {
      if (!["none", "rejected"].includes(listing.featured_status)) return apiFailure("CONFLICT", { message: "A promotion request is already active." });
      updates.featured = false;
      updates.promotion_requested_at = new Date().toISOString();
    }
  }
  const { data, error } = await supabaseAdmin.from("listings").update(updates).eq("id", listing.id).select().single();
  return error ? apiFailure("SERVER_ERROR") : apiSuccess({ listing: data });
}

export async function DELETE(request) {
  const body = await request.json().catch(() => null);
  if (!body) return apiFailure("VALIDATION_ERROR");
  const auth = await resolveActor(supabaseAdmin, body.actorId);
  if (auth.response) return auth.response;
  const listing = await getListing(body.listingId);
  if (!listing || (listing.seller_id !== auth.actor.id && !auth.actor.is_admin)) return apiFailure("NOT_FOUND", { message: "Listing not found." });
  const { error } = await supabaseAdmin.from("listings").delete().eq("id", listing.id);
  return error ? apiFailure("SERVER_ERROR") : apiSuccess({ deleted: true });
}
