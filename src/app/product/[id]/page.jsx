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
  ArrowLeft,
  Share2,
  ShoppingCart,
  CreditCard,
  BadgeCheck,
  Truck,
  Landmark,
  Banknote,
  Smartphone,
  CircleDollarSign,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { useSiteChrome } from "@/context/SiteChromeContext";
import { supabase } from "@/lib/supabaseClient";
import ProductCard from "@/components/ProductCard";
import BrandLogo from "@/components/BrandLogo";
import MockCheckoutModal from "@/components/MockCheckoutModal";

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
  const [selectedSpecifications, setSelectedSpecifications] = useState({});
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [commerceMessage, setCommerceMessage] = useState("");
  const [deliveryPin, setDeliveryPin] = useState("");
  const [deliveryMessage, setDeliveryMessage] = useState("");

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
              subcategoryId: data.subcategory_id || null,
              specifications: data.specifications || {},
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
  const specs = listing.specifications || {};
  const discount = listing.originalPrice > listing.price ? Math.round(((listing.originalPrice - listing.price) / listing.originalPrice) * 100) : 0;
  const checkoutItem = { ...listing, selectedSpecifications, quantity: 1 };
  const bundles = BUNDLES_BY_CATEGORY[listing.category] || [{ label: "care and protection plan", icon: "🛡️", price: 499 }, { label: "premium accessory", icon: "✨", price: 299 }];

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

  const shareListing = async () => {
    const shareData = { title: listing.title, text: `View ${listing.title} on SellsPoint`, url: window.location.href };
    if (navigator.share) await navigator.share(shareData);
    else await navigator.clipboard?.writeText(shareData.url);
  };

  const addToCart = async () => {
    if (!currentUser) return openAuth();
    const response = await fetch("/api/cart", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ actorId: currentUser.id, listingId: listing.id, selectedSpecifications }) });
    const json = await response.json().catch(() => ({}));
    setCommerceMessage(response.ok ? "Added to your cart." : json.error || "Unable to add to cart.");
  };

  const selectSpec = (key, value) => setSelectedSpecifications((prev) => ({ ...prev, [key]: value }));

  const optionValues = (value) => String(value || "").split("|").map((item) => item.trim()).filter(Boolean);

  const checkDelivery = () => setDeliveryMessage(/^\d{6}$/.test(deliveryPin) ? "Delivery is available here in 3–5 business days (mock)." : "Enter a valid 6-digit PIN code.");

  return (
    <div className="mx-auto w-full max-w-[1280px] pb-24 md:px-8 md:py-8 lg:pb-8">
      <header className="flex h-14 items-center justify-between border-b border-ink-100 px-4 md:hidden">
        <button type="button" onClick={() => router.back()} className="-ml-2 rounded-full p-2" aria-label="Go back"><ArrowLeft size={21} /></button>
        <BrandLogo compact className="h-8 w-[104px] min-[390px]:w-[112px]" />
        <div className="flex items-center gap-1"><button type="button" onClick={() => toggleFavorite(listing.id)} className="rounded-full p-2" aria-label="Save listing"><Heart size={20} fill={fav ? "currentColor" : "none"} className={fav ? "text-red-500" : ""} /></button><button type="button" onClick={shareListing} className="rounded-full p-2" aria-label="Share listing"><Share2 size={19} /></button></div>
      </header>
      <div className="hidden border-b border-ink-100 px-4 py-3 text-xs text-ink-500 md:block"><Link href="/">Home</Link> <span className="mx-2">›</span><Link href={`/search?category=${encodeURIComponent(listing.category)}`}>{listing.category}</Link><span className="mx-2">›</span><span className="text-ink-700">{listing.title}</span></div>
      <div className="grid gap-0 lg:grid-cols-[minmax(0,1.08fr)_minmax(360px,.92fr)] lg:gap-10 lg:px-4 lg:pt-6">
        <div className="min-w-0">
          <div className="flex h-[min(72vw,390px)] min-h-[280px] gap-2 bg-white px-3 py-3 sm:h-[480px] lg:h-[580px]">
            {images.length > 1 && (
              <div className="flex w-12 shrink-0 flex-col gap-2 overflow-y-auto scrollbar-hidden sm:w-16">
                {images.map((src, idx) => (
                  <button key={idx} onClick={() => setImgIdx(idx)} className={`aspect-square shrink-0 overflow-hidden rounded-md border-2 bg-white p-1 ${idx === imgIdx ? "border-brand-500" : "border-ink-200"}`} aria-label={`View image ${idx + 1}`}>
                    <img src={src} alt="" className="h-full w-full object-contain" />
                  </button>
                ))}
              </div>
            )}
            <div className="relative min-w-0 flex-1 overflow-hidden rounded-lg border border-ink-200 bg-white">
              {images.length > 0 ? (
                <img src={images[imgIdx]} alt={listing.title} className="h-full w-full p-5 object-contain object-center sm:p-8" />
              ) : (
                <div className="flex h-full items-center justify-center text-ink-300">No image</div>
              )}
            {images.length > 1 && (
              <>
                <button
                  onClick={() => setImgIdx((i) => (i - 1 + images.length) % images.length)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white p-2 shadow-soft"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={() => setImgIdx((i) => (i + 1) % images.length)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white p-2 shadow-soft"
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
            <img
              src="/assets/brand/sellspoint-assurance.png"
              alt="Sells Point Assurance"
              className="absolute left-3 top-3 h-10 w-32 rounded-md object-cover object-center shadow-md sm:h-12 sm:w-40"
            />
            <div className="absolute bottom-3 left-1/2 grid w-[calc(100%_-_1rem)] max-w-[360px] -translate-x-1/2 grid-cols-3 overflow-hidden rounded-md bg-ink-950 py-2 text-center text-white shadow-lg sm:bottom-5 sm:w-[82%] sm:py-2.5">
              <span className="min-w-0 border-r border-white/20 px-0.5 text-[9px] font-semibold leading-tight sm:px-1 sm:text-xs"><b className="mr-0.5 text-sm sm:mr-1 sm:text-lg">32</b>Point Quality<br/>Check</span>
              <span className="min-w-0 border-r border-white/20 px-0.5 text-[9px] font-semibold leading-tight sm:px-1 sm:text-xs"><b className="mr-0.5 text-sm sm:mr-1 sm:text-lg">15</b>Days Refund<sup>*</sup></span>
              <span className="min-w-0 px-0.5 text-[9px] font-semibold leading-tight sm:px-1 sm:text-xs"><b className="mr-0.5 text-sm sm:mr-1 sm:text-lg">06</b>Months<br/>Warranty</span>
            </div>
            </div>
          </div>

          {listing.video && (
            <div className="mt-4">
              <video src={listing.video} controls className="w-full rounded-2xl" />
            </div>
          )}

          <div className="px-4 pb-5 pt-4 lg:hidden">
            <div className="flex flex-wrap items-center gap-2">
              <span className="badge-ink">{listing.condition}</span>
              {listing.featured && listing.featuredStatus === "approved" && (
                <span className="badge-gold">Featured</span>
              )}
            </div>
            <h1 className="mt-3 font-display text-lg font-bold text-ink-900">{listing.title}</h1>
            <div className="mt-2 flex items-baseline gap-3">
              <span className="font-display text-2xl font-extrabold text-ink-900">
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

            <div className="mt-5 border-t border-ink-100 pt-4">
              <h3 className="mb-2 font-display font-semibold text-ink-900">Description</h3>
              <p className="whitespace-pre-line text-sm leading-relaxed text-ink-600">
                {listing.description}
              </p>
            </div>
          </div>
        </div>

        <div className="min-w-0 space-y-4 px-4 pb-4 lg:px-0">
          <div className="hidden lg:block">
            <div className="flex flex-wrap items-center gap-2"><span className="badge-ink">{listing.condition}</span>{listing.featured && listing.featuredStatus === "approved" && <span className="badge-gold">Featured</span>}</div>
            <h1 className="mt-3 font-display text-3xl font-bold text-ink-900">{listing.title}</h1>
            <div className="mt-3 flex items-baseline gap-3"><span className="font-display text-3xl font-extrabold text-ink-900">{formatPrice(listing.price)}</span>{listing.originalPrice > listing.price && <span className="text-base text-ink-400 line-through">{formatPrice(listing.originalPrice)}</span>}</div>
            <div className="mt-3 flex flex-wrap gap-4 text-sm text-ink-500"><span className="flex items-center gap-1"><MapPin size={14} />{listing.location}</span><span className="flex items-center gap-1"><Clock size={14} />{timeAgo(listing.createdAt)}</span><span className="flex items-center gap-1"><Eye size={14} />{listing.views} views</span></div>
            <div className="mt-5 border-t border-ink-100 pt-4"><h2 className="font-display font-semibold text-ink-900">Description</h2><p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink-600">{listing.description}</p></div>
          </div>
          {!isOwner && listing.status === "active" && (
            <div className="rounded-2xl border border-brand-100 bg-white p-4 shadow-sm sm:p-5">
              <div className="flex items-center justify-between gap-4"><div><p className="font-display font-bold text-ink-900">Buy with confidence</p><p className="mt-1 text-sm text-ink-500">Mock EMI from {formatPrice(Math.ceil(listing.price / 6))}/month</p></div><BadgeCheck className="shrink-0 text-brand-600" /></div>
              {Object.entries(specs).filter(([, value]) => value !== null && value !== "").map(([key, value]) => <div key={key} className="mt-4"><p className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-500">{key.replace(/([A-Z])/g, " $1")}</p><div className="flex flex-wrap gap-2">{optionValues(value).map((option) => <button key={option} onClick={() => selectSpec(key, option)} className={`rounded-lg border px-3 py-2 text-sm font-semibold ${selectedSpecifications[key] === option ? "border-brand-600 bg-brand-50 text-brand-800" : "border-ink-200 text-ink-700"}`}>{option}{key === "warrantyMonths" ? " months" : ""}</button>)}</div></div>)}
              <div className="mt-5 grid grid-cols-[42px_minmax(0,1fr)_minmax(0,1fr)] gap-2 sm:grid-cols-[48px_minmax(0,1fr)_minmax(0,1fr)]"><button onClick={addToCart} className="flex min-h-11 items-center justify-center rounded-xl border border-brand-200 text-brand-700 hover:bg-brand-50" aria-label="Add to cart"><ShoppingCart size={19} /></button><button onClick={() => setCheckoutOpen(true)} className="btn-secondary min-w-0 px-1.5 text-xs sm:px-2 sm:text-sm"><CreditCard size={15} /><span className="sm:hidden">EMI</span><span className="hidden sm:inline">Pay with EMI</span></button><button onClick={() => setCheckoutOpen(true)} className="btn-primary min-w-0 px-1.5 text-xs sm:px-2 sm:text-sm">Buy Now</button></div>
              {commerceMessage && <p className="mt-3 text-sm font-medium text-brand-700">{commerceMessage}</p>}
              <section className="mt-6 border-t border-ink-100 pt-4" aria-label="Bundle offers"><h3 className="font-display text-base font-bold text-ink-900">Save extra when you buy together</h3><p className="text-xs text-brand-700">Relevant accessories for this {listing.category} listing · mock bundle offer</p><div className="mt-3 flex snap-x gap-3 overflow-x-auto pb-2 pr-2">{bundles.map((bundle) => <div key={bundle.label} className="w-[78vw] max-w-[250px] shrink-0 snap-start rounded-xl border border-ink-200 p-3 sm:w-[225px]"><div className="flex h-20 items-center justify-center gap-2 rounded-lg bg-ink-50"><img src={images[0]} alt="" className="h-16 w-16 object-contain"/><b className="rounded-full bg-ink-900 px-1.5 text-white">+</b><span className="text-3xl">{bundle.icon}</span></div><p className="mt-2 line-clamp-2 text-xs font-semibold">{listing.title} + {bundle.label}</p><p className="mt-1 text-sm font-bold text-ink-900">{formatPrice(listing.price + bundle.price)}</p><button onClick={() => setCommerceMessage(`Mock ${bundle.label} bundle added to cart.`)} className="mt-2 w-full rounded-lg border border-ink-800 py-1.5 text-xs font-semibold">Add combo to cart</button></div>)}</div></section>
              <section className="mt-5 border-t border-ink-100 pt-4" aria-label="Available payment methods"><h3 className="font-display text-base font-bold text-ink-900">Available Payment Methods</h3><div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-7">{[[CreditCard,"EMI"],[Smartphone,"UPI"],[CreditCard,"Credit card"],[Truck,"COD"],[CircleDollarSign,"Split pay"],[Banknote,"Debit card"],[Landmark,"Net banking"]].map(([Icon, label]) => <div key={label} className="text-center"><span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-ink-50 text-brand-700"><Icon size={18}/></span><p className="mt-1 text-[10px] font-medium text-ink-600">{label}</p></div>)}</div></section>
              <section className="mt-5 rounded-xl bg-brand-50 p-3" aria-label="Check delivery"><div className="flex items-center gap-2"><Truck size={18} className="text-brand-700"/><h3 className="font-display text-sm font-bold">Check Delivery</h3></div><div className="mt-2 flex gap-2"><input value={deliveryPin} onChange={(event) => setDeliveryPin(event.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" placeholder="Enter PIN code" className="min-w-0 flex-1 rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm outline-none"/><button onClick={checkDelivery} className="rounded-lg bg-brand-700 px-3 text-sm font-bold text-white">Check</button></div>{deliveryMessage && <p className="mt-2 text-xs font-medium text-brand-800">{deliveryMessage}</p>}</section>
            </div>
          )}
          <div className="border-t border-ink-100 pt-4 lg:border-0 lg:pt-0">
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

      <div className="fixed inset-x-0 bottom-0 z-40 flex gap-2 border-t border-ink-200 bg-white p-3 pb-[calc(.75rem+env(safe-area-inset-bottom))] shadow-[0_-5px_20px_rgba(15,23,42,.08)] lg:hidden">
        {!isOwner && listing.status === "active" ? <><button type="button" onClick={addToCart} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-brand-300 text-brand-700" aria-label="Add to cart"><ShoppingCart size={20} /></button><button type="button" onClick={() => setCheckoutOpen(true)} className="flex-1 rounded-md border border-brand-500 px-2 text-sm font-bold text-brand-700">EMI</button><button type="button" onClick={() => setCheckoutOpen(true)} className="flex-1 rounded-md bg-brand-600 px-2 text-sm font-bold text-white">Buy Now</button></> : <button type="button" onClick={handleChat} className="flex-1 rounded-md bg-ink-950 px-4 text-sm font-bold text-white">Chat with Seller</button>}
      </div>

      <MockCheckoutModal open={checkoutOpen} onClose={() => setCheckoutOpen(false)} items={[checkoutItem]} />

      {relatedListings.length > 0 && (
        <section className="mt-8 border-t border-ink-100 px-4 pt-8 sm:mt-16 sm:pt-12 lg:px-0" aria-labelledby="related-products-heading">
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
                <ProductCard listing={relatedListing} sizes="(max-width: 640px) 82vw, 320px" />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

const BUNDLES_BY_CATEGORY = {
  mobiles: [{ label: "25W compatible charger", icon: "🔌", price: 399 }, { label: "10,000 mAh power bank", icon: "🔋", price: 1244 }],
  laptops: [{ label: "padded laptop sleeve", icon: "💼", price: 799 }, { label: "wireless mouse", icon: "🖱️", price: 649 }],
  vehicles: [{ label: "riding helmet", icon: "🪖", price: 2499 }, { label: "bike care kit", icon: "🧰", price: 899 }],
  furniture: [{ label: "fabric care kit", icon: "🧴", price: 499 }, { label: "floor protection pads", icon: "◼️", price: 299 }],
  gaming: [{ label: "controller charging dock", icon: "🎮", price: 1199 }, { label: "gaming headset", icon: "🎧", price: 1499 }],
  cameras: [{ label: "memory card", icon: "💾", price: 899 }, { label: "camera carry case", icon: "📷", price: 1299 }],
  appliances: [{ label: "extended care kit", icon: "🛠️", price: 699 }, { label: "power protection plug", icon: "🔌", price: 449 }],
  fashion: [{ label: "premium garment care", icon: "🧼", price: 249 }, { label: "gift packaging", icon: "🎁", price: 99 }],
  books: [{ label: "reading light", icon: "💡", price: 349 }, { label: "book cover", icon: "📘", price: 199 }],
  realestate: [{ label: "home inspection visit", icon: "🏠", price: 999 }, { label: "documentation check", icon: "📄", price: 499 }],
};
