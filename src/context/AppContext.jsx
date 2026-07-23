"use client";

import { createContext, useContext, useEffect, useMemo, useState, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";

const AppContext = createContext(null);
const CURRENT_USER_KEY = "sellspoint_current_user_id";
const LEGACY_EMAIL_ACCOUNTS_KEY = "sellspoint_email_accounts";

export const CATEGORIES = [
  { id: "mobiles", label: "Mobiles", icon: "Smartphone" },
  { id: "laptops", label: "Laptops", icon: "Laptop" },
  { id: "vehicles", label: "Vehicles", icon: "Car" },
  { id: "furniture", label: "Furniture", icon: "Sofa" },
  { id: "fashion", label: "Fashion", icon: "Shirt" },
  { id: "gaming", label: "Gaming", icon: "Gamepad2" },
  { id: "appliances", label: "Appliances", icon: "WashingMachine" },
  { id: "cameras", label: "Cameras", icon: "Camera" },
  { id: "books", label: "Books", icon: "BookOpen" },
  { id: "realestate", label: "Real Estate", icon: "Building2" },
];

export const CONDITIONS = ["New", "Like New", "Excellent", "Good", "Fair"];

function mapCategory(row) {
  return {
    id: row.id,
    label: row.label,
    icon: row.icon,
    imageUrl: row.image_url || "",
    sortOrder: row.sort_order,
  };
}
function mapSubcategory(row) {
  return { id: row.id, categoryId: row.category_id, label: row.label, sortOrder: row.sort_order || 0 };
}

// ----- DB row <-> app object mapping -----

function mapProfile(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email || "",
    avatar: row.avatar_url,
    verified: row.verified,
    isAdmin: row.is_admin,
    isBanned: row.is_banned,
    location: row.location || "",
    latitude: row.latitude,
    longitude: row.longitude,
    bio: row.bio || "",
    joinedAt: row.joined_at ? new Date(row.joined_at).getTime() : Date.now(),
    rating: Number(row.rating) || 0,
    ratingCount: row.rating_count || 0,
  };
}

function mapListing(row) {
  return {
    id: row.id,
    sellerId: row.seller_id,
    title: row.title,
    description: row.description || "",
    price: Number(row.price) || 0,
    originalPrice: Number(row.original_price) || 0,
    category: row.category,
    subcategoryId: row.subcategory_id || null,
    specifications: row.specifications || {},
    condition: row.condition,
    images: row.images || [],
    video: row.video_url,
    location: row.location || "",
    latitude: row.latitude,
    longitude: row.longitude,
    featured: row.featured,
    featuredStatus: row.featured_status,
    status: row.status,
    expiresAt: row.expires_at ? new Date(row.expires_at).getTime() : null,
    moderationNote: row.moderation_note || "",
    distanceKm: typeof row.distance_km === "number" ? row.distance_km : null,
    createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
    views: row.views || 0,
    promotionPrice: row.promotion_price_inr == null ? null : Number(row.promotion_price_inr),
    promotionRequestedAt: row.promotion_requested_at ? new Date(row.promotion_requested_at).getTime() : null,
    promotionQuotedAt: row.promotion_quoted_at ? new Date(row.promotion_quoted_at).getTime() : null,
    promotionPaidAt: row.promotion_paid_at ? new Date(row.promotion_paid_at).getTime() : null,
    promotionPaymentReference: row.promotion_payment_reference || null,
  };
}

function mapMessage(row) {
  return {
    id: row.id,
    senderId: row.sender_id,
    text: row.text || "",
    image: row.image_url,
    createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
  };
}

function mapChat(row, messages = []) {
  return {
    id: row.id,
    listingId: row.listing_id,
    participantIds: row.participant_ids || [],
    messages,
  };
}

function mapReport(row) {
  return {
    id: row.id,
    type: row.type,
    targetId: row.target_id,
    reporterId: row.reporter_id,
    reason: row.reason,
    status: row.status,
    resolutionNote: row.resolution_note || "",
    resolutionAction: row.resolution_action || "",
    resolvedBy: row.resolved_by || null,
    resolvedAt: row.resolved_at ? new Date(row.resolved_at).getTime() : null,
    createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
  };
}

function mapNotification(row) {
  return {
    id: row.id,
    recipientId: row.recipient_id,
    actorId: row.actor_id,
    type: row.type,
    entityId: row.entity_id,
    entityType: row.entity_type,
    read: row.read,
    createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
  };
}

function mapReview(row) {
  return {
    id: row.id,
    reviewerId: row.reviewer_id,
    reviewedUserId: row.reviewed_user_id,
    rating: Number(row.rating) || 0,
    comment: row.comment || "",
    createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
    updatedAt: row.updated_at ? new Date(row.updated_at).getTime() : Date.now(),
  };
}

const LISTING_FIELD_MAP = {
  title: "title",
  description: "description",
  price: "price",
  originalPrice: "original_price",
  category: "category",
  subcategoryId: "subcategory_id",
  specifications: "specifications",
  condition: "condition",
  images: "images",
  video: "video_url",
  location: "location",
  latitude: "latitude",
  longitude: "longitude",
  featured: "featured",
  featuredStatus: "featured_status",
  status: "status",
  expiresAt: "expires_at",
  moderationNote: "moderation_note",
  views: "views",
};

