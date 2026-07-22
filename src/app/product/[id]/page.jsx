"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  MapPin,
  Heart,
  MessageCircle,
  ShieldCheck,
  Flag,
  Eye,
  Clock,
  ChevronLeft,
  ChevronRight,
  Star,
  ArrowRight,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { useSiteChrome } from "@/context/SiteChromeContext";
import { supabase } from "@/lib/supabaseClient";
import ProductCard from "@/components/ProductCard";

const CHAT_CONTINUATION_KEY = "sellspoint_pending_chat_listing";

function formatPrice(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function timeAgo(ts) {
  const diff = Date.now() - ts;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

export default function ProductPage({ params }) {
  const { id } = params;
  const router = useRouter();
  const { openAuth } = useSiteChrome();
  const {
    hydrated,
    listings,
    getListingById,
    getUserById,
    currentUser,
    toggleFavorite,
    isFavorite,
    getOrCreateChat,
    incrementViews,
    reportContent,
  } = useApp();
  const [imgIdx, setImgIdx] = useState(0);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportSent, setReportSent] = useState(false);
  const [chatError, setChatError] = useState("");
  const [fetchedListing, setFetchedListing] = useState(null);
  const [fetching, setFetching] = useState(false);

  const listing = getListingById(id) || fetchedListing;
  const relatedListings = useMemo(() => {
    if (!listing) return [];

    return listings
      .filter((item) => item.id !== listing.id && item.status === "active" && item.category === listing.category)
      .sort((first, second) => {
        const firstFeatured = first.featured && first.featuredStatus === "approved" ? 1 : 0;
        const secondFeatured = second.featured && second.featuredStatus === "approved" ? 1 : 0;
        return secondFeatured - firstFeatured || Number(second.createdAt || 0) - Number(first.createdAt || 0);
      })
      .slice(0, 8);
  }, [listing, listings]);

  const startChat = useCallback(
    async (targetListing) => {
      setChatError("");
      if (!currentUser?.verified) {
        setChatError("A verified account is required before starting a chat.");
        return;
      }
      const chat = await getOrCreateChat(targetListing.id, targetListing.sellerId);
      if (chat) router.push("/chat");
      else setChatError("Unable to start this chat. Check your account verification and try again.");
    },
    [currentUser, getOrCreateChat, router]
  );

  // Fetch listing from Supabase if not in local state (due to pagination)
  useEffect(() => {
    if (hydrated && !getListingById(id)) {
      setFetching(true);
      supabase
        .from("listings")
        .select("*")
        .eq("id", id)
        .single()
        .then(({ data, error }) => {
          if (data && !error) {
            setFetchedListing({
              id: data.id,
              sellerId: data.seller_id,
              title: data.title,
              description: data.description || "",
              price: Number(data.price) || 0,
              originalPrice: Number(data.original_price) || 0,
              category: data.category,
              condition: data.condition,
              images: data.images || [],
              video: data.video_url || null,
              location: data.location || "",
              latitude: data.latitude,
              longitude: data.longitude,
              featured: data.featured,
              featuredStatus: data.featured_status || "none",
              status: data.status || "active",
              expiresAt: data.expires_at ? new Date(data.expires_at).getTime() : null,
              moderationNote: data.moderation_note || "",
              views: data.views || 0,
              createdAt: data.created_at ? new Date(data.created_at).getTime() : Date.now(),
            });
          }
          setFetching(false);
        });
    }
  }, [id, hydrated, getListingById]);

  useEffect(() => {
    if (listing) incrementViews(listing.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (!listing || !currentUser || window.sessionStorage.getItem(CHAT_CONTINUATION_KEY) !== listing.id) return;
    window.sessionStorage.removeItem(CHAT_CONTINUATION_KEY);
    startChat(listing);
  }, [currentUser, listing, startChat]);

  if (!hydrated || fetching) {
    return (
      <div className="page-container">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="skeleton aspect-video w-full rounded-2xl" />
            <div className="skeleton mt-3 h-6 w-2/3 rounded-md" />
            <div className="skeleton mt-3 h-8 w-1/3 rounded-md" />
          </div>
          <div className="card h-52 p-5">
            <div className="flex items-center gap-3">
              <div className="skeleton h-12 w-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-3 w-2/3 rounded" />
                <div className="skeleton h-3 w-1/2 rounded" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <p className="text-ink-500">This listing doesn't exist or has been removed.</p>
        <Link href="/" className="btn-primary mt-4 inline-flex">
          Back to Home
        </Link>
      </div>
    );
  }

  const seller = getUserById(listing.sellerId);
  const fav = isFavorite(listing.id);
  const isOwner = currentUser?.id === listing.sellerId;
  const images = listing.images?.length ? listing.images : [];

  const handleChat = async () => {
    if (!currentUser) {
      openAuth({
        onSuccess: () => window.sessionStorage.setItem(CHAT_CONTINUATION_KEY, listing.id),
      });
      return;
    }
    await startChat(listing);
  };

  const submitReport = () => {
    if (!reportReason.trim()) return;
    reportContent("listing", listing.id, reportReason.trim());
    setReportSent(true);
  };

  return (
    <div className="page-container">
      <div className="grid gap-6 sm:gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="relative aspect-video overflow-hidden rounded-2xl bg-ink-100">
            {images.length > 0 ? (
              <img src={images[imgIdx]} alt={listing.title} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-ink-300">No image</div>
            )}
            {images.length > 1 && (
              <>
                <button
                  onClick={() => setImgIdx((i) => (i - 1 + images.length) % images.length)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-soft"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={() => setImgIdx((i) => (i + 1) % images.length)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-soft"
                >
                  <ChevronRight size={18} />
                </button>
              </>
            )}
            {listing.status === "sold" && (
              <div className="absolute inset-0 flex items-center justify-center bg-ink-950/50">
                <span className="rounded-full bg-white px-6 py-2 text-lg font-bold uppercase text-ink-900">
                  Sold Out
                </span>
              </div>
            )}
          </div>

          {images.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {images.map((src, idx) => (
                <button
                  key={idx}
                  onClick={() => setImgIdx(idx)}
                  className={`h-16 w-20 shrink-0 overflow-hidden rounded-lg border-2 ${
                    idx === imgIdx ? "border-brand-500" : "border-transparent"
                  }`}
                >
                  <img src={src} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {listing.video && (
            <div className="mt-4">
              <video src={listing.video} controls className="w-full rounded-2xl" />
            </div>
          )}

          <div className="mt-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="badge-ink">{listing.condition}</span>
              {listing.featured && listing.featuredStatus === "approved" && (
                <span className="badge-gold">Featured</span>
              )}
            </div>
            <h1 className="mt-3 font-display text-2xl font-bold text-ink-900">{listing.title}</h1>
            <div className="mt-2 flex items-baseline gap-3">
              <span className="font-display text-3xl font-extrabold text-ink-900">
                {formatPrice(listing.price)}
              </span>
              {listing.originalPrice > listing.price && (
                <span className="text-base text-ink-400 line-through">
                  {formatPrice(listing.originalPrice)}
                </span>
              )}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-ink-500">
              <span className="flex items-center gap-1">
                <MapPin size={14} /> {listing.location}
              </span>
              <span className="flex items-center gap-1">
                <Clock size={14} /> {timeAgo(listing.createdAt)}
              </span>
              <span className="flex items-center gap-1">
                <Eye size={14} /> {listing.views} views
              </span>
            </div>

            <div className="mt-6 card p-5">
              <h3 className="mb-2 font-display font-semibold text-ink-900">Description</h3>
              <p className="whitespace-pre-line text-sm leading-relaxed text-ink-600">
                {listing.description}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="card p-5">
            <Link href={`/profile/${seller?.id}`} className="flex items-center gap-3">
              <img src={seller?.avatar} alt="" className="h-12 w-12 rounded-full object-cover" />
              <div>
                <p className="flex items-center gap-1 font-semibold text-ink-900">
                  {seller?.name}
                  {seller?.verified && <ShieldCheck size={14} className="text-brand-600" />}
                </p>
                <p className="flex items-center gap-1 text-xs text-ink-500">
                  <Star size={12} className="fill-amber-400 text-amber-400" /> {seller?.rating?.toFixed(1)} (
                  {seller?.ratingCount} ratings)
                </p>
              </div>
            </Link>

            <div className="mt-4 flex flex-col gap-2">
              {!isOwner ? (
                <button onClick={handleChat} className="btn-primary w-full">
                  <MessageCircle size={16} /> Chat with Seller
                </button>
              ) : (
                <span className="rounded-xl bg-ink-50 px-4 py-2.5 text-center text-sm text-ink-500">
                  This is your listing
                </span>
              )}
              {currentUser && !isOwner && (
                <button
                  onClick={() => toggleFavorite(listing.id)}
                  className="btn-secondary w-full"
                >
                  <Heart size={16} fill={fav ? "currentColor" : "none"} className={fav ? "text-red-500" : ""} />
                  {fav ? "Saved to favorites" : "Save to favorites"}
                </button>
              )}
              {chatError && (
                <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  {chatError}
                </p>
              )}
            </div>
          </div>

          <div className="card p-5">
            <h3 className="mb-3 font-display text-sm font-semibold text-ink-900">
              Seller Trust Score
            </h3>
            <div className="space-y-2 text-sm text-ink-600">
              <div className="flex justify-between">
                <span>Member since</span>
                <span className="text-right">{new Date(seller?.joinedAt).toLocaleDateString("en-IN", { year: "numeric", month: "short" })}</span>
              </div>
              <div className="flex justify-between">
                <span>Verification</span>
                <span>{seller?.verified ? "Verified" : "Unverified"}</span>
              </div>
              <div className="flex justify-between">
                <span>Location</span>
                <span>{seller?.location}</span>
              </div>
            </div>
          </div>

          {currentUser && !isOwner && (
            <div className="card p-5">
              {reportSent ? (
                <p className="text-sm text-brand-600">Thanks — our team will review this listing.</p>
              ) : reportOpen ? (
                <div>
                  <textarea
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    rows={2}
                    placeholder="What's wrong with this listing?"
                    className="input-field resize-none text-sm"
                  />
                  <button onClick={submitReport} className="btn-secondary mt-2 w-full text-sm">
                    Submit Report
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setReportOpen(true)}
                  className="flex w-full items-center justify-center gap-2 text-sm font-medium text-ink-500 hover:text-red-500"
                >
                  <Flag size={14} /> Report this listing
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {relatedListings.length > 0 && (
        <section className="mt-14 border-t border-ink-100 pt-10 sm:mt-16 sm:pt-12" aria-labelledby="related-products-heading">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 id="related-products-heading" className="font-display text-2xl font-bold text-ink-900 sm:text-3xl">
                Related Products
              </h2>
              <p className="mt-1 text-sm text-ink-500">More active {listing.category} listings you may like.</p>
            </div>
            <Link
              href={`/search?category=${encodeURIComponent(listing.category)}`}
              className="shrink-0 text-sm font-semibold text-brand-700 hover:text-brand-800 sm:text-base"
            >
              View all <ArrowRight aria-hidden="true" size={17} className="inline" />
            </Link>
          </div>

          <div className="mt-6 flex snap-x gap-4 overflow-x-auto pb-5 sm:gap-5">
            {relatedListings.map((relatedListing) => (
              <div key={relatedListing.id} className="w-[82vw] max-w-[320px] shrink-0 snap-start sm:w-[300px] lg:w-[320px]">
                <ProductCard listing={relatedListing} />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
