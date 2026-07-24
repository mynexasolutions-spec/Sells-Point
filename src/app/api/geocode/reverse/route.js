import { NextResponse } from "next/server";
import { normalizeReverseGeocode, validCoordinates } from "@/lib/geocoding";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const CACHE_TTL = 24 * 60 * 60 * 1000;

function failure(code, message, status, retryable = false) {
  return NextResponse.json({ error: { code, message, retryable } }, { status });
}

async function cachedResult(key) {
  const { data, error } = await supabaseAdmin
    .from("geocode_cache")
    .select("response, expires_at")
    .eq("coordinate_key", key)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();
  if (error) throw new Error("CACHE_UNAVAILABLE");
  return data?.response || null;
}

async function acquireProviderSlot() {
  const { data, error } = await supabaseAdmin.rpc("acquire_nominatim_slot");
  if (error) throw new Error("RATE_LIMIT_UNAVAILABLE");
  const waitMs = Math.max(0, Number(data) || 0);
  if (waitMs) await new Promise((resolve) => setTimeout(resolve, waitMs));
}

export async function GET(request) {
  const params = new URL(request.url).searchParams;
  const latParam = params.get("lat");
  const lngParam = params.get("lng");
  if (!latParam?.trim() || !lngParam?.trim()) return failure("VALIDATION_ERROR", "Valid latitude and longitude are required.", 422);
  const lat = Number(latParam);
  const lng = Number(lngParam);
  if (!validCoordinates(lat, lng)) return failure("VALIDATION_ERROR", "Valid latitude and longitude are required.", 422);

  const latitude = Number(lat.toFixed(4));
  const longitude = Number(lng.toFixed(4));
  const key = `${latitude},${longitude}`;
  try {
    const cached = await cachedResult(key);
    if (cached) return NextResponse.json(cached);
    await acquireProviderSlot();
  } catch {
    return failure("SERVER_ERROR", "Location lookup is temporarily unavailable.", 500, true);
  }

  const baseUrl = (process.env.NOMINATIM_BASE_URL || "https://nominatim.openstreetmap.org").replace(/\/$/, "");
  const url = `${baseUrl}/reverse?format=jsonv2&addressdetails=1&lat=${latitude}&lon=${longitude}`;
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": process.env.NOMINATIM_USER_AGENT || "SellsPoint/1.0 (support@sellspoint.app)",
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(5000),
    });
    if (response.status === 429) return failure("RATE_LIMITED", "Location lookup is busy. Please wait and retry.", 429, true);
    if (!response.ok) return failure("PROVIDER_FAILURE", "Location lookup is temporarily unavailable.", 502, true);
    const normalized = normalizeReverseGeocode(await response.json(), { latitude, longitude });
    if (!normalized) return failure("EMPTY_RESULT", "No readable location was found. Enter it manually.", 404);
    const { error: cacheError } = await supabaseAdmin.from("geocode_cache").upsert({
      coordinate_key: key,
      response: normalized,
      expires_at: new Date(Date.now() + CACHE_TTL).toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: "coordinate_key" });
    if (cacheError) return failure("SERVER_ERROR", "Location lookup could not be saved. Please retry.", 500, true);
    return NextResponse.json(normalized);
  } catch (error) {
    if (error?.name === "TimeoutError" || error?.name === "AbortError") return failure("PROVIDER_TIMEOUT", "Location lookup timed out. Please retry.", 504, true);
    return failure("PROVIDER_FAILURE", "Location lookup is temporarily unavailable.", 502, true);
  }
}
