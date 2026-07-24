import { NextResponse } from "next/server";

export const API_ERRORS = Object.freeze({
  AUTH_REQUIRED: { status: 401, message: "Please sign in to continue.", retryable: false },
  ACCOUNT_BANNED: { status: 403, message: "This account has been suspended.", retryable: false },
  NOT_FOUND: { status: 404, message: "The requested item was not found.", retryable: false },
  CONFLICT: { status: 409, message: "The request conflicts with the current state.", retryable: false },
  VALIDATION_ERROR: { status: 422, message: "Please correct the highlighted fields.", retryable: false },
  RATE_LIMITED: { status: 429, message: "Too many requests. Please try again shortly.", retryable: true },
  SERVER_ERROR: { status: 500, message: "Something went wrong. Please try again.", retryable: true },
});

export function apiSuccess(data, status = 200) {
  return NextResponse.json({ ok: true, data }, { status });
}

export function apiFailure(code, options = {}) {
  const definition = API_ERRORS[code] || API_ERRORS.SERVER_ERROR;
  const error = {
    code: API_ERRORS[code] ? code : "SERVER_ERROR",
    message: options.message || definition.message,
    retryable: options.retryable ?? definition.retryable,
  };
  if (options.fieldErrors && Object.keys(options.fieldErrors).length) {
    error.fieldErrors = options.fieldErrors;
  }
  return NextResponse.json({ ok: false, error }, { status: options.status || definition.status });
}

export async function resolveActor(supabase, actorId) {
  if (!actorId) return { response: apiFailure("AUTH_REQUIRED") };
  const { data, error } = await supabase
    .from("profiles")
    .select("id, is_admin, is_banned, location")
    .eq("id", actorId)
    .maybeSingle();
  if (error) return { response: apiFailure("SERVER_ERROR") };
  if (!data) return { response: apiFailure("AUTH_REQUIRED") };
  if (data.is_banned) return { response: apiFailure("ACCOUNT_BANNED") };
  return { actor: data };
}
