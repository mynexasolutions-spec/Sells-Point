"use client";

import { useState, useEffect } from "react";
import { X, Upload, ChevronLeft, ChevronRight, Check, Film, ImagePlus, LocateFixed } from "lucide-react";
import { useApp, CONDITIONS } from "@/context/AppContext";

const STEPS = ["Details", "Media", "Pricing", "Review"];

async function uploadFile(file) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", "sells-point/products");
  const res = await fetch("/api/upload", { method: "POST", body: formData });
  if (!res.ok) throw new Error("Upload failed");
  const { url } = await res.json();
  return url;
}

export default function EditListingModal({ isOpen, onClose, listing, adminMode = false }) {
  const { updateListing, categories, subcategories } = useApp();
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: listing?.title || "",
    category: listing?.category || "",
    subcategoryId: listing?.subcategoryId || "",
    specifications: listing?.specifications || { storage: "", color: "", ram: "", warrantyMonths: "" },
    condition: listing?.condition || "Good",
    description: listing?.description || "",
    images: listing?.images || [],
    video: listing?.video || null,
    price: listing?.price ? String(listing.price) : "",
    originalPrice: listing?.originalPrice ? String(listing.originalPrice) : "",
    location: listing?.location || "",
    latitude: listing?.latitude || null,
    longitude: listing?.longitude || null,
  });

  useEffect(() => {
    if (isOpen && listing) {
      setForm({
        title: listing.title || "",
        category: listing.category || "",
        subcategoryId: listing.subcategoryId || "",
        specifications: listing.specifications || { storage: "", color: "", ram: "", warrantyMonths: "" },
        condition: listing.condition || "Good",
        description: listing.description || "",
        images: listing.images || [],
        video: listing.video || null,
        price: listing.price ? String(listing.price) : "",
        originalPrice: listing.originalPrice ? String(listing.originalPrice) : "",
        location: listing.location || "",
        latitude: listing.latitude || null,
        longitude: listing.longitude || null,
      });
      setStep(0);
      setSubmitted(false);
      setError("");
    }
  }, [isOpen, listing]);

  if (!isOpen || !listing) return null;

  const close = () => {
    setStep(0);
    setSubmitted(false);
    setError("");
    onClose();
  };

  const set = (patch) => setForm((prev) => ({ ...prev, ...patch }));

  const handleImages = async (e) => {
    const files = Array.from(e.target.files || []).slice(0, 6 - form.images.length);
    if (files.length === 0) return;
    setUploading(true);
    setError("");
    try {
      const urls = await Promise.all(files.map(uploadFile));
      set({ images: [...form.images, ...urls] });
    } catch {
      setError("Failed to upload image. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleVideo = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const url = await uploadFile(file);
      set({ video: url });
    } catch {
      setError("Failed to upload video. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (idx) => set({ images: form.images.filter((_, i) => i !== idx) });

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("Location is not supported in this browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        set({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          location: form.location || "Current location",
        });
        setError("");
      },
      () => setError("Unable to access your location. You can still enter it manually."),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const canProceed = () => {
    if (step === 0) return form.title.trim() && form.description.trim() && form.category;
    if (step === 2) return form.price && Number(form.price) > 0;
    return true;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");
    try {
      const result = await updateListing(listing.id, form, { skipOwnershipCheck: adminMode });
      if (result?.success) {
        setSubmitted(true);
      } else {
        setError(result?.error || "Failed to save listing. Please check your inputs and try again.");
      }
    } catch (err) {
      setError("Failed to save listing. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink-950/60 p-0 sm:items-center sm:p-4 animate-fade-in">
      <div className="relative flex h-[100dvh] w-full max-w-2xl flex-col rounded-t-2xl bg-white shadow-soft animate-slide-up sm:h-auto sm:max-h-[90vh] sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-ink-100 px-4 py-3 sm:px-6 sm:py-4">
          <h2 className="font-display text-lg font-bold text-ink-900">
            {submitted ? "Listing Updated" : adminMode ? "Admin Edit Listing" : "Edit Listing"}
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
            {STEPS.map((label, idx) => (
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
                {idx < STEPS.length - 1 && <div className="h-px flex-1 bg-ink-100" />}
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
                Listing updated!
              </h3>
              <p className="max-w-sm text-sm text-ink-500">
                Your listing has been updated successfully.
              </p>
              <button onClick={close} className="btn-primary mt-3 min-h-11">
                Close
              </button>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}
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
                        onChange={(e) => set({ category: e.target.value, subcategoryId: "" })}
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
                      <label className="mb-1.5 block text-sm font-medium text-ink-700">Subcategory</label>
                      <select value={form.subcategoryId} onChange={(e) => set({ subcategoryId: e.target.value })} className="input-field" disabled={!form.category}>
                        <option value="">None</option>
                        {subcategories.filter((s) => s.categoryId === form.category).map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
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
                  {["mobiles", "laptops"].includes(form.category) && <div className="rounded-xl bg-ink-50 p-3"><p className="mb-2 text-sm font-semibold text-ink-700">Product specifications <span className="font-normal text-ink-400">Use | for choices</span></p><div className="grid grid-cols-2 gap-2">{[["storage", "Storage"], ["color", "Color"], ["ram", "RAM"], ["warrantyMonths", "Warranty months"]].map(([key, label]) => <input key={key} className="input-field" placeholder={label} value={form.specifications?.[key] || ""} onChange={(e) => set({ specifications: { ...form.specifications, [key]: e.target.value } })} />)}</div></div>}
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-ink-700">
                      Location
                    </label>
                    <div className="flex gap-2">
                      <input
                        value={form.location}
                        onChange={(e) => set({ location: e.target.value })}
                        placeholder="City, Country"
                        className="input-field flex-1"
                      />
                      <button type="button" onClick={useCurrentLocation} className="btn-secondary shrink-0 px-3">
                        <LocateFixed size={16} />
                      </button>
                    </div>
                    {form.latitude && form.longitude && (
                      <p className="mt-1 text-xs text-brand-600">Nearby discovery enabled for this listing.</p>
                    )}
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="space-y-5">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-ink-700">
                      Photos <span className="text-ink-400">(up to 6)</span>
                    </label>
                    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                      {form.images.map((src, idx) => (
                        <div key={idx} className="group relative aspect-square overflow-hidden rounded-xl border border-ink-100">
                          <img src={src} alt="" className="h-full w-full object-contain bg-ink-50" />
                          <button
                            onClick={() => removeImage(idx)}
                            className="absolute right-1 top-1 rounded-full bg-ink-950/70 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                      {form.images.length < 6 && (
                        <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-ink-200 text-ink-400 hover:border-brand-400 hover:text-brand-500">
                          <ImagePlus size={20} />
                          <span className="text-[11px]">{uploading ? "Uploading..." : "Add photo"}</span>
                          <input
                            type="file"
                            accept="image/*"
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
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <div className="overflow-hidden rounded-2xl border border-ink-100">
                    {form.images[0] && (
                      <img src={form.images[0]} alt="" className="h-44 w-full object-contain bg-ink-50" />
                    )}
                    <div className="p-4">
                      <h4 className="font-display font-bold text-ink-900">{form.title}</h4>
                      <p className="mt-1 text-sm text-ink-500 line-clamp-2">{form.description}</p>
                      <div className="mt-3 flex items-center gap-2">
                        <span className="font-display text-lg font-bold text-ink-900">
                          ₹{Number(form.price || 0).toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-ink-500">
                    Review the details above, then save your changes.
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {!submitted && (
          <div className="flex items-center justify-between gap-3 border-t border-ink-100 px-4 py-3 sm:px-6 sm:py-4">
            <button
              onClick={() => (step === 0 ? close() : setStep((s) => s - 1))}
              className="btn-ghost min-h-11"
            >
              <ChevronLeft size={16} /> {step === 0 ? "Cancel" : "Back"}
            </button>
            {step < STEPS.length - 1 ? (
              <button
                onClick={() => canProceed() && setStep((s) => s + 1)}
                disabled={!canProceed()}
                className="btn-primary min-h-11"
              >
                Continue <ChevronRight size={16} />
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={submitting} className="btn-primary min-h-11">
                {submitting ? "Saving..." : "Save Changes"} <Check size={16} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
