import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(request) {
  const { actorId, orderId, method = "mock_emi", succeed = true } = await request.json();
  const { data: order } = await supabaseAdmin.from("orders").select("*").eq("id", orderId).eq("buyer_id", actorId).maybeSingle();
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  const reference = `SPMOCK-${Date.now().toString(36).toUpperCase()}-${order.id.slice(0, 5).toUpperCase()}`;
  await supabaseAdmin.from("mock_payments").insert({ order_id: order.id, transaction_reference: reference, amount: order.subtotal, payment_method: method, state: succeed ? "successful" : "failed" });
  const { data, error } = await supabaseAdmin.from("orders").update({ payment_status: succeed ? "paid" : "failed", status: succeed ? "paid" : "pending_payment", updated_at: new Date().toISOString() }).eq("id", order.id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ order: data, reference });
}
