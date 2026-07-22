"use client";

import { useRouter } from "next/navigation";
import * as Icons from "lucide-react";
import { useApp } from "@/context/AppContext";

function CategoryTile({ category, onSelect }) {
  const Icon = Icons[category.icon] || Icons.Tag;
  return (
    <button
      type="button"
      onClick={() => onSelect(category.id)}
      className="group flex flex-col items-center justify-start gap-2.5 sm:gap-3 text-center w-full"
    >
      <div className="flex w-full aspect-square items-center justify-center rounded-[20px] bg-brand-50 p-2 sm:p-5 transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-neutral">
        {category.imageUrl ? (
          <img src={category.imageUrl} alt="" className="h-[90%] w-[90%] object-contain" />
        ) : (
          <Icon
            size={40}
            className="text-brand-600 sm:h-12 sm:w-12 transition-transform duration-300 group-hover:scale-110"
          />
        )}
      </div>
      <span className="w-full text-xs font-bold leading-tight text-ink-900 sm:text-sm md:text-base">
        {category.label}
      </span>
    </button>
  );
}

export default function CategoryGrid() {
  const router = useRouter();
  const { categories } = useApp();
  const selectCategory = (id) => router.push(`/search?category=${encodeURIComponent(id)}`);

  return (
    <section className="home-container py-8 sm:py-12 md:py-16">
      <h2 className="font-display text-2xl font-bold text-ink-900 sm:text-3xl md:text-4xl">Our Services</h2>
      <div className="mt-5 grid grid-cols-4 gap-3 sm:gap-4 md:grid-cols-6 lg:grid-cols-8 lg:gap-5">
        {categories.slice(0, 8).map((category) => (
          <CategoryTile key={category.id} category={category} onSelect={selectCategory} />
        ))}
      </div>
    </section>
  );
}
