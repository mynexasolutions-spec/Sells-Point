"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, MessageCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import BrandLogo from "@/components/BrandLogo";

export default function SiteChrome({ children, appName }) {
  const pathname = usePathname();
  const isAdmin = pathname === "/admin" || pathname.startsWith("/admin/");
  if (isAdmin) return <main className="min-h-screen">{children}</main>;

  return <><Navbar /><main className="min-h-screen">{children}</main><footer className="border-t border-ink-100 bg-white">
    <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4 lg:px-8">
      <div><BrandLogo /><p className="mt-3 max-w-xs text-sm text-ink-500">A premium marketplace to buy &amp; sell mobiles, vehicles, furniture and more — with verified sellers and built-in chat.</p></div>
      <div><h4 className="font-display text-sm font-bold text-ink-900">Explore</h4><ul className="mt-3 space-y-2 text-sm text-ink-500"><li><Link href="/" className="hover:text-brand-600">Browse listings</Link></li><li><Link href="/dashboard" className="hover:text-brand-600">My dashboard</Link></li><li><Link href="/chat" className="hover:text-brand-600">Messages</Link></li></ul></div>
      <div><h4 className="font-display text-sm font-bold text-ink-900">Trust &amp; Safety</h4><ul className="mt-3 space-y-2 text-sm text-ink-500"><li className="flex items-center gap-2"><ShieldCheck size={14} className="text-brand-600" /> Phone-verified sellers</li><li className="flex items-center gap-2"><MessageCircle size={14} className="text-brand-600" /> Chat before you buy</li></ul></div>
      <div><h4 className="font-display text-sm font-bold text-ink-900">Contact</h4><p className="mt-3 text-sm text-ink-500">{process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@sellspoint.app"}</p></div>
    </div><div className="border-t border-ink-100 py-5 text-center text-sm text-ink-400">© {new Date().getFullYear()} {appName}. All rights reserved.</div>
  </footer></>;
}
