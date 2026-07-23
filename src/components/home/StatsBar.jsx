import { IndianRupee, MapPin, Package } from "lucide-react";

const stats = [
  { value: "₹250 Cr+", label: "Worth of deals closed", icon: IndianRupee },
  { value: "50K+", label: "Active listings right now", icon: Package },
  { value: "100+", label: "Cities across India", icon: MapPin },
];

export default function StatsBar() {
  return (
    <section className="bg-ink-950 text-white">
      <div className="home-container py-12 sm:py-16">
        <h2 className="font-display text-2xl font-extrabold leading-tight sm:text-3xl lg:text-4xl">
          Trusted by 1.2 Lac+ happy buyers and sellers
        </h2>
        <p className="mt-2 text-sm text-white/60 sm:text-base">
          India&apos;s neighborhood marketplace for buying and selling pre-loved goods.
        </p>
        <div className="scrollbar-hidden mt-8 flex snap-x gap-3 overflow-x-auto pb-1 sm:grid sm:grid-cols-3 sm:gap-5 sm:overflow-visible sm:pb-0">
          {stats.map(({ value, label, icon: Icon }) => (
            <div
              key={label}
              className="w-[68vw] max-w-[280px] shrink-0 snap-start rounded-2xl border border-white/10 bg-white/5 p-5 sm:w-auto sm:max-w-none"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-brand-300">
                <Icon aria-hidden="true" size={20} />
              </span>
              <p className="mt-3 font-display text-xl font-extrabold sm:text-2xl">{value}</p>
              <p className="mt-1 text-xs text-white/60 sm:text-sm">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
