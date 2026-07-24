import crypto from "crypto";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { validateContactInquiry } from "@/lib/contact-inquiry.mjs";

function referenceCode() {
  const date = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  return `SP-${date}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
}

function failure(status, code, message, fieldErrors, retryable = false) {
  return NextResponse.json(
    {
      ok: false,
      error: {
        code,
        message,
        ...(fieldErrors ? { fieldErrors } : {}),
        retryable,
      },
    },
    { status }
  );
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return failure(422, "VALIDATION_ERROR", "Check the form and try again.");
  }

  const validation = validateContactInquiry(body);
  if (!validation.ok) {
    return failure(422, "VALIDATION_ERROR", "Check the highlighted fields.", validation.fieldErrors);
  }

  const values = validation.values;
  if (values.website) {
    return NextResponse.json({
      ok: true,
      data: { referenceCode: "SP-RECEIVED" },
    });
  }

  const reference = referenceCode();
  const { data: inserted, error } = await supabaseAdmin.rpc("submit_contact_inquiry", {
    p_reference_code: reference,
    p_name: values.name,
    p_email: values.email,
    p_normalized_email: values.email,
    p_phone: values.phone,
    p_category: values.category,
    p_message: values.message,
  });

  if (!error && inserted === false) {
    const response = failure(
      429,
      "RATE_LIMITED",
      "Please wait a minute before sending another enquiry.",
      undefined,
      true
    );
    response.headers.set("Retry-After", "60");
    return response;
  }

  if (error) {
    return failure(
      500,
      "SERVER_ERROR",
      "We could not submit your enquiry right now. Please try again.",
      undefined,
      true
    );
  }

  return NextResponse.json({ ok: true, data: { referenceCode: reference } }, { status: 201 });
}
