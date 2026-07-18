"use client";

import { X, Calendar, IndianRupee, Tag, LocateFixed } from "lucide-react";
import { CONDITIONS } from "@/context/AppContext";

const DATE_OPTIONS = [
  { id: "24h", label: "Last 24 hours" },
  { id: "7d", label: "Last 7 days" },
  { id: "30d", label: "Last 30 days" },
  { id: "all", label: "All time" },
];

export default function FilterBar({
  subcategories = [], subcategoryId, onSubcategoryChange,
  minPrice,
  maxPrice,
  conditions,
  dateFilter,
  nearby,
  radiusKm,
  onMinPriceChange,
  onMaxPriceChange,
  onConditionToggle,
  onDateFilterChange,
  onUseNearby,
  onClearNearby,
  onRadiusChange,
  onClearAll,
}) {
  const activeFilterCount =
    (minPrice || maxPrice ? 1 : 0) +
    (conditions.length > 0 ? 1 : 0) +
    (dateFilter && dateFilter !== "all" ? 1 : 0) +
    (nearby ? 1 : 0);

  return (
    <div className="space-y-4">
      {subcategories.length > 0 && <div className="flex items-center gap-3"><div className="flex items-center gap-2 text-sm font-semibold text-ink-700"><Tag size={16}/>Subcategory:</div><select value={subcategoryId || ""} onChange={(e)=>onSubcategoryChange(e.target.value)} className="input-field max-w-xs"><option value="">All subcategories</option>{subcategories.map((s)=><option key={s.id} value={s.id}>{s.label}</option>)}</select></div>}
      {/* Price Range */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-ink-700">
          <IndianRupee size={16} />
          Price:
        </div>
        <input
          type="number"
          placeholder="Min"
          value={minPrice || ""}
          onChange={(e) => onMinPriceChange(e.target.value ? Number(e.target.value) : null)}
          className="input-field w-28 text-sm"
          min="0"
          max={maxPrice || undefined}
        />
        <span className="text-ink-400">-</span>
        <input
          type="number"
          placeholder="Max"
          value={maxPrice || ""}
          onChange={(e) => onMaxPriceChange(e.target.value ? Number(e.target.value) : null)}
          className="input-field w-28 text-sm"
          min={minPrice || 0}
        />
        {minPrice && maxPrice && minPrice > maxPrice && (
          <span className="text-xs text-red-500">Min must be less than Max</span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-ink-700">
          <LocateFixed size={16} />
          Nearby:
        </div>
        <button
          type="button"
          onClick={nearby ? onClearNearby : onUseNearby}
          className={`rounded-xl px-3.5 py-2 text-sm font-semibold ${
            nearby ? "bg-brand-600 text-white" : "bg-white text-ink-600 ring-1 ring-inset ring-ink-200"
          }`}
        >
          {nearby ? "Near me active" : "Use my location"}
        </button>
        {nearby && (
          <select
            value={radiusKm || 25}
            onChange={(e) => onRadiusChange(Number(e.target.value))}
            className="rounded-xl border border-ink-200 px-3.5 py-2 text-sm text-ink-700 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          >
            {[5, 10, 25, 50].map((km) => (
              <option key={km} value={km}>
                {km} km
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Condition Filter */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-ink-700">
          <Tag size={16} />
          Condition:
        </div>
        <div className="flex flex-wrap gap-2">
          {CONDITIONS.map((cond) => {
            const active = conditions.includes(cond);
            return (
              <button
                key={cond}
                onClick={() => onConditionToggle(cond)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
                  active
                    ? "bg-brand-600 text-white shadow-sm"
                    : "bg-white text-ink-600 ring-1 ring-inset ring-ink-200 hover:ring-ink-300"
                }`}
              >
                {cond}
              </button>
            );
          })}
        </div>
      </div>

      {/* Date Posted Filter */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-ink-700">
          <Calendar size={16} />
          Posted:
        </div>
        <select
          value={dateFilter || "all"}
          onChange={(e) => onDateFilterChange(e.target.value)}
          className="rounded-xl border border-ink-200 px-3.5 py-2 text-sm text-ink-700 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
        >
          {DATE_OPTIONS.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Clear Filters */}
      {activeFilterCount > 0 && (
        <div className="flex items-center justify-between border-t border-ink-100 pt-3">
          <span className="text-xs font-medium text-ink-500">
            {activeFilterCount} filter{activeFilterCount !== 1 ? "s" : ""} active
          </span>
          <button
            onClick={onClearAll}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-ink-600 transition-colors hover:bg-ink-100"
          >
            <X size={14} />
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}
