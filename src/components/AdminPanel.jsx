"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  LayoutList,
  Users,
  Flag,
  Sparkles,
  Check,
  X,
  ShieldOff,
  ShieldCheck,
  Trash2,
  Package,
  Tags,
  Plus,
  Pencil,
  MessageCircle,
  BarChart3,
  Megaphone,
  ChevronDown,
  ChevronUp,
  Eye,
  TrendingUp,
  AlertTriangle,
  ExternalLink,
  Upload,
  Menu,
  LogOut,
  Home,
  Search,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import BrandLogo from "@/components/BrandLogo";
import EditListingModal from "@/components/EditListingModal";

const TABS = [
  { id: "analytics", label: "Analytics", group: "Main", icon: BarChart3, subtitle: "Marketplace performance and community health at a glance." },
  { id: "promotions", label: "Promotion Requests", group: "Operations", icon: Sparkles, subtitle: "Review pending featured-ad requests and send mock payment quotes." },
  { id: "listings", label: "Listings", group: "Operations", icon: LayoutList, subtitle: "Review, moderate, and feature marketplace listings." },
  { id: "users", label: "Users", group: "Operations", icon: Users, subtitle: "Manage member access, warnings, and account status." },
  { id: "reports", label: "Reports", group: "Operations", icon: Flag, subtitle: "Investigate and resolve community reports." },
  { id: "chats", label: "Chat Monitor", group: "Operations", icon: MessageCircle, subtitle: "Monitor marketplace conversations for safety." },
  { id: "categories", label: "Categories", group: "Content", icon: Tags, subtitle: "Organize the marketplace and category imagery." },
  { id: "announcements", label: "Announcements", group: "Content", icon: Megaphone, subtitle: "Publish important updates to all users." },
];

