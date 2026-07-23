"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  ChevronDown,
  Heart,
  ShoppingCart,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  PlusCircle,
  Search,
  ShieldCheck,
  User,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import NotificationPanel from "@/components/NotificationPanel";
import BrandLogo from "@/components/BrandLogo";
import SearchSuggestions from "@/components/SearchSuggestions";
import { useSiteChrome } from "@/context/SiteChromeContext";
import { buildLocationSearchUrl } from "@/lib/location-search-url.mjs";

export default function Navbar() {
  const { categories, currentUser, logout, notifications, unreadMessageCount } = useApp();
  const { openAuth, openPostAd } = useSiteChrome();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const menuRef = useRef(null);
  const notifRef = useRef(null);
  const searchRef = useRef(null);
  const mobileSearchRef = useRef(null);
  const unreadCount = notifications.filter((notification) => !notification.read).length;

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) setProfileOpen(false);
      if (notifRef.current && !notifRef.current.contains(event.target)) setNotifOpen(false);
      const outsideDesktopSearch = !searchRef.current || !searchRef.current.contains(event.target);
      const outsideMobileSearch = !mobileSearchRef.current || !mobileSearchRef.current.contains(event.target);
      if (outsideDesktopSearch && outsideMobileSearch) setSuggestionsOpen(false);
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) {
      setSuggestions([]);
      setSuggestionsOpen(false);
      setActiveSuggestion(-1);
      return undefined;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/search/suggestions?q=${encodeURIComponent(query.trim())}`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Suggestion request failed");
        const json = await response.json();
        setSuggestions(json.suggestions || []);
        setSuggestionsOpen((json.suggestions || []).length > 0);
        setActiveSuggestion(-1);
      } catch (error) {
        if (error.name === "AbortError") return;
        setSuggestions([]);
        setSuggestionsOpen(false);
        setActiveSuggestion(-1);
      }
    }, 180);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const handleSearchKeyDown = (event) => {
    if (event.key === "Escape") {
      setSuggestionsOpen(false);
      setActiveSuggestion(-1);
      return;
    }
    if (!suggestionsOpen || !suggestions.length) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveSuggestion((index) => (index + 1) % suggestions.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveSuggestion((index) => (index <= 0 ? suggestions.length - 1 : index - 1));
    } else if (event.key === "Enter" && activeSuggestion >= 0) {
      event.preventDefault();
      handleSuggestion(suggestions[activeSuggestion]);
    }
  };

  const searchUrl = (nextQuery = query, nextCategory = category) => {
    const params = new URLSearchParams();
    if (nextQuery.trim()) params.set("q", nextQuery.trim());
    if (nextCategory) params.set("category", nextCategory);
    return params.size ? `/search?${params.toString()}` : "/search";
  };

  const handleSearch = (event) => {
    event.preventDefault();
    setSuggestionsOpen(false);
    router.push(searchUrl());
  };

  const handleSuggestion = (suggestion) => {
    setSuggestionsOpen(false);
    if (suggestion.type === "category") {
      setCategory(suggestion.value);
      router.push(searchUrl(query, suggestion.value));
      return;
    }
    if (suggestion.type === "location") {
      router.push(
        buildLocationSearchUrl({
          pathname: window.location.pathname,
          currentSearch: window.location.search,
          query,
          location: suggestion.value,
        })
      );
      return;
    }
    setQuery(suggestion.value);
    router.push(searchUrl(suggestion.value));
  };

  const handleSell = () => {
    if (!currentUser) openAuth();
    else openPostAd();
  };

  return (
    <>
      <header className="sticky top-0 z-40 hidden border-b border-ink-100 bg-white/95 shadow-sm backdrop-blur-xl md:block">
        <div className="home-container flex items-center gap-1.5 py-2.5 sm:gap-3 sm:py-3">
          <Link href="/" aria-label="SellsPoint home" className="shrink-0">
            <BrandLogo compact />
          </Link>

          <form onSubmit={handleSearch} className="hidden min-w-0 flex-1 md:block">
            <div ref={searchRef} className="search-group relative overflow-visible">
              <label className="sr-only" htmlFor="site-search-category">
                Search category
              </label>
              <select
                id="site-search-category"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="max-w-40 rounded-l-full border-0 border-r border-ink-200 bg-ink-50 px-4 text-sm font-semibold text-ink-700 outline-none"
              >
                <option value="">All categories</option>
                {categories.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
              <Search size={17} className="ml-4 self-center text-ink-400" aria-hidden="true" />
              <label className="sr-only" htmlFor="site-search">
                Search listings
              </label>
              <input
                id="site-search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onFocus={() => suggestions.length > 0 && setSuggestionsOpen(true)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Search mobiles, cars, furniture..."
                className="search-group-field pl-3"
                role="combobox"
                aria-autocomplete="list"
                aria-expanded={suggestionsOpen}
                aria-controls="search-suggestions"
                aria-activedescendant={
                  activeSuggestion >= 0 ? `search-suggestions-option-${activeSuggestion}` : undefined
                }
              />
              <button
                type="submit"
                className="btn-pill m-1 rounded-full bg-brand-600 px-5 py-2 text-sm text-white hover:bg-brand-700"
              >
                Search
              </button>
              {suggestionsOpen && (
                <SearchSuggestions
                  id="search-suggestions"
                  suggestions={suggestions}
                  activeIndex={activeSuggestion}
                  onSelect={handleSuggestion}
                />
              )}
            </div>
          </form>

          <div className="ml-auto flex items-center gap-1 sm:gap-3">
            <Link
              href="/dashboard?tab=saved"
              className="flex h-11 w-11 items-center justify-center rounded-full text-ink-600 hover:bg-ink-50 hover:text-brand-700"
              aria-label="Saved favourites"
            >
              <Heart size={20} />
            </Link>
            {currentUser && <Link href="/dashboard?tab=cart" className="flex h-11 w-11 items-center justify-center rounded-full text-ink-600 hover:bg-ink-50 hover:text-brand-700" aria-label="Shopping cart"><ShoppingCart size={20} /></Link>}
            {currentUser && (
              <Link
                href="/chat"
                className="relative flex h-11 w-11 items-center justify-center rounded-full text-ink-600 hover:bg-ink-50"
                aria-label="Messages"
              >
                <MessageCircle size={20} />
                {unreadMessageCount > 0 && (
                  <span className="absolute right-0 top-0 rounded-full bg-brand-600 px-1 text-[10px] font-bold text-white">
                    {unreadMessageCount > 99 ? "99+" : unreadMessageCount}
                  </span>
                )}
              </Link>
            )}
            {currentUser && (
              <div ref={notifRef} className="relative">
                <button
                  type="button"
                  onClick={() => setNotifOpen((open) => !open)}
                  className="relative flex h-11 w-11 items-center justify-center rounded-full text-ink-600 hover:bg-ink-50"
                  aria-label="Notifications"
                >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="absolute right-0 top-0 rounded-full bg-brand-600 px-1 text-[10px] font-bold text-white">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </button>
                {notifOpen && (
                  <div className="absolute right-0 z-30 mt-2">
                    <NotificationPanel />
                  </div>
                )}
              </div>
            )}
            <button
              type="button"
              onClick={handleSell}
              className="btn-pill h-11 w-11 bg-brand-600 max-sm:!px-0 text-sm text-white hover:bg-brand-700 sm:w-auto sm:gap-2 sm:px-4"
            >
              <PlusCircle size={17} /> <span className="hidden sm:inline">Post Your Ad</span>
            </button>
            {currentUser ? (
              <div ref={menuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setProfileOpen((open) => !open)}
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-ink-200 p-1 sm:w-auto sm:gap-1 sm:justify-start sm:pr-2"
                  aria-label="Account menu"
                  aria-expanded={profileOpen}
                >
                  <img src={currentUser.avatar} alt="" className="h-8 w-8 rounded-full object-cover" />
                  <ChevronDown size={14} />
                </button>
                {profileOpen && (
                  <div className="absolute right-0 z-30 mt-2 w-56 overflow-hidden rounded-2xl border border-ink-100 bg-white py-2 shadow-neutral">
                    <p className="truncate border-b border-ink-100 px-4 pb-2 text-sm font-semibold">
                      {currentUser.name}
                    </p>
                    <Link
                      href={`/profile/${currentUser.id}`}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-ink-50"
                    >
                      <User size={15} /> My Profile
                    </Link>
                    <Link href="/dashboard" className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-ink-50">
                      <LayoutDashboard size={15} /> Dashboard
                    </Link>
                    {currentUser.isAdmin && (
                      <Link href="/admin" className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-ink-50">
                        <ShieldCheck size={15} /> Admin Panel
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        logout();
                        setProfileOpen(false);
                        router.push("/");
                      }}
                      className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut size={15} /> Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={openAuth}
                className="h-11 whitespace-nowrap px-1 text-sm font-semibold text-ink-700 hover:text-brand-700 sm:px-2"
              >
                Log in
              </button>
            )}
          </div>
        </div>

        <div className="home-container pb-3 md:hidden">
          <form ref={mobileSearchRef} onSubmit={handleSearch} className="search-group relative overflow-visible">
            <Search size={17} className="ml-4 self-center text-ink-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onFocus={() => suggestions.length > 0 && setSuggestionsOpen(true)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Search listings..."
              aria-label="Search listings"
              className="search-group-field pl-3"
              role="combobox"
              aria-autocomplete="list"
              aria-expanded={suggestionsOpen}
              aria-controls="mobile-search-suggestions"
              aria-activedescendant={
                activeSuggestion >= 0 ? `mobile-search-suggestions-option-${activeSuggestion}` : undefined
              }
            />
            <button type="submit" className="m-1 rounded-full bg-brand-600 px-4 text-white" aria-label="Submit search">
              <Search size={17} />
            </button>
            {suggestionsOpen && (
              <SearchSuggestions
                id="mobile-search-suggestions"
                suggestions={suggestions}
                activeIndex={activeSuggestion}
                onSelect={handleSuggestion}
              />
            )}
          </form>
        </div>

        <nav aria-label="Marketplace categories" className="border-t border-ink-100">
          <div className="home-container flex gap-5 overflow-x-auto py-2.5 text-sm font-semibold text-ink-600">
            <Link href="/search" className="shrink-0 text-brand-700">
              Browse all
            </Link>
            {categories.slice(0, 10).map((item) => (
              <Link
                key={item.id}
                href={`/search?category=${encodeURIComponent(item.id)}`}
                className="shrink-0 hover:text-brand-700"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
      </header>
    </>
  );
}
