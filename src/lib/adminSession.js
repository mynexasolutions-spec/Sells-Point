import "server-only";
import crypto from "crypto";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const ADMIN_COOKIE = "sellspoint_admin_session";
const SESSION_SECONDS = 8 * 60 * 60;

function config() {
  return { email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD, secret: process.env.ADMIN_SESSION_SECRET };
}
function signature(value, secret) { return crypto.createHmac("sha256", secret).update(value).digest("base64url"); }
function safeEqual(a, b) {
  const left = crypto.createHash("sha256").update(a || "").digest();
  const right = crypto.createHash("sha256").update(b || "").digest();
  return crypto.timingSafeEqual(left, right);
}
function issueToken(profileId, secret) {
  const payload = Buffer.from(JSON.stringify({ sub: profileId, exp: Math.floor(Date.now() / 1000) + SESSION_SECONDS })).toString("base64url");
  return `${payload}.${signature(payload, secret)}`;
}
function readToken(token, secret) {
  const [payload, signed] = (token || "").split(".");
  if (!payload || !signed || !safeEqual(signature(payload, secret), signed)) return null;
  try { const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")); return data.exp > Math.floor(Date.now() / 1000) ? data : null; } catch { return null; }
}
async function getAdminProfile(profileId, email) {
  let query = supabaseAdmin.from("profiles").select("*");
  query = profileId ? query.eq("id", profileId) : query.eq("email", email);
  const { data } = await query.maybeSingle();
  return data?.is_admin && data.email?.toLowerCase() === email.toLowerCase() ? data : null;
}
export async function createAdminSession(email, password) {
  const { email: expectedEmail, password: expectedPassword, secret } = config();
  if (!expectedEmail || !expectedPassword || !secret || !safeEqual(email.trim().toLowerCase(), expectedEmail.trim().toLowerCase()) || !safeEqual(password, expectedPassword)) return null;
  let profile = await getAdminProfile(null, expectedEmail);
  if (!profile) {
    const normalizedEmail = expectedEmail.trim().toLowerCase();
    const { data: existing } = await supabaseAdmin.from("profiles").select("id, avatar_url").eq("email", normalizedEmail).maybeSingle();
    const query = existing
      ? supabaseAdmin.from("profiles").update({ is_admin: true, verified: true, ...(existing.avatar_url ? {} : { avatar_url: `https://i.pravatar.cc/150?u=${encodeURIComponent(normalizedEmail)}` }) }).eq("id", existing.id)
      : supabaseAdmin.from("profiles").insert({ phone: null, email: normalizedEmail, name: "Administrator", location: "India", verified: true, is_admin: true, avatar_url: `https://i.pravatar.cc/150?u=${encodeURIComponent(normalizedEmail)}` });
    const { data, error } = await query.select().single();
    if (error) return null;
    profile = data;
  }
  if (!profile.avatar_url) {
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .update({ avatar_url: `https://i.pravatar.cc/150?u=${encodeURIComponent(expectedEmail.trim().toLowerCase())}` })
      .eq("id", profile.id)
      .select()
      .single();
    if (error) return null;
    profile = data;
  }
  return profile ? { profile, token: issueToken(profile.id, secret) } : null;
}
export async function requireAdminSession(request) {
  const { email, secret } = config();
  const token = readToken(request.cookies.get(ADMIN_COOKIE)?.value, secret || "");
  if (!token || !email) return { ok: false, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  const profile = await getAdminProfile(token.sub, email);
  return profile ? { ok: true, profile, profileId: profile.id } : { ok: false, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
}
export function setAdminCookie(response, token) {
  response.cookies.set(ADMIN_COOKIE, token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: SESSION_SECONDS });
  return response;
}
export function clearAdminCookie(response) { response.cookies.set(ADMIN_COOKIE, "", { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 0 }); return response; }
