import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: NextRequest) {
  try {
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);

    const { searchParams } = new URL(req.url);
    const rawPeriod = (searchParams.get("period") || "today").toLowerCase();
    const period = rawPeriod === "ytd" ? "year" : rawPeriod;

    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const tenantId = searchParams.get("tenant_id") || req.headers.get("x-tenant-id");

    let start: Date;
    let end: Date;

    if (from && to) {
      start = new Date(from);
      start.setHours(0, 0, 0, 0);

      end = new Date(to);
      end.setHours(23, 59, 59, 999);
    } else {
      const range = getRange(period);
      start = range.start;
      end = range.end;
    }


    const startISO = start.toISOString();
    const endISO = end.toISOString();
    const startDateOnly = start.toISOString().split("T")[0];
    const endDateOnly = end.toISOString().split("T")[0];

    // --------------------------
    // APPOINTMENTS
    // --------------------------
    let apptsQuery = supabase
      .from("appointments")
      .select("id, client_id, staff_id, service_price, date, status")
      .gte("date", startDateOnly)
      .lte("date", endDateOnly);
    if (tenantId) apptsQuery = apptsQuery.eq("tenant_id", tenantId);
    const { data: rawApptsData, error: apptErr } = await apptsQuery;
    const apptsData: any[] = rawApptsData || [];

    if (apptErr) {
      console.error("Appts fetch error in analytics:", apptErr);
    }

    const appointmentsTotal = apptsData.length;
    const completedCount = apptsData.filter(a => (a.status || "").toLowerCase() === "completed").length;
    const cancelledCount = apptsData.filter(a => (a.status || "").toLowerCase() === "cancelled").length;
    const pendingCount = apptsData.filter(a => ["pending", "upcoming", "booked"].includes((a.status || "").toLowerCase())).length;
    const noShowCount = apptsData.filter(a => ["no-show", "noshow", "no_show"].includes((a.status || "").toLowerCase())).length;

    const completionRate =
      appointmentsTotal > 0
        ? Math.round((completedCount / appointmentsTotal) * 1000) / 10
        : 0;

    const servicesSold = apptsData.reduce(
      (acc, a: any) => acc + Number(a.service_price || 0),
      0
    );

    // --------------------------
    // INVOICES (REVENUE)
    // --------------------------
    let invoicesQuery = supabase
      .from("invoices")
      .select("id, total, invoice_date")
      .gte("invoice_date", startISO)
      .lte("invoice_date", endISO);
    if (tenantId) invoicesQuery = invoicesQuery.eq("tenant_id", tenantId);
    const { data: rawInvoicesData, error: invoicesErr } = await invoicesQuery;
    const invoicesData = rawInvoicesData || [];

    if (invoicesErr) throw invoicesErr;

    const invoicesGenerated = invoicesData.length;
    const invoicesPaid = 0;
    const invoicesPending = Math.max(0, invoicesGenerated - invoicesPaid);
    const invoicesCollected = invoicesData.reduce(
      (acc, inv) => acc + Number(inv.total || 0),
      0
    );

    // --------------------------
    // FINANCE (EXPENSES = COSTS)
    // --------------------------
    let financeQuery = supabase
      .from("finance")
      .select("expenses, created_at")
      .gte("created_at", startISO)
      .lte("created_at", endISO);
    if (tenantId) financeQuery = financeQuery.eq("tenant_id", tenantId);
    const { data: rawFinanceData, error: financeErr } = await financeQuery;
    const financeData = rawFinanceData || [];

    if (financeErr) throw financeErr;

    const totalFinanceCosts = financeData.reduce(
      (acc, f) => acc + Number(f.expenses || 0),
      0
    );

    // --------------------------
    // CLIENTS
    // --------------------------
    let clientsQuery = supabase
      .from("clients")
      .select("id, created_at")
      .gte("created_at", startISO)
      .lte("created_at", endISO);
    if (tenantId) clientsQuery = clientsQuery.eq("tenant_id", tenantId);
    const { data: rawClientsData, error: clientsErr } = await clientsQuery;
    const clientsData = rawClientsData || [];

    if (clientsErr) throw clientsErr;

    const newClients = clientsData.length;

    let apptsBeforeQuery = supabase
      .from("appointments")
      .select("client_id")
      .lt("date", startDateOnly)
      .limit(10000);
    if (tenantId) apptsBeforeQuery = apptsBeforeQuery.eq("tenant_id", tenantId);
    const { data: rawApptsBefore, error: apptsBeforeErr } = await apptsBeforeQuery;
    const apptsBefore = rawApptsBefore || [];

    if (apptsBeforeErr) throw apptsBeforeErr;

    const clientsWithPriorAppts = new Set(apptsBefore.map((r: any) => r.client_id).filter(Boolean));
    const clientsInPeriod = new Set(apptsData.map((a: any) => a.client_id).filter(Boolean));

    const returningClients = Array.from(clientsInPeriod)
      .filter(cid => clientsWithPriorAppts.has(cid)).length;

    const totalUniqueClients = clientsInPeriod.size;

    const retention =
      totalUniqueClients > 0
        ? Math.round((returningClients / totalUniqueClients) * 1000) / 10
        : 0;

    // --------------------------
    // PROFIT & MARGIN (FINANCE-BASED ✅)
    // --------------------------
    const totalRevenue = invoicesCollected;
    const totalCosts = totalFinanceCosts;
    const profit = totalRevenue - totalCosts;
    const margin =
      totalRevenue > 0
        ? Math.round((profit / totalRevenue) * 100)
        : 0;

    // --------------------------
    // PEAK HOURS & DAYS
    // --------------------------
    const hourlyCounts: Record<number, number> = {};
    const dailyCounts: Record<string, number> = {};

    apptsData.forEach((a: any) => {
      if (!a.date) return;
      // If time exists, use it, otherwise assume start of day
      const iso = a.time ? `${a.date}T${a.time}` : `${a.date}T00:00:00`;
      const dt = new Date(iso);
      if (isNaN(dt.getTime())) return;
      const hour = dt.getHours();
      hourlyCounts[hour] = (hourlyCounts[hour] || 0) + 1;
      dailyCounts[a.date] = (dailyCounts[a.date] || 0) + 1;
    });

    // --------------------------
    // STAFF LEADERBOARD
    // --------------------------
    const staffPerfMap: Record<string, { completed: number; revenue: number }> = {};

    apptsData.forEach((a: any) => {
      const sid = a.staff_id || "unknown";
      if (!staffPerfMap[sid]) staffPerfMap[sid] = { completed: 0, revenue: 0 };
      if ((a.status || "").toLowerCase() === "completed") {
        staffPerfMap[sid].completed += 1;
      }
      staffPerfMap[sid].revenue += Number(a.service_price || 0);
    });

    const staffLeaderboard = Object.entries(staffPerfMap)
      .map(([staff_id, stats]) => ({
        staff_id,
        completed: stats.completed,
        revenue: stats.revenue
      }))
      .sort((a, b) => b.revenue - a.revenue);

    // --------------------------
    // FINAL RESPONSE ✅
    // --------------------------
    return NextResponse.json({
      period,
      range: { start: startISO, end: endISO },

      appointments: {
        total: appointmentsTotal,
        completed: completedCount,
        pending: pendingCount,
        cancelled: cancelledCount,
        noShows: noShowCount,
        completionRate
      },

      clients: {
        new: newClients,
        returning: returningClients,
        totalUnique: totalUniqueClients,
        retention
      },

      invoices: {
        generated: invoicesGenerated,
        paid: invoicesPaid,
        pending: invoicesPending,
        collected: invoicesCollected
      },

      finance: {
        expenses: totalFinanceCosts
      },

      revenue: {
        total: totalRevenue,
        servicesSold,
        profit,
        margin
      },

      peak: {
        hourly: hourlyCounts,
        daily: dailyCounts
      },

      staffLeaderboard
    });

  } catch (err: any) {
    console.error("Analytics API error:", err);
    return NextResponse.json(
      { error: err?.message || "Unknown error" },
      { status: 500 }
    );
  }
}

// --------------------------
// DATE RANGE UTILS
// --------------------------
function getRange(period: string) {
  const now = new Date();

  if (period === "today") {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  if (period === "week" || period === "weekly") {
    const start = new Date(now);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1);
    start.setDate(diff);
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  if (period === "month" || period === "monthly") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  if (period === "year" || period === "ytd") {
    const start = new Date(now.getFullYear(), 0, 1);
    const end = new Date(now.getFullYear(), 11, 31);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { start, end };
}
