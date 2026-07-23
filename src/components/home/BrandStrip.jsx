const brands = ["Apple", "Samsung", "Xiaomi", "OnePlus", "Oppo", "Vivo", "Realme", "Google", "Sony", "HP"];

export default function BrandStrip() {
  return (
    <section aria-label="Popular brands" className="overflow-hidden border-y border-ink-100 bg-white py-5">
      <div className="animate-marquee flex w-max items-center gap-12">
        {[...brands, ...brands].map((brand, idx) => (
          <span key={idx} className="whitespace-nowrap font-display text-lg font-bold text-ink-300 sm:text-xl" aria-hidden={idx >= brands.length ? "true" : undefined}>
            {brand}
          </span>
        ))}
      </div>
    </section>
  );
}
