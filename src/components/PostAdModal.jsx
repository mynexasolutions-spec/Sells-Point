"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Upload, Sparkles, ChevronLeft, ChevronRight, Check, Film, ImagePlus, LocateFixed } from "lucide-react";
import { useApp, CONDITIONS } from "@/context/AppContext";
import ListingMedia from "@/components/ListingMedia";
import { useListingLocation } from "@/hooks/useListingLocation";

const STEPS = ["Details", "Media", "Pricing & Boost", "Review"];

async function uploadFile(file) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", "sells-point/products");
  const res = await fetch("/api/upload", { method: "POST", body: formData });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(payload.error || "Upload failed");
  return payload;
}

function SpecificationInputs({ specifications, onChange }) {
  return <div className="rounded-xl bg-ink-50 p-3"><p className="mb-2 text-sm font-semibold text-ink-700">Product specifications <span className="font-normal text-ink-400">Use | for choices</span></p><div className="grid grid-cols-2 gap-2">{[["storage", "Storage"], ["color", "Color"], ["ram", "RAM"], ["warrantyMonths", "Warranty months"]].map(([key, label]) => <input key={key} className="input-field" placeholder={label} value={specifications?.[key] || ""} onChange={(e) => onChange({ ...specifications, [key]: e.target.value })} />)}</div></div>;
}

