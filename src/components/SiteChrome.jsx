"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  CircleUserRound,
  House,
  LogIn,
  LogOut,
  Menu,
  MessageCircle,
  PlusCircle,
  Search,
  ShieldCheck,
  Store,
  X,
} from "lucide-react";
import AuthModal from "@/components/AuthModal";
import BrandLogo from "@/components/BrandLogo";
import Navbar from "@/components/Navbar";
import PostAdModal from "@/components/PostAdModal";
import { useApp } from "@/context/AppContext";
import { SiteChromeProvider } from "@/context/SiteChromeContext";

function MobileHeader({ onMenuOpen }) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const handleSearch = (event) => {
    event.preventDefault();
    const trimmedQuery = query.trim();
    router.push(trimmedQuery ? `/search?q=${encodeURIComponent(trimmedQuery)}` : "/search");
  };

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-ink-100 bg-white md:hidden">
      <div className="flex h-14 items-center justify-between px-4">
        <Link href="/" aria-label="SellsPoint home">
          <BrandLogo compact className="h-9 w-[112px] min-[390px]:w-[128px]" />
        </Link>
        <button
          type="button"
          onClick={onMenuOpen}
          className="flex h-10 w-10 items-center justify-center rounded-full text-ink-700 hover:bg-ink-50"
          aria-label="Open menu"
          aria-expanded="false"
        >
          <Menu size={22} />
        </button>
      </div>
      <form onSubmit={handleSearch} className="border-t border-ink-100 px-4 py-2">
        <label className="sr-only" htmlFor="mobile-global-search">
          Search listings
        </label>
        <div className="flex h-10 items-center rounded-full border border-ink-200 bg-ink-50 px-3 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-100">
          <Search size={17} className="shrink-0 text-ink-400" aria-hidden="true" />
          <input
            id="mobile-global-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search mobiles, cars, furniture..."
            className="min-w-0 flex-1 bg-transparent px-2 text-sm text-ink-900 outline-none placeholder:text-ink-400"
          />
          <button type="submit" className="text-sm font-semibold text-brand-700" aria-label="Submit search">
            Search
          </button>
        </div>
      </form>
    </header>
  );
}

function MobileDrawer({ isOpen, onClose, onAuth, onPostAd }) {
  const { currentUser, logout } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const closeThen = (action) => () => {
    onClose();
    action();
  };

  return (
    <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Navigation menu">
      <button type="button" className="absolute inset-0 bg-ink-950/35" aria-label="Close menu" onClick={onClose} />
      <aside className="absolute inset-y-0 right-0 flex h-[100dvh] w-[min(86vw,360px)] flex-col bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
          <BrandLogo compact />
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full text-ink-700 hover:bg-ink-50"
            aria-label="Close menu"
          >
            <X size={21} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          {currentUser ? (
            <div className="rounded-2xl bg-ink-50 p-4">
              <p className="font-semibold text-ink-900">{currentUser.name}</p>
              <Link
                href="/dashboard"
                onClick={onClose}
                className="mt-3 flex items-center gap-2 text-sm font-semibold text-brand-700"
              >
                <CircleUserRound size={16} /> My dashboard
              </Link>
            </div>
          ) : (
            <div className="rounded-2xl bg-ink-50 p-4">
              <p className="text-sm text-ink-600">Sign in to post ads, save listings, and chat with sellers.</p>
              <button
                type="button"
                onClick={closeThen(onAuth)}
                className="mt-3 flex items-center gap-2 text-sm font-semibold text-brand-700"
              >
                <LogIn size={16} /> Log in or create an account
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={closeThen(() => (currentUser ? onPostAd() : onAuth()))}
            className="btn-pill mt-5 w-full bg-brand-600 text-sm text-white hover:bg-brand-700"
          >
            <PlusCircle size={17} /> Post your ad
          </button>

          <nav aria-label="Mobile drawer links" className="mt-7 border-t border-ink-100 pt-4">
            <Link
              href="/search"
              onClick={onClose}
              className="block rounded-xl px-3 py-3 text-sm font-semibold text-ink-700 hover:bg-ink-50"
            >
              Browse listings
            </Link>
            <Link
              href="/dashboard"
              onClick={onClose}
              className="block rounded-xl px-3 py-3 text-sm font-semibold text-ink-700 hover:bg-ink-50"
            >
              My dashboard
            </Link>
            <Link
              href="/chat"
              onClick={onClose}
              className="block rounded-xl px-3 py-3 text-sm font-semibold text-ink-700 hover:bg-ink-50"
            >
              Messages
            </Link>
            <a
              href={`mailto:${process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@sellspoint.app"}`}
              onClick={onClose}
              className="block rounded-xl px-3 py-3 text-sm font-semibold text-ink-700 hover:bg-ink-50"
            >
              Contact
            </a>
          </nav>
        </div>
        {currentUser && (
          <button
            type="button"
            onClick={closeThen(() => {
              logout();
              router.push("/");
            })}
            className="m-5 flex items-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold text-red-600 hover:bg-red-50"
          >
            <LogOut size={16} /> Log out
          </button>
        )}
      </aside>
    </div>
  );
}

function MobileBottomNav({ onAuth, onPostAd }) {
  const pathname = usePathname();
  const { currentUser } = useApp();

  const actionClass = (active) =>
    `flex min-w-0 flex-1 flex-col items-center justify-center gap-1 text-[10px] font-semibold ${active ? "text-brand-600" : "text-ink-500"}`;
  const profileActive = pathname.startsWith("/dashboard") || pathname.startsWith("/profile");

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 flex h-[calc(3.75rem+env(safe-area-inset-bottom))] border-t border-ink-100 bg-white px-1 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_18px_rgba(15,23,42,0.06)] md:hidden"
      aria-label="Mobile navigation"
    >
      <Link href="/" className={actionClass(pathname === "/")}>
        <House size={20} />
        Home
      </Link>
      <Link href="/search" className={actionClass(pathname.startsWith("/search"))}>
        <Search size={20} />
        Browse
      </Link>
      <button type="button" onClick={() => (currentUser ? onPostAd() : onAuth())} className={actionClass(false)}>
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-white">
          <PlusCircle size={18} />
        </span>
        Sell
      </button>
      <Link href="/chat" className={actionClass(pathname.startsWith("/chat"))}>
        <MessageCircle size={20} />
        Chat
      </Link>
      {currentUser ? (
        <Link href="/dashboard" className={actionClass(profileActive)}>
          <CircleUserRound size={20} />
          Profile
        </Link>
      ) : (
        <button type="button" onClick={onAuth} className={actionClass(false)}>
          <CircleUserRound size={20} />
          Profile
        </button>
      )}
    </nav>
  );
}

