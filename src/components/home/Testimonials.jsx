import { Star } from "lucide-react";

const testimonials = [
  { name: "Priya Sharma", city: "Bengaluru", avatar: "https://i.pravatar.cc/150?u=priya-sellspoint", quote: "Sold my old sofa in two days. The built-in chat made it so easy — no spam calls, no sharing my number." },
  { name: "Rohan Verma", city: "Delhi", avatar: "https://i.pravatar.cc/150?u=rohan-sellspoint", quote: "Bought a refurbished laptop for half the showroom price. The quality-check badge gave me real confidence." },
  { name: "Ananya Iyer", city: "Chennai", avatar: "https://i.pravatar.cc/150?u=ananya-sellspoint", quote: "Posting my ad took less than five minutes, and my phone was sold by the weekend. Smooth experience." },
  { name: "Vikram Singh", city: "Jaipur", avatar: "https://i.pravatar.cc/150?u=vikram-sellspoint", quote: "Met the seller nearby, checked the bike, closed the deal. The safest way I have bought second-hand." },
];

export default function Testimonials() {
  return (
    <section className="home-container pb-14 sm:pb-20">
      <div className="pt-12 sm:pt-16">
        <h2 className="font-display text-2xl font-bold text-ink-900 sm:text-3xl md:text-4xl">What Our Users Say</h2>
        <p className="mt-1 text-sm text-ink-500 sm:text-base">Real stories from buyers and sellers across India</p>
        <div className="scrollbar-hidden mt-6 flex snap-x gap-3 overflow-x-auto pb-2 sm:gap-5">
          {testimonials.map(({ name, city, avatar, quote }) => (
            <figure key={name} className="card w-[80vw] max-w-[320px] shrink-0 snap-start p-5">
              <div className="flex items-center gap-3">
                <img src={avatar} alt="" className="h-11 w-11 rounded-full object-cover" loading="lazy" />
                <figcaption>
                  <p className="text-sm font-bold text-ink-900">{name}</p>
                  <p className="text-xs text-ink-500">{city}</p>
                </figcaption>
              </div>
              <div className="mt-3 flex gap-0.5" aria-label="5 out of 5 stars">
                {Array.from({ length: 5 }).map((_, idx) => (
                  <Star key={idx} size={14} className="fill-amber-400 text-amber-400" aria-hidden="true" />
                ))}
              </div>
              <blockquote className="mt-2 text-sm leading-relaxed text-ink-600">&ldquo;{quote}&rdquo;</blockquote>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
