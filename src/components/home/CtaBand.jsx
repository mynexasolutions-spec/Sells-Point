"use client";

import { ArrowRight } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { useSiteChrome } from "@/context/SiteChromeContext";

export default function CtaBand() {
  const { currentUser } = useApp();
  const { openAuth, openPostAd } = useSiteChrome();
  return (
    <section className="bg-ink-50 pb-4 sm:pb-6">
      <div className="home-container">
        <div className="cta-gradient grid overflow-hidden rounded-3xl px-6 py-8 sm:px-10 sm:py-9 lg:grid-cols-[170px_minmax(0,1fr)_auto] lg:items-center lg:gap-10">
          <div className="order-2 mx-auto mt-5 w-36 self-end sm:mt-0 sm:w-44 lg:order-1 lg:mx-0 lg:w-full">
            <img
              src="/assets/home/cta-armchair.webp"
              alt="Green armchair and lamp"
              className="max-h-44 w-full object-contain object-bottom"
            />
          </div>
          <div className="order-1 text-white lg:order-2">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-brand-100">Make room for what matters</p>
            <h2 className="mt-2 font-display text-2xl font-extrabold sm:text-3xl">
              Ready to declutter or find something amazing?
            </h2>
            <p className="mt-2 text-base text-white/85 sm:text-lg">Join thousands of buyers and sellers on SellsPoint.</p>
          </div>
          <button
            type="button"
            onClick={() => (currentUser ? openPostAd() : openAuth())}
            className="btn-pill order-3 mt-6 shrink-0 justify-self-start bg-white px-6 py-3.5 text-base text-brand-700 shadow-lg hover:bg-brand-50 lg:mt-0 lg:justify-self-end"
          >
            Post Your Ad Now <ArrowRight aria-hidden="true" size={19} />
          </button>
        </div>
      </div>
    </section>
  );
}