function formatPrice(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function AdminPanel() {
  const {
    listings,
    users,
    reports,
    categories,
    subcategories,
    currentUser,
    getUserById,
    getListingById,
    setFeaturedStatus,
    deleteListing,
    banUser,
    unbanUser,
    warnUser,
    moderateListing,
    resolveReport,
    addCategory,
    updateCategory,
    deleteCategory,
    mutateSubcategory,
    fetchCategories,
    analytics,
    announcements,
    fetchAnalytics,
    createAnnouncement,
    deactivateAnnouncement,
    deleteAnnouncement,
    logout,
  } = useApp();
  const [tab, setTab] = useState("listings");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [editingCat, setEditingCat] = useState(null);
  const [newCat, setNewCat] = useState({ id: "", label: "", icon: "Tag", image_url: "" });
  const [catError, setCatError] = useState("");
  const [catSyncing, setCatSyncing] = useState(false);
  const [catSyncMessage, setCatSyncMessage] = useState("");
  const [catUploading, setCatUploading] = useState(null);
  const [newSubcategory, setNewSubcategory] = useState({});
  const [listingSearch, setListingSearch] = useState("");
  const [listingFilters, setListingFilters] = useState({ status: "", featured: "", category: "", subcategoryId: "" });
  const [listingPage, setListingPage] = useState(0);
  const [userSearch, setUserSearch] = useState("");
  const [userFilter, setUserFilter] = useState("");
  const [userPage, setUserPage] = useState(0);
  const [editingListing, setEditingListing] = useState(null);
  const ADMIN_PAGE_SIZE = 10;

  const [monitoredChats, setMonitoredChats] = useState([]);
  const [chatsLoading, setChatsLoading] = useState(false);
  const [expandedChat, setExpandedChat] = useState(null);

  const [newAnnouncement, setNewAnnouncement] = useState({ title: "", body: "" });
  const [annError, setAnnError] = useState("");
  const [annSuccess, setAnnSuccess] = useState("");

  const pendingFeatured = listings.filter((l) => l.featuredStatus === "pending");
  const otherListings = listings.filter((l) => l.featuredStatus !== "pending");
  const openReports = reports.filter((r) => r.status === "open");
  const closedReports = reports.filter((r) => r.status !== "open");
  const filteredListings = otherListings.filter((l) => {
    const seller = getUserById(l.sellerId);
    return (!listingSearch || `${l.title} ${seller?.name || ""}`.toLowerCase().includes(listingSearch.toLowerCase())) &&
      (!listingFilters.status || l.status === listingFilters.status) && (!listingFilters.featured || l.featuredStatus === listingFilters.featured) &&
      (!listingFilters.category || l.category === listingFilters.category) && (!listingFilters.subcategoryId || l.subcategoryId === listingFilters.subcategoryId);
  });
  const filteredUsers = users.filter((u) => (!userSearch || `${u.name} ${u.email || u.phone || ""}`.toLowerCase().includes(userSearch.toLowerCase())) &&
    (!userFilter || (userFilter === "admin" ? u.isAdmin : userFilter === "suspended" ? u.isBanned : !u.isBanned && !u.isAdmin)));
  const pageListings = filteredListings.slice(listingPage * ADMIN_PAGE_SIZE, (listingPage + 1) * ADMIN_PAGE_SIZE);
  const pageUsers = filteredUsers.slice(userPage * ADMIN_PAGE_SIZE, (userPage + 1) * ADMIN_PAGE_SIZE);

  useEffect(() => {
    if (tab === "chats" && currentUser) {
      setChatsLoading(true);
      fetch("/api/admin/chats")
        .then((r) => r.json())
        .then((json) => setMonitoredChats(json.chats || []))
        .catch(() => setMonitoredChats([]))
        .finally(() => setChatsLoading(false));
    }
  }, [tab, currentUser]);

  useEffect(() => {
    if (tab === "analytics" && currentUser) {
      fetchAnalytics(currentUser.id);
    }
  }, [tab, currentUser, fetchAnalytics]);

  useEffect(() => {
    const closeOnEscape = (event) => event.key === "Escape" && setSidebarOpen(false);
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);

  const activeSection = TABS.find((item) => item.id === tab) || TABS[0];
  const selectTab = (id) => {
    setTab(id);
    setSidebarOpen(false);
  };

  return (
    <div className="admin-shell min-h-screen bg-[#f4f7f5]">
      {sidebarOpen && <button aria-label="Close navigation" className="fixed inset-0 z-40 bg-ink-950/50 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />}
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-ink-950 text-white shadow-2xl transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-20 items-center border-b border-white/10 px-6"><div className="rounded-xl bg-white px-3 py-2"><BrandLogo /></div></div>
        <nav className="flex-1 overflow-y-auto px-4 py-6" aria-label="Admin navigation">
          {["Main", "Operations", "Content"].map((group) => <div key={group} className="mb-7"><p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-ink-400">{group}</p><div className="space-y-1">{TABS.filter((item) => item.group === group).map((item) => { const Icon = item.icon; return <button key={item.id} onClick={() => selectTab(item.id)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all ${tab === item.id ? "bg-brand-500 text-ink-950 shadow-lg shadow-brand-900/20" : "text-ink-300 hover:bg-white/10 hover:text-white"}`}><Icon size={18} /><span className="flex-1 text-left">{item.label}</span>{item.id === "promotions" && pendingFeatured.length > 0 && <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-amber-400 px-1.5 text-xs font-bold text-ink-950">{pendingFeatured.length}</span>}</button>; })}</div></div>)}
        </nav>
        <div className="border-t border-white/10 p-4"><div className="mb-3 flex items-center gap-3 rounded-xl bg-white/5 p-3"><img src={currentUser.avatar} alt="" className="h-10 w-10 rounded-full object-cover ring-2 ring-brand-400" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{currentUser.name}</p><p className="text-xs text-ink-400">Administrator</p></div></div><button onClick={logout} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-ink-300 hover:bg-red-500/10 hover:text-red-300"><LogOut size={17} /> Log out</button></div>
      </aside>
      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 flex min-h-20 items-center justify-between border-b border-ink-100 bg-white/95 px-4 backdrop-blur-xl sm:px-6 lg:px-10"><div className="flex min-w-0 items-center gap-3"><button onClick={() => setSidebarOpen(true)} className="rounded-xl border border-ink-200 p-2 text-ink-700 lg:hidden" aria-label="Open navigation"><Menu size={20} /></button><div className="min-w-0"><h1 className="font-display text-xl font-bold text-ink-950 sm:text-2xl">{activeSection.label}</h1><p className="hidden truncate text-sm text-ink-500 sm:block">{activeSection.subtitle}</p></div></div><Link href="/" className="btn-secondary shrink-0 px-3 py-2 text-sm sm:px-4"><Home size={16} /><span className="hidden sm:inline">View Site</span></Link></header>
        <main className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-10 lg:py-8">

      {tab === "promotions" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between"><div><h3 className="flex items-center gap-2 font-display font-bold text-ink-900"><Sparkles size={18} className="text-amber-500" /> Pending Featured Ad Approvals</h3><p className="mt-1 text-sm text-ink-500">Accept a request by setting its mock promotion price, or reject it.</p></div><span className="badge-gold">{pendingFeatured.length} pending</span></div>
          {pendingFeatured.length === 0 ? <div className="card p-10 text-center"><Sparkles size={30} className="mx-auto mb-3 text-ink-300"/><p className="font-semibold text-ink-700">No pending promotion requests</p><p className="mt-1 text-sm text-ink-400">New featured-ad requests will appear here.</p></div> : <div className="space-y-3">{pendingFeatured.map((listing) => { const seller = getUserById(listing.sellerId); return <div key={listing.id} className="card flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
            {listing.images?.[0] ? <img src={listing.images[0]} alt="" className="h-24 w-full rounded-xl object-cover sm:h-20 sm:w-24"/> : <div className="flex h-20 w-24 items-center justify-center rounded-xl bg-ink-100 text-ink-400"><Package size={22}/></div>}
            <div className="min-w-0 flex-1"><Link href={`/product/${listing.id}`} className="font-semibold text-ink-900 hover:underline">{listing.title}</Link><p className="mt-1 text-sm text-ink-500">{formatPrice(listing.price)} · Seller: {seller?.name || "Unknown"}</p><p className="mt-1 text-xs text-ink-400">Requested {listing.promotionRequestedAt ? new Date(listing.promotionRequestedAt).toLocaleString("en-IN") : "recently"}</p></div>
            <div className="flex shrink-0 gap-2"><button onClick={async()=>{const value=window.prompt("Set the mock promotion price in whole INR rupees");if(value!==null){const result=await setFeaturedStatus(listing.id,"awaiting_payment",Number(value));if(!result?.success)window.alert(result?.error||"Unable to send quote.");}}} className="btn-primary px-3 py-2 text-sm"><Check size={14}/> Accept & Set Price</button><button onClick={async()=>{const result=await setFeaturedStatus(listing.id,"rejected");if(!result?.success)window.alert(result?.error||"Unable to reject request.");}} className="btn-secondary px-3 py-2 text-sm"><X size={14}/> Reject</button></div>
          </div>;})}</div>}
          <div><h3 className="mb-3 font-display font-bold text-ink-900">Awaiting Mock Payment</h3><div className="space-y-2">{listings.filter((listing)=>listing.featuredStatus==="awaiting_payment").map((listing)=><div key={listing.id} className="flex items-center gap-3 rounded-xl border border-ink-100 bg-white p-3">{listing.images?.[0] && <img src={listing.images[0]} alt="" className="h-12 w-12 rounded-lg object-cover"/>}<div className="flex-1"><p className="font-medium text-ink-900">{listing.title}</p><p className="text-xs text-ink-500">Quote: {formatPrice(listing.promotionPrice)} · awaiting seller mock payment</p></div><span className="badge bg-blue-100 text-blue-700">Awaiting payment</span></div>)}{!listings.some((listing)=>listing.featuredStatus==="awaiting_payment")&&<p className="text-sm text-ink-400">No quotes awaiting payment.</p>}</div></div>
        </div>
      )}

      {tab === "listings" && (
        <div className="space-y-8">
          {false && pendingFeatured.length > 0 && (
            <div>
              <h3 className="mb-3 flex items-center gap-2 font-display font-bold text-ink-900">
                <Sparkles size={16} className="text-amber-500" /> Pending Featured Approvals
              </h3>
              <div className="space-y-3">
                {pendingFeatured.map((l) => {
                  const seller = getUserById(l.sellerId);
                  return (
                    <div key={l.id} className="card flex items-center gap-4 p-4">
                      <img
                        src={l.images?.[0]}
                        alt=""
                        className="h-16 w-16 rounded-xl object-cover"
                      />
                      <div className="flex-1">
                        <Link href={`/product/${l.id}`} className="font-semibold text-ink-900 hover:underline">
                          {l.title}
                        </Link>
                        <p className="text-xs text-ink-500">
                          {formatPrice(l.price)} · by {seller?.name}
                        </p>
                      </div>
                      <button
                        onClick={async () => {
                          const value = window.prompt("Mock promotion quote in whole INR rupees");
                          if (value !== null) {
                            const result = await setFeaturedStatus(l.id, "awaiting_payment", Number(value));
                            if (!result?.success) window.alert(result?.error || "Unable to send mock promotion quote.");
                          }
                        }}
                        className="btn-primary px-3 py-1.5 text-sm"
                      >
                        <Check size={14} /> Send Quote
                      </button>
                      <button
                        onClick={() => setFeaturedStatus(l.id, "rejected")}
                        className="btn-secondary px-3 py-1.5 text-sm"
                      >
                        <X size={14} /> Reject
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div>
            <h3 className="mb-3 font-display font-bold text-ink-900">All Listings</h3>
            <div className="mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
              <label className="relative"><Search size={15} className="absolute left-3 top-3 text-ink-400" /><input value={listingSearch} onChange={(e) => { setListingSearch(e.target.value); setListingPage(0); }} placeholder="Title or seller" className="input-field pl-9" /></label>
              <select className="input-field" value={listingFilters.status} onChange={(e) => { setListingFilters((p) => ({...p,status:e.target.value})); setListingPage(0); }}><option value="">All statuses</option>{["active","sold","expired","flagged","removed"].map((v)=><option key={v}>{v}</option>)}</select>
              <select className="input-field" value={listingFilters.featured} onChange={(e) => { setListingFilters((p) => ({...p,featured:e.target.value})); setListingPage(0); }}><option value="">All promotion states</option>{["none","pending","awaiting_payment","approved","rejected"].map((v)=><option key={v}>{v}</option>)}</select>
              <select className="input-field" value={listingFilters.category} onChange={(e) => { setListingFilters((p) => ({...p,category:e.target.value,subcategoryId:""})); setListingPage(0); }}><option value="">All categories</option>{categories.map((c)=><option key={c.id} value={c.id}>{c.label}</option>)}</select>
              <select className="input-field" value={listingFilters.subcategoryId} onChange={(e) => { setListingFilters((p) => ({...p,subcategoryId:e.target.value})); setListingPage(0); }}><option value="">All subcategories</option>{subcategories.filter((s)=>!listingFilters.category||s.categoryId===listingFilters.category).map((s)=><option key={s.id} value={s.id}>{s.label}</option>)}</select>
            </div>
            <div className="overflow-hidden rounded-2xl border border-ink-100">
              <table className="w-full text-left text-sm">
                <thead className="bg-ink-50 text-xs uppercase text-ink-500">
                  <tr>
                    <th className="px-4 py-3">Listing</th>
                    <th className="px-4 py-3">Seller</th>
                    <th className="px-4 py-3">Price</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Featured</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100">
                  {pageListings.map((l) => {
                    const seller = getUserById(l.sellerId);
                    return (
                      <tr key={l.id}>
                        <td className="max-w-xs px-4 py-3">
                          <Link href={`/product/${l.id}`} className="flex items-center gap-3 hover:underline">
                            {l.images?.[0] ? <img src={l.images[0]} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" /> : <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-ink-100 text-ink-400"><Package size={18} /></div>}
                            <span className="truncate">{l.title}</span>
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-ink-500">{seller?.name}</td>
                        <td className="px-4 py-3">{formatPrice(l.price)}</td>
                        <td className="px-4 py-3 capitalize">{l.status}</td>
                        <td className="px-4 py-3 capitalize">{l.featuredStatus}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => setEditingListing(l)} className="rounded-lg p-1.5 text-blue-600 hover:bg-blue-50" title="Edit listing"><Pencil size={15} /></button>
                            {l.status !== "flagged" && (
                              <button
                                onClick={() => moderateListing(l.id, "flag", "Flagged by admin")}
                                className="rounded-lg p-1.5 text-amber-600 hover:bg-amber-50"
                                title="Flag listing"
                              >
                                <Flag size={15} />
                              </button>
                            )}
                            {l.status !== "removed" && (
                              <button
                                onClick={() => moderateListing(l.id, "remove", "Removed by admin")}
                                className="rounded-lg p-1.5 text-red-500 hover:bg-red-50"
                                title="Remove listing"
                              >
                                <ShieldOff size={15} />
                              </button>
                            )}
                            {["flagged", "removed"].includes(l.status) && (
                              <button
                                onClick={() => moderateListing(l.id, "restore", "Restored by admin")}
                                className="rounded-lg p-1.5 text-brand-600 hover:bg-brand-50"
                                title="Restore listing"
                              >
                                <ShieldCheck size={15} />
                              </button>
                            )}
                            <button
                              onClick={() => deleteListing(l.id)}
                              className="rounded-lg p-1.5 text-red-500 hover:bg-red-50"
                              title="Delete listing"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex items-center justify-between text-sm text-ink-500"><span>{filteredListings.length} result(s)</span><div className="flex gap-2"><button className="btn-secondary px-3 py-1" disabled={listingPage===0} onClick={()=>setListingPage((p)=>p-1)}>Previous</button><button className="btn-secondary px-3 py-1" disabled={(listingPage+1)*ADMIN_PAGE_SIZE>=filteredListings.length} onClick={()=>setListingPage((p)=>p+1)}>Next</button></div></div>
          </div>
        </div>
      )}

      {tab === "users" && (
        <div><div className="mb-4 flex flex-wrap gap-2"><input value={userSearch} onChange={(e)=>{setUserSearch(e.target.value);setUserPage(0);}} placeholder="Search name or email" className="input-field max-w-sm"/><select value={userFilter} onChange={(e)=>{setUserFilter(e.target.value);setUserPage(0);}} className="input-field max-w-xs"><option value="">All users</option><option value="active">Active</option><option value="suspended">Suspended</option><option value="admin">Admins</option></select></div><div className="overflow-hidden rounded-2xl border border-ink-100">
          <table className="w-full text-left text-sm">
            <thead className="bg-ink-50 text-xs uppercase text-ink-500">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Rating</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {pageUsers.map((u) => (
                <tr key={u.id}>
                  <td className="px-4 py-3">
                    <Link href={`/profile/${u.id}`} className="flex items-center gap-2 hover:underline">
                      <img src={u.avatar} alt="" className="h-8 w-8 rounded-full object-cover" />
                      {u.name}
                      {u.isAdmin && <span className="badge-brand">Admin</span>}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-ink-500">{u.email || u.phone || "—"}</td>
                  <td className="px-4 py-3">{u.rating?.toFixed(1) ?? "—"}</td>
                  <td className="px-4 py-3">
                    {u.isBanned ? (
                      <span className="badge bg-red-100 text-red-600">Banned</span>
                    ) : (
                      <span className="badge-brand">Active</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {u.isAdmin ? (
                      <span className="text-xs text-ink-400">Protected</span>
                    ) : (
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => warnUser(u.id, "Admin warning")}
                          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-amber-600 hover:bg-amber-50"
                        >
                          <AlertTriangle size={14} /> Warn
                        </button>
                        {u.isBanned ? (
                          <button
                            onClick={() => unbanUser(u.id)}
                            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-brand-700 hover:bg-brand-50"
                          >
                            <ShieldCheck size={14} /> Unsuspend
                          </button>
                        ) : (
                          <button
                            onClick={() => banUser(u.id)}
                            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-red-500 hover:bg-red-50"
                          >
                            <ShieldOff size={14} /> Suspend
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div><div className="mt-3 flex justify-end gap-2"><button className="btn-secondary px-3 py-1" disabled={userPage===0} onClick={()=>setUserPage((p)=>p-1)}>Previous</button><button className="btn-secondary px-3 py-1" disabled={(userPage+1)*ADMIN_PAGE_SIZE>=filteredUsers.length} onClick={()=>setUserPage((p)=>p+1)}>Next</button></div></div>
      )}

      {tab === "reports" && (
        <div className="space-y-6">
          <div>
            <h3 className="mb-3 font-display font-bold text-ink-900">Open Reports</h3>
            {openReports.length === 0 && (
              <p className="text-sm text-ink-400">No open reports. Nice and quiet.</p>
            )}
            <div className="space-y-3">
              {openReports.map((r) => {
                const reporter = getUserById(r.reporterId);
                const target = r.type === "listing" ? getListingById(r.targetId) : getUserById(r.targetId);
                return (
                  <div key={r.id} className="card p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm">
                          <span className="badge-ink mr-2 capitalize">{r.type}</span>
                          <span className="font-semibold text-ink-900">
                            {r.type === "listing" ? target?.title : target?.name}
                          </span>
                        </p>
                        <p className="mt-1 text-sm text-ink-600">{r.reason}</p>
                        <p className="mt-1 text-xs text-ink-400">Reported by {reporter?.name}</p>
                      </div>
                      <div className="flex max-w-md flex-col items-end gap-2">
                        <textarea id={`report-note-${r.id}`} className="input-field min-h-16 text-sm" placeholder="Resolution note" />
                        <div className="flex flex-wrap justify-end gap-2">
                          {(r.type === "listing" ? [["flag","Flag"],["remove","Remove"],["resolve","No action"]] : [["warn","Warn"],["suspend","Suspend"],["resolve","No action"]]).map(([action,label]) => (
                            <button key={action} onClick={() => resolveReport(r.id, action, document.getElementById(`report-note-${r.id}`)?.value || "")} className="btn-secondary shrink-0 px-3 py-1.5 text-sm">{label}</button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {closedReports.length > 0 && (
            <div>
              <h3 className="mb-3 font-display font-bold text-ink-900">Resolved</h3>
              <div className="space-y-2">
                {closedReports.map((r) => (
                  <div key={r.id} className="rounded-xl bg-ink-50 px-4 py-2.5 text-sm text-ink-500">
                    <span className="badge-ink mr-2 capitalize">{r.type}</span>
                    <span className="font-medium text-ink-700">{r.resolutionAction || "resolve"}</span> · {r.reason}
                    {r.resolutionNote && <span className="block pl-16 text-xs">Note: {r.resolutionNote}</span>}
                    {r.resolvedAt && <span className="block pl-16 text-xs">Resolved {new Date(r.resolvedAt).toLocaleString("en-IN")} by {getUserById(r.resolvedBy)?.name || "Admin"}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "categories" && (
        <div className="space-y-6">
          <div>
            <h3 className="mb-3 font-display font-bold text-ink-900">Add New Category</h3>
            {catError && (
              <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
                {catError}
              </div>
            )}
            <div className="card p-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-5">
                <input
                  value={newCat.id}
                  onChange={(e) => setNewCat((p) => ({ ...p, id: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "") }))}
                  placeholder="ID (e.g. electronics)"
                  className="input-field"
                />
                <input
                  value={newCat.label}
                  onChange={(e) => setNewCat((p) => ({ ...p, label: e.target.value }))}
                  placeholder="Label (e.g. Electronics)"
                  className="input-field"
                />
                <input
                  value={newCat.icon}
                  onChange={(e) => setNewCat((p) => ({ ...p, icon: e.target.value }))}
                  placeholder="Icon (e.g. Smartphone)"
                  className="input-field"
                />
                <input
                  value={newCat.image_url}
                  onChange={(e) => setNewCat((p) => ({ ...p, image_url: e.target.value }))}
                  placeholder="Image URL (optional)"
                  className="input-field"
                />
                <label className="btn-secondary flex cursor-pointer items-center justify-center gap-2">
                  <Upload size={16} /> {catUploading === "new" ? "Uploading..." : "Upload"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={catUploading !== null}
                    onChange={async (event) => {
                      const file = event.target.files?.[0];
                      if (!file) return;
                      setCatError("");
                      setCatUploading("new");
                      try {
                        const url = await uploadCategoryImage(file);
                        setNewCat((prev) => ({ ...prev, image_url: url }));
                      } catch (error) {
                        setCatError(error.message);
                      } finally {
                        setCatUploading(null);
                        event.target.value = "";
                      }
                    }}
                  />
                </label>
                <button
                  onClick={async () => {
                    setCatError("");
                    if (!newCat.id || !newCat.label) {
                      setCatError("ID and label are required.");
                      return;
                    }
                    const result = await addCategory(newCat);
                    if (result.success) {
                      setNewCat({ id: "", label: "", icon: "Tag", image_url: "" });
                    } else {
                      setCatError(result.error || "Failed to add category.");
                    }
                  }}
                  className="btn-primary flex items-center justify-center gap-2"
                >
                  <Plus size={16} /> Add
                </button>
              </div>
              {newCat.image_url && (
                <div className="mt-3 flex items-center gap-3 rounded-xl bg-ink-50 p-3">
                  <img src={newCat.image_url} alt="" className="h-14 w-14 rounded-lg object-contain" />
                  <button
                    type="button"
                    onClick={() => setNewCat((prev) => ({ ...prev, image_url: "" }))}
                    className="text-sm font-semibold text-red-500"
                  >
                    Remove image
                  </button>
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-display font-bold text-ink-900">All Categories</h3>
                {catSyncMessage && <p className="mt-1 text-xs text-brand-600">{catSyncMessage}</p>}
              </div>
              <button
                onClick={async () => {
                  setCatError("");
                  setCatSyncMessage("");
                  setCatSyncing(true);
                  try {
                    const res = await fetch("/api/admin/categories/sync-cloudinary", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ actorId: currentUser.id }),
                    });
                    const json = await res.json();
                    if (!res.ok) {
                      setCatError(json.error || "Cloudinary sync failed.");
                      return;
                    }
                    await fetchCategories();
                    const skippedPreview = (json.skipped || [])
                      .slice(0, 3)
                      .map((item) => item.slug || item.categoryId)
                      .join(", ");
                    setCatSyncMessage(
                      `Synced ${json.updated?.length || 0} image(s). Skipped ${json.skipped?.length || 0}.${
                        skippedPreview ? ` Skipped: ${skippedPreview}` : ""
                      }`
                    );
                  } finally {
                    setCatSyncing(false);
                  }
                }}
                disabled={catSyncing}
                className="btn-secondary px-3 py-2 text-sm"
              >
                <Sparkles size={15} /> {catSyncing ? "Syncing..." : "Sync Cloudinary Images"}
              </button>
            </div>
            <div className="overflow-hidden rounded-2xl border border-ink-100">
              <table className="w-full text-left text-sm">
                <thead className="bg-ink-50 text-xs uppercase text-ink-500">
                  <tr>
                    <th className="px-4 py-3">Image</th>
                    <th className="px-4 py-3">ID</th>
                    <th className="px-4 py-3">Label</th>
                    <th className="px-4 py-3">Icon</th>
                    <th className="px-4 py-3">Image URL</th>
                    <th className="px-4 py-3">Order</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100">
                  {categories.map((cat) => (
                    <tr key={cat.id}>
                      {editingCat === cat.id ? (
                        <>
                          <td className="px-4 py-3">
                            {cat.imageUrl ? (
                              <img src={cat.imageUrl} alt="" className="h-10 w-10 rounded-lg object-contain" />
                            ) : (
                              <span className="text-xs text-ink-300">None</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-ink-400">{cat.id}</td>
                          <td className="px-4 py-3">
                            <input
                              defaultValue={cat.label}
                              id={`edit-label-${cat.id}`}
                              className="input-field py-1 text-sm"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              defaultValue={cat.icon}
                              id={`edit-icon-${cat.id}`}
                              className="input-field py-1 text-sm"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex min-w-56 items-center gap-2">
                              <input
                                defaultValue={cat.imageUrl}
                                id={`edit-image-${cat.id}`}
                                className="input-field py-1 text-sm"
                              />
                              <label className="cursor-pointer rounded-lg border border-ink-200 px-2 py-1.5 text-xs font-semibold text-ink-600 hover:bg-ink-50">
                                {catUploading === cat.id ? "..." : "Upload"}
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  disabled={catUploading !== null}
                                  onChange={async (event) => {
                                    const file = event.target.files?.[0];
                                    if (!file) return;
                                    setCatError("");
                                    setCatUploading(cat.id);
                                    try {
                                      const url = await uploadCategoryImage(file);
                                      const input = document.getElementById(`edit-image-${cat.id}`);
                                      if (input) input.value = url;
                                    } catch (error) {
                                      setCatError(error.message);
                                    } finally {
                                      setCatUploading(null);
                                      event.target.value = "";
                                    }
                                  }}
                                />
                              </label>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <input
                              defaultValue={cat.sortOrder ?? 0}
                              id={`edit-order-${cat.id}`}
                              type="number"
                              className="input-field w-20 py-1 text-sm"
                            />
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={async () => {
                                  setCatError("");
                                  const label = document.getElementById(`edit-label-${cat.id}`).value;
                                  const icon = document.getElementById(`edit-icon-${cat.id}`).value;
                                  const image_url = document.getElementById(`edit-image-${cat.id}`).value;
                                  const sort_order = Number(document.getElementById(`edit-order-${cat.id}`).value);
                                  const result = await updateCategory({ id: cat.id, label, icon, image_url, sort_order });
                                  if (result.success) {
                                    setEditingCat(null);
                                  } else {
                                    setCatError(result.error || "Failed to update.");
                                  }
                                }}
                                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-brand-700 hover:bg-brand-50"
                              >
                                <Check size={14} /> Save
                              </button>
                              <button
                                onClick={() => setEditingCat(null)}
                                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-ink-500 hover:bg-ink-100"
                              >
                                <X size={14} /> Cancel
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-3">
                            {cat.imageUrl ? (
                              <img src={cat.imageUrl} alt="" className="h-10 w-10 rounded-lg object-contain" />
                            ) : (
                              <span className="text-xs text-ink-300">None</span>
                            )}
                          </td>
                          <td className="px-4 py-3 font-mono text-xs text-ink-500">{cat.id}</td>
                          <td className="px-4 py-3 font-semibold text-ink-900">{cat.label}</td>
                          <td className="px-4 py-3 text-ink-500">{cat.icon}</td>
                          <td className="max-w-xs truncate px-4 py-3 text-ink-500">{cat.imageUrl || "—"}</td>
                          <td className="px-4 py-3 text-ink-500">{cat.sortOrder ?? 0}</td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => setEditingCat(cat.id)}
                                className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-700"
                              >
                                <Pencil size={15} />
                              </button>
                              <button
                                onClick={async () => {
                                  if (!window.confirm(`Delete category "${cat.label}"? This cannot be undone.`)) return;
                                  setCatError("");
                                  const result = await deleteCategory(cat.id);
                                  if (!result.success) {
                                    setCatError(result.error || "Failed to delete.");
                                  }
                                }}
                                className="rounded-lg p-1.5 text-red-500 hover:bg-red-50"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div>
            <h3 className="mb-3 font-display font-bold text-ink-900">Subcategories</h3>
            <div className="space-y-4">
              {categories.map((cat) => <div key={cat.id} className="card p-4"><h4 className="mb-3 font-semibold text-ink-900">{cat.label}</h4>
                <div className="mb-3 flex gap-2"><input className="input-field" placeholder="New subcategory" value={newSubcategory[cat.id] || ""} onChange={(e)=>setNewSubcategory((p)=>({...p,[cat.id]:e.target.value}))}/><button className="btn-primary" onClick={async()=>{const result=await mutateSubcategory("create-subcategory",{category_id:cat.id,label:newSubcategory[cat.id],sort_order:subcategories.filter((s)=>s.categoryId===cat.id).length});if(result.success)setNewSubcategory((p)=>({...p,[cat.id]:""}));else setCatError(result.error);}}><Plus size={15}/> Add</button></div>
                <div className="space-y-2">{subcategories.filter((s)=>s.categoryId===cat.id).map((sub)=><div key={sub.id} className="flex items-center gap-2 rounded-lg bg-ink-50 p-2"><input id={`sub-label-${sub.id}`} defaultValue={sub.label} className="input-field py-1"/><input id={`sub-order-${sub.id}`} type="number" defaultValue={sub.sortOrder} className="input-field w-24 py-1"/><button onClick={()=>mutateSubcategory("update-subcategory",{id:sub.id,label:document.getElementById(`sub-label-${sub.id}`).value,sort_order:Number(document.getElementById(`sub-order-${sub.id}`).value)})} className="rounded-lg p-2 text-brand-700"><Check size={15}/></button><button onClick={async()=>{const result=await mutateSubcategory("delete-subcategory",{id:sub.id});if(!result.success)setCatError(result.error);}} className="rounded-lg p-2 text-red-500"><Trash2 size={15}/></button></div>)}</div>
              </div>)}
            </div>
          </div>
        </div>
      )}

      {tab === "chats" && (
        <div className="space-y-4">
          <h3 className="font-display font-bold text-ink-900">All Conversations</h3>
          {chatsLoading ? (
            <p className="text-sm text-ink-400">Loading conversations...</p>
          ) : monitoredChats.length === 0 ? (
            <p className="text-sm text-ink-400">No conversations yet.</p>
          ) : (
            <div className="space-y-3">
              {monitoredChats.map((chat) => (
                <div key={chat.id} className="card overflow-hidden">
                  <button
                    onClick={() => setExpandedChat(expandedChat === chat.id ? null : chat.id)}
                    className="flex w-full items-center gap-4 p-4 text-left"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-600">
                      <MessageCircle size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-ink-900 truncate">
                        {chat.listingTitle}
                      </p>
                      <p className="text-xs text-ink-500">
                        {chat.participants.map((p) => p.name).join(" & ")}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-ink-400">
                      <span>{chat.messageCount} msgs</span>
                      {chat.participants.some((p) => p.isBanned) && (
                        <span className="badge bg-red-100 text-red-600">Banned user</span>
                      )}
                      {expandedChat === chat.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </button>
                  {expandedChat === chat.id && (
                    <div className="border-t border-ink-100 bg-ink-50/50 p-4">
                      <div className="mb-3 flex flex-wrap gap-2">
                        {chat.participants.map((p) => (
                          <div key={p.id} className="flex items-center gap-2 rounded-lg bg-white px-3 py-1.5 text-xs">
                            <img src={p.avatar} alt="" className="h-5 w-5 rounded-full" />
                            <span className="font-medium text-ink-700">{p.name}</span>
                            <span className="text-ink-400">{p.phone}</span>
                            {p.isBanned && <span className="badge bg-red-100 text-red-600">Banned</span>}
                          </div>
                        ))}
                      </div>
                      <div className="max-h-64 space-y-2 overflow-y-auto">
                        {chat.messages.map((msg) => (
                          <div
                            key={msg.id}
                            className={`flex gap-2 ${msg.senderId === chat.participants[0]?.id ? "" : "justify-end"}`}
                          >
                            <div className={`max-w-xs rounded-xl px-3 py-2 text-sm ${
                              msg.senderId === chat.participants[0]?.id
                                ? "bg-white text-ink-800"
                                : "bg-brand-100 text-brand-900"
                            }`}>
                              <p className="text-[10px] font-semibold text-ink-400">{msg.senderName}</p>
                              {msg.text && <p>{msg.text}</p>}
                              {msg.image && <img src={msg.image} alt="" className="mt-1 max-w-40 rounded-lg" />}
                              <p className="mt-0.5 text-[10px] text-ink-400">
                                {new Date(msg.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "analytics" && (
        <div className="space-y-8">
          {analytics ? (
            <>
              <div>
                <h3 className="mb-4 font-display font-bold text-ink-900">Overview</h3>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  {[
                    { label: "Total Users", value: analytics.overview.totalUsers, icon: Users, color: "bg-blue-100 text-blue-600" },
                    { label: "Active Listings", value: analytics.overview.activeListings, icon: Package, color: "bg-green-100 text-green-600" },
                    { label: "Sold Items", value: analytics.overview.soldListings, icon: TrendingUp, color: "bg-purple-100 text-purple-600" },
                    { label: "Open Reports", value: analytics.overview.openReports, icon: AlertTriangle, color: "bg-red-100 text-red-600" },
                    { label: "Pending Boost Requests", value: analytics.overview.pendingPromotions, icon: Sparkles, color: "bg-amber-100 text-amber-600" },
                    { label: "Awaiting Mock Payment", value: analytics.overview.awaitingPaymentPromotions, icon: Package, color: "bg-blue-100 text-blue-600" },
                    { label: "Successful Mock Payments", value: analytics.overview.successfulMockPayments, icon: Check, color: "bg-green-100 text-green-600" },
                    { label: "Mock Promotion Revenue", value: formatPrice(analytics.overview.mockPromotionRevenue), icon: TrendingUp, color: "bg-purple-100 text-purple-600" },
                  ].map((stat) => {
                    const Icon = stat.icon;
                    return (
                      <div key={stat.label} className="card flex items-center gap-3 p-4">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.color}`}>
                          <Icon size={18} />
                        </div>
                        <div>
                          <p className="text-xs text-ink-500">{stat.label}</p>
                          <p className="font-display text-xl font-bold text-ink-900">{stat.value}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <h3 className="mb-4 font-display font-bold text-ink-900">Engagement</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="card flex items-center gap-3 p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                      <MessageCircle size={18} />
                    </div>
                    <div>
                      <p className="text-xs text-ink-500">Total Chats</p>
                      <p className="font-display text-xl font-bold text-ink-900">{analytics.overview.totalChats}</p>
                    </div>
                  </div>
                  <div className="card flex items-center gap-3 p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-100 text-cyan-600">
                      <MessageCircle size={18} />
                    </div>
                    <div>
                      <p className="text-xs text-ink-500">Total Messages</p>
                      <p className="font-display text-xl font-bold text-ink-900">{analytics.overview.totalMessages}</p>
                    </div>
                  </div>
                  <div className="card flex items-center gap-3 p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                      <Check size={18} />
                    </div>
                    <div>
                      <p className="text-xs text-ink-500">Resolved Reports</p>
                      <p className="font-display text-xl font-bold text-ink-900">{analytics.overview.resolvedReports}</p>
                    </div>
                  </div>
                </div>
              </div>

              {analytics.listingsByDay.length > 0 && (
                <div>
                  <h3 className="mb-4 font-display font-bold text-ink-900">New Listings (Last 30 Days)</h3>
                  <div className="card p-6">
                    <div className="flex items-end gap-1" style={{ height: 160 }}>
                      {analytics.listingsByDay.map((d) => {
                        const max = Math.max(...analytics.listingsByDay.map((x) => x.count), 1);
                        const h = Math.max((d.count / max) * 100, 4);
                        return (
                          <div
                            key={d.date}
                            className="group relative flex-1 rounded-t bg-brand-500 transition-all hover:bg-brand-600"
                            style={{ height: `${h}%` }}
                          >
                            <div className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 rounded bg-ink-900 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
                              {d.count}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-2 flex justify-between text-xs text-ink-400">
                      <span>{analytics.listingsByDay[0]?.date.slice(5)}</span>
                      <span>{analytics.listingsByDay[analytics.listingsByDay.length - 1]?.date.slice(5)}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div>
                  <h3 className="mb-4 font-display font-bold text-ink-900">Listings by Category</h3>
                  <div className="card divide-y divide-ink-100">
                    {analytics.categoryStats.length === 0 ? (
                      <p className="p-4 text-sm text-ink-400">No data</p>
                    ) : (
                      analytics.categoryStats.map((cs) => {
                        const max = Math.max(...analytics.categoryStats.map((x) => Number(x.count)), 1);
                        const pct = (Number(cs.count) / max) * 100;
                        return (
                          <div key={cs.category} className="px-4 py-3">
                            <div className="mb-1 flex items-center justify-between">
                              <span className="text-sm font-medium capitalize text-ink-700">{cs.category}</span>
                              <span className="text-sm font-bold text-ink-900">{cs.count}</span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-ink-100">
                              <div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="mb-4 font-display font-bold text-ink-900">Listings by Condition</h3>
                  <div className="card divide-y divide-ink-100">
                    {Object.keys(analytics.conditionCounts).length === 0 ? (
                      <p className="p-4 text-sm text-ink-400">No data</p>
                    ) : (
                      Object.entries(analytics.conditionCounts).map(([cond, count]) => {
                        const max = Math.max(...Object.values(analytics.conditionCounts), 1);
                        const pct = (count / max) * 100;
                        return (
                          <div key={cond} className="px-4 py-3">
                            <div className="mb-1 flex items-center justify-between">
                              <span className="text-sm font-medium text-ink-700">{cond}</span>
                              <span className="text-sm font-bold text-ink-900">{count}</span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-ink-100">
                              <div className="h-full rounded-full bg-purple-500 transition-all" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              <div><h3 className="mb-4 font-display font-bold text-ink-900">Recent Mock Promotion Transactions</h3><div className="overflow-hidden rounded-2xl border border-ink-100"><table className="w-full text-left text-sm"><thead className="bg-ink-50 text-xs uppercase text-ink-500"><tr><th className="px-4 py-3">Reference</th><th className="px-4 py-3">Listing</th><th className="px-4 py-3">Amount</th><th className="px-4 py-3">Date</th></tr></thead><tbody className="divide-y divide-ink-100">{(analytics.recentMockTransactions || []).map((payment)=><tr key={payment.id}><td className="px-4 py-3 font-mono text-xs">{payment.reference}</td><td className="px-4 py-3">{getListingById(payment.listing_id)?.title || payment.listing_id}</td><td className="px-4 py-3">{formatPrice(payment.amount_inr)} <span className="badge-ink">Mock</span></td><td className="px-4 py-3 text-ink-500">{new Date(payment.created_at).toLocaleString("en-IN")}</td></tr>)}</tbody></table>{!analytics.recentMockTransactions?.length && <p className="p-4 text-sm text-ink-400">No mock transactions yet.</p>}</div></div>

              {analytics.recentUsers.length > 0 && (
                <div>
                  <h3 className="mb-4 font-display font-bold text-ink-900">Recent Signups (Last 7 Days)</h3>
                  <div className="overflow-hidden rounded-2xl border border-ink-100">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-ink-50 text-xs uppercase text-ink-500">
                        <tr>
                          <th className="px-4 py-3">User</th>
                          <th className="px-4 py-3">Joined</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-ink-100">
                        {analytics.recentUsers.map((u) => (
                          <tr key={u.id}>
                            <td className="px-4 py-3">
                              <Link href={`/profile/${u.id}`} className="font-medium text-ink-900 hover:underline">
                                {u.name}
                              </Link>
                            </td>
                            <td className="px-4 py-3 text-ink-500">
                              {new Date(u.joined_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-ink-400">Loading analytics...</p>
          )}
        </div>
      )}

      {tab === "announcements" && (
        <div className="space-y-6">
          <div>
            <h3 className="mb-3 font-display font-bold text-ink-900">Create Announcement</h3>
            {annError && (
              <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
                {annError}
              </div>
            )}
            {annSuccess && (
              <div className="mb-3 rounded-xl border border-green-200 bg-green-50 px-4 py-2.5 text-sm text-green-700">
                {annSuccess}
              </div>
            )}
            <div className="card space-y-3 p-4">
              <input
                value={newAnnouncement.title}
                onChange={(e) => setNewAnnouncement((p) => ({ ...p, title: e.target.value }))}
                placeholder="Announcement title"
                className="input-field"
              />
              <textarea
                value={newAnnouncement.body}
                onChange={(e) => setNewAnnouncement((p) => ({ ...p, body: e.target.value }))}
                placeholder="Write your announcement message..."
                rows={3}
                className="input-field resize-none"
              />
              <button
                onClick={async () => {
                  setAnnError("");
                  setAnnSuccess("");
                  if (!newAnnouncement.title || !newAnnouncement.body) {
                    setAnnError("Title and body are required.");
                    return;
                  }
                  const result = await createAnnouncement(newAnnouncement);
                  if (result.success) {
                    setNewAnnouncement({ title: "", body: "" });
                    setAnnSuccess(`Announcement sent with ${result.notificationsCreated} notifications.`);
                    setTimeout(() => setAnnSuccess(""), 3000);
                  } else {
                    setAnnError(result.error || "Failed to create announcement.");
                  }
                }}
                className="btn-primary flex items-center gap-2"
              >
                <Megaphone size={16} /> Send to All Users
              </button>
            </div>
          </div>

          <div>
            <h3 className="mb-3 font-display font-bold text-ink-900">All Announcements</h3>
            {announcements.length === 0 ? (
              <p className="text-sm text-ink-400">No announcements yet.</p>
            ) : (
              <div className="space-y-3">
                {announcements.map((ann) => (
                  <div key={ann.id} className="card p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-ink-900">{ann.title}</h4>
                          {ann.active ? (
                            <span className="badge bg-green-100 text-green-600">Active</span>
                          ) : (
                            <span className="badge bg-ink-100 text-ink-500">Inactive</span>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-ink-600">{ann.body}</p>
                        <p className="mt-1 text-xs text-ink-400">
                          {new Date(ann.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        {ann.active && (
                          <button
                            onClick={() => deactivateAnnouncement(ann.id)}
                            className="btn-secondary px-3 py-1.5 text-xs"
                          >
                            Deactivate
                          </button>
                        )}
                        <button
                          onClick={async () => {
                            if (!window.confirm("Delete this announcement?")) return;
                            await deleteAnnouncement(ann.id);
                          }}
                          className="rounded-lg p-1.5 text-red-500 hover:bg-red-50"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
          <EditListingModal isOpen={!!editingListing} listing={editingListing} adminMode onClose={() => setEditingListing(null)} />
        </main>
      </div>
    </div>
  );
}

async function uploadCategoryImage(file) {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch("/api/upload", { method: "POST", body: formData });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.error || "Upload failed");
  }
  const json = await res.json();
  return json.url;
}
