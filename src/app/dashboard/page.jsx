"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Package, Heart, CheckCircle2, Sparkles, Trash2, Pencil, Clock, RotateCw, ShieldOff, ShoppingCart, CreditCard } from "lucide-react";
import { useApp } from "@/context/AppContext";
import ProductCard from "@/components/ProductCard";
import EditListingModal from "@/components/EditListingModal";
import MockCheckoutModal from "@/components/MockCheckoutModal";
import ListingMedia from "@/components/ListingMedia";

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
    refreshListings,
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
  const [orders, setOrders] = useState([]);
  const [sales, setSales] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [checkoutCart, setCheckoutCart] = useState(false);
  const [promotionPayment, setPromotionPayment] = useState({ payingId: null, message: "", error: "" });

  useEffect(() => {
    const requestedTab = new URLSearchParams(window.location.search).get("tab");
    if (["active", "sold", "expired", "saved", "payments", "blocked", "orders", "sales", "cart"].includes(requestedTab)) {
      setTab(requestedTab);
    }
  }, []);

  useEffect(() => {
    if (!currentUser) router.push("/");
    else if (currentUser.isAdmin) router.replace("/admin");
  }, [currentUser, router]);

  useEffect(() => {
    if (!currentUser) return;
    refreshListings();
    Promise.all(["buyer", "seller"].map(async (type) => {
      const response = await fetch(`/api/orders?actorId=${currentUser.id}&type=${type}`);
      const json = await response.json().catch(() => ({}));
      if (response.ok && json.ok) type === "buyer" ? setOrders(json.data.orders || []) : setSales(json.data.orders || []);
    }));
    fetch(`/api/cart?buyerId=${currentUser.id}`).then((response) => response.json()).then((json) => setCartItems(json.data?.items || [])).catch(() => setCartItems([]));
  }, [currentUser, refreshListings]);

  if (!currentUser || currentUser.isAdmin) return null;

  const myListings = listings.filter((l) => l.sellerId === currentUser.id);
  const active = myListings.filter((l) => l.status === "active");
  const sold = myListings.filter((l) => l.status === "sold");
  const expired = myListings.filter((l) => isExpired(l));
  const quotedListings = myListings.filter((l) => l.featuredStatus === "awaiting_payment");

  const TABS = [
    { id: "active", label: `Active (${active.length - expired.length})`, icon: Package },
    { id: "sold", label: `Sold (${sold.length})`, icon: CheckCircle2 },
    { id: "expired", label: `Expired (${expired.length})`, icon: Clock },
    { id: "saved", label: `Favorites (${favoriteListings.length})`, icon: Heart },
    { id: "payments", label: `Payments (${quotedListings.length})`, icon: CreditCard },
    { id: "blocked", label: `Blocked (${blockedUsers.length})`, icon: ShieldOff },
    { id: "orders", label: `My Orders (${orders.length})`, icon: Package },
    { id: "sales", label: `Sales (${sales.length})`, icon: CheckCircle2 },
    { id: "cart", label: `Cart (${cartItems.length})`, icon: ShoppingCart },
  ];

  return (
    <div className="page-container">
      <h1 className="mb-1 font-display text-2xl font-bold text-ink-900">My Dashboard</h1>
      <p className="mb-6 text-sm text-ink-500">Manage your listings, sales, favorites, and payments.</p>

      <div className="mb-6 flex gap-1 overflow-x-auto border-b border-ink-100">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => {
                setTab(t.id);
                router.replace(`/dashboard?tab=${t.id}`, { scroll: false });
              }}
              className={`flex min-h-11 shrink-0 items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-semibold transition-colors sm:px-4 ${
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

      {tab === "payments" ? (
        <div className="space-y-3">
          {promotionPayment.message && <p className="rounded-xl bg-brand-50 p-3 text-sm font-medium text-brand-800" role="status">{promotionPayment.message}</p>}
          {promotionPayment.error && <p className="rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700" role="alert">{promotionPayment.error}</p>}
          {quotedListings.length === 0 ? <p className="py-16 text-center text-sm text-ink-400">No promotion payments are due.</p> : quotedListings.map((listing) => (
            <div key={listing.id} className="card flex items-center gap-4 p-4">
              <ListingMedia src={listing.images?.[0]} alt="" className="w-16 shrink-0 rounded-xl" />
              <div className="min-w-0 flex-1"><p className="truncate font-semibold text-ink-900">{listing.title}</p><p className="text-sm text-ink-500">Featured placement · {formatPrice(listing.promotionPrice)}</p></div>
              <button disabled={promotionPayment.payingId === listing.id} onClick={async () => {
                setPromotionPayment({ payingId: listing.id, message: "", error: "" });
                const result = await completeMockPromotionPayment(listing.id);
                setPromotionPayment(result?.success
                  ? { payingId: null, message: "Payment successful. Your listing is now featured.", error: "" }
                  : { payingId: null, message: "", error: result?.error || "Payment failed. Please try again." });
              }} className="btn-primary shrink-0 px-4 py-2 text-sm disabled:opacity-60">
                <CreditCard size={15} /> {promotionPayment.payingId === listing.id ? "Paying…" : `Pay ${formatPrice(listing.promotionPrice)}`}
              </button>
            </div>
          ))}
        </div>
      ) : tab === "cart" ? (cartItems.length === 0 ? <p className="py-16 text-center text-sm text-ink-400">Your cart is empty.</p> : <div className="space-y-3">{cartItems.map((item) => <div key={item.id} className="card flex gap-3 p-3"><ListingMedia src={item.listings?.images?.[0]} alt="" className="w-16 shrink-0 rounded-xl"/><div className="flex-1"><p className="font-semibold">{item.listings?.title}</p><p className="text-sm text-ink-500">{formatPrice(item.listings?.price || 0)}</p></div></div>)}<button onClick={() => setCheckoutCart(true)} className="btn-primary w-full">Checkout cart (mock)</button></div>) : tab === "orders" || tab === "sales" ? (
        (tab === "orders" ? orders : sales).length === 0 ? <p className="py-16 text-center text-sm text-ink-400">No {tab === "orders" ? "orders" : "sales"} yet.</p> : <div className="space-y-3">{(tab === "orders" ? orders : sales).map((order) => <div key={order.id} className="card p-4"><div className="flex flex-wrap items-center justify-between gap-2"><div><p className="font-semibold text-ink-900">Order #{order.id.slice(0, 8).toUpperCase()}</p><p className="text-sm text-ink-500">{new Date(order.created_at).toLocaleDateString("en-IN")} · {order.order_items?.length || 0} item(s)</p></div><span className="badge-brand capitalize">{order.status.replaceAll("_", " ")}</span></div><div className="mt-3 space-y-1 text-sm text-ink-600">{order.order_items?.map((item) => <p key={item.id}>{item.title} × {item.quantity}</p>)}</div><p className="mt-3 font-display font-bold text-ink-900">{formatPrice(order.subtotal)}</p></div>)}</div>
      ) : tab === "blocked" ? (
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
                    <p className="text-sm text-ink-500">{user?.email || user?.phone || userId}</p>
                  </div>
                  <button onClick={() => unblockUser(userId)} className="btn-secondary px-3 py-1.5 text-sm">
                    Unblock
                  </button>
                </div>
              );
            })}
          </div>
        )
      ) : tab === "saved" ? (
        favoriteListings.length === 0 ? (
          <p className="py-16 text-center text-sm text-ink-400">
            You haven't added any favorites yet.
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
              <ListingMedia src={l.images?.[0]} alt="" className="w-full rounded-xl sm:w-20" />
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
                    <button onClick={() => setTab("payments")} className="btn-primary px-3 py-1.5 text-sm">
                      <CreditCard size={14} /> Pay {formatPrice(l.promotionPrice)}
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
      <MockCheckoutModal open={checkoutCart} onClose={() => setCheckoutCart(false)} source="cart" items={cartItems.map((item) => ({ ...item.listings, quantity: item.quantity, selectedSpecifications: item.selected_specifications || {} }))} />
    </div>
  );
}
