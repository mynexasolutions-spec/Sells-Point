import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

async function actor(id) {
  if (!id) return null;
  const { data } = await supabaseAdmin.from("profiles").select("id, verified, is_banned").eq("id", id).maybeSingle();
  return data?.verified && !data.is_banned ? data : null;
}

async function cartFor(buyerId) {
  let { data } = await supabaseAdmin.from("carts").select("*").eq("buyer_id", buyerId).maybeSingle();
  if (!data) ({ data } = await supabaseAdmin.from("carts").insert({ buyer_id: buyerId }).select().single());
  return data;
}

export async function GET(request) {
  const buyerId = new URL(request.url).searchParams.get("buyerId");
  if (!(await actor(buyerId))) return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  const cart = await cartFor(buyerId);
  const { data, error } = await supabaseAdmin.from("cart_items").select("*, listings(*)").eq("cart_id", cart.id).order("created_at");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: data || [] });
}

export async function POST(request) {
  const { actorId, listingId, selectedSpecifications = {}, quantity = 1 } = await request.json();
  const user = await actor(actorId);
  if (!user) return NextResponse.json({ error: "Please sign in with a verified account." }, { status: 403 });
  const { data: listing } = await supabaseAdmin.from("listings").select("id, seller_id, status, expires_at").eq("id", listingId).maybeSingle();
  if (!listing || listing.seller_id === user.id || listing.status !== "active" || new Date(listing.expires_at) <= new Date()) return NextResponse.json({ error: "This item is unavailable." }, { status: 400 });
  const cart = await cartFor(user.id);
  const { data, error } = await supabaseAdmin.from("cart_items").upsert({ cart_id: cart.id, listing_id: listingId, selected_specifications: selectedSpecifications, quantity: Math.max(1, Number(quantity) || 1), updated_at: new Date().toISOString() }, { onConflict: "cart_id,listing_id" }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ item: data });
}

export async function PATCH(request) {
  const { actorId, itemId, quantity } = await request.json();
  if (!(await actor(actorId))) return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  const { data: item } = await supabaseAdmin.from("cart_items").select("id, carts!inner(buyer_id)").eq("id", itemId).maybeSingle();
  if (!item || item.carts.buyer_id !== actorId) return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  if (Number(quantity) <= 0) await supabaseAdmin.from("cart_items").delete().eq("id", itemId);
  else await supabaseAdmin.from("cart_items").update({ quantity: Number(quantity), updated_at: new Date().toISOString() }).eq("id", itemId);
  return NextResponse.json({ success: true });
}

export async function DELETE(request) {
  const { actorId, itemId } = await request.json();
  if (!(await actor(actorId))) return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  const { data: item } = await supabaseAdmin.from("cart_items").select("id, carts!inner(buyer_id)").eq("id", itemId).maybeSingle();
  if (!item || item.carts.buyer_id !== actorId) return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  await supabaseAdmin.from("cart_items").delete().eq("id", itemId);
  return NextResponse.json({ success: true });
}
