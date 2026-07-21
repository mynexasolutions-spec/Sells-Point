import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/adminSession";
export async function GET(request) { const session = await requireAdminSession(request); return session.ok ? NextResponse.json({ user: session.profile }) : session.response; }
