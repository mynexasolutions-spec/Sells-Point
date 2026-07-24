import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { apiFailure, apiSuccess, resolveActor } from "@/lib/apiResponse";

export async function POST(request) {
  const body = await request.json().catch(() => null);
  if (!body) return apiFailure("VALIDATION_ERROR");
  const auth = await resolveActor(supabaseAdmin, body.actorId);
  if (auth.response) return auth.response;
  const { data: order, error: orderError } = await supabaseAdmin.from("orders").select("*").eq("id", body.orderId).eq("buyer_id", auth.actor.id).maybeSingle();
  if (orderError) return apiFailure("SERVER_ERROR");
  if (!order) return apiFailure("NOT_FOUND", { message: "Order not found." });
  const reference = `SPMOCK-${Date.now().toString(36).toUpperCase()}-${order.id.slice(0, 5).toUpperCase()}`;
  const { error: paymentError } = await supabaseAdmin.from("mock_payments").insert({
    order_id: order.id,
    transaction_reference: reference,
    amount: order.subtotal,
    payment_method: body.method || "mock_card",
    state: body.succeed === false ? "failed" : "successful",
  });
  if (paymentError) return apiFailure("SERVER_ERROR");
  const succeeded = body.succeed !== false;
  const { data, error } = await supabaseAdmin.from("orders").update({
    payment_status: succeeded ? "paid" : "failed",
    status: succeeded ? "paid" : "pending_payment",
    updated_at: new Date().toISOString(),
  }).eq("id", order.id).select().single();
  return error ? apiFailure("SERVER_ERROR") : apiSuccess({ order: data, reference });
}
