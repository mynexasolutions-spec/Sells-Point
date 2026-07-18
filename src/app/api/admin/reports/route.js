import { NextResponse } from "next/server";
import { supabaseAdmin, isAdminActor } from "@/lib/supabaseAdmin";

export async function GET(request) {
  const actorId = request.nextUrl.searchParams.get("actorId");

  if (!(await isAdminActor(actorId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data, error } = await supabaseAdmin
    .from("reports")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ reports: data });
}

export async function POST(request) {
  const { actorId, reportId, action, note = "" } = await request.json();

  if (!(await isAdminActor(actorId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: report, error: reportError } = await supabaseAdmin.from("reports").select("*").eq("id", reportId).single();
  if (reportError || !report || report.status !== "open") return NextResponse.json({ error: "Open report not found" }, { status: 404 });
  const allowed = report.type === "listing" ? ["flag", "remove", "resolve"] : ["warn", "suspend", "resolve"];
  if (!allowed.includes(action)) return NextResponse.json({ error: "Invalid action for report type" }, { status: 400 });

  if (report.type === "listing" && action !== "resolve") {
    const status = action === "flag" ? "flagged" : "removed";
    const { error } = await supabaseAdmin.from("listings").update({ status, moderation_note: note }).eq("id", report.target_id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (report.type === "user" && action === "suspend") {
    const { error } = await supabaseAdmin.from("profiles").update({ is_banned: true }).eq("id", report.target_id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (report.type === "user" && action === "warn") {
    const { error } = await supabaseAdmin.from("notifications").insert({ recipient_id: report.target_id, actor_id: actorId, type: "admin", entity_id: report.target_id, entity_type: "user" });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (action !== "resolve") {
    await supabaseAdmin.from("moderation_logs").insert({ actor_id: actorId, target_type: report.type, target_id: report.target_id, action, note });
  }

  const { error } = await supabaseAdmin
    .from("reports")
    .update({
      status: "resolved",
      resolution_note: note,
      resolved_by: actorId,
      resolved_at: new Date().toISOString(),
      resolution_action: action,
    })
    .eq("id", reportId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await supabaseAdmin.from("moderation_logs").insert({
    actor_id: actorId,
    target_type: "report",
    target_id: reportId,
    action: `resolve_${action}`,
    note,
  });
  return NextResponse.json({ success: true });
}
