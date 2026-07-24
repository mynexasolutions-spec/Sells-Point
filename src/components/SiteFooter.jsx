import Link from "next/link";
import { Facebook, Instagram, Linkedin, Mail, MessageCircle, ShieldCheck, Youtube } from "lucide-react";
import BrandLogo from "@/components/BrandLogo";
import { SOCIAL_LINKS, SUPPORT_EMAIL } from "@/lib/siteConfig";

const socialIcons = {
  Instagram,
  Facebook,
  YouTube: Youtube,
  LinkedIn: Linkedin,
};

function XIcon({ size = 19 }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width={size} height={size} fill="currentColor">
      <path d="M18.9 2H22l-6.77 7.74L23.2 22h-6.24l-4.89-6.4L6.48 22H3.36l7.26-8.3L2.97 2h6.4l4.42 5.84L18.9 2Zm-1.1 17.84h1.73L8.43 4.05H6.58L17.8 19.84Z" />
    </svg>
  );
}

export default function SiteFooter({ appName, hasProductBar = false }) {
  return (
    <footer
      className={`border-t border-ink-100 bg-white ${
        hasProductBar
          ? "pb-[calc(5.75rem+env(safe-area-inset-bottom))] lg:pb-0"
          : "pb-[calc(4.75rem+env(safe-area-inset-bottom))] md:pb-0"
      }`}
    >
      <div className="home-container grid gap-10 py-12 sm:grid-cols-2 sm:py-14 lg:grid-cols-[1.4fr_0.8fr_1fr_1.1fr] lg:py-16">
        <div>
          <BrandLogo />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-ink-500 sm:text-base">
            A trusted marketplace to buy and sell mobiles, vehicles, furniture, and more—with direct chat between buyers
            and sellers.
          </p>
          <div className="mt-5 flex flex-wrap gap-2" aria-label="SellsPoint on social media">
            {SOCIAL_LINKS.map(({ label, href }) => {
              const Icon = label === "X" ? XIcon : socialIcons[label];
              return (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`SellsPoint on ${label} (opens in a new tab)`}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-ink-200 text-ink-600 transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
                >
                  <Icon size={19} />
                </a>
              );
            })}
          </div>
        </div>

        <div>
          <h2 className="font-display text-base font-bold text-ink-900 sm:text-lg">Explore</h2>
          <ul className="mt-4 space-y-3 text-sm text-ink-500 sm:text-base">
            <li>
              <Link href="/search" className="hover:text-brand-600">
                Browse listings
              </Link>
            </li>
            <li>
              <Link href="/dashboard" className="hover:text-brand-600">
                My dashboard
              </Link>
            </li>
            <li>
              <Link href="/chat" className="hover:text-brand-600">
                Messages
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="font-display text-base font-bold text-ink-900 sm:text-lg">SellsPoint</h2>
          <ul className="mt-4 space-y-3 text-sm text-ink-500 sm:text-base">
            <li>
              <Link href="/about" className="hover:text-brand-600">
                About us
              </Link>
            </li>
            <li>
              <Link href="/contact" className="hover:text-brand-600">
                Contact us
              </Link>
            </li>
            <li className="flex items-center gap-2">
              <ShieldCheck size={18} className="shrink-0 text-brand-600" />
              Safer marketplace guidance
            </li>
            <li className="flex items-center gap-2">
              <MessageCircle size={18} className="shrink-0 text-brand-600" />
              Chat before you buy
            </li>
          </ul>
        </div>

        <div>
          <h2 className="font-display text-base font-bold text-ink-900 sm:text-lg">Need help?</h2>
          <p className="mt-4 text-sm leading-relaxed text-ink-500 sm:text-base">
            Our support inbox is the quickest way to reach the SellsPoint team.
          </p>
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="mt-4 inline-flex items-center gap-2 break-all text-sm font-semibold text-brand-700 hover:text-brand-800 sm:text-base"
          >
            <Mail size={18} className="shrink-0" aria-hidden="true" />
            {SUPPORT_EMAIL}
          </a>
        </div>
      </div>

      <div className="border-t border-ink-100">
        <div className="home-container py-5 text-center text-sm text-ink-400 sm:text-left">
          © {new Date().getFullYear()} {appName}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
