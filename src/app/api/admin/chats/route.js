import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireAdminSession } from "@/lib/adminSession";

export async function GET(request) {
  const session = await requireAdminSession(request);
  if (!session.ok) return session.response;

  const { data: chats, error: chatsError } = await supabaseAdmin
    .from("chats")
    .select("*")
    .order("created_at", { ascending: false });

  if (chatsError) return NextResponse.json({ error: chatsError.message }, { status: 500 });
  if (!chats || chats.length === 0) {
    return NextResponse.json({ chats: [] });
  }

  const chatIds = chats.map((c) => c.id);
  const { data: messages } = await supabaseAdmin
    .from("messages")
    .select("id, chat_id, sender_id, text, image_url, created_at")
    .in("chat_id", chatIds)
    .order("created_at", { ascending: true });

  const { data: profiles } = await supabaseAdmin
    .from("profiles")
    .select("id, name, phone, email, avatar_url, is_banned");

  const { data: listings } = await supabaseAdmin
    .from("listings")
    .select("id, title");

  const profileMap = {};
  (profiles || []).forEach((p) => { profileMap[p.id] = p; });

  const listingMap = {};
  (listings || []).forEach((l) => { listingMap[l.id] = l; });

  const msgByChat = {};
  (messages || []).forEach((m) => {
    if (!msgByChat[m.chat_id]) msgByChat[m.chat_id] = [];
    msgByChat[m.chat_id].push(m);
  });

  const result = chats.map((c) => ({
    id: c.id,
    listingId: c.listing_id,
    listingTitle: listingMap[c.listing_id]?.title || "Unknown listing",
    participants: (c.participant_ids || []).map((pid) => ({
      id: pid,
      name: profileMap[pid]?.name || "Unknown",
      phone: profileMap[pid]?.phone || "",
      email: profileMap[pid]?.email || "",
      avatar: profileMap[pid]?.avatar_url || "",
      isBanned: profileMap[pid]?.is_banned || false,
    })),
    messageCount: (msgByChat[c.id] || []).length,
    lastMessageAt: (msgByChat[c.id] || []).length
      ? msgByChat[c.id][msgByChat[c.id].length - 1].created_at
      : c.created_at,
    messages: (msgByChat[c.id] || []).map((m) => ({
      id: m.id,
      senderId: m.sender_id,
      senderName: profileMap[m.sender_id]?.name || "Unknown",
      text: m.text,
      image: m.image_url,
      createdAt: m.created_at,
    })),
  }));

  return NextResponse.json({ chats: result });
}
