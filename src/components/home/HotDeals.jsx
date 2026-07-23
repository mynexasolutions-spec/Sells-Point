"use client";

import { useRouter } from "next/navigation";
import { ArrowRight, Sparkles, Tag } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { useSiteChrome } from "@/context/SiteChromeContext";

export default function HotDeals() {
  const router = useRouter();
  const { currentUser } = useApp();
  const { openAuth, openPostAd } = useSiteChrome();

  return (
    <section className="home-container pb-14 sm:pb-20">
      <div className="border-t border-ink-100 pt-14 sm:pt-16">
        <h2 className="font-display text-2xl font-bold text-ink-900 sm:text-3xl md:text-4xl">Hot Deals</h2>
        <p className="mt-1 text-sm text-ink-500 sm:text-base">Exciting offers for more value</p>
        <div className="mt-6 grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 sm:gap-5">
          <div className="cta-gradient flex flex-col items-start rounded-2xl p-5 text-white sm:p-6">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
              <Sparkles aria-hidden="true" size={20} />
            </span>
            <h3 className="mt-3 font-display text-lg font-bold sm:text-xl">Featured Ads</h3>
            <p className="mt-1 text-sm text-white/85">Sell 2x faster — boost your listing to the top from ₹49.</p>
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="mt-4 inline-flex items-center gap-1 rounded-full bg-white px-4 py-2 text-sm font-bold text-brand-700 hover:bg-brand-50"
            >
              Promote now <ArrowRight aria-hidden="true" size={15} />
            </button>
          </div>
          <div className="flex flex-col items-start rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 p-5 text-white sm:p-6">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
              <Tag aria-hidden="true" size={20} />
            </span>
            <h3 className="mt-3 font-display text-lg font-bold sm:text-xl">First Listing Free</h3>
            <p className="mt-1 text-sm text-white/85">New here? Post your first ad in under 2 minutes — on the house.</p>
            <button
              type="button"
              onClick={() => (currentUser ? openPostAd() : openAuth())}
              className="mt-4 inline-flex items-center gap-1 rounded-full bg-white px-4 py-2 text-sm font-bold text-amber-700 hover:bg-amber-50"
            >
              Post your ad <ArrowRight aria-hidden="true" size={15} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