export default function PostAdModal({ isOpen, onClose, adminMode = false }) {
  const { addListing, createAdminListing, currentUser, categories, subcategories } = useApp();
  const router = useRouter();
  const steps = adminMode ? ["Details", "Media", "Pricing", "Review"] : STEPS;
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [detailsError, setDetailsError] = useState("");
  const [mediaWarning, setMediaWarning] = useState("");
  const [mediaByUrl, setMediaByUrl] = useState({});
  const locationLookup = useListingLocation();
  const [form, setForm] = useState({
    title: "",
    category: "",
    subcategoryId: "",
    condition: "Good",
    description: "",
    images: [],
    video: null,
    price: "",
    originalPrice: "",
    location: currentUser?.location || "",
    latitude: currentUser?.latitude || null,
    longitude: currentUser?.longitude || null,
    featured: false,
    specifications: { storage: "", color: "", ram: "", warrantyMonths: "" },
  });

  if (!isOpen) return null;

  const close = () => {
    setStep(0);
    setSubmitted(null);
    setSubmitError("");
    setFieldErrors({});
    setDetailsError("");
    setMediaWarning("");
    setMediaByUrl({});
    setForm({
      title: "",
      category: "",
      subcategoryId: "",
      condition: "Good",
      description: "",
      images: [],
      video: null,
      price: "",
      originalPrice: "",
      location: currentUser?.location || "",
      latitude: currentUser?.latitude || null,
      longitude: currentUser?.longitude || null,
      featured: false,
      specifications: { storage: "", color: "", ram: "", warrantyMonths: "" },
    });
    onClose();
  };

  const set = (patch) => setForm((prev) => ({ ...prev, ...patch }));

  const handleImages = async (e) => {
    const files = Array.from(e.target.files || []).slice(0, 6 - form.images.length);
    if (files.length === 0) return;
    setUploading(true);
    try {
      const uploads = await Promise.all(files.map(uploadFile));
      set({ images: [...form.images, ...uploads.map((upload) => upload.url)] });
      setMediaByUrl((current) => ({ ...current, ...Object.fromEntries(uploads.map((upload) => [upload.url, upload])) }));
      const warning = uploads.find((upload) => upload.warning)?.warning;
      if (warning) setMediaWarning(warning);
    } catch (error) {
      setSubmitError(error.message || "Failed to upload an image.");
    } finally {
      setUploading(false);
    }
  };

  const handleVideo = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const upload = await uploadFile(file);
      set({ video: upload.url });
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (idx) => set({ images: form.images.filter((_, i) => i !== idx) });

  const useCurrentLocation = () => locationLookup.locate((result) => set({
    latitude: result.latitude,
    longitude: result.longitude,
    location: result.displayName,
  }));

  const canProceed = () => {
    if (step === 0) return form.title.trim() && form.description.trim() && form.category;
    if (step === 2) return form.price && Number(form.price) > 0;
    return true;
  };

  const nextStep = () => {
    if (!canProceed()) {
      setDetailsError("Add a title, category, and description to continue.");
      return;
    }
    setDetailsError("");
    setStep((current) => current + 1);
  };

  const handleSubmit = async () => {
    setSubmitError("");
    setFieldErrors({});
    if (!currentUser) {
      setSubmitError("Please sign in before publishing your ad.");
      return;
    }
    if (currentUser.isBanned) {
      setSubmitError("This account has been suspended.");
      return;
    }
    setSubmitting(true);
    try {
      const result = await (adminMode ? createAdminListing(form) : addListing(form));
      const listing = adminMode ? result : result?.listing;
      if (!listing) {
        setSubmitError(result?.error || "Unable to publish this ad. Your draft has been kept so you can try again.");
        setFieldErrors(result?.fieldErrors || {});
        return;
      }
      setSubmitted(listing);
    } catch {
      setSubmitError("Unable to publish this ad. Your draft has been kept so you can try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink-950/60 p-0 sm:items-center sm:p-4 animate-fade-in">
      <div className="relative flex h-[100dvh] w-full max-w-2xl flex-col rounded-t-2xl bg-white shadow-soft animate-slide-up sm:h-auto sm:max-h-[90vh] sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-ink-100 px-4 py-3 sm:px-6 sm:py-4">
          <h2 className="font-display text-lg font-bold text-ink-900">
            {submitted ? "Listing Published" : adminMode ? "Create Listing" : "Post a New Ad"}
          </h2>
          <button
            onClick={close}
            className="flex h-11 w-11 items-center justify-center rounded-full text-ink-400 hover:bg-ink-100 hover:text-ink-700"
          >
            <X size={18} />
          </button>
        </div>

        {!submitted && (
          <div className="flex items-center gap-2 px-4 pt-4 sm:px-6">
            {steps.map((label, idx) => (
              <div key={label} className="flex flex-1 items-center gap-2">
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    idx <= step ? "bg-brand-600 text-white" : "bg-ink-100 text-ink-400"
                  }`}
                >
                  {idx < step ? <Check size={14} /> : idx + 1}
                </div>
                <span
                  className={`hidden text-xs font-medium sm:block ${
                    idx <= step ? "text-ink-900" : "text-ink-400"
                  }`}
                >
                  {label}
                </span>
                {idx < steps.length - 1 && <div className="h-px flex-1 bg-ink-100" />}
              </div>
            ))}
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6">
          {submitted ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 text-brand-600">
                <Check size={32} />
              </div>
              <h3 className="font-display text-xl font-bold text-ink-900">
                Your ad is live!
              </h3>
              <p className="max-w-sm text-sm text-ink-500">
                {submitted.featuredStatus === "pending"
                  ? "Your listing is published and your featured request is awaiting admin approval."
                  : "Your listing is now visible to buyers across Sells Point."}
              </p>
              <div className="mt-3 flex gap-3">
                <button
                  onClick={() => {
                    router.push(`/product/${submitted.id}`);
                    close();
                  }}
                  className="btn-primary"
                >
                  View Listing
                </button>
                <button onClick={close} className="btn-secondary">
                  Close
                </button>
              </div>
            </div>
          ) : (
            <>
              {step === 0 && (
                <div className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-ink-700">
                      Ad title
                    </label>
                    <input
                      value={form.title}
                      onChange={(e) => set({ title: e.target.value })}
                      placeholder="e.g. iPhone 14 Pro 256GB"
                      className="input-field"
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-ink-700">
                        Category
                      </label>
                      <select
                        value={form.category}
                        onChange={(e) => {
                          set({ category: e.target.value, subcategoryId: "" });
                          setDetailsError("");
                        }}
                        className="input-field"
                      >
                        <option value="" disabled>Select a category</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-ink-700">
                        Condition
                      </label>
                      <select
                        value={form.condition}
                        onChange={(e) => set({ condition: e.target.value })}
                        className="input-field"
                      >
                        {CONDITIONS.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                    {mediaWarning && <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">{mediaWarning}</p>}
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-ink-700">
                      Description
                    </label>
                    <textarea
                      value={form.description}
                      onChange={(e) => set({ description: e.target.value })}
                      rows={4}
                      placeholder="Describe the item's condition, usage, and reason for sale..."
                      className="input-field resize-none"
                    />
                  </div>
                  {["mobiles", "laptops"].includes(form.category) && <SpecificationInputs specifications={form.specifications} onChange={(specifications) => set({ specifications })} />}
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-ink-700">
                      Location
                    </label>
                    <div className="flex gap-2">
                      <input
                        value={form.location}
                        onChange={(e) => set({ location: e.target.value, latitude: null, longitude: null })}
                        placeholder="City, Country"
                        className="input-field flex-1"
                      />
                      <button type="button" onClick={useCurrentLocation} disabled={locationLookup.loading} className="btn-secondary shrink-0 px-3" aria-label="Use live location">
                        <LocateFixed size={16} />
                      </button>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-ink-700">Subcategory</label>
                      <select value={form.subcategoryId} onChange={(e) => set({ subcategoryId: e.target.value })} className="input-field" disabled={!form.category}>
                        <option value="">None</option>
                        {subcategories.filter((s) => s.categoryId === form.category).map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                      </select>
                    </div>
                    {form.latitude != null && form.longitude != null && (
                      <p className="mt-1 text-xs text-brand-600">Nearby discovery enabled for this listing.</p>
                    )}
                    {locationLookup.message && <p className={`mt-1 text-xs ${locationLookup.kind === "error" ? "text-red-600" : "text-brand-700"}`} role={locationLookup.kind === "error" ? "alert" : "status"}>{locationLookup.message}</p>}
                    <p className="mt-1 text-[11px] text-ink-400">Location data © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" className="underline">OpenStreetMap contributors</a></p>
                  </div>
                  {detailsError && <p className="text-sm font-medium text-red-600">{detailsError}</p>}
                </div>
              )}

              {step === 1 && (
                <div className="space-y-5">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-ink-700">
                      Photos <span className="text-ink-400">(up to 6)</span>
                    </label>
                    <p className="mb-3 rounded-lg bg-brand-50 px-3 py-2 text-xs text-brand-800">
                      For the best result, upload photos in a 9:16 portrait ratio. Other shapes will be fitted completely inside the frame.
                    </p>
                    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                      {form.images.map((src, idx) => (
                        <div key={idx} className="group relative">
                          <ListingMedia src={src} metadata={mediaByUrl[src]} alt={`Listing photo ${idx + 1}`} className="rounded-xl border border-ink-100" />
                          <button
                            onClick={() => removeImage(idx)}
                            className="absolute right-1 top-1 rounded-full bg-ink-950/70 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                      {form.images.length < 6 && (
                        <label className="flex aspect-[9/16] cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-ink-200 text-ink-400 hover:border-brand-400 hover:text-brand-500">
                          <ImagePlus size={20} />
                          <span className="text-[11px]">{uploading ? "Uploading..." : "Add photo"}</span>
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/avif"
                            multiple
                            className="hidden"
                            disabled={uploading}
                            onChange={handleImages}
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-ink-700">
                      Video <span className="text-ink-400">(optional)</span>
                    </label>
                    {form.video ? (
                      <div className="flex items-center justify-between rounded-xl border border-ink-100 px-4 py-3">
                        <span className="flex items-center gap-2 text-sm text-ink-700">
                          <Film size={16} /> Video attached
                        </span>
                        <button
                          onClick={() => set({ video: null })}
                          className="text-sm font-medium text-red-500"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-ink-200 px-4 py-6 text-ink-400 hover:border-brand-400 hover:text-brand-500">
                        <Upload size={18} />
                        <span className="text-sm">
                          {uploading ? "Uploading..." : "Upload a short video walkthrough"}
                        </span>
                        <input
                          type="file"
                          accept="video/*"
                          className="hidden"
                          disabled={uploading}
                          onChange={handleVideo}
                        />
                      </label>
                    )}
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-ink-700">
                        Selling price (₹)
                      </label>
                      <input
                        type="number"
                        value={form.price}
                        onChange={(e) => set({ price: e.target.value })}
                        placeholder="45000"
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-ink-700">
                        Original price (₹)
                      </label>
                      <input
                        type="number"
                        value={form.originalPrice}
                        onChange={(e) => set({ originalPrice: e.target.value })}
                        placeholder="60000"
                        className="input-field"
                      />
                    </div>
                  </div>

                  {!adminMode && (
                    <button
                      type="button"
                      onClick={() => set({ featured: !form.featured })}
                      className={`flex w-full items-center justify-between rounded-2xl border-2 px-5 py-4 text-left transition-colors ${
                        form.featured
                          ? "border-amber-400 bg-amber-50"
                          : "border-ink-100 hover:border-ink-200"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                          <Sparkles size={20} />
                        </div>
                        <div>
                          <p className="font-semibold text-ink-900">Boost as Featured Ad</p>
                          <p className="text-xs text-ink-500">
                            Get 5x more visibility. Subject to admin approval.
                          </p>
                        </div>
                      </div>
                      <div
                        className={`h-6 w-11 shrink-0 rounded-full transition-colors ${
                          form.featured ? "bg-amber-400" : "bg-ink-200"
                        }`}
                      >
                        <div
                          className={`h-5 w-5 translate-y-0.5 rounded-full bg-white shadow transition-transform ${
                            form.featured ? "translate-x-5" : "translate-x-0.5"
                          }`}
                        />
                      </div>
                    </button>
                  )}
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <div className="overflow-hidden rounded-2xl border border-ink-100">
                    {form.images[0] && (
                      <ListingMedia src={form.images[0]} metadata={mediaByUrl[form.images[0]]} alt={form.title} className="mx-auto w-full max-w-[16rem]" expandable />
                    )}
                    <div className="p-4">
                      <h4 className="font-display font-bold text-ink-900">{form.title}</h4>
                      <p className="mt-1 text-sm text-ink-500 line-clamp-2">{form.description}</p>
                      <div className="mt-3 flex items-center gap-2">
                        <span className="font-display text-lg font-bold text-ink-900">
                          ₹{Number(form.price || 0).toLocaleString("en-IN")}
                        </span>
                        {!adminMode && form.featured && <span className="badge-gold">Featured (pending)</span>}
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-ink-500">
                    {adminMode
                      ? "Review the details above, then publish this listing. You can manage it from this screen."
                      : "Review the details above, then publish your ad. You can edit or mark it sold anytime from your dashboard."}
                  </p>
                  {submitError && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
                      {submitError}
                      {Object.keys(fieldErrors).length > 0 && (
                        <ul className="mt-2 list-disc space-y-1 pl-5">
                          {Object.entries(fieldErrors).map(([field, message]) => <li key={field}><span className="font-semibold capitalize">{field.replace(/([A-Z])/g, " $1")}:</span> {message}</li>)}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {!submitted && (
          <div className="flex items-center justify-between gap-3 border-t border-ink-100 px-4 py-3 sm:px-6 sm:py-4">
            <button
              onClick={() => (step === 0 ? close() : setStep((s) => s - 1))}
              className="btn-ghost"
            >
              <ChevronLeft size={16} /> {step === 0 ? "Cancel" : "Back"}
            </button>
            {step < STEPS.length - 1 ? (
              <button
                onClick={nextStep}
                className="btn-primary"
              >
                Continue <ChevronRight size={16} />
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={submitting || !currentUser} className="btn-primary">
                {submitting ? "Publishing..." : "Publish Ad"} <Check size={16} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
