"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Heart, MapPin, PlayCircle, Sparkles, Star } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { useSiteChrome } from "@/context/SiteChromeContext";
import ListingMedia from "@/components/ListingMedia";

const formatPrice = (value) => new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
}).format(value);

const relativeTime = (timestamp) => {
  const elapsed = Math.max(0, Date.now() - Number(timestamp || Date.now()));
  const minutes = Math.floor(elapsed / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
};

export default function ProductCard({ listing }) {
  const { toggleFavorite, isFavorite, isFavoritePending, getFavoriteError, currentUser } = useApp();
  const { openAuth } = useSiteChrome();
  const fav = isFavorite(listing.id);
  const favoritePending = isFavoritePending(listing.id);
  const favoriteError = getFavoriteError(listing.id);

  useEffect(() => {
    if (!currentUser || window.sessionStorage.getItem("sellspoint_pending_favorite_listing") !== listing.id) return;
    window.sessionStorage.removeItem("sellspoint_pending_favorite_listing");
    toggleFavorite(listing.id);
  }, [currentUser, listing.id, toggleFavorite]);
  const discount = listing.originalPrice > listing.price
    ? Math.round(((listing.originalPrice - listing.price) / listing.originalPrice) * 100)
    : 0;
  const featured = listing.featured && listing.featuredStatus === "approved";
  const isNew = Date.now() - Number(listing.createdAt || 0) <= 7 * 24 * 60 * 60 * 1000;
  const status = featured
    ? { label: "Featured", className: "bg-amber-100 text-amber-800", icon: true }
    : discount > 0
      ? { label: "Lowest Price", className: "bg-ink-900 text-white" }
      : isNew
        ? { label: "New", className: "bg-blue-600 text-white" }
        : null;
  // Deterministic mock rating (display-only until the ratings/reviews phase ships real data)
  const ratingSeed = String(listing.id).split("").reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  const mockRating = (4 + (ratingSeed % 9) / 10).toFixed(1);
  const offAmount = discount > 0 ? listing.originalPrice - listing.price : 0;

  return (
    <article className={`group relative overflow-hidden rounded-xl border border-ink-100 bg-white ${featured ? "ring-1 ring-amber-200" : ""}`}>
      <div className="relative aspect-[9/16] w-full overflow-hidden bg-white">
        {listing.images?.[0] ? (
          <ListingMedia
            src={listing.images[0]}
            alt={listing.title}
            className="h-full w-full"
            expandable
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-ink-400">No image</div>
        )}
        {listing.video && <span className="pointer-events-none absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-ink-950/70 px-2 py-1 text-xs text-white"><PlayCircle size={13} /> Video</span>}
        {listing.status === "sold" && <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-ink-950/55"><span className="rounded-full bg-white px-4 py-1.5 text-sm font-bold uppercase">Sold Out</span></div>}
      </div>
      <Link href={`/product/${listing.id}`} className="block" aria-label={`View details for ${listing.title}`}>
        <div className="p-3 sm:p-4">
          <p className={`text-xs font-semibold ${offAmount > 0 ? "text-brand-600" : "invisible"}`} aria-hidden={offAmount > 0 ? undefined : "true"}>
            {offAmount > 0 ? `${formatPrice(offAmount)} OFF` : " "}
          </p>
          <h3 className="mt-0.5 line-clamp-2 min-h-10 font-display text-sm font-semibold leading-5 text-ink-900 sm:min-h-12 sm:text-base sm:leading-6">{listing.title}</h3>
          <div className="mt-1.5 flex items-center gap-2">
            {status && (
              <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-bold ${status.className}`}>
                {status.icon && <Sparkles size={11} />} {status.label}
              </span>
            )}
            <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-ink-700">
              <Star size={12} className="fill-amber-400 text-amber-400" /> {mockRating}
            </span>
          </div>
          <div className="mt-1.5 flex flex-wrap items-baseline gap-x-1.5">
            {discount > 0 && <span className="text-[11px] font-bold text-brand-600 sm:text-xs">-{discount}%</span>}
            <span className="font-display text-[15px] font-bold text-ink-900 min-[390px]:text-base sm:text-lg">{formatPrice(listing.price)}</span>
            {discount > 0 && <span className="text-[11px] text-ink-400 line-through sm:text-xs">{formatPrice(listing.originalPrice)}</span>}
          </div>
          <div className="mt-2.5 flex items-center justify-between gap-2 text-xs text-ink-500 sm:text-sm">
            <span className="truncate">{relativeTime(listing.createdAt)}</span>
            <span className="hidden min-w-0 items-center gap-1 min-[390px]:flex"><MapPin size={12} className="shrink-0" /><span className="truncate">{listing.distanceKm != null ? `${listing.distanceKm.toFixed(1)} km` : listing.location}</span></span>
          </div>
        </div>
      </Link>
      <button
        type="button"
        onClick={() => currentUser ? toggleFavorite(listing.id) : openAuth({ onSuccess: () => window.sessionStorage.setItem("sellspoint_pending_favorite_listing", listing.id) })}
        disabled={favoritePending}
        className={`absolute right-2 top-2 z-10 flex h-11 w-11 items-center justify-center rounded-full shadow-sm transition-colors disabled:opacity-60 ${fav ? "bg-red-500 text-white" : "bg-white text-ink-600 hover:text-red-500"}`}
        aria-label={fav ? `Remove ${listing.title} from favourites` : `Save ${listing.title} to favourites`}
        aria-pressed={fav}
      >
        <Heart size={16} fill={fav ? "currentColor" : "none"} />
      </button>
      {favoriteError && <p role="alert" className="absolute right-2 top-14 z-10 max-w-[calc(100%-1rem)] rounded-lg bg-red-50 px-2 py-1 text-[10px] font-medium text-red-700 shadow">{favoriteError}</p>}
    </article>
  );
}
