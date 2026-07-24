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
  subcategories = [],
  subcategoryId,
  onSubcategoryChange,
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
    <div className="divide-y divide-[#ededed]">
      {subcategories.length > 0 && (
        <div className="space-y-2 py-4">
          <div className="flex items-center gap-2 text-sm font-bold text-[#303030]">
            <Tag size={15} className="text-brand-600" />
            Subcategory
          </div>
          <select
            value={subcategoryId || ""}
            onChange={(e) => onSubcategoryChange(e.target.value)}
            className="min-h-11 w-full rounded-lg border border-[#dcdcdc] bg-white px-3 text-sm text-[#4d4d4d] outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 sm:max-w-xs"
          >
            <option value="">All subcategories</option>
            {subcategories.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      )}
      {/* Price Range */}
      <div className="flex flex-wrap items-center gap-2 py-4 sm:gap-3">
        <div className="flex w-full items-center gap-2 text-sm font-bold text-[#303030]">
          <IndianRupee size={15} className="text-brand-600" />
          Price range
        </div>
        <input
          type="number"
          placeholder="Min"
          value={minPrice || ""}
          onChange={(e) => onMinPriceChange(e.target.value ? Number(e.target.value) : null)}
          className="min-h-11 min-w-0 flex-1 basis-28 rounded-lg border border-[#dcdcdc] px-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 sm:w-28 sm:flex-none"
          min="0"
          max={maxPrice || undefined}
        />
        <span className="text-[#999]">–</span>
        <input
          type="number"
          placeholder="Max"
          value={maxPrice || ""}
          onChange={(e) => onMaxPriceChange(e.target.value ? Number(e.target.value) : null)}
          className="min-h-11 min-w-0 flex-1 basis-28 rounded-lg border border-[#dcdcdc] px-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 sm:w-28 sm:flex-none"
          min={minPrice || 0}
        />
        {minPrice && maxPrice && minPrice > maxPrice && (
          <span className="text-xs text-red-500">Min must be less than Max</span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3 py-4">
        <div className="flex w-full items-center gap-2 text-sm font-bold text-[#303030]">
          <LocateFixed size={15} className="text-brand-600" />
          Nearby
        </div>
        <button
          type="button"
          onClick={nearby ? onClearNearby : onUseNearby}
          className={`min-h-11 rounded-lg px-3.5 py-2 text-sm font-semibold ${
            nearby ? "bg-brand-600 text-white" : "border border-[#dcdcdc] bg-white text-[#4d4d4d]"
          }`}
        >
          {nearby ? "Near me active" : "Use my location"}
        </button>
        {nearby && (
          <select
            value={radiusKm || 25}
            onChange={(e) => onRadiusChange(Number(e.target.value))}
            className="min-h-11 rounded-lg border border-[#dcdcdc] px-3.5 py-2 text-sm text-[#4d4d4d] focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
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
      <div className="flex flex-wrap items-center gap-3 py-4">
        <div className="flex w-full items-center gap-2 text-sm font-bold text-[#303030]">
          <Tag size={15} className="text-brand-600" />
          Condition
        </div>
        <div className="flex flex-wrap gap-2">
          {CONDITIONS.map((cond) => {
            const active = conditions.includes(cond);
            return (
              <button
                key={cond}
                onClick={() => onConditionToggle(cond)}
                className={`min-h-10 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
                  active
                    ? "bg-brand-600 text-white shadow-sm"
                    : "bg-white text-[#555] ring-1 ring-inset ring-[#d7d7d7] hover:ring-brand-400"
                }`}
              >
                {cond}
              </button>
            );
          })}
        </div>
      </div>

      {/* Date Posted Filter */}
      <div className="flex flex-wrap items-center gap-3 py-4">
        <div className="flex w-full items-center gap-2 text-sm font-bold text-[#303030]">
          <Calendar size={15} className="text-brand-600" />
          Date posted
        </div>
        <select
          value={dateFilter || "all"}
          onChange={(e) => onDateFilterChange(e.target.value)}
          className="min-h-11 rounded-lg border border-[#dcdcdc] px-3.5 py-2 text-sm text-[#4d4d4d] focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
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
        <div className="flex items-center justify-between py-4">
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
