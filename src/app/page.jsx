import { redirect } from "next/navigation";
import Hero from "@/components/home/Hero";
import CategoryGrid from "@/components/home/CategoryGrid";
import FeaturedDeals from "@/components/home/FeaturedDeals";
import StatsBar from "@/components/home/StatsBar";
import Testimonials from "@/components/home/Testimonials";
import BrandStrip from "@/components/home/BrandStrip";
import Articles from "@/components/home/Articles";
import HotDeals from "@/components/home/HotDeals";
import HowItWorks from "@/components/home/HowItWorks";
import CtaBand from "@/components/home/CtaBand";
import WhyChoose from "@/components/home/WhyChoose";

const LEGACY_SEARCH_KEYS = new Set([
  "q", "category", "subcategory", "loc", "min", "max", "cond", "since",
  "lat", "lng", "radius", "page",
]);

export default function HomePage({ searchParams = {} }) {
  const hasLegacySearch = Object.keys(searchParams).some((key) => LEGACY_SEARCH_KEYS.has(key));
  if (hasLegacySearch) {
    const params = new URLSearchParams();
    Object.entries(searchParams).forEach(([key, value]) => {
      const values = Array.isArray(value) ? value : [value];
      values.forEach((item) => {
        if (item !== undefined) params.append(key, String(item));
      });
    });
    redirect(`/search?${params.toString()}`);
  }

  return (
    <>
      <Hero />
      <CategoryGrid />
      <FeaturedDeals />
      <StatsBar />
      <Testimonials />
      <BrandStrip />
      <Articles />
      <HotDeals />
      <HowItWorks />
      <CtaBand />
      <WhyChoose />
    </>
  );
}
