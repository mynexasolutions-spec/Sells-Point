import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireAdminSession } from "@/lib/adminSession";

export async function GET(request) {
  const session = await requireAdminSession(request);
  if (!session.ok) return session.response;

  const { data, error } = await supabaseAdmin
    .from("announcements")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    if (error.code === "42P01") {
      return NextResponse.json({ announcements: [] });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ announcements: data || [] });
}

export async function POST(request) {
  const { action, announcement } = await request.json();
  const session = await requireAdminSession(request);
  if (!session.ok) return session.response;
  const actorId = session.profileId;

  if (action === "create") {
    const { title, body } = announcement || {};
    if (!title || !body) {
      return NextResponse.json({ error: "title and body are required" }, { status: 400 });
    }

    const { data: inserted, error } = await supabaseAdmin
      .from("announcements")
      .insert({ title, body, created_by: actorId, active: true })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const { data: allUsers, error: usersError } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("is_banned", false)
      .neq("id", actorId);

    if (usersError) {
      await supabaseAdmin.from("announcements").delete().eq("id", inserted.id);
      return NextResponse.json({ error: usersError.message }, { status: 500 });
    }

    let notificationsCreated = 0;
    if (allUsers && allUsers.length > 0) {
      const notifRows = allUsers.map((u) => ({
        recipient_id: u.id,
        actor_id: actorId,
        type: "admin",
        entity_id: inserted.id,
        entity_type: "announcement",
        read: false,
      }));
      const { error: notificationError } = await supabaseAdmin.from("notifications").insert(notifRows);
      if (notificationError) {
        await supabaseAdmin.from("announcements").delete().eq("id", inserted.id);
        return NextResponse.json({ error: notificationError.message }, { status: 500 });
      }
      notificationsCreated = notifRows.length;
    }

    return NextResponse.json({ success: true, announcement: inserted, notificationsCreated });
  }

  if (action === "deactivate") {
    const { id } = announcement || {};
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    const { error } = await supabaseAdmin
      .from("announcements")
      .update({ active: false })
      .eq("id", id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  if (action === "delete") {
    const { id } = announcement || {};
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    const { error } = await supabaseAdmin.from("announcements").delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
