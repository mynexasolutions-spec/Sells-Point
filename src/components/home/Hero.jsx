"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { useSiteChrome } from "@/context/SiteChromeContext";

const promotions = [
  {
    title: "Sell anything, free",
    sub: "Post your ad in under a minute — photos, video, and your price.",
    cta: "Post Your Ad",
    image: "/assets/home/slides/slide 1.png",
    action: "post",
  },
  {
    title: "Deals near you",
    sub: "Find great second-hand finds from people in your own city.",
    cta: "Browse Listings",
    image: "/assets/home/slides/slide 2.png",
    action: "browse",
  },
  {
    title: "Your number stays private",
    sub: "Chat with buyers and sellers inside the app. Nothing shared.",
    cta: "See How It Works",
    image: "/assets/home/slides/slide 3.png",
    action: "how-it-works",
  },
  {
    title: "Get seen faster",
    sub: "Boost your listing to the top of search for a full month.",
    cta: "Promote an Ad",
    image: "/assets/home/slides/slide 4.png",
    action: "post",
  },
];

export default function Hero() {
  const router = useRouter();
  const { currentUser } = useApp();
  const { openAuth, openPostAd } = useSiteChrome();
  const carouselRef = useRef(null);
  const touchStartX = useRef(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const [paused, setPaused] = useState(false);
  const [isTabHidden, setIsTabHidden] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [missingImages, setMissingImages] = useState(() => new Set());
  const [controlsVisible, setControlsVisible] = useState(false);
  const controlsTimerRef = useRef(null);

  const goToSlide = (index) => setActiveSlide((index + promotions.length) % promotions.length);
  const postAd = () => (currentUser ? openPostAd() : openAuth());
  const revealMobileControls = () => {
    window.clearTimeout(controlsTimerRef.current);
    setControlsVisible(true);
    controlsTimerRef.current = window.setTimeout(() => setControlsVisible(false), 2200);
  };

  const handleAction = (action) => {
    if (action === "post") {
      postAd();
      return;
    }
    if (action === "browse") {
      router.push("/search");
      return;
    }
    router.push("#how-it-works");
  };

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateReducedMotion = () => setReducedMotion(mediaQuery.matches);
    const updateVisibility = () => setIsTabHidden(document.hidden);

    updateReducedMotion();
    updateVisibility();
    mediaQuery.addEventListener("change", updateReducedMotion);
    document.addEventListener("visibilitychange", updateVisibility);

    return () => {
      mediaQuery.removeEventListener("change", updateReducedMotion);
      document.removeEventListener("visibilitychange", updateVisibility);
    };
  }, []);

  useEffect(() => {
    if (paused || isTabHidden || reducedMotion) return undefined;
    const interval = window.setInterval(() => goToSlide(activeSlide + 1), 4000);
    return () => window.clearInterval(interval);
  }, [activeSlide, isTabHidden, paused, reducedMotion]);

  useEffect(() => () => window.clearTimeout(controlsTimerRef.current), []);

  const handleBlur = (event) => {
    if (!carouselRef.current?.contains(event.relatedTarget)) {
      setPaused(false);
      setControlsVisible(false);
    }
  };

  const handleTouchEnd = (event) => {
    if (touchStartX.current === null) return;
    const distance = event.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(distance) > 40) goToSlide(activeSlide + (distance < 0 ? 1 : -1));
    touchStartX.current = null;
  };

  return (
    <section className="pt-5 pb-2 sm:pt-6 md:pt-8 w-full max-w-full overflow-hidden">
      <div className="home-container relative">
        <div
          ref={carouselRef}
          aria-roledescription="carousel"
          aria-label="SellsPoint promotions"
          onMouseEnter={() => { setPaused(true); setControlsVisible(true); }}
          onMouseLeave={() => { setPaused(false); setControlsVisible(false); }}
          onFocusCapture={() => { setPaused(true); setControlsVisible(true); }}
          onBlurCapture={handleBlur}
          onKeyDown={(event) => {
            if (event.key === "ArrowLeft") {
              event.preventDefault();
              goToSlide(activeSlide - 1);
            }
            if (event.key === "ArrowRight") {
              event.preventDefault();
              goToSlide(activeSlide + 1);
            }
          }}
          onTouchStart={(event) => {
            touchStartX.current = event.touches[0].clientX;
            revealMobileControls();
          }}
          onTouchEnd={handleTouchEnd}
          className="group relative mx-auto mt-2 w-full max-w-[1360px]"
        >
          {/* Banner Container */}
          <div
            className="relative aspect-[1.48/1] overflow-hidden rounded-[16px] bg-brand-800 shadow-neutral sm:aspect-[1.8/1] md:aspect-[3/1]"
            aria-live="polite"
          >
            {promotions.map((promotion, index) => {
              const isActive = index === activeSlide;
              const imageMissing = missingImages.has(index);
              const Heading = index === 0 ? "h1" : "p";

              return (
                <div
                  key={promotion.title}
                  aria-hidden={!isActive}
                  className={`absolute inset-0 transition-opacity duration-[500ms] ${
                    isActive ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
                  }`}
                >
                  {/* Option 2 Layout: Transparent PNG Image pinned to the right */}
                  {!missingImages.has(index) && (
                    <div className="absolute right-0 top-0 z-0 flex h-full w-[55%] items-end justify-end pr-2 sm:w-[50%] sm:pr-8">
                      <Image
                        src={promotion.image}
                        alt=""
                        width={800}
                        height={600}
                        sizes="(max-width: 1280px) 100vw, 1200px"
                        priority={index === 0}
                        onError={() => setMissingImages((previous) => new Set(previous).add(index))}
                        className="h-[90%] w-auto max-h-full max-w-none object-contain object-right drop-shadow-xl sm:h-full"
                      />
                    </div>
                  )}

                  {/* Text Container directly over background (Left Side) */}
                  <div className="relative z-10 flex h-full items-center px-6 py-5 sm:px-10 sm:py-0 md:px-14 lg:px-20 w-[90%] sm:w-[60%] lg:w-[55%]">
                    <div>
                      <Heading className="font-display text-2xl font-extrabold leading-[1.05] sm:text-4xl md:text-5xl lg:text-6xl text-white">
                        {promotion.title}
                      </Heading>
                      <p className="mt-2 text-sm font-medium leading-snug text-brand-50 sm:mt-3 md:mt-5 md:text-xl">
                        {promotion.sub}
                      </p>
                      <div className="mt-5 flex flex-wrap gap-2 md:mt-8 md:gap-3">
                        <button
                          type="button"
                          tabIndex={isActive ? 0 : -1}
                          onClick={() => handleAction(promotion.action)}
                          className="btn-pill inline-flex items-center rounded-xl bg-ink-950 px-5 py-2.5 sm:px-6 sm:py-3.5 text-xs sm:text-sm md:text-base font-semibold text-white shadow-lg transition-transform hover:-translate-y-0.5 hover:bg-ink-800 focus:ring-4 focus:ring-ink-200 border-none"
                        >
                          {promotion.cta} <ArrowRight size={18} className="ml-1.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Layout Arrows - Positioned exactly on border edges as 'Tabs' */}
          <button
            type="button"
            onClick={() => goToSlide(activeSlide - 1)}
            className={`pointer-events-none absolute left-[-1px] top-1/2 z-20 flex h-16 w-10 -translate-y-1/2 items-center justify-center rounded-r-[16px] bg-white text-ink-600 opacity-0 shadow-[4px_0_12px_rgba(0,0,0,0.08)] outline-none transition-all duration-200 hover:text-ink-900 focus-visible:outline-offset-2 sm:h-20 sm:w-11 group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100 ${controlsVisible ? "pointer-events-auto opacity-100" : ""}`}
            aria-label="Previous slide"
          >
            <ChevronLeft size={24} className="ml-1" strokeWidth={2.5} />
          </button>
          <button
            type="button"
            onClick={() => goToSlide(activeSlide + 1)}
            className={`pointer-events-none absolute right-[-1px] top-1/2 z-20 flex h-16 w-10 -translate-y-1/2 items-center justify-center rounded-l-[16px] bg-white text-ink-600 opacity-0 shadow-[-4px_0_12px_rgba(0,0,0,0.08)] outline-none transition-all duration-200 hover:text-ink-900 focus-visible:outline-offset-2 sm:h-20 sm:w-11 group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100 ${controlsVisible ? "pointer-events-auto opacity-100" : ""}`}
            aria-label="Next slide"
          >
            <ChevronRight size={24} className="mr-1" strokeWidth={2.5} />
          </button>
        </div>

        {/* Carousel Dots */}
        <div className="mt-4 flex justify-center gap-1.5 md:gap-2">
          {promotions.map((promotion, index) => (
            <button
              key={promotion.title}
              type="button"
              onClick={() => goToSlide(index)}
              className={`h-1.5 rounded-full transition-all focus-visible:outline-offset-2 ${
                activeSlide === index ? "w-6 bg-ink-400" : "w-4 bg-ink-200 hover:bg-ink-300"
              }`}
              aria-label={`Go to slide ${index + 1}`}
              aria-current={activeSlide === index ? "true" : undefined}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
