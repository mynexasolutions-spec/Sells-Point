import Link from "next/link";
import {
  ArrowRight,
  Building2,
  Handshake,
  Headphones,
  LifeBuoy,
  Mail,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import ContactForm from "@/components/contact/ContactForm";
import { SUPPORT_EMAIL } from "@/lib/siteConfig";

export const metadata = {
  title: "Contact SellsPoint | Help, Safety & Partnerships",
  description:
    "Contact SellsPoint for marketplace support, account help, safety concerns, listing questions, feedback, and partnerships.",
};

const enquiryRoutes = [
  {
    icon: LifeBuoy,
    title: "Customer support",
    text: "Questions about browsing, buying, selling, or using SellsPoint.",
  },
  {
    icon: ShieldCheck,
    title: "Trust & safety",
    text: "Report suspicious activity or ask for safer marketplace guidance.",
  },
  {
    icon: UserRound,
    title: "Account & listings",
    text: "Get help with access, profile details, or an advertisement.",
  },
  {
    icon: Handshake,
    title: "Partnerships",
    text: "Explore thoughtful ways to work with the SellsPoint community.",
  },
];

export default function ContactPage() {
  return (
    <div className="overflow-hidden bg-[#f7faf8]">
      <section className="relative isolate bg-ink-950 text-white">
        <div className="absolute inset-0 -z-10 opacity-70 [background:radial-gradient(circle_at_78%_22%,rgba(24,181,104,.42),transparent_30%),radial-gradient(circle_at_10%_90%,rgba(117,230,169,.16),transparent_35%)]" />
        <div className="home-container grid min-h-[420px] items-center gap-10 py-16 sm:py-20 lg:grid-cols-[1.05fr_.95fr] lg:py-24">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-brand-300">Contact SellsPoint</p>
            <h1 className="mt-5 font-display text-4xl font-extrabold leading-[1.08] sm:text-5xl lg:text-6xl">
              We’d genuinely love to hear from you.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-white/70 sm:text-lg">
              A question, a concern, an idea—send it our way and we’ll place it with the right part of the SellsPoint
              team.
            </p>
            <a href="#contact-form" className="btn-pill mt-8 bg-brand-500 px-7 py-3.5 text-ink-950 hover:bg-brand-400">
              Write to us <ArrowRight size={18} />
            </a>
          </div>

          <div className="relative mx-auto w-full max-w-lg">
            <div className="absolute -left-5 top-8 h-24 w-24 rounded-full border border-brand-300/30 bg-brand-400/10 blur-sm" />
            <div className="relative rounded-[2rem] border border-white/10 bg-white/10 p-6 shadow-2xl backdrop-blur sm:p-8">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-400 text-ink-950">
                <MessageCircle size={27} />
              </div>
              <p className="mt-8 font-display text-2xl font-bold">A direct line to people who care.</p>
              <div className="mt-6 space-y-3">
                {["Clear categories", "A reference for every enquiry", "Private internal follow-up"].map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 rounded-xl bg-white/5 px-4 py-3 text-sm text-white/80"
                  >
                    <Sparkles size={16} className="text-brand-300" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="home-container py-14 sm:py-20">
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-700">Need help?</p>
          <h2 className="mt-3 font-display text-3xl font-extrabold text-ink-950 sm:text-4xl">
            Start with the quickest route
          </h2>
        </div>
        <div className="mt-9 grid gap-4 md:grid-cols-3">
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="group rounded-3xl border border-ink-100 bg-white p-6 shadow-neutral transition-transform hover:-translate-y-1"
          >
            <Mail className="text-brand-600" size={26} />
            <h3 className="mt-5 font-display text-xl font-bold text-ink-950">Email support</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-500">Best for detailed questions and attachments.</p>
            <span className="mt-5 inline-block text-sm font-semibold text-brand-700">{SUPPORT_EMAIL}</span>
          </a>
          <Link
            href="/chat"
            className="group rounded-3xl border border-ink-100 bg-white p-6 shadow-neutral transition-transform hover:-translate-y-1"
          >
            <MessageCircle className="text-brand-600" size={26} />
            <h3 className="mt-5 font-display text-xl font-bold text-ink-950">Marketplace chat</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-500">Continue a conversation with a buyer or seller.</p>
            <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-brand-700">
              Open messages <ArrowRight size={15} />
            </span>
          </Link>
          <a
            href="#contact-form"
            className="group rounded-3xl border border-brand-200 bg-brand-50 p-6 shadow-neutral transition-transform hover:-translate-y-1"
          >
            <Headphones className="text-brand-700" size={26} />
            <h3 className="mt-5 font-display text-xl font-bold text-ink-950">Send an enquiry</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-500">
              Receive a reference code and keep your request easy to track.
            </p>
            <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-brand-700">
              Use the form <ArrowRight size={15} />
            </span>
          </a>
        </div>
      </section>

      <section className="border-y border-ink-100 bg-white">
        <div className="home-container grid gap-10 py-14 sm:py-20 lg:grid-cols-[.8fr_1.2fr] lg:items-start">
          <div className="lg:sticky lg:top-28">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-700">Reach us</p>
            <h2 className="mt-3 font-display text-3xl font-extrabold text-ink-950 sm:text-4xl">
              One inbox, carefully routed.
            </h2>
            <p className="mt-4 max-w-lg leading-relaxed text-ink-500">
              SellsPoint operates online. We don’t publish an office address or phone number we cannot verify; email and
              the enquiry form are the official ways to reach us.
            </p>
            <div className="mt-7 rounded-2xl bg-ink-950 p-5 text-white">
              <div className="flex items-start gap-3">
                <Building2 className="mt-0.5 text-brand-300" size={21} />
                <div>
                  <p className="font-semibold">SellsPoint support</p>
                  <a href={`mailto:${SUPPORT_EMAIL}`} className="mt-1 block break-all text-sm text-brand-300">
                    {SUPPORT_EMAIL}
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-700">Find the right team</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {enquiryRoutes.map(({ icon: Icon, title, text }) => (
                <a
                  key={title}
                  href="#contact-form"
                  className="rounded-2xl border border-ink-100 bg-[#f7faf8] p-5 transition-colors hover:border-brand-300 hover:bg-brand-50"
                >
                  <Icon className="text-brand-600" size={22} />
                  <h3 className="mt-4 font-display font-bold text-ink-950">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-500">{text}</p>
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="home-container grid gap-10 py-14 sm:py-20 lg:grid-cols-[.8fr_1.2fr] lg:items-start">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-700">A useful message</p>
          <h2 className="mt-3 font-display text-3xl font-extrabold text-ink-950 sm:text-4xl">
            More context means a faster hand-off.
          </h2>
          <p className="mt-4 leading-relaxed text-ink-500">
            Include the listing title or account email when relevant. Never send passwords, one-time codes, or full
            payment credentials.
          </p>
          <div className="mt-7 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-relaxed text-amber-900">
            For immediate danger or suspected criminal activity, contact the appropriate local authorities first.
          </div>
        </div>
        <ContactForm />
      </section>
    </div>
  );
}
