import Link from "next/link";
import { ArrowRight } from "lucide-react";

const articles = [
  { title: "5 checks before you buy a used phone", tag: "Buying guide", image: "/assets/home/slides/slide 1.png" },
  { title: "How to price your old furniture right", tag: "Selling guide", image: "/assets/home/slides/slide 2.png" },
  { title: "Meet safely: close the deal like a pro", tag: "Trust & safety", image: "/assets/home/slides/slide 3.png" },
];

export default function Articles() {
  return (
    <section className="home-container pb-14 sm:pb-20">
      <div className="border-t border-ink-100 pt-14 sm:pt-16">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h2 className="font-display text-2xl font-bold text-ink-900 sm:text-3xl md:text-4xl">Be Smart. Buy &amp; Sell Smart.</h2>
            <p className="mt-1 text-sm text-ink-500 sm:text-base">Guides and stories to help you deal better</p>
          </div>
          <Link href="/search" className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap text-sm font-semibold text-brand-700 hover:text-brand-800 sm:text-base">
            See all <ArrowRight aria-hidden="true" size={18} />
          </Link>
        </div>
        <div className="scrollbar-hidden flex snap-x gap-3 overflow-x-auto pb-2 sm:gap-5">
          {articles.map(({ title, tag, image }) => (
            <article key={title} className="relative w-[75vw] max-w-[300px] shrink-0 snap-start overflow-hidden rounded-2xl bg-ink-950">
              <img src={image} alt="" className="h-44 w-full object-cover opacity-80 sm:h-52" loading="lazy" />
              <div className="absolute inset-0 bg-gradient-to-t from-ink-950/90 via-ink-950/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-brand-300">{tag}</p>
                <h3 className="mt-1 line-clamp-2 text-sm font-bold leading-snug text-white sm:text-base">{title}</h3>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
