import { NextResponse } from "next/server";
import { clearAdminCookie } from "@/lib/adminSession";
export async function POST() { return clearAdminCookie(NextResponse.json({ success: true })); }
