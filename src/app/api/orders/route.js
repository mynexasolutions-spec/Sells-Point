import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

async function user(id) { const { data } = await supabaseAdmin.from("profiles").select("id, verified, is_banned").eq("id", id).maybeSingle(); return data?.verified && !data.is_banned ? data : null; }
const validSpec = (declared = {}, selected = {}) => Object.entries(selected).every(([key, value]) => declared[key] === undefined || String(declared[key]).split("|").map((v) => v.trim()).includes(String(value)));

export async function GET(request) {
  const p = new URL(request.url).searchParams, actorId = p.get("actorId"), type = p.get("type") || "buyer";
  if (!(await user(actorId))) return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  const field = type === "seller" ? "seller_id" : "buyer_id";
  const { data, error } = await supabaseAdmin.from("orders").select("*, order_items(*)").eq(field, actorId).order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ orders: data || [] });
}

export async function POST(request) {
  const { actorId, items, shipping = {}, emiMonths = null, clearCart = false } = await request.json();
  const buyer = await user(actorId);
  if (!buyer || !Array.isArray(items) || !items.length) return NextResponse.json({ error: "A signed-in buyer and items are required." }, { status: 400 });
  const ids = items.map((i) => i.listingId);
  const { data: listings } = await supabaseAdmin.from("listings").select("*").in("id", ids);
  if (!listings || listings.length !== ids.length) return NextResponse.json({ error: "One or more products are unavailable." }, { status: 400 });
  const rows = items.map((item) => ({ item, listing: listings.find((l) => l.id === item.listingId) }));
  if (rows.some(({ listing, item }) => !listing || listing.status !== "active" || listing.seller_id === buyer.id || !validSpec(listing.specifications, item.selectedSpecifications))) return NextResponse.json({ error: "A product or selected variant is no longer available." }, { status: 400 });
  const sellerIds = [...new Set(rows.map(({ listing }) => listing.seller_id))];
  if (sellerIds.length !== 1) return NextResponse.json({ error: "Mock checkout supports items from one seller at a time." }, { status: 400 });
  const subtotal = rows.reduce((sum, { listing, item }) => sum + Number(listing.price) * Math.max(1, Number(item.quantity) || 1), 0);
  const { data: order, error } = await supabaseAdmin.from("orders").insert({ buyer_id: buyer.id, seller_id: sellerIds[0], subtotal, emi_months: [3,6,9,12].includes(Number(emiMonths)) ? Number(emiMonths) : null, shipping_name: shipping.name || "", shipping_phone: shipping.phone || "", shipping_address: shipping.address || "" }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await supabaseAdmin.from("order_items").insert(rows.map(({ listing, item }) => ({ order_id: order.id, listing_id: listing.id, title: listing.title, image_url: listing.images?.[0] || null, unit_price: listing.price, quantity: Math.max(1, Number(item.quantity) || 1), selected_specifications: item.selectedSpecifications || {} })));
  if (clearCart) { const { data: cart } = await supabaseAdmin.from("carts").select("id").eq("buyer_id", buyer.id).maybeSingle(); if (cart) await supabaseAdmin.from("cart_items").delete().eq("cart_id", cart.id).in("listing_id", ids); }
  return NextResponse.json({ order });
}
