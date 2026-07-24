"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  ChevronRight,
  Clock3,
  Inbox,
  LoaderCircle,
  Mail,
  Phone,
  RefreshCw,
  Save,
  Search,
} from "lucide-react";
import { CONTACT_CATEGORIES, CONTACT_STATUSES } from "@/lib/contact-inquiry.mjs";

const CATEGORY_LABELS = {
  support: "Support",
  safety: "Trust & safety",
  account: "Account",
  listing: "Listing",
  payment: "Payment",
  partnership: "Partnership",
  feedback: "Feedback",
  other: "Other",
};

const STATUS_LABELS = {
  new: "New",
  in_progress: "In progress",
  resolved: "Resolved",
};

const STATUS_STYLES = {
  new: "bg-blue-100 text-blue-700",
  in_progress: "bg-amber-100 text-amber-800",
  resolved: "bg-brand-100 text-brand-800",
};

export default function AdminEnquiries() {
  const [enquiries, setEnquiries] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [filters, setFilters] = useState({
    status: "",
    category: "",
    search: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [noteDraft, setNoteDraft] = useState("");
  const [page, setPage] = useState(0);
  const [pagination, setPagination] = useState({
    page: 0,
    pageSize: 50,
    total: 0,
    hasMore: false,
  });

  const selected = useMemo(() => enquiries.find((item) => item.id === selectedId) || null, [enquiries, selectedId]);
  const updateFilter = (key, value) => {
    setPage(0);
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const load = async (signal) => {
    setLoading(true);
    setError("");
    const params = new URLSearchParams();
    if (filters.status) params.set("status", filters.status);
    if (filters.category) params.set("category", filters.category);
    if (filters.search.trim()) params.set("q", filters.search.trim());
    params.set("page", String(page));

    try {
      const response = await fetch(`/api/admin/enquiries?${params}`, { signal });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || "Unable to load enquiries.");
      }
      setEnquiries(payload.enquiries || []);
      setPagination(
        payload.pagination || {
          page,
          pageSize: 50,
          total: payload.enquiries?.length || 0,
          hasMore: false,
        }
      );
      setSelectedId((current) =>
        (payload.enquiries || []).some((item) => item.id === current) ? current : payload.enquiries?.[0]?.id || null
      );
    } catch (requestError) {
      if (requestError.name !== "AbortError") {
        setError(requestError.message || "Unable to load enquiries.");
        setEnquiries([]);
        setSelectedId(null);
      }
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => load(controller.signal), 180);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [filters.status, filters.category, filters.search, page]);

  useEffect(() => {
    setNoteDraft(selected?.admin_note || "");
  }, [selectedId, selected?.admin_note]);

  const updateEnquiry = async (updates) => {
    if (!selected) return;
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/admin/enquiries", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selected.id, ...updates }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || "Unable to update enquiry.");
      }
      setEnquiries((items) => items.map((item) => (item.id === payload.enquiry.id ? payload.enquiry : item)));
      setNoteDraft(payload.enquiry.admin_note || "");
    } catch (requestError) {
      setError(requestError.message || "Unable to update enquiry.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="relative sm:col-span-1">
          <span className="sr-only">Search enquiries</span>
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
          <input
            value={filters.search}
            onChange={(event) => updateFilter("search", event.target.value)}
            placeholder="Search reference, name, email…"
            className="input-field pl-10"
          />
        </label>
        <label>
          <span className="sr-only">Filter by status</span>
          <select
            value={filters.status}
            onChange={(event) => updateFilter("status", event.target.value)}
            className="input-field"
          >
            <option value="">All statuses</option>
            {CONTACT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="sr-only">Filter by category</span>
          <select
            value={filters.category}
            onChange={(event) => updateFilter("category", event.target.value)}
            className="input-field"
          >
            <option value="">All categories</option>
            {CONTACT_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {CATEGORY_LABELS[category]}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-center justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={() => load()}
            className="inline-flex shrink-0 items-center gap-1 font-semibold"
          >
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      )}

      <div className="grid min-h-[560px] overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-neutral lg:grid-cols-[minmax(300px,.85fr)_minmax(0,1.5fr)]">
        <div className={`${selected ? "hidden lg:block" : "block"} border-r border-ink-100`}>
          <div className="flex h-14 items-center justify-between border-b border-ink-100 px-4">
            <p className="text-sm font-semibold text-ink-700">
              {loading ? "Loading…" : `${pagination.total} ${pagination.total === 1 ? "enquiry" : "enquiries"}`}
            </p>
          </div>
          <div className="max-h-[620px] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center gap-2 p-10 text-sm text-ink-400">
                <LoaderCircle className="animate-spin" size={18} /> Loading
              </div>
            ) : enquiries.length === 0 ? (
              <div className="p-10 text-center">
                <Inbox className="mx-auto text-ink-300" size={30} />
                <p className="mt-3 font-semibold text-ink-700">No matching enquiries</p>
                <p className="mt-1 text-sm text-ink-400">New contact submissions will appear here.</p>
              </div>
            ) : (
              enquiries.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => setSelectedId(item.id)}
                  className={`flex w-full items-start gap-3 border-b border-ink-100 p-4 text-left transition-colors hover:bg-ink-50 ${
                    selectedId === item.id ? "bg-brand-50" : ""
                  }`}
                >
                  <span
                    className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
                      item.status === "new"
                        ? "bg-blue-500"
                        : item.status === "in_progress"
                          ? "bg-amber-500"
                          : "bg-brand-500"
                    }`}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <strong className="truncate text-sm text-ink-900">{item.name}</strong>
                      <span className="shrink-0 text-[10px] text-ink-400">{formatDate(item.created_at, true)}</span>
                    </span>
                    <span className="mt-1 block truncate text-xs text-ink-500">
                      {CATEGORY_LABELS[item.category]} · {item.reference_code}
                    </span>
                    <span className="mt-1 block truncate text-xs text-ink-400">{item.message}</span>
                  </span>
                  <ChevronRight size={16} className="mt-3 shrink-0 text-ink-300 lg:hidden" />
                </button>
              ))
            )}
          </div>
          {!loading && pagination.total > pagination.pageSize && (
            <div className="flex items-center justify-between gap-3 border-t border-ink-100 px-4 py-3">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(0, current - 1))}
                disabled={page === 0}
                className="text-xs font-semibold text-brand-700 disabled:text-ink-300"
              >
                Previous
              </button>
              <span className="text-xs text-ink-400">
                Page {page + 1} of {Math.max(1, Math.ceil(pagination.total / pagination.pageSize))}
              </span>
              <button
                type="button"
                onClick={() => setPage((current) => current + 1)}
                disabled={!pagination.hasMore}
                className="text-xs font-semibold text-brand-700 disabled:text-ink-300"
              >
                Next
              </button>
            </div>
          )}
        </div>

        <div className={`${selected ? "block" : "hidden lg:block"} min-w-0`}>
          {!selected ? (
            <div className="flex h-full flex-col items-center justify-center p-10 text-center text-ink-400">
              <Mail size={30} />
              <p className="mt-3 text-sm">Select an enquiry to review its details.</p>
            </div>
          ) : (
            <div className="flex h-full flex-col">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-100 px-4 py-4 sm:px-6">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedId(null)}
                    className="text-sm font-semibold text-brand-700 lg:hidden"
                  >
                    ← Inbox
                  </button>
                  <span className={`badge ${STATUS_STYLES[selected.status]}`}>{STATUS_LABELS[selected.status]}</span>
                  <span className="font-mono text-xs text-ink-400">{selected.reference_code}</span>
                </div>
                <select
                  value={selected.status}
                  onChange={(event) =>
                    updateEnquiry({
                      status: event.target.value,
                      adminNote: noteDraft,
                    })
                  }
                  disabled={saving}
                  aria-label="Update enquiry status"
                  className="rounded-xl border border-ink-200 bg-white px-3 py-2 text-sm font-semibold text-ink-700"
                >
                  {CONTACT_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {STATUS_LABELS[status]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex-1 space-y-6 overflow-y-auto p-4 sm:p-6">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-700">
                    {CATEGORY_LABELS[selected.category]}
                  </p>
                  <h3 className="mt-2 font-display text-2xl font-bold text-ink-950">{selected.name}</h3>
                  <p className="mt-2 flex items-center gap-2 text-sm text-ink-500">
                    <Clock3 size={15} />
                    Received {formatDate(selected.created_at)}
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <a
                    href={`mailto:${selected.email}`}
                    className="inline-flex items-center gap-2 rounded-xl bg-ink-50 px-3 py-2 text-sm font-medium text-ink-700 hover:bg-brand-50 hover:text-brand-700"
                  >
                    <Mail size={15} /> {selected.email}
                  </a>
                  {selected.phone && (
                    <a
                      href={`tel:${selected.phone}`}
                      className="inline-flex items-center gap-2 rounded-xl bg-ink-50 px-3 py-2 text-sm font-medium text-ink-700 hover:bg-brand-50 hover:text-brand-700"
                    >
                      <Phone size={15} /> {selected.phone}
                    </a>
                  )}
                </div>

                <div className="rounded-2xl border border-ink-100 bg-ink-50/70 p-5">
                  <p className="whitespace-pre-wrap text-sm leading-7 text-ink-700">{selected.message}</p>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label htmlFor="enquiry-admin-note" className="text-sm font-semibold text-ink-800">
                      Internal note
                    </label>
                    <span className="text-xs text-ink-400">{noteDraft.length}/4000</span>
                  </div>
                  <textarea
                    id="enquiry-admin-note"
                    value={noteDraft}
                    onChange={(event) => setNoteDraft(event.target.value)}
                    maxLength={4000}
                    rows={6}
                    placeholder="Record follow-up context for other administrators…"
                    className="input-field resize-y"
                  />
                  <button
                    type="button"
                    onClick={() => updateEnquiry({ adminNote: noteDraft })}
                    disabled={saving || noteDraft.trim() === (selected.admin_note || "")}
                    className="btn-primary mt-3 px-4 py-2 text-sm"
                  >
                    {saving ? <LoaderCircle className="animate-spin" size={15} /> : <Save size={15} />}
                    Save internal note
                  </button>
                </div>

                {selected.status !== "resolved" && (
                  <button
                    type="button"
                    onClick={() =>
                      updateEnquiry({
                        status: "resolved",
                        adminNote: noteDraft,
                      })
                    }
                    disabled={saving}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-brand-700"
                  >
                    <CheckCircle2 size={17} /> Mark enquiry resolved
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function formatDate(value, short = false) {
  if (!value) return "";
  return new Date(value).toLocaleString(
    "en-IN",
    short
      ? { day: "numeric", month: "short" }
      : {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }
  );
}
