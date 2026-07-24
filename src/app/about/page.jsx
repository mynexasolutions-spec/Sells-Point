import Link from "next/link";
import {
  ArrowRight,
  HeartHandshake,
  Leaf,
  MessageCircle,
  RefreshCcw,
  Search,
  ShieldCheck,
  Sparkles,
  Store,
} from "lucide-react";

export const metadata = {
  title: "About SellsPoint | Better Finds, Longer Lives",
  description:
    "Learn how SellsPoint helps useful things find their next owner through local discovery, direct conversation, and community trust.",
};

const values = [
  {
    label: "Our passion",
    title: "Make second-hand feel first choice.",
    text: "We want useful things to be discovered for their value, not dismissed because they have already been owned.",
    icon: HeartHandshake,
  },
  {
    label: "Our promise",
    title: "Keep the marketplace human.",
    text: "Clear listings, direct conversation, and practical safety cues help people make decisions with more confidence.",
    icon: ShieldCheck,
  },
  {
    label: "Our principle",
    title: "A good item deserves another chapter.",
    text: "Every successful hand-off can extend an item’s useful life while making buying and selling more thoughtful.",
    icon: RefreshCcw,
  },
];

const impact = [
  {
    icon: Leaf,
    title: "Less unnecessary waste",
    text: "Keeping useful products in circulation can reduce the rush to discard and replace.",
  },
  {
    icon: RefreshCcw,
    title: "Longer useful lives",
    text: "A new owner can give a well-kept item a purpose beyond its first home.",
  },
  {
    icon: Sparkles,
    title: "Smarter everyday value",
    text: "Pre-owned choices can make quality products accessible to more people.",
  },
];

const journey = [
  {
    title: "Start with the neighbourhood",
    text: "Make it simple to discover useful items offered by people nearby.",
  },
  {
    title: "Put trust in the interface",
    text: "Bring profiles, listing detail, moderation cues, and direct chat into one clear flow.",
  },
  {
    title: "Support the whole hand-off",
    text: "Help sellers present items well and help buyers ask better questions before deciding.",
  },
  {
    title: "Keep improving with the community",
    text: "Use feedback and real marketplace needs to shape what SellsPoint becomes next.",
  },
];

