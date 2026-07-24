import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { apiFailure, apiSuccess, resolveActor } from "@/lib/apiResponse";

async function cartFor(buyerId) {
  const { data: existing, error: readError } = await supabaseAdmin.from("carts").select("*").eq("buyer_id", buyerId).maybeSingle();
  if (readError) return { error: true };
  if (existing) return { cart: existing };
  const { data, error } = await supabaseAdmin.from("carts").insert({ buyer_id: buyerId }).select().single();
  return error ? { error: true } : { cart: data };
}

export async function GET(request) {
  const buyerId = new URL(request.url).searchParams.get("buyerId");
  const auth = await resolveActor(supabaseAdmin, buyerId);
  if (auth.response) return auth.response;
  const result = await cartFor(buyerId);
  if (result.error) return apiFailure("SERVER_ERROR");
  const { data, error } = await supabaseAdmin.from("cart_items").select("*, listings(*)").eq("cart_id", result.cart.id).order("created_at");
  if (error) return apiFailure("SERVER_ERROR");
  return apiSuccess({ items: data || [] });
}

export async function POST(request) {
  const body = await request.json().catch(() => null);
  if (!body) return apiFailure("VALIDATION_ERROR", { message: "The cart request is invalid." });
  const auth = await resolveActor(supabaseAdmin, body.actorId);
  if (auth.response) return auth.response;
  if (!body.listingId) return apiFailure("VALIDATION_ERROR", { fieldErrors: { listingId: "Choose a listing." } });

  const { data: listing, error: listingError } = await supabaseAdmin
    .from("listings")
    .select("id, seller_id, status, expires_at")
    .eq("id", body.listingId)
    .maybeSingle();
  if (listingError) return apiFailure("SERVER_ERROR");
  if (!listing) return apiFailure("NOT_FOUND", { message: "This listing no longer exists." });
  const unavailable = listing.seller_id === auth.actor.id || listing.status !== "active" ||
    (listing.expires_at && new Date(listing.expires_at) <= new Date());
  if (unavailable) return apiFailure("CONFLICT", { message: "This item is currently unavailable." });

  const cartResult = await cartFor(auth.actor.id);
  if (cartResult.error) return apiFailure("SERVER_ERROR");
  const quantity = Math.max(1, Math.min(99, Number(body.quantity) || 1));
  const { data, error } = await supabaseAdmin
    .from("cart_items")
    .upsert({
      cart_id: cartResult.cart.id,
      listing_id: body.listingId,
      selected_specifications: body.selectedSpecifications || {},
      quantity,
      updated_at: new Date().toISOString(),
    }, { onConflict: "cart_id,listing_id" })
    .select()
    .single();
  if (error) return apiFailure("SERVER_ERROR");
  return apiSuccess({ item: data });
}

async function ownedItem(actorId, itemId) {
  if (!itemId) return null;
  const { data } = await supabaseAdmin.from("cart_items").select("id, carts!inner(buyer_id)").eq("id", itemId).maybeSingle();
  return data?.carts?.buyer_id === actorId ? data : null;
}

export async function PATCH(request) {
  const body = await request.json().catch(() => null);
  if (!body) return apiFailure("VALIDATION_ERROR");
  const auth = await resolveActor(supabaseAdmin, body.actorId);
  if (auth.response) return auth.response;
  if (!(await ownedItem(auth.actor.id, body.itemId))) return apiFailure("NOT_FOUND", { message: "Cart item not found." });
  const quantity = Number(body.quantity);
  const query = quantity <= 0
    ? supabaseAdmin.from("cart_items").delete().eq("id", body.itemId)
    : supabaseAdmin.from("cart_items").update({ quantity: Math.min(99, Math.floor(quantity)), updated_at: new Date().toISOString() }).eq("id", body.itemId);
  const { error } = await query;
  if (error) return apiFailure("SERVER_ERROR");
  return apiSuccess({ removed: quantity <= 0, quantity: quantity <= 0 ? 0 : Math.min(99, Math.floor(quantity)) });
}

export async function DELETE(request) {
  const body = await request.json().catch(() => null);
  if (!body) return apiFailure("VALIDATION_ERROR");
  const auth = await resolveActor(supabaseAdmin, body.actorId);
  if (auth.response) return auth.response;
  if (!(await ownedItem(auth.actor.id, body.itemId))) return apiFailure("NOT_FOUND", { message: "Cart item not found." });
  const { error } = await supabaseAdmin.from("cart_items").delete().eq("id", body.itemId);
  if (error) return apiFailure("SERVER_ERROR");
  return apiSuccess({ removed: true });
}