function toListingRow(updates) {
  const row = {};
  for (const [key, value] of Object.entries(updates)) {
    const column = LISTING_FIELD_MAP[key];
    if (column) row[column] = value;
  }
  return row;
}

const PROFILE_FIELD_MAP = {
  name: "name",
  email: "email",
  avatar: "avatar_url",
  location: "location",
  latitude: "latitude",
  longitude: "longitude",
  bio: "bio",
  verified: "verified",
};

function toProfileRow(updates) {
  const row = {};
  for (const [key, value] of Object.entries(updates)) {
    const column = PROFILE_FIELD_MAP[key];
    if (column) row[column] = value;
  }
  return row;
}

export function AppProvider({ children }) {
  const [users, setUsers] = useState([]);
  const [listings, setListings] = useState([]);
  const [categories, setCategories] = useState(CATEGORIES);
  const [subcategories, setSubcategories] = useState([]);
  const [chats, setChats] = useState([]);
  const chatsRef = useRef(chats);
  useEffect(() => {
    chatsRef.current = chats;
  }, [chats]);
  const [reports, setReports] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [favoriteIds, setFavoriteIds] = useState(new Set());
  const [currentUser, setCurrentUser] = useState(null);
  const [pendingOtp, setPendingOtp] = useState(null);
  const [hydrated, setHydrated] = useState(false);
  const [userResolved, setUserResolved] = useState(false);
  const [blockedUsers, setBlockedUsersState] = useState([]);
  const [blockRows, setBlockRows] = useState([]);
  const [chatReads, setChatReads] = useState({});
  const chatReadsRef = useRef(chatReads);
  useEffect(() => {
    chatReadsRef.current = chatReads;
  }, [chatReads]);
  const [announcements, setAnnouncements] = useState([]);
  const [publicAnnouncements, setPublicAnnouncements] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [reviewsByUser, setReviewsByUser] = useState({});

  const [paginatedListings, setPaginatedListings] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [paginatedLoading, setPaginatedLoading] = useState(false);
  const [paginatedHasMore, setPaginatedHasMore] = useState(true);
  const [lastFilters, setLastFilters] = useState({});
  const ITEMS_PER_PAGE = 20;
  const queryIdRef = useRef(0);

  const fetchCategories = useCallback(async () => {
    const res = await fetch("/api/admin/categories");
    if (res.ok) {
      const json = await res.json();
      if (json.categories && json.categories.length > 0) {
        setCategories(json.categories.map(mapCategory));
      }
      setSubcategories((json.subcategories || []).map(mapSubcategory));
    }
  }, []);

  // ----- initial public data -----
  useEffect(() => {
    (async () => {
      await fetch("/api/listings/expiry", { method: "POST" }).catch(() => {});
      const [profileRes, listingsRes] = await Promise.all([
        supabase.from("profiles").select("*").order("joined_at", { ascending: true }),
        supabase.from("listings").select("*").order("created_at", { ascending: false }),
      ]);
      setUsers((profileRes.data || []).map(mapProfile));
      setListings((listingsRes.data || []).map(mapListing));
      fetchCategories();
      fetchAnnouncements();
      setHydrated(true);
    })();
  }, [fetchCategories]);

  const fetchPaginatedListings = useCallback(
    async ({ page = 0, filters = {} } = {}) => {
      const queryId = ++queryIdRef.current;
      setPaginatedLoading(true);
      try {
        const from = page * ITEMS_PER_PAGE;
        const to = from + ITEMS_PER_PAGE - 1;

        if (page === 0) {
          setLastFilters(filters);
        }

        let dateCutoff = null;
        if (filters.dateFilter && filters.dateFilter !== "all") {
          const now = new Date();
          if (filters.dateFilter === "24h") dateCutoff = new Date(now - 1 * 24 * 60 * 60 * 1000);
          else if (filters.dateFilter === "7d") dateCutoff = new Date(now - 7 * 24 * 60 * 60 * 1000);
          else if (filters.dateFilter === "30d") dateCutoff = new Date(now - 30 * 24 * 60 * 60 * 1000);
        }

        if (filters.nearby?.latitude && filters.nearby?.longitude) {
          const { data, error } = await supabase.rpc("search_nearby_listings", {
            user_lat: filters.nearby.latitude,
            user_lng: filters.nearby.longitude,
            radius_km: filters.radiusKm || 25,
            search_query: filters.q || null,
            category_filter: filters.category || null,
            subcategory_filter: filters.subcategoryId || null,
            min_price: filters.minPrice || null,
            max_price: filters.maxPrice || null,
            condition_filters: filters.conditions?.length ? filters.conditions : null,
            date_cutoff: dateCutoff ? dateCutoff.toISOString() : null,
            result_limit: ITEMS_PER_PAGE + 1,
            result_offset: from,
          });
          if (queryId !== queryIdRef.current) return;
          if (error) {
            setPaginatedHasMore(false);
            return;
          }
          const pageRows = data || [];
          const mapped = pageRows.slice(0, ITEMS_PER_PAGE).map(mapListing);
          if (page === 0) setPaginatedListings(mapped);
          else setPaginatedListings((prev) => [...prev, ...mapped]);
          setCurrentPage(page);
          setTotalCount(page === 0 ? mapped.length : totalCount + mapped.length);
          setPaginatedHasMore(pageRows.length > ITEMS_PER_PAGE);
          return;
        }

        let query = supabase
          .from("listings")
          .select("*", { count: "exact" })
          .eq("status", "active")
          .gt("expires_at", new Date().toISOString())
          .order("featured", { ascending: false })
          .order("created_at", { ascending: false });

        if (filters.category) {
          query = query.eq("category", filters.category);
        }
        if (filters.subcategoryId) query = query.eq("subcategory_id", filters.subcategoryId);
        if (filters.q) {
          query = query.ilike("title", `%${filters.q}%`);
        }
        if (filters.loc && filters.loc !== "All India") {
          query = query.eq("location", filters.loc);
        }
        if (filters.minPrice) {
          query = query.gte("price", filters.minPrice);
        }
        if (filters.maxPrice) {
          query = query.lte("price", filters.maxPrice);
        }
        if (filters.conditions && filters.conditions.length > 0) {
          query = query.in("condition", filters.conditions);
        }
        if (dateCutoff) query = query.gte("created_at", dateCutoff.toISOString());

        const { data, count, error } = await query.range(from, to);
        if (queryId !== queryIdRef.current) return;
        if (error) {
          setPaginatedHasMore(false);
          return;
        }

        const mapped = (data || []).map(mapListing);
        if (page === 0) {
          setPaginatedListings(mapped);
        } else {
          setPaginatedListings((prev) => [...prev, ...mapped]);
        }
        setCurrentPage(page);
        setTotalCount(count || 0);
        setPaginatedHasMore(from + mapped.length < (count || 0));
      } finally {
        if (queryId === queryIdRef.current) {
          setPaginatedLoading(false);
        }
      }
    },
    [totalCount]
  );

  const loadMore = useCallback(() => {
    if (!paginatedLoading && paginatedHasMore) {
      fetchPaginatedListings({ page: currentPage + 1, filters: lastFilters });
    }
  }, [paginatedLoading, paginatedHasMore, currentPage, lastFilters, fetchPaginatedListings]);

  const resetPagination = useCallback(
    (filters = {}) => {
      setPaginatedListings([]);
      setPaginatedHasMore(true);
      fetchPaginatedListings({ page: 0, filters });
    },
    [fetchPaginatedListings]
  );

  // ----- resolve the regular phone-authenticated user -----
  useEffect(() => {
    (async () => {
      window.localStorage.removeItem(LEGACY_EMAIL_ACCOUNTS_KEY);
      const storedId = window.localStorage.getItem(CURRENT_USER_KEY);
      if (!storedId) {
        setUserResolved(true);
        return;
      }
      const { data, error } = await supabase.from("profiles").select("*").eq("id", storedId).single();
      if (error || !data || !data.phone || data.is_banned) {
        window.localStorage.removeItem(CURRENT_USER_KEY);
      } else {
        setCurrentUser(mapProfile(data));
      }
      setUserResolved(true);
    })();
  }, []);

  const fetchUserChats = useCallback(async (userId) => {
    const { data: chatRows } = await supabase
      .from("chats")
      .select("*")
      .contains("participant_ids", [userId]);
    if (!chatRows || chatRows.length === 0) {
      setChats([]);
      return;
    }
    const chatIds = chatRows.map((c) => c.id);
    const { data: msgRows } = await supabase
      .from("messages")
      .select("*")
      .in("chat_id", chatIds)
      .order("created_at", { ascending: true });
    setChats(
      chatRows.map((c) =>
        mapChat(c, (msgRows || []).filter((m) => m.chat_id === c.id).map(mapMessage))
      )
    );
  }, []);

  const fetchFavorites = useCallback(async (userId) => {
    const { data } = await supabase.from("favorites").select("listing_id").eq("user_id", userId);
    setFavoriteIds(new Set((data || []).map((r) => r.listing_id)));
  }, []);

  const fetchReports = useCallback(async (actorId) => {
    const res = await fetch("/api/admin/reports");
    if (!res.ok) {
      setReports([]);
      return;
    }
    const json = await res.json();
    setReports((json.reports || []).map(mapReport));
  }, []);

  const addCategory = useCallback(
    async (category) => {
      if (!currentUser) return { success: false, error: "Not authenticated" };
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actorId: currentUser.id, action: "create", category }),
      });
      if (!res.ok) {
        const json = await res.json();
        return { success: false, error: json.error };
      }
      await fetchCategories();
      return { success: true };
    },
    [currentUser, fetchCategories]
  );

  const updateCategory = useCallback(
    async (category) => {
      if (!currentUser) return { success: false, error: "Not authenticated" };
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actorId: currentUser.id, action: "update", category }),
      });
      if (!res.ok) {
        const json = await res.json();
        return { success: false, error: json.error };
      }
      await fetchCategories();
      return { success: true };
    },
    [currentUser, fetchCategories]
  );

  const deleteCategory = useCallback(
    async (id) => {
      if (!currentUser) return { success: false, error: "Not authenticated" };
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actorId: currentUser.id, action: "delete", category: { id } }),
      });
      if (!res.ok) {
        const json = await res.json();
        return { success: false, error: json.error };
      }
      await fetchCategories();
      return { success: true };
    },
    [currentUser, fetchCategories]
  );

  const mutateSubcategory = useCallback(async (action, subcategory) => {
    if (!currentUser) return { success: false, error: "Not authenticated" };
    const res = await fetch("/api/admin/categories", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actorId: currentUser.id, action, subcategory }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return { success: false, error: json.error || "Unable to update subcategory" };
    await fetchCategories();
    return { success: true };
  }, [currentUser, fetchCategories]);

  const fetchAnnouncements = useCallback(async () => {
    const res = await fetch("/api/announcements");
    if (res.ok) {
      const json = await res.json();
      setPublicAnnouncements(json.announcements || []);
    }
  }, []);

  const fetchAdminAnnouncements = useCallback(async (actorId) => {
    const res = await fetch("/api/admin/announcements");
    if (res.ok) {
      const json = await res.json();
      setAnnouncements(json.announcements || []);
    }
  }, []);

  const createAnnouncement = useCallback(
    async ({ title, body }) => {
      if (!currentUser) return { success: false, error: "Not authenticated" };
      const res = await fetch("/api/admin/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actorId: currentUser.id, action: "create", announcement: { title, body } }),
      });
      if (!res.ok) {
        const json = await res.json();
        return { success: false, error: json.error };
      }
      const json = await res.json();
      await fetchAdminAnnouncements(currentUser.id);
      await fetchAnnouncements();
      return { success: true, notificationsCreated: json.notificationsCreated || 0 };
    },
    [currentUser, fetchAdminAnnouncements, fetchAnnouncements]
  );

  const deactivateAnnouncement = useCallback(
    async (id) => {
      if (!currentUser) return { success: false, error: "Not authenticated" };
      const res = await fetch("/api/admin/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actorId: currentUser.id, action: "deactivate", announcement: { id } }),
      });
      if (!res.ok) {
        const json = await res.json();
        return { success: false, error: json.error };
      }
      await fetchAdminAnnouncements(currentUser.id);
      await fetchAnnouncements();
      return { success: true };
    },
    [currentUser, fetchAdminAnnouncements, fetchAnnouncements]
  );

  const deleteAnnouncement = useCallback(
    async (id) => {
      if (!currentUser) return { success: false, error: "Not authenticated" };
      const res = await fetch("/api/admin/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actorId: currentUser.id, action: "delete", announcement: { id } }),
      });
      if (!res.ok) {
        const json = await res.json();
        return { success: false, error: json.error };
      }
      await fetchAdminAnnouncements(currentUser.id);
      await fetchAnnouncements();
      return { success: true };
    },
    [currentUser, fetchAdminAnnouncements, fetchAnnouncements]
  );

  const fetchAnalytics = useCallback(async (actorId) => {
    const res = await fetch("/api/admin/analytics");
    if (res.ok) {
      const json = await res.json();
      setAnalytics(json);
    }
  }, []);

  const createNotification = useCallback(
    async (recipientId, actorId, type, entityId, entityType) => {
      await supabase.from("notifications").insert({
        recipient_id: recipientId,
        actor_id: actorId,
        type,
        entity_id: entityId,
        entity_type: entityType,
        read: false,
      });
    },
    []
  );

  const fetchReviewsForUser = useCallback(async (userId) => {
    if (!userId) return [];
    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .eq("reviewed_user_id", userId)
      .order("created_at", { ascending: false });
    if (error) {
      setReviewsByUser((prev) => ({ ...prev, [userId]: [] }));
      return [];
    }
    const mapped = (data || []).map(mapReview);
    setReviewsByUser((prev) => ({ ...prev, [userId]: mapped }));
    return mapped;
  }, []);

  const refreshUserRating = useCallback(async (userId, reviews = null) => {
    const sourceReviews = reviews || (await fetchReviewsForUser(userId));
    const ratingCount = sourceReviews.length;
    const rating =
      ratingCount > 0
        ? sourceReviews.reduce((total, review) => total + review.rating, 0) / ratingCount
        : 0;

    const { data, error } = await supabase
      .from("profiles")
      .update({ rating, rating_count: ratingCount })
      .eq("id", userId)
      .select()
      .single();

    if (error || !data) return null;
    const mapped = mapProfile(data);
    setUsers((prev) => prev.map((user) => (user.id === mapped.id ? mapped : user)));
    if (currentUser?.id === mapped.id) setCurrentUser(mapped);
    return mapped;
  }, [currentUser, fetchReviewsForUser]);

  const submitReview = useCallback(
    async (reviewedUserId, rating, comment) => {
      if (!currentUser) return { success: false, error: "Not authenticated" };
      if (!currentUser.verified) return { success: false, error: "A verified account is required before leaving a review." };
      if (currentUser.id === reviewedUserId) return { success: false, error: "You cannot review yourself." };

      const safeRating = Math.max(1, Math.min(5, Number(rating) || 0));
      if (!safeRating) return { success: false, error: "Choose a rating." };

      const { error } = await supabase.from("reviews").upsert(
        {
          reviewer_id: currentUser.id,
          reviewed_user_id: reviewedUserId,
          rating: safeRating,
          comment: comment?.trim() || "",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "reviewer_id,reviewed_user_id" }
      );
      if (error) return { success: false, error: error.message };

      const reviews = await fetchReviewsForUser(reviewedUserId);
      await refreshUserRating(reviewedUserId, reviews);
      return { success: true };
    },
    [currentUser, fetchReviewsForUser, refreshUserRating]
  );

  const fetchNotifications = useCallback(async (userId) => {
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("recipient_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);
    setNotifications((data || []).map(mapNotification));
  }, []);

  const fetchChatReads = useCallback(async (userId) => {
    const { data } = await supabase
      .from("chat_reads")
      .select("chat_id, last_read_at")
      .eq("user_id", userId);
    const map = {};
    (data || []).forEach((r) => {
      map[r.chat_id] = new Date(r.last_read_at).getTime();
    });
    setChatReads(map);
  }, []);

  const fetchBlocks = useCallback(async (userId) => {
    const res = await fetch(`/api/blocks?actorId=${userId}`);
    if (!res.ok) {
      setBlockRows([]);
      setBlockedUsersState([]);
      return;
    }
    const json = await res.json();
    const rows = json.blocks || [];
    setBlockRows(rows);
    setBlockedUsersState(rows.filter((row) => row.blocker_id === userId).map((row) => row.blocked_id));
  }, []);

  const markChatAsRead = useCallback(
    async (chatId) => {
      if (!currentUser) return;
      const now = new Date().toISOString();
      const existing = chatReadsRef.current[chatId];
      if (existing) {
        await supabase
          .from("chat_reads")
          .update({ last_read_at: now })
          .eq("user_id", currentUser.id)
          .eq("chat_id", chatId);
      } else {
        await supabase.from("chat_reads").insert({
          user_id: currentUser.id,
          chat_id: chatId,
          last_read_at: now,
        });
      }
      setChatReads((prev) => ({ ...prev, [chatId]: Date.now() }));
    },
    [currentUser]
  );

  const markNotificationRead = useCallback(async (id) => {
    await supabase.from("notifications").update({ read: true }).eq("id", id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const markAllNotificationsRead = useCallback(async () => {
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
    if (unreadIds.length > 0) {
      await supabase.from("notifications").update({ read: true }).in("id", unreadIds);
    }
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, [notifications]);

  useEffect(() => {
    if (currentUser) {
      fetchUserChats(currentUser.id);
      fetchFavorites(currentUser.id);
    } else {
      setChats([]);
      setFavoriteIds(new Set());
    }
  }, [currentUser, fetchUserChats, fetchFavorites]);

  useEffect(() => {
    if (currentUser?.isAdmin) {
      fetchReports(currentUser.id);
      fetchAdminAnnouncements(currentUser.id);
      fetchAnalytics(currentUser.id);
    } else {
      setReports([]);
      setAnnouncements([]);
      setAnalytics(null);
    }
  }, [currentUser, fetchReports, fetchAdminAnnouncements, fetchAnalytics]);

  useEffect(() => {
    if (currentUser) {
      fetchNotifications(currentUser.id);
    } else {
      setNotifications([]);
    }
  }, [currentUser, fetchNotifications]);

  useEffect(() => {
    if (currentUser) {
      fetchChatReads(currentUser.id);
    } else {
      setChatReads({});
    }
  }, [currentUser, fetchChatReads]);

  useEffect(() => {
    if (!currentUser) return;
    const channel = supabase
      .channel(`notifications-${currentUser.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `recipient_id=eq.${currentUser.id}` },
        (payload) => {
          const mapped = mapNotification(payload.new);
          setNotifications((prev) => (prev.some((n) => n.id === mapped.id) ? prev : [mapped, ...prev]));
          if (mapped.entityType === "announcement") {
            fetchAnnouncements();
          }
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser, fetchAnnouncements]);

  useEffect(() => {
    if (!currentUser) {
      setBlockedUsersState([]);
      setBlockRows([]);
      return;
    }
    fetchBlocks(currentUser.id);
    const raw = window.localStorage.getItem(`sellspoint_blocked_${currentUser.id}`);
    const legacyIds = raw ? JSON.parse(raw) : [];
    legacyIds.forEach((blockedId) => {
      fetch("/api/blocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actorId: currentUser.id, blockedId }),
      }).then(() => fetchBlocks(currentUser.id));
    });
  }, [currentUser, fetchBlocks]);

  const getUserById = useCallback((id) => users.find((u) => u.id === id) || null, [users]);
  const getListingById = useCallback((id) => listings.find((l) => l.id === id) || null, [listings]);

  // ----- Auth (mock OTP, real profile persistence) -----
  const sendOtp = useCallback((phone) => {
    const code = "123456";
    setPendingOtp({ phone, code });
    return code;
  }, []);

  const verifyOtp = useCallback(async (phone, code, name) => {
    if (!pendingOtp || pendingOtp.phone !== phone || pendingOtp.code !== code) return { success: false, message: "Invalid OTP. Try 123456." };
    const { data: existing } = await supabase.from("profiles").select("*").eq("phone", phone).maybeSingle();
    let profileRow = existing;
    if (!profileRow) {
      const { data: inserted, error } = await supabase.from("profiles").insert({ phone, name: name || "New User", avatar_url: `https://i.pravatar.cc/150?u=${encodeURIComponent(phone)}`, location: "India", verified: true }).select().single();
      if (error) return { success: false, message: error.message };
      profileRow = inserted;
    } else if (!profileRow.verified) {
      const { data: updated, error } = await supabase.from("profiles").update({ verified: true }).eq("id", profileRow.id).select().single();
      if (error) return { success: false, message: error.message };
      profileRow = updated;
    }
    if (profileRow.is_banned) return { success: false, message: "This account has been banned by admin." };
    const mapped = mapProfile(profileRow);
    setUsers((prev) => (prev.some((user) => user.id === mapped.id) ? prev : [...prev, mapped]));
    setCurrentUser(mapped);
    window.localStorage.setItem(CURRENT_USER_KEY, mapped.id);
    setPendingOtp(null);
    return { success: true, user: mapped };
  }, [pendingOtp]);

  const activateAdminSession = useCallback((profile) => setCurrentUser(mapProfile(profile)), []);

  const logout = useCallback(() => {
    window.localStorage.removeItem(CURRENT_USER_KEY);
    fetch("/api/auth/admin-logout", { method: "POST" }).catch(() => {});
    setCurrentUser(null);
  }, []);

  const updateProfile = useCallback(
    async (updates) => {
      if (!currentUser) return { success: false, error: "Not logged in." };
      const safe = {};
      for (const key of ["name", "avatar", "bio", "location"]) {
        if (key in updates) safe[key] = updates[key];
      }
      const row = toProfileRow(safe);
      const { data, error } = await supabase
        .from("profiles")
        .update(row)
        .eq("id", currentUser.id)
        .select()
        .single();
      if (error) return { success: false, error: error.message };
      const mapped = mapProfile(data);
      setCurrentUser(mapped);
      setUsers((prev) => prev.map((u) => (u.id === mapped.id ? mapped : u)));
      return { success: true };
    },
    [currentUser]
  );

  // ----- Listings -----
  const addListing = useCallback(
    async (data) => {
      if (!currentUser) return null;
      if (!currentUser.verified) return null;
      const res = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actorId: currentUser.id, action: "create", listing: data }),
      });
      if (!res.ok) return null;
      const json = await res.json();
      const mapped = mapListing(json.listing);
      setListings((prev) => [mapped, ...prev]);
      return mapped;
    },
    [currentUser]
  );

  const updateListing = useCallback(
    async (id, updates, options = {}) => {
      if (!currentUser && !options.skipOwnershipCheck) return { success: false, error: "Not authenticated" };
      if (!options.skipOwnershipCheck) {
        const existing = listings.find((l) => l.id === id);
        if (!existing || existing.sellerId !== currentUser.id) return { success: false, error: "Not authorized" };
      }
      const row = toListingRow(updates);
      const res = await fetch("/api/listings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actorId: currentUser?.id,
          listingId: id,
          action: "update",
          skipOwnershipCheck: options.skipOwnershipCheck,
          updates: row,
        }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        return { success: false, error: json.error || "Unable to update listing" };
      }
      const json = await res.json();
      const mapped = mapListing(json.listing);
      setListings((prev) => prev.map((l) => (l.id === id ? mapped : l)));
      return { success: true };
    },
    [currentUser, listings]
  );

  const deleteListing = useCallback(async (id) => {
    if (!currentUser) return;
    const res = await fetch("/api/listings", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actorId: currentUser.id, listingId: id }),
    });
    if (!res.ok) return;
    setListings((prev) => prev.filter((l) => l.id !== id));
  }, [currentUser]);

  const renewListing = useCallback(async (id) => {
    if (!currentUser) return { success: false, error: "Not authenticated" };
    const res = await fetch("/api/listings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actorId: currentUser.id, listingId: id, action: "renew" }),
    });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      return { success: false, error: json.error || "Unable to renew listing" };
    }
    const json = await res.json();
    const mapped = mapListing(json.listing);
    setListings((prev) => prev.map((l) => (l.id === id ? mapped : l)));
    return { success: true };
  }, [currentUser]);

  const markAsSold = useCallback(
    async (id) => {
      const result = await updateListing(id, { status: "sold" });
      if (result?.success) {
        const { data: favs } = await supabase
          .from("favorites")
          .select("user_id")
          .eq("listing_id", id);
        if (favs && currentUser) {
          for (const fav of favs) {
            if (fav.user_id !== currentUser.id) {
              await createNotification(fav.user_id, currentUser.id, "listing_sold", id, "listing");
            }
          }
        }
      }
      return result;
    },
    [updateListing, currentUser, createNotification]
  );

  const requestFeatured = useCallback(
    (id) => updateListing(id, { featured: false, featuredStatus: "pending" }),
    [updateListing]
  );

  const completeMockPromotionPayment = useCallback(async (id) => {
    if (!currentUser) return { success: false, error: "Not authenticated" };
    const res = await fetch("/api/listings/promotion-payment", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actorId: currentUser.id, listingId: id }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return { success: false, error: json.error || "Mock payment failed" };
    const mapped = mapListing(json.listing);
    setListings((prev) => prev.map((listing) => listing.id === id ? mapped : listing));
    return { success: true, payment: json.payment };
  }, [currentUser]);

  const incrementViews = useCallback(
    (id) => {
      const listing = listings.find((l) => l.id === id);
      if (!listing) return;
      supabase.from("listings").update({ views: (listing.views || 0) + 1 }).eq("id", id).then(() => {});
    },
    [listings]
  );

  // ----- Favorites -----
  const toggleFavorite = useCallback(
    async (listingId) => {
      if (!currentUser) return;
      const exists = favoriteIds.has(listingId);
      if (exists) {
        await supabase
          .from("favorites")
          .delete()
          .eq("user_id", currentUser.id)
          .eq("listing_id", listingId);
        setFavoriteIds((prev) => {
          const next = new Set(prev);
          next.delete(listingId);
          return next;
        });
      } else {
        await supabase.from("favorites").insert({ user_id: currentUser.id, listing_id: listingId });
        setFavoriteIds((prev) => new Set(prev).add(listingId));
      }
    },
    [currentUser, favoriteIds]
  );

  const isFavorite = useCallback((listingId) => favoriteIds.has(listingId), [favoriteIds]);

  const favoriteListings = useMemo(
    () => listings.filter((l) => favoriteIds.has(l.id)),
    [listings, favoriteIds]
  );

  // ----- Chat -----
  const getOrCreateChat = useCallback(
    async (listingId, otherUserId) => {
      if (!currentUser) return null;
      if (!currentUser.verified) return null;
      const existingLocal = chats.find(
        (c) =>
          c.listingId === listingId &&
          c.participantIds.includes(currentUser.id) &&
          c.participantIds.includes(otherUserId)
      );
      if (existingLocal) return existingLocal;

      const { data: existingRow } = await supabase
        .from("chats")
        .select("*")
        .eq("listing_id", listingId)
        .contains("participant_ids", [currentUser.id, otherUserId])
        .maybeSingle();

      if (existingRow) {
        const mapped = mapChat(existingRow, []);
        setChats((prev) => (prev.some((c) => c.id === mapped.id) ? prev : [...prev, mapped]));
        return mapped;
      }

      const { data: inserted, error } = await supabase
        .from("chats")
        .insert({ listing_id: listingId, participant_ids: [currentUser.id, otherUserId] })
        .select()
        .single();
      if (error) return null;
      const mapped = mapChat(inserted, []);
      setChats((prev) => [...prev, mapped]);
      return mapped;
    },
    [currentUser, chats]
  );

  const sendMessage = useCallback(
    async (chatId, text, image) => {
      if (!currentUser) return;
      const chat = chatsRef.current.find((c) => c.id === chatId);
      const recipientIds = chat?.participantIds.filter((pid) => pid !== currentUser.id) || [];
      const blocked = recipientIds.some((recipientId) =>
        blockRows.some(
          (row) =>
            (row.blocker_id === currentUser.id && row.blocked_id === recipientId) ||
            (row.blocker_id === recipientId && row.blocked_id === currentUser.id)
        )
      );
      if (blocked) return;
      const { data, error } = await supabase
        .from("messages")
        .insert({ chat_id: chatId, sender_id: currentUser.id, text: text || "", image_url: image || null })
        .select()
        .single();
      if (error) return;
      const mapped = mapMessage(data);
      setChats((prev) =>
        prev.map((c) =>
          c.id === chatId
            ? { ...c, messages: c.messages.some((m) => m.id === mapped.id) ? c.messages : [...c.messages, mapped] }
            : c
        )
      );
      if (chat) {
        for (const recipientId of recipientIds) {
          await createNotification(recipientId, currentUser.id, "message", chatId, "chat");
        }
      }
      return mapped;
    },
    [currentUser, createNotification, blockRows]
  );

  const appendIncomingMessage = useCallback((chatId, row) => {
    const mapped = mapMessage(row);
    setChats((prev) =>
      prev.map((c) =>
        c.id === chatId
          ? { ...c, messages: c.messages.some((m) => m.id === mapped.id) ? c.messages : [...c.messages, mapped] }
          : c
      )
    );
  }, []);

  const userChats = useMemo(() => {
    if (!currentUser) return [];
    return chats
      .filter((c) => c.participantIds.includes(currentUser.id))
      .sort((a, b) => {
        const aLast = a.messages[a.messages.length - 1]?.createdAt || 0;
        const bLast = b.messages[b.messages.length - 1]?.createdAt || 0;
        return bLast - aLast;
      });
  }, [currentUser, chats]);

  const getUnreadCount = useCallback(
    (chatId) => {
      const lastRead = chatReads[chatId] || 0;
      const chat = chats.find((c) => c.id === chatId);
      if (!chat) return 0;
      return chat.messages.filter(
        (m) => m.createdAt > lastRead && m.senderId !== currentUser?.id
      ).length;
    },
    [chatReads, chats, currentUser]
  );

  const unreadMessageCount = useMemo(() => {
    if (!currentUser) return 0;
    return userChats.reduce((total, chat) => {
      const lastRead = chatReads[chat.id] || 0;
      return total + chat.messages.filter(
        (m) => m.createdAt > lastRead && m.senderId !== currentUser.id
      ).length;
    }, 0);
  }, [currentUser, userChats, chatReads]);

  // ----- Reports & moderation -----
  const reportContent = useCallback(
    async (type, targetId, reason) => {
      if (!currentUser) return;
      await supabase
        .from("reports")
        .insert({ type, target_id: targetId, reporter_id: currentUser.id, reason, status: "open" });
    },
    [currentUser]
  );

  const resolveReport = useCallback(
    async (id, action = "resolve", note = "") => {
      if (!currentUser) return;
      const res = await fetch("/api/admin/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actorId: currentUser.id, reportId: id, action, note }),
      });
      if (!res.ok) return { success: false, error: (await res.json().catch(() => ({}))).error || "Resolution failed" };
      setReports((prev) => prev.map((r) => (r.id === id ? { ...r, status: "resolved", resolutionNote: note, resolutionAction: action, resolvedBy: currentUser.id, resolvedAt: Date.now() } : r)));
      return { success: true };
    },
    [currentUser]
  );

  const banUser = useCallback(
    async (id) => {
      if (!currentUser) return;
      await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actorId: currentUser.id, targetUserId: id, action: "ban" }),
      });
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, isBanned: true } : u)));
      await createNotification(id, currentUser.id, "user_banned", id, "user");
    },
    [currentUser, createNotification]
  );

  const unbanUser = useCallback(
    async (id) => {
      if (!currentUser) return;
      await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actorId: currentUser.id, targetUserId: id, action: "unban" }),
      });
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, isBanned: false } : u)));
    },
    [currentUser]
  );

  const setFeaturedStatus = useCallback(
    async (id, status, price = null) => {
      if (!currentUser) return;
      const action = status === "awaiting_payment" ? "quote-featured" : "reject-featured";
      const res = await fetch("/api/admin/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actorId: currentUser.id, listingId: id, action, price }),
      });
      if (!res.ok) return { success: false, error: (await res.json().catch(() => ({}))).error || "Unable to update request" };
      setListings((prev) =>
        prev.map((l) =>
          l.id === id ? { ...l, featuredStatus: status, featured: false, promotionPrice: status === "awaiting_payment" ? Number(price) : null } : l
        )
      );
      const listing = listings.find((l) => l.id === id);
      if (listing && listing.sellerId !== currentUser.id) {
        if (status === "rejected") await createNotification(listing.sellerId, currentUser.id, "featured_rejected", id, "listing");
      }
      return { success: true };
    },
    [currentUser, listings, createNotification]
  );

  const blockUser = useCallback(
    async (id) => {
      if (!currentUser) return;
      const res = await fetch("/api/blocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actorId: currentUser.id, blockedId: id }),
      });
      if (res.ok) await fetchBlocks(currentUser.id);
    },
    [currentUser, fetchBlocks]
  );

  const warnUser = useCallback(
    async (id, note = "") => {
      if (!currentUser) return;
      await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actorId: currentUser.id, targetUserId: id, action: "warn", note }),
      });
    },
    [currentUser]
  );

  const createAdminListing = useCallback(
    async (data) => {
      if (!currentUser?.isAdmin) return null;
      const res = await fetch("/api/admin/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", listing: data }),
      });
      if (!res.ok) return null;
      const json = await res.json();
      const mapped = mapListing(json.listing);
      setListings((prev) => [mapped, ...prev]);
      return mapped;
    },
    [currentUser]
  );

  const moderateListing = useCallback(
    async (id, action, note = "") => {
      if (!currentUser) return { success: false, error: "Not authenticated" };
      const res = await fetch("/api/admin/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actorId: currentUser.id, listingId: id, action, note }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        return { success: false, error: json.error || "Moderation failed" };
      }
      const statusMap = { flag: "flagged", remove: "removed", restore: "active" };
      if (statusMap[action]) {
        setListings((prev) =>
          prev.map((listing) =>
            listing.id === id ? { ...listing, status: statusMap[action], moderationNote: note } : listing
          )
        );
      }
      return { success: true };
    },
    [currentUser]
  );

  const unblockUser = useCallback(
    async (id) => {
      if (!currentUser) return;
      const res = await fetch("/api/blocks", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actorId: currentUser.id, blockedId: id }),
      });
      if (res.ok) await fetchBlocks(currentUser.id);
    },
    [currentUser, fetchBlocks]
  );

  const isBlocked = useCallback((id) => blockedUsers.includes(id), [blockedUsers]);

  const hasBlockingRelationship = useCallback(
    (id) => {
      if (!currentUser || !id) return false;
      return blockRows.some(
        (row) =>
          (row.blocker_id === currentUser.id && row.blocked_id === id) ||
          (row.blocker_id === id && row.blocked_id === currentUser.id)
      );
    },
    [blockRows, currentUser]
  );

  const value = {
    hydrated,
    userResolved,
    users,
    listings,
    categories,
    subcategories,
    chats,
    reports,
    notifications,
    blockedUsers,
    reviewsByUser,
    currentUser,
    getUserById,
    getListingById,
    sendOtp,
    verifyOtp,
    activateAdminSession,
    logout,
    updateProfile,
    addListing,
    createAdminListing,
    updateListing,
    deleteListing,
    renewListing,
    markAsSold,
    requestFeatured,
    completeMockPromotionPayment,
    incrementViews,
    toggleFavorite,
    isFavorite,
    favoriteListings,
    getOrCreateChat,
    sendMessage,
    appendIncomingMessage,
    userChats,
    unreadMessageCount,
    markChatAsRead,
    getUnreadCount,
    reportContent,
    resolveReport,
    banUser,
    unbanUser,
    warnUser,
    moderateListing,
    setFeaturedStatus,
    blockUser,
    unblockUser,
    isBlocked,
    hasBlockingRelationship,
    markNotificationRead,
    markAllNotificationsRead,
    fetchReviewsForUser,
    submitReview,
    addCategory,
    updateCategory,
    deleteCategory,
    mutateSubcategory,
    fetchCategories,
    announcements,
    publicAnnouncements,
    analytics,
    fetchAdminAnnouncements,
    fetchAnalytics,
    createAnnouncement,
    deactivateAnnouncement,
    deleteAnnouncement,
    fetchAnnouncements,
    lastFilters,
    setLastFilters,
    paginatedListings,
    currentPage,
    totalCount,
    paginatedLoading,
    paginatedHasMore,
    fetchPaginatedListings,
    loadMore,
    resetPagination,
    ITEMS_PER_PAGE,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
