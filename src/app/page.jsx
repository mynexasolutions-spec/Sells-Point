"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import * as Icons from "lucide-react";
import {
  Sparkles,
  TrendingUp,
  ShieldCheck,
  MessageCircle,
  SearchX,
  UserPlus,
  Camera,
  Search,
  CheckCircle2,
  Flag,
  Star,
  Quote,
  ArrowRight,
  MapPin,
  ChevronDown,
  SlidersHorizontal,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import ProductCard from "@/components/ProductCard";
import { ProductGridSkeleton } from "@/components/Skeleton";
import AuthModal from "@/components/AuthModal";
import PostAdModal from "@/components/PostAdModal";
import Reveal from "@/components/Reveal";
import TiltCard from "@/components/TiltCard";
import Marquee from "@/components/Marquee";
import CountUp from "@/components/CountUp";
import FilterBar from "@/components/FilterBar";
import PaginationControls from "@/components/PaginationControls";

const STATS = [
  { label: "Verified sellers", value: 12, suffix: "K+" },
  { label: "Listings live", value: 48, suffix: "K+" },
  { label: "Cities covered", value: 120, suffix: "+" },
  { label: "Avg. seller rating", value: 4.7, suffix: "★", decimals: 1 },
];

const STEPS = [
  {
    icon: UserPlus,
    title: "Sign Up",
    description: "Join in seconds with just your mobile number, verified by OTP.",
  },
  {
    icon: Camera,
    title: "Post an Ad",
    description: "Add photos, a short video, price, and description in minutes.",
  },
  {
    icon: Search,
    title: "Browse & Discover",
    description: "Search, filter, and explore listings near you.",
  },
  {
    icon: MessageCircle,
    title: "Chat & Connect",
    description: "Message the seller directly — no numbers shared.",
  },
  {
    icon: CheckCircle2,
    title: "Close the Deal",
    description: "Finalize safely, confidently, and mark it sold.",
  },
];

const TRUST_FEATURES = [
  {
    icon: ShieldCheck,
    color: "bg-gradient-to-br from-brand-400 to-brand-600 text-white",
    title: "Phone-verified sellers",
    description: "Every account is OTP-verified — no fake profiles, no spam.",
  },
  {
    icon: MessageCircle,
    color: "bg-gradient-to-br from-sky-400 to-sky-600 text-white",
    title: "Built-in secure chat",
    description: "Talk and share photos without ever exposing your number.",
  },
  {
    icon: Flag,
    color: "bg-gradient-to-br from-red-400 to-red-600 text-white",
    title: "Report & block controls",
    description: "Full control over who you interact with, every conversation.",
  },
  {
    icon: Camera,
    color: "bg-gradient-to-br from-purple-400 to-purple-600 text-white",
    title: "Photo + video listings",
    description: "See the real condition before you even reach out.",
  },
  {
    icon: Sparkles,
    color: "bg-gradient-to-br from-amber-400 to-amber-600 text-white",
    title: "Featured & boosted ads",
    description: "Promote your listing for 5x the visibility.",
  },
  {
    icon: Star,
    color: "bg-gradient-to-br from-ink-700 to-ink-900 text-white",
    title: "Ratings & reviews",
    description: "Every seller's reputation is public and earned over time.",
  },
];

const TESTIMONIALS = [
  {
    name: "Meera Nair",
    location: "Bengaluru, IN",
    avatar: "https://i.pravatar.cc/150?img=47",
    quote:
      "Sold my old laptop in two days flat. The chat kept everything in one place and I never had to share my number.",
    rating: 5,
  },
  {
    name: "Vikram Singh",
    location: "Delhi, IN",
    avatar: "https://i.pravatar.cc/150?img=51",
    quote:
      "The video upload feature is genuinely useful — buyers trusted the listing more and I got fewer time-wasting queries.",
    rating: 5,
  },
  {
    name: "Ananya Iyer",
    location: "Pune, IN",
    avatar: "https://i.pravatar.cc/150?img=44",
    quote:
      "Felt safer than other marketplaces I've used. Phone verification and the report option actually matter.",
    rating: 4,
  },
];

const HOME_CATEGORY_LIMIT = 5;

const QUICK_BENEFITS = [
  { icon: CheckCircle2, title: "Sell Old", description: "Get instant payment" },
  { icon: Sparkles, title: "Buy Refurbished", description: "Quality goods, great prices" },
  { icon: ShieldCheck, title: "Safe & Secure", description: "100% secure transactions" },
  { icon: MapPin, title: "Doorstep Pickup", description: "Hassle-free experience" },
];

const TRUST_BENEFITS = [
  { icon: ShieldCheck, title: "Safe & Secure", description: "Report and block controls" },
  { icon: MessageCircle, title: "Built-in Chat", description: "Connect without sharing numbers" },
  { icon: Camera, title: "Real Listings", description: "Photos and video support" },
  { icon: MapPin, title: "Nearby Discovery", description: "Find listings around you" },
  { icon: CheckCircle2, title: "Fresh Inventory", description: "Expiry-aware active listings" },
];

function HomeContent() {
  const {
    listings,
    currentUser,
    hydrated,
    categories,
    subcategories,
    paginatedListings,
    paginatedLoading,
    paginatedHasMore,
    currentPage,
    fetchPaginatedListings,
    loadMore,
    resetPagination,
    setLastFilters,
  } = useApp();
  const searchParams = useSearchParams();
  const router = useRouter();
  const q = (searchParams.get("q") || "").toLowerCase();
  const loc = searchParams.get("loc") || "All India";
  const [activeCategory, setActiveCategory] = useState(searchParams.get("category") || null);
  const [subcategoryId, setSubcategoryId] = useState(searchParams.get("subcategory") || "");
  const [authOpen, setAuthOpen] = useState(false);
  const [postOpen, setPostOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const [minPrice, setMinPrice] = useState(searchParams.get("min") ? Number(searchParams.get("min")) : null);
  const [maxPrice, setMaxPrice] = useState(searchParams.get("max") ? Number(searchParams.get("max")) : null);
  const [conditions, setConditions] = useState(
    searchParams.get("cond") ? searchParams.get("cond").split(",").filter(Boolean) : []
  );
  const [dateFilter, setDateFilter] = useState(searchParams.get("since") || "all");
  const [nearby, setNearby] = useState(
    searchParams.get("lat") && searchParams.get("lng")
      ? { latitude: Number(searchParams.get("lat")), longitude: Number(searchParams.get("lng")) }
      : null
  );
  const [radiusKm, setRadiusKm] = useState(searchParams.get("radius") ? Number(searchParams.get("radius")) : 25);
  const [paginationReady, setPaginationReady] = useState(false);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const isInitialMount = useRef(true);
  const initialUrlPage = useRef(Number(searchParams.get("page")) || 1);

  const handleStartSelling = () => {
    if (!currentUser) {
      setAuthOpen(true);
    } else {
      setPostOpen(true);
    }
  };

  // Sync filter state to URL params
  const updateURL = (newFilters) => {
    const urlParams = new URLSearchParams(window.location.search);
    const nextSubcategory = newFilters.subcategoryId === undefined ? subcategoryId : newFilters.subcategoryId;
    if (nextSubcategory) urlParams.set("subcategory", nextSubcategory); else urlParams.delete("subcategory");
    
    if (newFilters.minPrice) urlParams.set("min", String(newFilters.minPrice));
    else urlParams.delete("min");
    
    if (newFilters.maxPrice) urlParams.set("max", String(newFilters.maxPrice));
    else urlParams.delete("max");
    
    if (newFilters.conditions.length > 0) urlParams.set("cond", newFilters.conditions.join(","));
    else urlParams.delete("cond");
    
    if (newFilters.dateFilter && newFilters.dateFilter !== "all") urlParams.set("since", newFilters.dateFilter);
    else urlParams.delete("since");

    if (newFilters.nearby) {
      urlParams.set("lat", String(newFilters.nearby.latitude));
      urlParams.set("lng", String(newFilters.nearby.longitude));
      urlParams.set("radius", String(newFilters.radiusKm || radiusKm || 25));
    } else {
      urlParams.delete("lat");
      urlParams.delete("lng");
      urlParams.delete("radius");
    }
    
    const newURL = urlParams.toString() ? `/?${urlParams.toString()}` : "/";
    router.replace(newURL, { scroll: false });
  };

  const handleMinPriceChange = (value) => {
    setMinPrice(value);
    updateURL({ minPrice: value, maxPrice, conditions, dateFilter, nearby, radiusKm });
  };

  const handleMaxPriceChange = (value) => {
    setMaxPrice(value);
    updateURL({ minPrice, maxPrice: value, conditions, dateFilter, nearby, radiusKm });
  };

  const handleConditionToggle = (cond) => {
    const newConditions = conditions.includes(cond)
      ? conditions.filter((c) => c !== cond)
      : [...conditions, cond];
    setConditions(newConditions);
    updateURL({ minPrice, maxPrice, conditions: newConditions, dateFilter, nearby, radiusKm });
  };

  const handleDateFilterChange = (value) => {
    setDateFilter(value);
    updateURL({ minPrice, maxPrice, conditions, dateFilter: value, nearby, radiusKm });
  };

  const handleUseNearby = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextNearby = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        setNearby(nextNearby);
        updateURL({ minPrice, maxPrice, conditions, dateFilter, nearby: nextNearby, radiusKm });
      },
      () => {},
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleClearNearby = () => {
    setNearby(null);
    updateURL({ minPrice, maxPrice, conditions, dateFilter, nearby: null, radiusKm });
  };

  const handleRadiusChange = (value) => {
    setRadiusKm(value);
    updateURL({ minPrice, maxPrice, conditions, dateFilter, nearby, radiusKm: value });
  };

  const handleClearFilters = () => {
    setMinPrice(null);
    setMaxPrice(null);
    setConditions([]);
    setDateFilter("all");
    setNearby(null);
    updateURL({ minPrice: null, maxPrice: null, conditions: [], dateFilter: "all", nearby: null, radiusKm });
  };

  useEffect(() => {
    if (!hydrated) return;
    const filters = {
      category: activeCategory || undefined,
      subcategoryId: subcategoryId || undefined,
      q: q || undefined,
      loc: loc || undefined,
      minPrice: minPrice || undefined,
      maxPrice: maxPrice || undefined,
      conditions: conditions.length > 0 ? conditions : undefined,
      dateFilter: dateFilter !== "all" ? dateFilter : undefined,
      nearby,
      radiusKm,
    };
    if (isInitialMount.current) {
      isInitialMount.current = false;
      if (initialUrlPage.current > 1) {
        setLastFilters(filters);
        (async () => {
          for (let p = 0; p < initialUrlPage.current; p++) {
            await fetchPaginatedListings({ page: p, filters });
          }
        })();
      } else {
        resetPagination(filters);
      }
    } else {
      resetPagination(filters);
      const urlParams = new URLSearchParams(window.location.search);
      urlParams.set("page", "1");
      router.replace(`/?${urlParams.toString()}`, { scroll: false });
    }

    setPaginationReady(true);
  }, [hydrated, activeCategory, subcategoryId, q, loc, minPrice, maxPrice, conditions, dateFilter, nearby, radiusKm, resetPagination, fetchPaginatedListings, setLastFilters, router]);

  useEffect(() => {
    if (!paginationReady) return;
    const urlPage = currentPage + 1;
    const currentUrlPage = Number(searchParams.get("page")) || 1;
    if (urlPage !== currentUrlPage) {
      const urlParams = new URLSearchParams(window.location.search);
      urlParams.set("page", String(urlPage));
      router.replace(`/?${urlParams.toString()}`, { scroll: false });
    }
  }, [currentPage, paginationReady, searchParams, router]);

  const activeListings = useMemo(() => listings.filter((l) => l.status === "active"), [listings]);

  const featured = useMemo(
    () => activeListings.filter((l) => l.featured && l.featuredStatus === "approved"),
    [activeListings]
  );
  const topDeals = useMemo(
    () => (featured.length > 0 ? featured : activeListings).slice(0, 5),
    [featured, activeListings]
  );
  const canExpandCategories = categories.length > HOME_CATEGORY_LIMIT;
  const visibleHomeCategories =
    showAllCategories && canExpandCategories ? categories : categories.slice(0, HOME_CATEGORY_LIMIT);

  return (
    <div>
      <section className="relative min-h-[620px] overflow-hidden bg-white sm:min-h-[560px] lg:aspect-[3/1] lg:min-h-0">
        <div className="absolute inset-0">
          <div className="relative h-full w-full">
            <img
              src="/assets/home/marketplace-hero.png"
              alt="Phones, laptops, tablets, watches, and headphones available on Sells Point"
              className="absolute inset-0 h-full w-full object-cover object-center"
            />
          </div>
        </div>
        <div className="relative z-10 mx-auto flex min-h-[620px] max-w-7xl items-center px-4 py-12 sm:min-h-[560px] sm:px-8 lg:h-full lg:min-h-0 lg:px-12">
          <div className="max-w-xl">
                <span className="badge-brand">
                  <Sparkles size={12} /> Trusted marketplace
                </span>
                <h1 className="mt-5 max-w-lg font-display text-4xl font-extrabold leading-[1.05] text-ink-950 sm:text-5xl lg:text-6xl">
                  Buy smart.
                  <span className="block text-brand-600">Sell easy.</span>
                </h1>
                <p className="mt-5 max-w-md text-base leading-relaxed text-ink-600 sm:text-lg">
                  Find great value in pre-loved products or sell your old device with people you can trust.
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <button onClick={handleStartSelling} className="btn-primary">
                    Sell Your Device <ArrowRight size={16} />
                  </button>
                  <a href="#explore" className="btn-secondary">Browse Listings</a>
                  <button type="button" onClick={handleUseNearby} className="btn-ghost">
                    <MapPin size={16} /> Use my location
                  </button>
                </div>
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-x-6 gap-y-5 lg:grid-cols-4">
          {QUICK_BENEFITS.map((benefit) => {
            const Icon = benefit.icon;
            return (
              <div key={benefit.title} className="flex items-center gap-3 px-2 py-2 sm:px-4">
                <span className="icon-tile h-10 w-10 bg-brand-50 text-brand-600">
                  <Icon size={19} />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-ink-900">{benefit.title}</p>
                  <p className="mt-0.5 truncate text-xs text-ink-500">{benefit.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {false && (
      <section className="relative overflow-hidden bg-hero-gradient px-4 py-24 text-white lg:px-8 lg:py-32">
        <div className="bg-dot-grid pointer-events-none absolute inset-0 opacity-60" />
        <div className="pointer-events-none absolute -right-20 top-0 hidden h-96 w-96 rounded-full bg-brand-500/25 blur-3xl lg:block animate-float" />
        <div
          className="pointer-events-none absolute -left-24 bottom-0 hidden h-80 w-80 rounded-full bg-brand-700/25 blur-3xl lg:block animate-float"
          style={{ animationDelay: "1.5s" }}
        />

        <div className="relative mx-auto grid max-w-7xl gap-12 lg:grid-cols-2 lg:items-center">
          <div className="max-w-xl animate-slide-up">
            <span className="badge bg-white/10 text-brand-200 ring-1 ring-inset ring-white/15">
              <Sparkles size={12} /> Trusted marketplace
            </span>
            <h1 className="mt-5 font-display text-4xl font-extrabold leading-tight lg:text-6xl">
              Buy &amp; sell with people you can{" "}
              <span className="bg-gradient-to-r from-brand-300 via-brand-400 to-brand-500 bg-clip-text text-transparent">
                actually trust.
              </span>
            </h1>
            <p className="mt-5 max-w-lg text-lg text-ink-200">
              Verified sellers, secure in-app chat, and premium listings — Sells Point makes
              second-hand feel first-class.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <button onClick={handleStartSelling} className="pulse-ring btn-primary px-6 py-3 text-base">
                Start Selling <ArrowRight size={17} />
              </button>
              <a
                href="#explore"
                className="btn-secondary bg-white/5 px-6 py-3 text-base text-white ring-1 ring-inset ring-white/20 hover:bg-white/10"
              >
                Browse Listings
              </a>
            </div>

            <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {STATS.map((s) => (
                <div key={s.label}>
                  <p className="font-display text-2xl font-bold lg:text-3xl">
                    <CountUp value={s.value} suffix={s.suffix} decimals={s.decimals} />
                  </p>
                  <p className="mt-0.5 text-xs text-ink-300">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative hidden lg:block lg:pb-10 lg:pt-6">
            <div className="absolute right-6 top-10 w-72 -rotate-6 rounded-3xl bg-white/5 p-4 opacity-70 blur-[1px] ring-1 ring-white/10">
              <img
                src="https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=1200&q=80"
                alt=""
                className="aspect-[4/3] w-full rounded-2xl object-cover"
              />
            </div>

            <TiltCard className="relative ml-auto w-80 cursor-pointer">
              <div className="glass-dark rounded-3xl p-4 shadow-glow">
                <img
                  src="https://images.unsplash.com/photo-1663499482523-1c0c1bae4ce1?w=1200&q=80"
                  alt="iPhone 14 Pro"
                  className="aspect-[4/3] w-full rounded-2xl object-cover"
                />
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-display font-bold text-white">iPhone 14 Pro</p>
                    <span className="badge-gold shrink-0">Featured</span>
                  </div>
                  <p className="font-display text-xl font-extrabold text-brand-300">₹78,999</p>
                  <div className="flex items-center gap-1 text-xs text-ink-300">
                    <Star size={12} className="fill-amber-400 text-amber-400" /> 4.8 · Mumbai, IN
                  </div>
                </div>
              </div>
            </TiltCard>

            <div className="glass-dark animate-float absolute -top-2 left-0 flex items-center gap-3 whitespace-nowrap rounded-2xl px-4 py-3 text-sm text-white">
              <ShieldCheck size={18} className="text-brand-300" /> Phone-verified sellers
            </div>
            <div
              className="glass-dark animate-float absolute -bottom-2 right-4 flex items-center gap-3 whitespace-nowrap rounded-2xl px-4 py-3 text-sm text-white"
              style={{ animationDelay: "1s" }}
            >
              <MessageCircle size={18} className="text-brand-300" /> Chat before you buy
            </div>
          </div>
        </div>

        <div className="relative mt-16 border-t border-white/10 pt-6">
          <Marquee items={categories.map((c) => c.label)} className="text-ink-300" />
        </div>
      </section>
      )}

      <Reveal>
        <section className="mx-auto max-w-7xl px-4 py-14 lg:px-8">
          <div className="mb-10">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-display text-xl font-bold text-ink-900">Shop By Category</h2>
              {canExpandCategories && (
                <button
                  type="button"
                  onClick={() => setShowAllCategories((value) => !value)}
                  aria-controls="home-category-list"
                  aria-expanded={showAllCategories}
                  className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 transition-colors hover:text-brand-800"
                >
                  {showAllCategories ? "Show Less" : "Show More"}
                  <ChevronDown
                    size={16}
                    aria-hidden="true"
                    className={`transition-transform ${showAllCategories ? "rotate-180" : ""}`}
                  />
                </button>
              )}
            </div>
            <div
              id="home-category-list"
              className={`grid grid-cols-3 gap-x-4 gap-y-6 sm:grid-cols-5 lg:gap-x-6 ${
                showAllCategories ? "lg:grid-cols-10" : "lg:grid-cols-5"
              }`}
            >
              {visibleHomeCategories.map((cat) => {
                const Icon = Icons[cat.icon] || Icons.Tag;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className="group flex flex-col items-center gap-2 text-center"
                  >
                    <span className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-50 ring-1 ring-inset ring-ink-100 transition-transform group-hover:-translate-y-0.5">
                      {cat.imageUrl ? (
                        <img src={cat.imageUrl} alt="" className="h-14 w-14 object-contain" />
                      ) : (
                        <Icon size={28} className="text-brand-600" />
                      )}
                    </span>
                    <span className="text-sm font-semibold text-ink-700">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {topDeals.length > 0 && (
            <section className="border-t border-ink-100 pt-10">
              <div className="mb-5 flex items-center justify-between gap-4">
                <h2 className="section-heading">
                  <TrendingUp size={18} className="text-brand-600" /> Top Deals for You
                </h2>
                <a href="#explore" className="text-sm font-semibold text-brand-700 hover:text-brand-800">
                  View All Deals <ArrowRight size={15} className="inline" />
                </a>
              </div>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                {topDeals.map((listing) => (
                  <ProductCard key={listing.id} listing={listing} />
                ))}
              </div>
            </section>
          )}

          <section className="grid gap-4 border-t border-ink-100 pt-10 sm:grid-cols-3">
            <div className="rounded-2xl bg-brand-50 p-5">
              <div className="flex items-center gap-3 text-brand-700">
                <span className="icon-tile h-10 w-10 bg-white"><Sparkles size={18} /></span>
                <p className="font-display font-bold">Sell in 60 Seconds</p>
              </div>
              <p className="mt-3 text-sm text-ink-600">Get an instant quote and reach serious buyers quickly.</p>
            </div>
            <div className="rounded-2xl bg-sky-50 p-5">
              <div className="flex items-center gap-3 text-sky-700">
                <span className="icon-tile h-10 w-10 bg-white"><ShieldCheck size={18} /></span>
                <p className="font-display font-bold">Instant Payment</p>
              </div>
              <p className="mt-3 text-sm text-ink-600">Keep every step clear with trusted in-app conversations.</p>
            </div>
            <div className="rounded-2xl bg-amber-50 p-5">
              <div className="flex items-center gap-3 text-amber-700">
                <span className="icon-tile h-10 w-10 bg-white"><MapPin size={18} /></span>
                <p className="font-display font-bold">Free Pickup</p>
              </div>
              <p className="mt-3 text-sm text-ink-600">Arrange a safe handoff that works for both sides.</p>
            </div>
          </section>

          <h2 className="section-heading mb-8 justify-center text-center sm:justify-start sm:text-left">
            How Sells Point Works
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {STEPS.map((step, idx) => {
              const Icon = step.icon;
              return (
                <div key={step.title} className="relative">
                  {idx < STEPS.length - 1 && (
                    <div className="pointer-events-none absolute -right-4 top-9 z-10 hidden text-ink-200 lg:block">
                      <ArrowRight size={18} />
                    </div>
                  )}
                  <div className="gradient-border card hover-card relative h-full p-5">
                    <span className="absolute right-4 top-4 font-display text-2xl font-extrabold text-ink-100">
                      {idx + 1}
                    </span>
                    <div className="icon-tile bg-gradient-to-br from-brand-400 to-brand-600 text-white">
                      <Icon size={20} />
                    </div>
                    <p className="mt-3 font-display font-bold text-ink-900">{step.title}</p>
                    <p className="mt-1 text-sm text-ink-500">{step.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </Reveal>


      <Reveal>
        <section className="w-full overflow-hidden bg-gradient-to-b from-white to-ink-50 px-6 py-16 sm:py-20">
          <div className="relative mx-auto grid w-full max-w-7xl items-center gap-12 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="relative min-w-0">
              <h2 className="mb-12 font-display text-4xl font-extrabold leading-tight tracking-tight text-ink-900 sm:mb-16 sm:text-[44px]">
                How Sells Point Works?
              </h2>

              <div className="relative grid gap-8 sm:grid-cols-3 sm:gap-6">
                <div
                  className="pointer-events-none absolute left-4 right-4 top-9 z-0 hidden h-0.5 sm:block"
                  style={{
                    backgroundImage: "linear-gradient(90deg, #22a45d 45%, transparent 0)",
                    backgroundSize: "14px 2px",
                    backgroundRepeat: "repeat-x",
                  }}
                />

                <div className="relative z-10">
                  <div className="flex h-[74px] w-[74px] items-center justify-center rounded-full bg-brand-500 text-white shadow-[0_12px_24px_rgba(34,164,93,0.28)]">
                    <Icons.PenLine size={30} />
                  </div>
                  <h3 className="mt-7 font-display text-xl font-bold text-ink-900">1. Post Your Ad</h3>
                  <p className="mt-3 max-w-[230px] text-base leading-relaxed text-ink-500">List your item in seconds for free.</p>
                </div>

                <div className="relative z-10">
                  <div className="flex h-[74px] w-[74px] items-center justify-center rounded-full bg-brand-500 text-white shadow-[0_12px_24px_rgba(34,164,93,0.28)]">
                    <Icons.MessageSquare size={30} />
                  </div>
                  <h3 className="mt-7 font-display text-xl font-bold text-ink-900">2. Connect</h3>
                  <p className="mt-3 max-w-[230px] text-base leading-relaxed text-ink-500">Interested buyers will reach out to you.</p>
                </div>

                <div className="relative z-10">
                  <div className="flex h-[74px] w-[74px] items-center justify-center rounded-full bg-brand-500 text-white shadow-[0_12px_24px_rgba(34,164,93,0.28)]">
                    <Icons.Link size={32} />
                  </div>
                  <h3 className="mt-7 font-display text-xl font-bold text-ink-900">3. Complete the Deal</h3>
                  <p className="mt-3 max-w-[230px] text-base leading-relaxed text-ink-500">Close the deal safely and easily.</p>
                </div>
              </div>
            </div>

            <div className="relative flex h-[420px] items-center justify-center sm:h-[520px]">
              <div className="absolute right-0 h-[78%] w-full rounded-[50%] bg-brand-500/10 blur-[1px]" />
              <svg
                className="pointer-events-none absolute right-0 top-0 z-0 h-[340px] w-[360px] max-w-full"
                viewBox="0 0 360 340"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M0 263 C60 263, 90 230, 150 195 C200 165, 250 150, 300 120 C335 100, 350 90, 360 84"
                  stroke="#22a45d"
                  strokeWidth="2"
                  strokeDasharray="6 8"
                  strokeLinecap="round"
                  opacity="0.55"
                />
              </svg>

              <div className="relative z-10 h-[400px] w-[280px] overflow-hidden rounded-[150px_150px_32px_32px] sm:h-[500px] sm:w-[340px]">
                <img
                  src="/assets/home/how-it-works.png"
                  alt="Person using Sells Point on a phone"
                  className="block h-full w-full object-cover object-[52%_8%]"
                />
              </div>

              <div className="absolute left-[6%] top-[24%] z-20 flex h-[64px] w-[64px] items-center justify-center rounded-full bg-white text-brand-600 shadow-[0_14px_30px_rgba(24,34,51,0.12)] sm:h-[72px] sm:w-[72px]">
                <Icons.MapPin size={30} />
              </div>
              <div className="absolute right-[2%] top-[12%] z-20 flex h-[70px] w-[70px] items-center justify-center rounded-full bg-white text-brand-600 shadow-[0_14px_30px_rgba(24,34,51,0.12)] sm:h-20 sm:w-20">
                <Icons.ShieldCheck size={34} />
              </div>
              <div className="absolute bottom-[14%] right-0 z-20 flex h-[66px] w-[66px] items-center justify-center rounded-full bg-brand-500 text-white shadow-[0_14px_30px_rgba(34,164,93,0.28)] sm:h-[74px] sm:w-[74px]">
                <Icons.MessageSquare size={32} />
              </div>
            </div>
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section className="relative w-full overflow-hidden bg-ink-900">
          <div className="relative w-full">
            <img
              src="/assets/home/ready-to-declutter.png"
              alt="Ready to declutter or find something amazing? Join thousands of buyers and sellers on Sells Point."
              className="-my-1 block h-[155px] w-full object-cover object-[45%_center] sm:h-[220px] lg:h-auto lg:object-contain"
            />
            <button
              type="button"
              onClick={handleStartSelling}
              className="absolute bottom-5 right-5 inline-flex items-center justify-center gap-2 rounded-xl bg-white px-7 py-3.5 font-display text-sm font-bold text-brand-700 shadow-lg transition hover:bg-ink-50 sm:bottom-7 sm:right-8 lg:bottom-auto lg:left-[53%] lg:right-auto lg:top-[64%] lg:min-w-[250px] lg:-translate-x-1/2 lg:px-8 lg:py-4"
            >
              Post Your Ad Now <ArrowRight size={16} />
            </button>
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section className="w-full bg-ink-50 px-4 py-10 lg:px-8">
          <div className="mx-auto mb-6 max-w-7xl">
            <h2 className="section-heading">Why Choose Sells Point?</h2>
            <p className="mt-2 text-sm text-ink-500">Simple tools designed to make buying and selling feel safer.</p>
          </div>
          <div className="mx-auto grid max-w-7xl gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-5">
            {TRUST_BENEFITS.map((benefit) => {
              const Icon = benefit.icon;
              return (
                <div key={benefit.title} className="flex items-start gap-3 px-2 py-2 sm:px-4">
                  <span className="icon-tile h-10 w-10 bg-white text-brand-600">
                    <Icon size={18} />
                  </span>
                  <div>
                    <p className="text-sm font-bold text-ink-900">{benefit.title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-ink-500">{benefit.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </Reveal>

      <section className="mx-auto max-w-7xl px-4 pb-4 lg:px-8" id="explore">
        <div className="flex gap-2.5 overflow-x-auto pb-2">
          <button
            onClick={() => setActiveCategory(null)}
            className={`shrink-0 rounded-full px-4 py-2.5 text-sm font-semibold transition-all ${
              activeCategory === null
                ? "bg-ink-900 text-white shadow-soft"
                : "bg-white text-ink-600 ring-1 ring-inset ring-ink-100 hover:ring-ink-200"
            }`}
          >
            All
          </button>
          {categories.map((cat) => {
            const Icon = Icons[cat.icon] || Icons.Tag;
            const active = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => { setActiveCategory(cat.id === activeCategory ? null : cat.id); setSubcategoryId(""); }}
                className={`flex shrink-0 items-center gap-2 rounded-full py-2 pl-2 pr-4 text-sm font-semibold transition-all ${
                  active
                    ? "bg-brand-600 text-white shadow-glow"
                    : "bg-white text-ink-600 ring-1 ring-inset ring-ink-100 hover:ring-ink-200"
                }`}
              >
                <span className={`icon-tile h-7 w-7 ${active ? "bg-white/20" : "bg-ink-100"}`}>
                  {cat.imageUrl ? (
                    <img src={cat.imageUrl} alt="" className="h-5 w-5 object-contain" />
                  ) : (
                    <Icon size={14} />
                  )}
                </span>
                {cat.label}
              </button>
            );
          })}
        </div>
        
        {/* Filter Toggle Button */}
        <div className="mt-3 flex items-center justify-between">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-ink-700 transition-colors hover:bg-ink-100"
          >
            <SlidersHorizontal size={16} />
            Filters
            {(minPrice || maxPrice || conditions.length > 0 || (dateFilter && dateFilter !== "all") || nearby) && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-xs text-white">
                {(minPrice || maxPrice ? 1 : 0) +
                  (conditions.length > 0 ? 1 : 0) +
                  (dateFilter && dateFilter !== "all" ? 1 : 0) +
                  (nearby ? 1 : 0)}
              </span>
            )}
          </button>
        </div>
        
        {/* Filter Bar */}
        {showFilters && (
          <div className="mt-3 rounded-xl border border-ink-200 bg-white p-4 shadow-sm">
            <FilterBar
              subcategories={subcategories.filter((s)=>!activeCategory||s.categoryId===activeCategory)}
              subcategoryId={subcategoryId}
              onSubcategoryChange={(value)=>{setSubcategoryId(value);updateURL({minPrice,maxPrice,conditions,dateFilter,nearby,radiusKm,subcategoryId:value});}}
              minPrice={minPrice}
              maxPrice={maxPrice}
              conditions={conditions}
              dateFilter={dateFilter}
              nearby={nearby}
              radiusKm={radiusKm}
              onMinPriceChange={handleMinPriceChange}
              onMaxPriceChange={handleMaxPriceChange}
              onConditionToggle={handleConditionToggle}
              onDateFilterChange={handleDateFilterChange}
              onUseNearby={handleUseNearby}
              onClearNearby={handleClearNearby}
              onRadiusChange={handleRadiusChange}
              onClearAll={handleClearFilters}
            />
          </div>
        )}
      </section>

      {!hydrated ? (
        <section className="mx-auto max-w-7xl px-4 pb-8 lg:px-8">
          <ProductGridSkeleton count={4} />
        </section>
      ) : (
        false && featured.length > 0 && (
          <section className="border-y border-amber-100 bg-gradient-to-b from-amber-50/60 to-transparent">
            <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="section-heading">
                  <Sparkles size={18} className="text-amber-500" /> Featured Ads
                </h2>
                <span className="badge-gold">Handpicked &amp; boosted</span>
              </div>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {featured.map((listing) => (
                  <ProductCard key={listing.id} listing={listing} />
                ))}
              </div>
            </div>
          </section>
        )
      )}

      {false && (
      <Reveal>
        <section className="mx-auto max-w-7xl px-4 py-14 lg:px-8">
          <img
            src="/assets/home/how-sellspoint-works.png"
            alt="How Sells Point works"
            className="w-full rounded-2xl object-cover shadow-soft"
          />
        </section>
      </Reveal>

      )}

      {false && (
      <Reveal>
        <section className="mx-auto max-w-7xl px-4 py-14 lg:px-8">
          <div className="text-center">
            <h2 className="section-heading justify-center">Why Choose Sells Point</h2>
            <p className="mt-2 text-sm text-ink-500">
              Built for trust — from sign-up to sold, every step is designed to protect you.
            </p>
          </div>
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:grid-rows-2">
            {TRUST_FEATURES.map((f, idx) => {
              const Icon = f.icon;
              const isFeature = idx === 0;
              return (
                <div
                  key={f.title}
                  className={`gradient-border card hover-card relative overflow-hidden p-6 ${
                    isFeature ? "lg:col-span-2 lg:row-span-2" : ""
                  }`}
                >
                  {isFeature && (
                    <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-brand-100 blur-2xl" />
                  )}
                  <div className={`icon-tile shadow-soft ${f.color} ${isFeature ? "h-14 w-14" : ""}`}>
                    <Icon size={isFeature ? 26 : 20} />
                  </div>
                  <p
                    className={`mt-4 font-display font-bold text-ink-900 ${
                      isFeature ? "text-2xl" : ""
                    }`}
                  >
                    {f.title}
                  </p>
                  <p className={`mt-1.5 text-ink-500 ${isFeature ? "max-w-sm text-base" : "text-sm"}`}>
                    {f.description}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      </Reveal>
      )}

      <section className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
        <h2 className="section-heading mb-4">
          <TrendingUp size={18} className="text-brand-600" />
          {q ? `Results for "${q}"` : "Explore Listings"}
        </h2>
        {!paginationReady || (!hydrated && !paginatedListings.length) ? (
          <ProductGridSkeleton />
        ) : paginatedListings.length === 0 && !paginatedLoading ? (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <div className="icon-tile h-14 w-14 bg-ink-100 text-ink-400">
              <SearchX size={24} />
            </div>
            <p className="text-sm text-ink-500">
              No listings match your search. Try adjusting your filters or category.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {paginatedListings.map((listing) => (
                <ProductCard key={listing.id} listing={listing} />
              ))}
            </div>
            <PaginationControls
              loading={paginatedLoading}
              hasMore={paginatedHasMore}
              onLoadMore={loadMore}
              count={paginatedListings.length}
            />
          </>
        )}
      </section>

      <Reveal>
        <section className="bg-ink-50 py-16">
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <h2 className="section-heading justify-center text-center">What Sellers Are Saying</h2>
            <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-3">
              {TESTIMONIALS.map((t) => (
                <div
                  key={t.name}
                  className="hover-card card relative border-l-4 border-l-brand-400 p-6"
                >
                  <Quote size={32} className="text-brand-100" />
                  <p className="mt-2 text-sm leading-relaxed text-ink-600">"{t.quote}"</p>
                  <div className="mt-4 flex items-center gap-3">
                    <img src={t.avatar} alt={t.name} className="h-10 w-10 rounded-full object-cover" />
                    <div>
                      <p className="text-sm font-semibold text-ink-900">{t.name}</p>
                      <p className="text-xs text-ink-500">{t.location}</p>
                    </div>
                    <div className="ml-auto flex items-center gap-0.5">
                      {Array.from({ length: t.rating }).map((_, i) => (
                        <Star key={i} size={13} className="fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </Reveal>

      <section className="relative overflow-hidden bg-hero-gradient px-4 py-24 text-center text-white lg:px-8">
        <div className="bg-dot-grid pointer-events-none absolute inset-0 opacity-50" />
        <div className="pointer-events-none absolute left-1/2 top-0 h-96 w-96 -translate-x-1/2 rounded-full bg-brand-500/20 blur-3xl" />

        <Sparkles size={20} className="pointer-events-none absolute left-[15%] top-10 hidden text-brand-300/60 animate-float lg:block" />
        <Sparkles
          size={14}
          className="pointer-events-none absolute right-[18%] top-20 hidden text-brand-300/40 animate-float lg:block"
          style={{ animationDelay: "1s" }}
        />
        <Sparkles
          size={16}
          className="pointer-events-none absolute bottom-16 left-[22%] hidden text-brand-300/40 animate-float lg:block"
          style={{ animationDelay: "2s" }}
        />

        <div className="relative mx-auto max-w-2xl">
          <span className="badge bg-white/10 text-brand-200 ring-1 ring-inset ring-white/15">
            <Sparkles size={12} /> Free to post
          </span>
          <h2 className="mt-5 font-display text-4xl font-extrabold leading-tight lg:text-5xl">
            Got something to{" "}
            <span className="bg-gradient-to-r from-brand-300 via-brand-400 to-brand-500 bg-clip-text text-transparent">
              sell?
            </span>
          </h2>
          <p className="mt-4 text-lg text-ink-200">
            Post your first ad free and reach thousands of verified buyers today.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={handleStartSelling}
              className="pulse-ring btn-primary px-8 py-3.5 text-base"
            >
              Post Your Ad <ArrowRight size={17} />
            </button>
            <a
              href="#explore"
              className="btn-secondary bg-white/5 px-8 py-3.5 text-base text-white ring-1 ring-inset ring-white/20 hover:bg-white/10"
            >
              Browse Listings
            </a>
          </div>
        </div>
      </section>

      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
      <PostAdModal isOpen={postOpen} onClose={() => setPostOpen(false)} />
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={null}>
      <HomeContent />
    </Suspense>
  );
}
