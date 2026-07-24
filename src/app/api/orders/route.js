import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { apiFailure, apiSuccess, resolveActor } from "@/lib/apiResponse";

const validSpec = (declared = {}, selected = {}) => Object.entries(selected).every(([key, value]) => declared[key] === undefined || String(declared[key]).split("|").map((part) => part.trim()).includes(String(value)));

export async function GET(request) {
  const params = new URL(request.url).searchParams;
  const actorId = params.get("actorId");
  const auth = await resolveActor(supabaseAdmin, actorId);
  if (auth.response) return auth.response;
  const field = params.get("type") === "seller" ? "seller_id" : "buyer_id";
  const { data, error } = await supabaseAdmin.from("orders").select("*, order_items(*)").eq(field, actorId).order("created_at", { ascending: false });
  return error ? apiFailure("SERVER_ERROR") : apiSuccess({ orders: data || [] });
}

export async function POST(request) {
  const body = await request.json().catch(() => null);
  if (!body) return apiFailure("VALIDATION_ERROR");
  const auth = await resolveActor(supabaseAdmin, body.actorId);
  if (auth.response) return auth.response;
  if (!Array.isArray(body.items) || !body.items.length) return apiFailure("VALIDATION_ERROR", { fieldErrors: { items: "Add at least one item." } });

  const ids = [...new Set(body.items.map((item) => item.listingId).filter(Boolean))];
  const { data: listings, error: listingError } = await supabaseAdmin.from("listings").select("*").in("id", ids);
  if (listingError) return apiFailure("SERVER_ERROR");
  if (!listings || listings.length !== ids.length) return apiFailure("NOT_FOUND", { message: "One or more products are unavailable." });
  const rows = body.items.map((item) => ({ item, listing: listings.find((listing) => listing.id === item.listingId) }));
  if (rows.some(({ listing, item }) => !listing || listing.status !== "active" || listing.seller_id === auth.actor.id || !validSpec(listing.specifications, item.selectedSpecifications))) {
    return apiFailure("CONFLICT", { message: "A product or selected option is no longer available." });
  }
  const sellerIds = [...new Set(rows.map(({ listing }) => listing.seller_id))];
  if (sellerIds.length !== 1) return apiFailure("CONFLICT", { message: "Checkout supports items from one seller at a time." });
  const shipping = body.shipping || {};
  if (!String(shipping.name || "").trim() || !String(shipping.phone || "").trim() || !String(shipping.address || "").trim()) {
    return apiFailure("VALIDATION_ERROR", { fieldErrors: { shipping: "Add your delivery name, phone, and address." } });
  }
  const subtotal = rows.reduce((sum, { listing, item }) => sum + Number(listing.price) * Math.max(1, Number(item.quantity) || 1), 0);
  const { data: order, error } = await supabaseAdmin.from("orders").insert({
    buyer_id: auth.actor.id,
    seller_id: sellerIds[0],
    subtotal,
    emi_months: null,
    shipping_name: shipping.name.trim(),
    shipping_phone: shipping.phone.trim(),
    shipping_address: shipping.address.trim(),
  }).select().single();
  if (error) return apiFailure("SERVER_ERROR");
  const { error: itemError } = await supabaseAdmin.from("order_items").insert(rows.map(({ listing, item }) => ({
    order_id: order.id,
    listing_id: listing.id,
    title: listing.title,
    image_url: listing.images?.[0] || null,
    unit_price: listing.price,
    quantity: Math.max(1, Number(item.quantity) || 1),
    selected_specifications: item.selectedSpecifications || {},
  })));
  if (itemError) return apiFailure("SERVER_ERROR");
  if (body.clearCart) {
    const { data: cart } = await supabaseAdmin.from("carts").select("id").eq("buyer_id", auth.actor.id).maybeSingle();
    if (cart) await supabaseAdmin.from("cart_items").delete().eq("cart_id", cart.id).in("listing_id", ids);
  }
  return apiSuccess({ order }, 201);
}
