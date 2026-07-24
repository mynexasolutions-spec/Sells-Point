import { Link, MessageSquare, PenLine } from "lucide-react";

const steps = [
  { icon: PenLine, title: "1. Post Your Ad", text: "List your item in seconds for free." },
  { icon: MessageSquare, title: "2. Connect", text: "Interested buyers will reach out to you." },
  { icon: Link, title: "3. Complete the Deal", text: "Close the deal safely and easily." },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-ink-50 py-14 sm:py-20">
      <div className="home-container relative grid items-end gap-10 lg:min-h-[340px] lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-12">
        <div className="text-center sm:text-left lg:pb-5">
          <h2 className="font-display text-3xl font-extrabold text-ink-900 sm:text-4xl">How SellsPoint Works</h2>
          <div className="relative mt-9 grid gap-9 sm:grid-cols-3 sm:gap-7">
            <div className="pointer-events-none absolute left-9 right-9 top-9 hidden border-t-2 border-dotted border-brand-300 sm:block" />
            {steps.map(({ icon: Icon, title, text }) => (
              <div key={title} className="relative mx-auto max-w-[17rem] sm:mx-0">
                <span className="relative z-10 mx-auto flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full border border-brand-400 bg-brand-500 text-white shadow-glow ring-4 ring-ink-50 sm:mx-0">
                  <Icon aria-hidden="true" size={28} />
                </span>
                <h3 className="mt-4 font-display text-lg font-bold text-ink-900">{title}</h3>
                <p className="mt-2 text-base leading-relaxed text-ink-500">{text}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="pointer-events-none mx-auto w-48 max-w-full self-end sm:w-full sm:max-w-[340px] lg:max-w-[380px]">
          <img
            src="/assets/home/how-it-works.webp"
            alt="Person using SellsPoint on a phone"
            className="aspect-square w-full object-contain object-bottom"
          />
        </div>
      </div>
    </section>
  );
}
