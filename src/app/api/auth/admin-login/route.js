import { NextResponse } from "next/server";
import { createAdminSession, setAdminCookie } from "@/lib/adminSession";
export async function POST(request) {
  const { email = "", password = "" } = await request.json();
  const session = await createAdminSession(email, password);
  if (!session) return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  return setAdminCookie(NextResponse.json({ user: session.profile }), session.token);
}