export default function AboutPage() {
  return (
    <div className="overflow-hidden bg-white">
      <section className="relative isolate bg-[#effbf4]">
        <div className="absolute inset-0 -z-10 [background:radial-gradient(circle_at_80%_15%,rgba(24,181,104,.28),transparent_28%),radial-gradient(circle_at_0%_90%,rgba(117,230,169,.24),transparent_33%)]" />
        <div className="home-container grid min-h-[560px] items-center gap-12 py-16 sm:py-20 lg:grid-cols-[1.05fr_.95fr] lg:py-24">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-brand-700">About SellsPoint</p>
            <h1 className="mt-5 font-display text-4xl font-extrabold leading-[1.04] text-ink-950 sm:text-5xl lg:text-7xl">
              Good things deserve another chapter.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-ink-600 sm:text-lg">
              SellsPoint brings local discovery, honest listings, and direct conversation together so useful items can
              move from one person to the next with less friction.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/search" className="btn-pill bg-ink-950 px-7 py-3.5 text-white hover:bg-ink-800">
                Explore listings <ArrowRight size={18} />
              </Link>
              <Link
                href="/contact"
                className="btn-pill border border-brand-300 bg-white px-7 py-3.5 text-brand-800 hover:bg-brand-50"
              >
                Talk to us
              </Link>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-xl">
            <div className="relative overflow-hidden rounded-[2.5rem] border border-white/80 bg-white p-5 shadow-[0_30px_90px_rgba(13,117,70,.16)] sm:p-8">
              <div className="absolute right-0 top-0 h-36 w-36 rounded-bl-[5rem] bg-brand-100" />
              <img
                src="/assets/home/hero-products.webp"
                alt="A selection of useful products ready for their next owner"
                className="relative aspect-[4/3] w-full object-contain"
              />
              <div className="relative mt-4 grid grid-cols-3 gap-2">
                {["Discover", "Connect", "Pass it on"].map((item, index) => (
                  <div key={item} className="rounded-xl bg-ink-50 px-2 py-3 text-center">
                    <span className="block text-xs font-bold text-brand-700">0{index + 1}</span>
                    <span className="mt-1 block text-xs font-semibold text-ink-700 sm:text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="home-container py-16 sm:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-brand-700">Reuse & reconnect</p>
          <h2 className="mt-4 font-display text-3xl font-extrabold leading-tight text-ink-950 sm:text-5xl">
            A marketplace can be practical and more mindful at the same time.
          </h2>
          <p className="mt-5 text-base leading-relaxed text-ink-500 sm:text-lg">
            We’re building for the moment when one person no longer needs an item and someone else is actively looking
            for exactly that.
          </p>
        </div>
      </section>

      <section className="border-y border-ink-100 bg-[#f7faf8]">
        <div className="home-container space-y-8 py-16 sm:py-24">
          {values.map(({ label, title, text, icon: Icon }, index) => (
            <article
              key={label}
              className={`grid overflow-hidden rounded-[2rem] border border-ink-100 bg-white shadow-neutral lg:grid-cols-2 ${
                index % 2 ? "lg:[&>*:first-child]:order-2" : ""
              }`}
            >
              <div className="flex min-h-72 items-center justify-center bg-ink-950 p-8">
                <div className="relative flex h-44 w-44 items-center justify-center rounded-full border border-brand-300/30 bg-brand-500/10">
                  <div className="absolute h-28 w-28 rounded-full border border-dashed border-brand-300/50" />
                  <Icon className="relative text-brand-300" size={58} />
                </div>
              </div>
              <div className="flex flex-col justify-center p-7 sm:p-10 lg:p-14">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-700">{label}</p>
                <h3 className="mt-4 font-display text-3xl font-extrabold text-ink-950">{title}</h3>
                <p className="mt-4 text-base leading-relaxed text-ink-500 sm:text-lg">{text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="relative isolate bg-brand-800 text-white">
        <div className="absolute inset-0 -z-10 opacity-50 [background:radial-gradient(circle_at_50%_0%,rgba(117,230,169,.35),transparent_38%)]" />
        <div className="home-container py-16 sm:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-brand-200">The reuse effect</p>
            <h2 className="mt-4 font-display text-3xl font-extrabold sm:text-5xl">
              Small hand-offs can create a wider impact.
            </h2>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {impact.map(({ icon: Icon, title, text }) => (
              <article key={title} className="rounded-3xl border border-white/10 bg-white/10 p-6 backdrop-blur sm:p-8">
                <Icon className="text-brand-200" size={28} />
                <h3 className="mt-6 font-display text-xl font-bold">{title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-white/70 sm:text-base">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="home-container grid gap-12 py-16 sm:py-24 lg:grid-cols-[.8fr_1.2fr]">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-brand-700">Our journey</p>
          <h2 className="mt-4 font-display text-3xl font-extrabold text-ink-950 sm:text-5xl">Still being written.</h2>
          <p className="mt-5 max-w-md leading-relaxed text-ink-500">
            We won’t invent milestones or numbers. Our story is the product we improve and the useful exchanges the
            community makes possible.
          </p>
        </div>
        <ol className="relative space-y-5 before:absolute before:bottom-7 before:left-6 before:top-7 before:w-px before:bg-brand-200">
          {journey.map((item, index) => (
            <li key={item.title} className="relative flex gap-5">
              <span className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-600 font-display font-bold text-white ring-8 ring-white">
                {index + 1}
              </span>
              <div className="rounded-2xl border border-ink-100 bg-white p-5 shadow-neutral sm:p-6">
                <h3 className="font-display text-lg font-bold text-ink-950">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-500 sm:text-base">{item.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="border-y border-ink-100 bg-[#f7faf8]">
        <div className="home-container py-16 sm:py-24">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-brand-700">The SellsPoint platform</p>
            <h2 className="mt-4 font-display text-3xl font-extrabold text-ink-950 sm:text-5xl">
              Three simple ways to move things forward.
            </h2>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {[
              {
                icon: Search,
                title: "Browse",
                text: "Find items by category, location, condition, and what matters to you.",
                href: "/search",
              },
              {
                icon: Store,
                title: "Sell",
                text: "Present an item clearly and connect with people already looking.",
                href: "/dashboard",
              },
              {
                icon: MessageCircle,
                title: "Chat",
                text: "Ask questions directly and understand the item before moving ahead.",
                href: "/chat",
              },
            ].map(({ icon: Icon, title, text, href }) => (
              <Link
                key={title}
                href={href}
                className="group rounded-3xl border border-ink-100 bg-white p-7 shadow-neutral transition-transform hover:-translate-y-1"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-100 text-brand-700">
                  <Icon size={23} />
                </span>
                <h3 className="mt-6 font-display text-2xl font-bold text-ink-950">{title}</h3>
                <p className="mt-3 leading-relaxed text-ink-500">{text}</p>
                <span className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-brand-700">
                  Explore <ArrowRight size={15} />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="home-container py-16 sm:py-24">
        <div className="relative overflow-hidden rounded-[2.5rem] bg-ink-950 px-6 py-14 text-center text-white sm:px-12 sm:py-20">
          <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-brand-500/20 blur-2xl" />
          <p className="relative text-xs font-bold uppercase tracking-[0.22em] text-brand-300">Join the circle</p>
          <h2 className="relative mx-auto mt-4 max-w-3xl font-display text-3xl font-extrabold sm:text-5xl">
            Buy thoughtfully. Sell honestly. Keep good things moving.
          </h2>
          <div className="relative mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/search" className="btn-pill bg-brand-500 px-7 py-3.5 text-ink-950 hover:bg-brand-400">
              Start exploring <ArrowRight size={18} />
            </Link>
            <Link
              href="/contact"
              className="btn-pill border border-white/20 bg-white/5 px-7 py-3.5 text-white hover:bg-white/10"
            >
              Share feedback
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
