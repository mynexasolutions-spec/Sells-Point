import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(request) {
  const { actorId, listingId } = await request.json();
  if (!actorId || !listingId) return NextResponse.json({ error: "Missing payment details" }, { status: 400 });
  const { data, error } = await supabaseAdmin.rpc("complete_mock_promotion_payment", {
    actor_id: actorId,
    target_listing_id: listingId,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: /authorized/i.test(error.message) ? 403 : 409 });
  const { data: listing } = await supabaseAdmin.from("listings").select("*").eq("id", listingId).single();
  return NextResponse.json({ success: true, payment: data?.[0] || null, listing });
}
