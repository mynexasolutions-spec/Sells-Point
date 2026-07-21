import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireAdminSession } from "@/lib/adminSession";

export async function GET(request) {
  const session = await requireAdminSession(request);
  if (!session.ok) return session.response;

  const [
    { count: totalUsers },
    { count: totalListings },
    { count: activeListings },
    { count: soldListings },
    { count: totalChats },
    { count: totalMessages },
    { count: openReports },
    { count: resolvedReports },
    { count: pendingPromotions },
    { count: awaitingPaymentPromotions },
    { count: successfulMockPayments },
  ] = await Promise.all([
    supabaseAdmin.from("profiles").select("*", { count: "exact", head: true }),
    supabaseAdmin.from("listings").select("*", { count: "exact", head: true }),
    supabaseAdmin.from("listings").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabaseAdmin.from("listings").select("*", { count: "exact", head: true }).eq("status", "sold"),
    supabaseAdmin.from("chats").select("*", { count: "exact", head: true }),
    supabaseAdmin.from("messages").select("*", { count: "exact", head: true }),
    supabaseAdmin.from("reports").select("*", { count: "exact", head: true }).eq("status", "open"),
    supabaseAdmin.from("reports").select("*", { count: "exact", head: true }).eq("status", "resolved"),
    supabaseAdmin.from("listings").select("*", { count: "exact", head: true }).eq("featured_status", "pending"),
    supabaseAdmin.from("listings").select("*", { count: "exact", head: true }).eq("featured_status", "awaiting_payment"),
    supabaseAdmin.from("promotion_payments").select("*", { count: "exact", head: true }).eq("status", "successful"),
  ]);

  const { data: paymentRows } = await supabaseAdmin.from("promotion_payments").select("id, listing_id, seller_id, amount_inr, provider, status, reference, created_at").eq("status", "successful").order("created_at", { ascending: false }).limit(10);
  const { data: revenueRows } = await supabaseAdmin.from("promotion_payments").select("amount_inr").eq("status", "successful");
  const mockPromotionRevenue = (revenueRows || []).reduce((sum, row) => sum + Number(row.amount_inr || 0), 0);

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: recentUsers } = await supabaseAdmin
    .from("profiles")
    .select("id, name, joined_at")
    .gte("joined_at", sevenDaysAgo)
    .order("joined_at", { ascending: false })
    .limit(10);

  const { data: categoryStats, error: categoryError } = await supabaseAdmin.rpc("get_category_stats");
  const categoryStatsData = categoryError ? [] : (categoryStats || []);

  const { data: conditionRows } = await supabaseAdmin
    .from("listings")
    .select("condition");

  const conditionCounts = {};
  (conditionRows || []).forEach((r) => {
    conditionCounts[r.condition] = (conditionCounts[r.condition] || 0) + 1;
  });

  const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data: recentListings } = await supabaseAdmin
    .from("listings")
    .select("created_at")
    .gte("created_at", last30Days)
    .order("created_at", { ascending: true });

  const listingsByDay = {};
  (recentListings || []).forEach((r) => {
    const day = r.created_at.slice(0, 10);
    listingsByDay[day] = (listingsByDay[day] || 0) + 1;
  });

  return NextResponse.json({
    overview: {
      totalUsers: totalUsers || 0,
      totalListings: totalListings || 0,
      activeListings: activeListings || 0,
      soldListings: soldListings || 0,
      totalChats: totalChats || 0,
      totalMessages: totalMessages || 0,
      openReports: openReports || 0,
      resolvedReports: resolvedReports || 0,
      pendingPromotions: pendingPromotions || 0,
      awaitingPaymentPromotions: awaitingPaymentPromotions || 0,
      successfulMockPayments: successfulMockPayments || 0,
      mockPromotionRevenue,
    },
    recentUsers: recentUsers || [],
    categoryStats: categoryStatsData,
    conditionCounts,
    listingsByDay: Object.entries(listingsByDay).map(([date, count]) => ({ date, count })),
    recentMockTransactions: paymentRows || [],
  });
}
