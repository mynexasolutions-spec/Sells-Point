import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireAdminSession } from "@/lib/adminSession";

export async function POST(request) {
  const { targetUserId, action, note = "" } = await request.json();
  const session = await requireAdminSession(request);
  if (!session.ok) return session.response;
  const actorId = session.profileId;

  if (!["ban", "unban", "suspend", "unsuspend", "warn"].includes(action)) {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  if (action === "warn") {
    const { error } = await supabaseAdmin.from("notifications").insert({
      recipient_id: targetUserId,
      actor_id: actorId,
      type: "admin",
      entity_id: targetUserId,
      entity_type: "warning",
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await supabaseAdmin.from("moderation_logs").insert({
      actor_id: actorId,
      target_type: "user",
      target_id: targetUserId,
      action,
      note,
    });
    return NextResponse.json({ success: true });
  }

  const { error } = await supabaseAdmin
    .from("profiles")
    .update({ is_banned: action === "ban" || action === "suspend" })
    .eq("id", targetUserId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await supabaseAdmin.from("moderation_logs").insert({
    actor_id: actorId,
    target_type: "user",
    target_id: targetUserId,
    action,
    note,
  });
  return NextResponse.json({ success: true });
}
