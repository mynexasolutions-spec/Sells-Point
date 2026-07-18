"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Package, Heart, CheckCircle2, Sparkles, Trash2, Pencil, Clock, RotateCw, ShieldOff } from "lucide-react";
import { useApp } from "@/context/AppContext";
import ProductCard from "@/components/ProductCard";
import EditListingModal from "@/components/EditListingModal";

function isExpired(listing) {
  if (listing.status === "expired") return true;
  if (listing.status !== "active") return false;
  return listing.expiresAt ? listing.expiresAt <= Date.now() : false;
}

function expiredAgoText(expiresAt) {
  if (!expiresAt) return "";
  const diffMs = Date.now() - expiresAt;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return "Expired today";
  if (diffDays === 1) return "Expired 1 day ago";
  return `Expired ${diffDays} days ago`;
}

function formatPrice(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function DashboardPage() {
  const {
    currentUser,
    listings,
    favoriteListings,
    blockedUsers,
    getUserById,
    markAsSold,
    deleteListing,
    renewListing,
    requestFeatured,
    completeMockPromotionPayment,
    unblockUser,
  } =
    useApp();
  const router = useRouter();
  const [tab, setTab] = useState("active");
  const [editingListing, setEditingListing] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    if (!currentUser) router.push("/");
    else if (currentUser.isAdmin) router.replace("/admin");
  }, [currentUser, router]);

  if (!currentUser || currentUser.isAdmin) return null;

  const myListings = listings.filter((l) => l.sellerId === currentUser.id);
  const active = myListings.filter((l) => l.status === "active");
  const sold = myListings.filter((l) => l.status === "sold");
  const expired = myListings.filter((l) => isExpired(l));

  const TABS = [
    { id: "active", label: `Active (${active.length - expired.length})`, icon: Package },
    { id: "sold", label: `Sold (${sold.length})`, icon: CheckCircle2 },
    { id: "expired", label: `Expired (${expired.length})`, icon: Clock },
    { id: "wishlist", label: `Wishlist (${favoriteListings.length})`, icon: Heart },
    { id: "blocked", label: `Blocked (${blockedUsers.length})`, icon: ShieldOff },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 lg:px-8">
      <h1 className="mb-1 font-display text-2xl font-bold text-ink-900">My Dashboard</h1>
      <p className="mb-6 text-sm text-ink-500">Manage your listings, sales, and saved items.</p>

      <div className="mb-6 flex gap-2 border-b border-ink-100">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
                tab === t.id
                  ? "border-brand-600 text-brand-700"
                  : "border-transparent text-ink-500 hover:text-ink-700"
              }`}
            >
              <Icon size={15} /> {t.label}
            </button>
          );
        })}
      </div>

      {tab === "blocked" ? (
        blockedUsers.length === 0 ? (
          <p className="py-16 text-center text-sm text-ink-400">
            You haven't blocked any users.
          </p>
        ) : (
          <div className="space-y-3">
            {blockedUsers.map((userId) => {
              const user = getUserById(userId);
              return (
                <div key={userId} className="card flex items-center gap-4 p-4">
                  <img src={user?.avatar} alt="" className="h-11 w-11 rounded-full object-cover" />
                  <div className="flex-1">
                    <p className="font-semibold text-ink-900">{user?.name || "Sells Point user"}</p>
                    <p className="text-sm text-ink-500">{user?.phone || userId}</p>
                  </div>
                  <button onClick={() => unblockUser(userId)} className="btn-secondary px-3 py-1.5 text-sm">
                    Unblock
                  </button>
                </div>
              );
            })}
          </div>
        )
      ) : tab === "wishlist" ? (
        favoriteListings.length === 0 ? (
          <p className="py-16 text-center text-sm text-ink-400">
            You haven't saved any listings yet.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {favoriteListings.map((listing) => (
              <ProductCard key={listing.id} listing={listing} />
            ))}
          </div>
        )
      ) : (
        <div className="space-y-3">
          {(tab === "active"
            ? active.filter((l) => !isExpired(l))
            : tab === "expired"
            ? expired
            : sold
          ).length === 0 && (
            <p className="py-16 text-center text-sm text-ink-400">
              {tab === "expired"
                ? "No expired listings yet."
                : "Nothing here yet."}
            </p>
          )}
          {(tab === "active"
            ? active.filter((l) => !isExpired(l))
            : tab === "expired"
            ? expired
            : sold
          ).map((l) => (
            <div key={l.id} className="card flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
              <img
                src={l.images?.[0]}
                alt=""
                className="h-20 w-full rounded-xl object-cover sm:w-28"
              />
              <div className="flex-1">
                <p className="font-semibold text-ink-900">{l.title}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-ink-500">
                  <span className="font-display font-bold text-ink-900">{formatPrice(l.price)}</span>
                  <span className="badge-ink">{l.views} views</span>
                  {l.featured && (
                    <span className="badge-gold capitalize">{l.featuredStatus}</span>
                  )}
                </div>
                {tab === "expired" && (
                  <p className="mt-1 text-xs text-red-500">{expiredAgoText(l.expiresAt)}</p>
                )}
              </div>
              {tab === "active" && (
                <div className="flex shrink-0 flex-wrap gap-2">
                  <button
                    onClick={() => {
                      setEditingListing(l);
                      setIsEditModalOpen(true);
                    }}
                    className="btn-secondary px-3 py-1.5 text-sm"
                  >
                    <Pencil size={14} /> Edit
                  </button>
                  {["none", "rejected"].includes(l.featuredStatus) && (
                    <button
                      onClick={() => requestFeatured(l.id)}
                      className="btn-secondary px-3 py-1.5 text-sm"
                    >
                      <Sparkles size={14} /> {l.featuredStatus === "rejected" ? "Request Again" : "Boost"}
                    </button>
                  )}
                  {l.featuredStatus === "pending" && <span className="badge bg-amber-100 text-amber-700">Quote pending</span>}
                  {l.featuredStatus === "awaiting_payment" && (
                    <button onClick={() => completeMockPromotionPayment(l.id)} className="btn-primary px-3 py-1.5 text-sm" title="Mock checkout; no real charge">
                      <Sparkles size={14} /> Pay {formatPrice(l.promotionPrice)} (Mock)
                    </button>
                  )}
                  <button
                    onClick={() => markAsSold(l.id)}
                    className="btn-secondary px-3 py-1.5 text-sm"
                  >
                    <CheckCircle2 size={14} /> Mark Sold
                  </button>
                  <button
                    onClick={() => deleteListing(l.id)}
                    className="rounded-xl border border-red-200 px-3 py-1.5 text-sm font-semibold text-red-500 hover:bg-red-50"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
              {tab === "expired" && (
                <div className="flex shrink-0 flex-wrap gap-2">
                  <button
                    onClick={() => renewListing(l.id)}
                    className="btn-secondary px-3 py-1.5 text-sm"
                  >
                    <RotateCw size={14} /> Renew
                  </button>
                  <button
                    onClick={() => deleteListing(l.id)}
                    className="rounded-xl border border-red-200 px-3 py-1.5 text-sm font-semibold text-red-500 hover:bg-red-50"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <EditListingModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingListing(null);
        }}
        listing={editingListing}
      />
    </div>
  );
}
