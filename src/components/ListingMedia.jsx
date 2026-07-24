"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, ZoomIn } from "lucide-react";
import { cloudinaryOriginalFromPaddedPreview } from "@/lib/listingMedia";

export default function ListingMedia({ src, alt = "", metadata, className = "", imageClassName = "", loading = "lazy", expandable = false }) {
  const [failed, setFailed] = useState(false);
  const [fullViewOpen, setFullViewOpen] = useState(false);
  const requestedUrl = metadata?.url || src;
  const inferredOriginalUrl = cloudinaryOriginalFromPaddedPreview(requestedUrl);
  const displayUrl = metadata?.originalUrl || inferredOriginalUrl || requestedUrl;

  useEffect(() => {
    setFailed(false);
    setFullViewOpen(false);
  }, [src, metadata?.url, metadata?.originalUrl]);

  useEffect(() => {
    if (!fullViewOpen) return;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event) => event.key === "Escape" && setFullViewOpen(false);
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [fullViewOpen]);

  const image = (
    <img
      src={displayUrl}
      alt={alt}
      loading={loading}
      onError={() => setFailed(true)}
      className={`h-full w-full object-contain ${imageClassName}`}
    />
  );

  return (
    <>
      <div className={`relative aspect-[9/16] overflow-hidden bg-white ${className}`}>
        {displayUrl && !failed ? (
          expandable ? (
            <button type="button" onClick={() => setFullViewOpen(true)} className="group/media relative h-full w-full cursor-zoom-in" aria-label={`Open ${alt || "listing image"} in full view`}>
              {image}
              <span className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-ink-950/70 text-white opacity-90 shadow-lg backdrop-blur transition-transform group-hover/media:scale-105" aria-hidden="true">
                <ZoomIn size={17} />
              </span>
            </button>
          ) : image
        ) : (
          <div className="flex h-full items-center justify-center px-3 text-center text-xs text-ink-400">Image unavailable</div>
        )}
      </div>
      {fullViewOpen && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-3 sm:p-6" role="dialog" aria-modal="true" aria-label={`${alt || "Listing image"} full view`} onMouseDown={(event) => event.target === event.currentTarget && setFullViewOpen(false)}>
          <img src={displayUrl} alt={alt} className="max-h-full max-w-full object-contain" />
          <button type="button" onClick={() => setFullViewOpen(false)} className="absolute right-4 top-[max(1rem,env(safe-area-inset-top))] flex h-11 w-11 items-center justify-center rounded-full bg-white text-ink-950 shadow-xl hover:bg-ink-100" aria-label="Close full view">
            <X size={22} />
          </button>
        </div>,
        document.body
      )}
    </>
  );
}
