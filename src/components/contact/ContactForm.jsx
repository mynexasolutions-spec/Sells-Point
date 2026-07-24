"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle2, LoaderCircle } from "lucide-react";
import { CONTACT_CATEGORIES } from "@/lib/contact-inquiry.mjs";

const CATEGORY_LABELS = {
  support: "General support",
  safety: "Trust & safety",
  account: "Account access",
  listing: "Listing help",
  payment: "Payment question",
  partnership: "Partnership",
  feedback: "Feedback",
  other: "Something else",
};

const INITIAL_FORM = {
  name: "",
  email: "",
  phone: "",
  category: "",
  message: "",
  website: "",
};

export default function ContactForm() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [status, setStatus] = useState({
    state: "idle",
    message: "",
    referenceCode: "",
  });

  const update = (field) => (event) => {
    const value = event.target.value;
    setForm((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
    if (status.state === "error") {
      setStatus({ state: "idle", message: "", referenceCode: "" });
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    setFieldErrors({});
    setStatus({ state: "submitting", message: "", referenceCode: "" });

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok || !payload.ok) {
        setFieldErrors(payload.error?.fieldErrors || {});
        setStatus({
          state: "error",
          message: payload.error?.message || "We could not send your enquiry. Please try again.",
          referenceCode: "",
        });
        return;
      }

      setForm(INITIAL_FORM);
      setStatus({
        state: "success",
        message: "Your enquiry is safely in our inbox.",
        referenceCode: payload.data.referenceCode,
      });
    } catch {
      setStatus({
        state: "error",
        message: "We could not reach SellsPoint. Check your connection and retry.",
        referenceCode: "",
      });
    }
  };

  const inputClass = (field) => `input-field ${fieldErrors[field] ? "!border-red-400 !ring-red-100" : ""}`;

  return (
    <form
      id="contact-form"
      onSubmit={submit}
      className="rounded-[2rem] border border-ink-100 bg-white p-5 shadow-[0_24px_80px_rgba(14,16,23,0.1)] sm:p-8 lg:p-10"
      noValidate
    >
      <div className="mb-7">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-700">Send an enquiry</p>
        <h2 className="mt-2 font-display text-2xl font-extrabold text-ink-950 sm:text-3xl">Tell us what you need</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-500 sm:text-base">
          Share enough detail for our team to route your message correctly.
        </p>
      </div>

      <div className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
        <label htmlFor="contact-website">Website</label>
        <input
          id="contact-website"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={form.website}
          onChange={update("website")}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Name" error={fieldErrors.name} required>
          <input
            id="contact-name"
            value={form.name}
            onChange={update("name")}
            className={inputClass("name")}
            minLength={2}
            maxLength={100}
            autoComplete="name"
            aria-invalid={!!fieldErrors.name}
            aria-describedby={fieldErrors.name ? "contact-name-error" : undefined}
            required
          />
        </Field>

        <Field label="Email" error={fieldErrors.email} required>
          <input
            id="contact-email"
            type="email"
            value={form.email}
            onChange={update("email")}
            className={inputClass("email")}
            maxLength={254}
            autoComplete="email"
            aria-invalid={!!fieldErrors.email}
            aria-describedby={fieldErrors.email ? "contact-email-error" : undefined}
            required
          />
        </Field>

        <Field label="Phone" hint="Optional" error={fieldErrors.phone}>
          <input
            id="contact-phone"
            type="tel"
            value={form.phone}
            onChange={update("phone")}
            className={inputClass("phone")}
            minLength={7}
            maxLength={20}
            autoComplete="tel"
            aria-invalid={!!fieldErrors.phone}
            aria-describedby={fieldErrors.phone ? "contact-phone-error" : undefined}
          />
        </Field>

        <Field label="Category" error={fieldErrors.category} required>
          <select
            id="contact-category"
            value={form.category}
            onChange={update("category")}
            className={inputClass("category")}
            aria-invalid={!!fieldErrors.category}
            aria-describedby={fieldErrors.category ? "contact-category-error" : undefined}
            required
          >
            <option value="">Choose a category</option>
            {CONTACT_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {CATEGORY_LABELS[category]}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="mt-5">
        <div className="mb-1.5 flex items-center justify-between gap-3">
          <label htmlFor="contact-message" className="text-sm font-semibold text-ink-700">
            Message <span className="text-brand-700">*</span>
          </label>
          <span className="text-xs text-ink-400">{form.message.length}/2000</span>
        </div>
        <textarea
          id="contact-message"
          value={form.message}
          onChange={update("message")}
          className={`${inputClass("message")} min-h-36 resize-y`}
          minLength={10}
          maxLength={2000}
          aria-invalid={!!fieldErrors.message}
          aria-describedby={fieldErrors.message ? "contact-message-error" : undefined}
          required
        />
        {fieldErrors.message && (
          <p id="contact-message-error" className="mt-1.5 text-sm text-red-600">
            {fieldErrors.message}
          </p>
        )}
      </div>

      <div className="mt-6" aria-live="polite">
        {status.state === "error" && (
          <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {status.message}
          </div>
        )}
        {status.state === "success" && (
          <div className="mb-4 flex gap-3 rounded-xl border border-brand-200 bg-brand-50 px-4 py-4 text-brand-900">
            <CheckCircle2 className="mt-0.5 shrink-0" size={20} />
            <div>
              <p className="font-semibold">{status.message}</p>
              <p className="mt-1 text-sm">
                Reference: <strong className="font-mono">{status.referenceCode}</strong>
              </p>
            </div>
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={status.state === "submitting"}
        className="btn-primary w-full rounded-full py-3.5 sm:w-auto sm:px-8"
      >
        {status.state === "submitting" ? (
          <>
            <LoaderCircle className="animate-spin" size={18} /> Sending…
          </>
        ) : (
          <>
            Send enquiry <ArrowRight size={18} />
          </>
        )}
      </button>
    </form>
  );
}

function Field({ label, hint, error, required = false, children }) {
  const id = `contact-${label.toLowerCase()}`;
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <label htmlFor={id} className="text-sm font-semibold text-ink-700">
          {label} {required && <span className="text-brand-700">*</span>}
        </label>
        {hint && <span className="text-xs text-ink-400">{hint}</span>}
      </div>
      {children}
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
