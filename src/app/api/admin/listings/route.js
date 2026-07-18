import { NextResponse } from "next/server";
import { supabaseAdmin, isAdminActor } from "@/lib/supabaseAdmin";

export async function POST(request) {
  const { actorId, listingId, action, note = "", price } = await request.json();

  if (!(await isAdminActor(actorId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (action === "delete") {
    const { error } = await supabaseAdmin.from("listings").delete().eq("id", listingId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  const moderationStatusMap = {
    flag: "flagged",
    remove: "removed",
    restore: "active",
  };
  if (moderationStatusMap[action]) {
    const { error } = await supabaseAdmin
      .from("listings")
      .update({ status: moderationStatusMap[action], moderation_note: note })
      .eq("id", listingId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await supabaseAdmin.from("moderation_logs").insert({
      actor_id: actorId,
      target_type: "listing",
      target_id: listingId,
      action,
      note,
    });
    return NextResponse.json({ success: true });
  }

  if (action === "quote-featured") {
    const amount = Number(price);
    if (!Number.isInteger(amount) || amount <= 0) return NextResponse.json({ error: "Enter a positive whole-rupee quote" }, { status: 400 });
    const { data: listing } = await supabaseAdmin.from("listings").select("seller_id, featured_status").eq("id", listingId).single();
    if (!listing || listing.featured_status !== "pending") return NextResponse.json({ error: "Request is not pending" }, { status: 409 });
    const { error } = await supabaseAdmin.from("listings").update({ featured: false, featured_status: "awaiting_payment", promotion_price_inr: amount, promotion_quoted_at: new Date().toISOString() }).eq("id", listingId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await supabaseAdmin.from("notifications").insert({ recipient_id: listing.seller_id, actor_id: actorId, type: "featured_quote_ready", entity_id: listingId, entity_type: "listing" });
    return NextResponse.json({ success: true });
  }

  const statusMap = { "reject-featured": "rejected" };
  const featuredStatus = statusMap[action];
  if (!featuredStatus) {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("listings")
    .update({ featured_status: featuredStatus, featured: false, promotion_price_inr: null, promotion_quoted_at: null, promotion_paid_at: null, promotion_payment_reference: null })
    .eq("id", listingId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
