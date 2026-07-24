import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/adminSession";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { CONTACT_CATEGORIES, CONTACT_STATUSES } from "@/lib/contact-inquiry.mjs";

function serverError() {
  return NextResponse.json({ ok: false, error: "Unable to load enquiries." }, { status: 500 });
}

export async function GET(request) {
  const session = await requireAdminSession(request);
  if (!session.ok) return session.response;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || "";
  const category = searchParams.get("category") || "";
  const search = (searchParams.get("q") || "")
    .replace(/[^\p{L}\p{N}@.+\-\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 100);
  const requestedPage = Number.parseInt(searchParams.get("page") || "0", 10);
  const page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 0;
  const pageSize = 50;
  const rangeStart = page * pageSize;

  let query = supabaseAdmin
    .from("contact_inquiries")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(rangeStart, rangeStart + pageSize - 1);

  if (CONTACT_STATUSES.includes(status)) query = query.eq("status", status);
  if (CONTACT_CATEGORIES.includes(category)) {
    query = query.eq("category", category);
  }
  if (search) {
    const pattern = `%${search}%`;
    query = query.or(
      [
        `reference_code.ilike.${pattern}`,
        `name.ilike.${pattern}`,
        `email.ilike.${pattern}`,
        `phone.ilike.${pattern}`,
        `message.ilike.${pattern}`,
      ].join(",")
    );
  }

  const { data, error, count } = await query;
  if (error) return serverError();

  return NextResponse.json({
    ok: true,
    enquiries: data || [],
    pagination: {
      page,
      pageSize,
      total: count || 0,
      hasMore: rangeStart + (data?.length || 0) < (count || 0),
    },
  });
}

export async function PATCH(request) {
  const session = await requireAdminSession(request);
  if (!session.ok) return session.response;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  const id = String(body.id || "");
  const updates = { updated_at: new Date().toISOString() };

  if (body.status !== undefined) {
    if (!CONTACT_STATUSES.includes(body.status)) {
      return NextResponse.json({ ok: false, error: "Invalid enquiry status." }, { status: 422 });
    }
    updates.status = body.status;
  }
  if (body.adminNote !== undefined) {
    const note = String(body.adminNote).trim();
    if (note.length > 4000) {
      return NextResponse.json({ ok: false, error: "Internal note is too long." }, { status: 422 });
    }
    updates.admin_note = note;
  }
  if (!id || Object.keys(updates).length === 1) {
    return NextResponse.json({ ok: false, error: "No changes supplied." }, { status: 422 });
  }

  const { data, error } = await supabaseAdmin
    .from("contact_inquiries")
    .update(updates)
    .eq("id", id)
    .select()
    .maybeSingle();

  if (error) {
    return NextResponse.json({ ok: false, error: "Unable to update enquiry." }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ ok: false, error: "Enquiry not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, enquiry: data });
}