export default function SiteChrome({ children, appName }) {
  const pathname = usePathname();
  const [authOpen, setAuthOpen] = useState(false);
  const [postOpen, setPostOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const isAdmin = pathname === "/admin" || pathname.startsWith("/admin/");

  if (isAdmin) return <main className="min-h-screen">{children}</main>;

  const chrome = {
    openAuth: () => setAuthOpen(true),
    openPostAd: () => setPostOpen(true),
  };

  return (
    <SiteChromeProvider value={chrome}>
      <Navbar />
      <MobileHeader onMenuOpen={() => setDrawerOpen(true)} />
      <MobileDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onAuth={() => setAuthOpen(true)}
        onPostAd={() => setPostOpen(true)}
      />
      <main className="min-h-screen pt-[6.875rem] pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:py-0">
        {children}
      </main>
      <footer className="hidden border-t border-ink-100 bg-white md:block">
        <div className="home-container grid gap-10 py-16 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <BrandLogo />
            <p className="mt-4 max-w-sm text-base leading-relaxed text-ink-500">
              A premium marketplace to buy and sell mobiles, vehicles, furniture and more—with verified sellers and
              built-in chat.
            </p>
          </div>
          <div>
            <h4 className="font-display text-lg font-bold text-ink-900">Explore</h4>
            <ul className="mt-4 space-y-3 text-base text-ink-500">
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
            <h4 className="font-display text-lg font-bold text-ink-900">Trust &amp; Safety</h4>
            <ul className="mt-4 space-y-3 text-base text-ink-500">
              <li className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-brand-600" /> Verified sellers
              </li>
              <li className="flex items-center gap-2">
                <MessageCircle size={18} className="text-brand-600" /> Chat before you buy
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-display text-lg font-bold text-ink-900">Contact</h4>
            <p className="mt-4 text-base text-ink-500">
              {process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@sellspoint.app"}
            </p>
          </div>
        </div>
        <div className="border-t border-ink-100 py-6 text-center text-base text-ink-400">
          © {new Date().getFullYear()} {appName}. All rights reserved.
        </div>
      </footer>
      <MobileBottomNav onAuth={() => setAuthOpen(true)} onPostAd={() => setPostOpen(true)} />
      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
      <PostAdModal isOpen={postOpen} onClose={() => setPostOpen(false)} />
    </SiteChromeProvider>
  );
}
