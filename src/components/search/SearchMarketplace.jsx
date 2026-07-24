"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import * as Icons from "lucide-react";
import { SearchX, SlidersHorizontal, TrendingUp } from "lucide-react";
import { useApp } from "@/context/AppContext";
import FilterBar from "@/components/FilterBar";
import PaginationControls from "@/components/PaginationControls";
import ProductCard from "@/components/ProductCard";
import { ProductGridSkeleton } from "@/components/Skeleton";
import { getSearchFilterKey, getSearchFilterStateKey, isInternalFilterReflection } from "@/lib/search-filter-sync.mjs";

export default function SearchMarketplace() {
  const {
    categories,
    subcategories,
    hydrated,
    paginatedListings,
    paginatedLoading,
    paginatedHasMore,
    currentPage,
    fetchPaginatedListings,
    loadMore,
    resetPagination,
    setLastFilters,
  } = useApp();
  const router = useRouter();
  const searchParams = useSearchParams();
  const filterParamsKey = getSearchFilterKey(searchParams);
  const [showFilters, setShowFilters] = useState(true);
  const [filterState, setFilterState] = useState(() => ({
    category: searchParams.get("category") || "",
    subcategory: searchParams.get("subcategory") || "",
    minPrice: searchParams.get("min") ? Number(searchParams.get("min")) : null,
    maxPrice: searchParams.get("max") ? Number(searchParams.get("max")) : null,
    conditions: searchParams.get("cond")?.split(",").filter(Boolean) || [],
    dateFilter: searchParams.get("since") || "all",
    nearby:
      searchParams.get("lat") && searchParams.get("lng")
        ? {
            latitude: Number(searchParams.get("lat")),
            longitude: Number(searchParams.get("lng")),
          }
        : null,
    radiusKm: searchParams.get("radius") ? Number(searchParams.get("radius")) : 25,
  }));
  const { category, subcategory, minPrice, maxPrice, conditions, dateFilter, nearby, radiusKm } = filterState;
  const requestedPage = Math.max(1, Number(searchParams.get("page")) || 1);
  const initialLoad = useRef(true);
  const restoringPage = useRef(false);
  const restoreToken = useRef(0);
  const writtenPage = useRef(null);
  const internalFilterWrite = useRef(null);
  const localFilterReset = useRef(0);
  const suppressPageSync = useRef(false);
  const skipNextPageWriter = useRef(false);
  const externalFilterNavigation = useRef(null);
  const urlSyncMounted = useRef(false);
  const paginationActions = useRef({ fetchPaginatedListings, resetPagination, setLastFilters });
  paginationActions.current = { fetchPaginatedListings, resetPagination, setLastFilters };

  const q = searchParams.get("q") || "";
  const loc = searchParams.get("loc") || "All India";

  useEffect(() => {
    if (!urlSyncMounted.current) {
      urlSyncMounted.current = true;
      return;
    }
    if (isInternalFilterReflection(internalFilterWrite.current, filterParamsKey)) {
      internalFilterWrite.current = null;
      suppressPageSync.current = false;
      writtenPage.current = 1;
      skipNextPageWriter.current = true;
      return;
    }
    internalFilterWrite.current = null;
    suppressPageSync.current = false;
    localFilterReset.current = 0;
    skipNextPageWriter.current = false;
    externalFilterNavigation.current = { page: requestedPage };
    setFilterState({
      category: searchParams.get("category") || "",
      subcategory: searchParams.get("subcategory") || "",
      minPrice: searchParams.get("min") ? Number(searchParams.get("min")) : null,
      maxPrice: searchParams.get("max") ? Number(searchParams.get("max")) : null,
      conditions: searchParams.get("cond")?.split(",").filter(Boolean) || [],
      dateFilter: searchParams.get("since") || "all",
      nearby:
        searchParams.get("lat") && searchParams.get("lng")
          ? {
              latitude: Number(searchParams.get("lat")),
              longitude: Number(searchParams.get("lng")),
            }
          : null,
      radiusKm: searchParams.get("radius") ? Number(searchParams.get("radius")) : 25,
    });
  }, [filterParamsKey]);

  const patchUrl = useCallback(
    (updates, { replace = true } = {}) => {
      const params = new URLSearchParams(window.location.search);
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === undefined || value === "" || value === "all") params.delete(key);
        else params.set(key, String(value));
      });
      const url = params.size ? `/search?${params.toString()}` : "/search";
      if (replace) router.replace(url, { scroll: false });
      else router.push(url, { scroll: false });
    },
    [router]
  );

  const updateFilters = useCallback(
    (createNextState, urlUpdates) => {
      const nextState = createNextState(filterState);
      const currentParams = new URLSearchParams(window.location.search);
      const params = new URLSearchParams(currentParams);
      Object.entries({ ...urlUpdates, page: 1 }).forEach(([key, value]) => {
        if (value === null || value === undefined || value === "" || value === "all") params.delete(key);
        else params.set(key, String(value));
      });
      const semanticNoopAtPageOne =
        (Number(currentParams.get("page")) || 1) === 1 &&
        getSearchFilterStateKey(nextState) === getSearchFilterStateKey(filterState) &&
        getSearchFilterKey(params) === getSearchFilterKey(currentParams);
      if (semanticNoopAtPageOne) return;

      internalFilterWrite.current = getSearchFilterKey(params);
      localFilterReset.current += 1;
      suppressPageSync.current = true;
      setFilterState(nextState);
      router.replace(params.size ? `/search?${params.toString()}` : "/search", { scroll: false });
    },
    [filterState, router]
  );

  const filters = useMemo(
    () => ({
      category: category || undefined,
      subcategoryId: subcategory || undefined,
      q: q || undefined,
      loc: loc || undefined,
      minPrice: minPrice || undefined,
      maxPrice: maxPrice || undefined,
      conditions: conditions.length ? conditions : undefined,
      dateFilter: dateFilter !== "all" ? dateFilter : undefined,
      nearby,
      radiusKm,
    }),
    [category, subcategory, q, loc, minPrice, maxPrice, conditions, dateFilter, nearby, radiusKm]
  );

  const restoreRequestedPage = useCallback(async (targetPage, nextFilters) => {
    const token = ++restoreToken.current;
    restoringPage.current = true;
    paginationActions.current.setLastFilters(nextFilters);
    for (let page = 0; page < targetPage; page += 1) {
      await paginationActions.current.fetchPaginatedListings({ page, filters: nextFilters });
      if (token !== restoreToken.current) return;
    }
    if (token === restoreToken.current) restoringPage.current = false;
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (initialLoad.current) {
      initialLoad.current = false;
      if (requestedPage > 1) restoreRequestedPage(requestedPage, filters);
      else paginationActions.current.resetPagination(filters);
      return;
    }
    restoreToken.current += 1;
    restoringPage.current = false;
    if (localFilterReset.current > 0) {
      localFilterReset.current = 0;
      paginationActions.current.resetPagination(filters);
      return;
    }
    const externalNavigation = externalFilterNavigation.current;
    externalFilterNavigation.current = null;
    if (externalNavigation) {
      if (externalNavigation.page > 1) restoreRequestedPage(externalNavigation.page, filters);
      else paginationActions.current.resetPagination(filters);
      return;
    }
    paginationActions.current.resetPagination(filters);
    if (requestedPage !== 1) {
      writtenPage.current = 1;
      patchUrl({ page: 1 });
    }
  }, [hydrated, filters, restoreRequestedPage]);

  useEffect(() => {
    if (!hydrated || initialLoad.current) return;
    const unchangedFilterPageReflection =
      suppressPageSync.current &&
      localFilterReset.current > 0 &&
      requestedPage === 1 &&
      internalFilterWrite.current === filterParamsKey;
    if (!unchangedFilterPageReflection) return;

    internalFilterWrite.current = null;
    localFilterReset.current = 0;
    suppressPageSync.current = false;
    writtenPage.current = 1;
    skipNextPageWriter.current = true;
    restoreToken.current += 1;
    restoringPage.current = false;
    paginationActions.current.resetPagination(filters);
  }, [requestedPage, hydrated, filterParamsKey]);

  useEffect(() => {
    if (!hydrated || initialLoad.current || suppressPageSync.current || externalFilterNavigation.current) return;
    if (writtenPage.current === requestedPage) {
      writtenPage.current = null;
      return;
    }
    if (!restoringPage.current && requestedPage !== currentPage + 1) {
      restoreRequestedPage(requestedPage, filters);
    }
  }, [requestedPage, hydrated]);

  useEffect(() => {
    if (
      !hydrated ||
      initialLoad.current ||
      restoringPage.current ||
      suppressPageSync.current ||
      externalFilterNavigation.current
    )
      return;
    if (skipNextPageWriter.current) {
      skipNextPageWriter.current = false;
      return;
    }
    const loadedPage = currentPage + 1;
    if (requestedPage !== loadedPage) {
      writtenPage.current = loadedPage;
      patchUrl({ page: loadedPage });
    }
  }, [currentPage, hydrated, requestedPage, patchUrl]);

  const setCategoryFilter = (value) => {
    updateFilters((current) => ({ ...current, category: value, subcategory: "" }), {
      category: value,
      subcategory: null,
    });
  };
  const setSubcategoryFilter = (value) =>
    updateFilters((current) => ({ ...current, subcategory: value }), { subcategory: value });
  const setMin = (value) => updateFilters((current) => ({ ...current, minPrice: value }), { min: value });
  const setMax = (value) => updateFilters((current) => ({ ...current, maxPrice: value }), { max: value });
  const toggleCondition = (value) => {
    const next = conditions.includes(value) ? conditions.filter((item) => item !== value) : [...conditions, value];
    updateFilters((current) => ({ ...current, conditions: next }), { cond: next.join(",") });
  };
  const setSince = (value) => updateFilters((current) => ({ ...current, dateFilter: value }), { since: value });
  const useNearby = () =>
    navigator.geolocation?.getCurrentPosition(
      ({ coords }) => {
        const value = { latitude: coords.latitude, longitude: coords.longitude };
        updateFilters((current) => ({ ...current, nearby: value }), {
          lat: value.latitude,
          lng: value.longitude,
          radius: radiusKm,
        });
      },
      () => {},
      { enableHighAccuracy: true, timeout: 10000 }
    );
  const clearNearby = () =>
    updateFilters((current) => ({ ...current, nearby: null }), { lat: null, lng: null, radius: null });
  const setRadius = (value) =>
    updateFilters((current) => ({ ...current, radiusKm: value }), { radius: nearby ? value : null });
  const clearAll = () =>
    updateFilters(
      (current) => ({
        ...current,
        subcategory: "",
        minPrice: null,
        maxPrice: null,
        conditions: [],
        dateFilter: "all",
        nearby: null,
        radiusKm: 25,
      }),
      { subcategory: null, min: null, max: null, cond: null, since: null, lat: null, lng: null, radius: null }
    );
  const activeFilterCount =
    (minPrice || maxPrice ? 1 : 0) +
    (conditions.length ? 1 : 0) +
    (dateFilter !== "all" ? 1 : 0) +
    (nearby ? 1 : 0) +
    (subcategory ? 1 : 0);

  return (
    <div className="min-h-screen bg-[#f6f6f6] pb-10 pt-4 sm:pt-6">
      <div className="home-container">
        <div className="mb-4 rounded-2xl border border-[#e7e7e7] bg-white px-4 py-5 sm:px-6 sm:py-7">
          <p className="mb-2 text-xs font-semibold text-[#777]">Home / Browse</p>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-[#202020] sm:text-3xl">
            {q ? `Results for “${q}”` : "Explore Marketplace"}
          </h1>
          <p className="mt-1.5 text-sm leading-5 text-[#6b6b6b]">
            Browse verified community listings and find the right deal for you.
          </p>
        </div>
        <div className="flex gap-2 overflow-x-auto rounded-2xl border border-[#e7e7e7] bg-white p-3 scrollbar-hidden sm:p-4">
          <button
            type="button"
            onClick={() => setCategoryFilter("")}
            className={`inline-flex min-h-10 shrink-0 items-center rounded-full border px-4 text-sm font-semibold ${!category ? "border-brand-600 bg-brand-600 text-white" : "border-[#dedede] bg-white text-[#4c4c4c]"}`}
          >
            All
          </button>
          {categories.map((item) => {
            const Icon = Icons[item.icon] || Icons.Tag;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setCategoryFilter(item.id)}
                className={`inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-semibold ${category === item.id ? "border-brand-600 bg-brand-600 text-white" : "border-[#dedede] bg-white text-[#4c4c4c]"}`}
              >
                <Icon size={15} /> {item.label}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={() => setShowFilters((visible) => !visible)}
          className="mt-4 flex min-h-12 w-full items-center gap-2 rounded-xl border border-[#dedede] bg-white px-4 text-sm font-bold text-[#292929] shadow-sm"
          aria-expanded={showFilters}
        >
          <SlidersHorizontal size={17} className="text-brand-600" /> Filters{" "}
          {activeFilterCount > 0 && (
            <span className="rounded-full bg-brand-50 px-2 py-1 text-xs text-brand-700">
              {activeFilterCount} active
            </span>
          )}
        </button>
        {showFilters && (
          <div className="mt-3 rounded-2xl border border-[#e3e3e3] bg-white p-4 sm:p-5">
            <FilterBar
              subcategories={subcategories.filter((item) => !category || item.categoryId === category)}
              subcategoryId={subcategory}
              onSubcategoryChange={setSubcategoryFilter}
              minPrice={minPrice}
              maxPrice={maxPrice}
              conditions={conditions}
              dateFilter={dateFilter}
              nearby={nearby}
              radiusKm={radiusKm}
              onMinPriceChange={setMin}
              onMaxPriceChange={setMax}
              onConditionToggle={toggleCondition}
              onDateFilterChange={setSince}
              onUseNearby={useNearby}
              onClearNearby={clearNearby}
              onRadiusChange={setRadius}
              onClearAll={clearAll}
            />
          </div>
        )}
        <section className="mt-5 rounded-2xl border border-[#e3e3e3] bg-white p-4 sm:p-5">
          <h2 className="mb-5 flex items-center gap-2 border-b border-[#ededed] pb-4 font-display text-xl font-bold text-[#222]">
            <TrendingUp size={19} className="text-brand-600" /> Fresh listings
          </h2>
          {!hydrated || (paginatedLoading && !paginatedListings.length) ? (
            <ProductGridSkeleton />
          ) : !paginatedListings.length ? (
            <div className="flex flex-col items-center gap-3 py-20 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#f3f3f3] text-[#999]">
                <SearchX size={24} />
              </span>
              <p className="text-sm text-ink-500">
                No listings match your search. Try adjusting your filters or category.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
                <ProductCardList listings={paginatedListings} />
              </div>
              <PaginationControls
                loading={paginatedLoading}
                hasMore={paginatedHasMore}
                onLoadMore={loadMore}
                count={paginatedListings.length}
              />
            </>
          )}
        </section>
      </div>
    </div>
  );
}

function ProductCardList({ listings }) {
  return listings.map((listing) => <ProductCard key={listing.id} listing={listing} />);
}
