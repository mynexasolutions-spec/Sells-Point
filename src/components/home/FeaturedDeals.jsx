"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { useApp } from "@/context/AppContext";
import ProductCard from "@/components/ProductCard";

export default function FeaturedDeals() {
  const router = useRouter();
  const { listings } = useApp();
  const deals = useMemo(() => {
    const active = listings.filter((listing) => listing.status === "active");
    const featured = active.filter((listing) => listing.featured && listing.featuredStatus === "approved");
    return (featured.length ? featured : active).slice(0, 8);
  }, [listings]);

  return (
    <section className="home-container pb-14 sm:pb-20">
      <div className="border-t border-ink-100 pt-14 sm:pt-16">
        <div className="mb-8 flex items-center justify-between gap-4">
          <h2 className="min-w-0 flex-1 font-display text-2xl font-bold text-ink-900 sm:text-3xl md:text-4xl">
            Featured Deals
          </h2>
          <button
            type="button"
            onClick={() => router.push("/search")}
            className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap text-sm font-semibold text-brand-700 hover:text-brand-800 sm:text-base"
          >
            View All Deals
            <ArrowRight aria-hidden="true" size={18} />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
          {deals.map((listing) => (
            <div key={listing.id} className="min-w-0">
              <ProductCard listing={listing} />
            </div>
          ))}
          {deals.length === 0 && (
            <p className="col-span-full rounded-2xl border border-dashed border-ink-200 px-6 py-10 text-base text-ink-500">
              Featured deals will appear here as soon as listings are available.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
