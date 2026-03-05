import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/utils/supabase/server";

function getTenantId(req: Request): string | null {
  const url = new URL(req.url);
  return (
    url.searchParams.get("tenant_id") ||
    req.headers.get("x-tenant-id") ||
    null
  );
}

export async function GET(req: Request) {
  const supabase = await createServerSupabaseClient();

  const tenantId = getTenantId(req);

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from"); // expects dd-mm-yyyy
  const to = searchParams.get("to");     // expects dd-mm-yyyy

  let query = supabase
    .from("finance")
    .select("id, date, profit, expenses, created_at")
    .order("date", { ascending: false });

  if (tenantId) {
    query = query.eq("tenant_id", tenantId);
  }

  // 🔄 Convert dd-mm-yyyy → yyyy-mm-dd for Supabase
  const convert = (d: string) => {
    const [dd, mm, yyyy] = d.split("-");
    return `${yyyy}-${mm}-${dd}`;
  };

  if (from && to) {
    const fromISO = convert(from);
    const toISO = convert(to);

    // Apply date filtering
    query = query.gte("date", fromISO).lte("date", toISO);
  }

  const { data, error } = await query;

  if (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to load finance data" },
      { status: 500 }
    );
  }

  return NextResponse.json({ items: data });
}


export async function POST(req: Request) {
  const supabase = await createServerSupabaseClient();

  const tenantId = getTenantId(req);
  if (!tenantId) {
    return NextResponse.json({ error: "tenant_id required" }, { status: 400 });
  }

  const body = await req.json();

  // body.date expected as "YYYY-MM-DD"
  const date = body.date ?? null;
  const profit = body.profit !== undefined ? Number(body.profit) : null;
  const expenses = body.expenses !== undefined ? Number(body.expenses) : null;

  if (
    date === null ||
    profit === null ||
    expenses === null ||
    Number.isNaN(profit) ||
    Number.isNaN(expenses)
  ) {
    return NextResponse.json(
      { error: "date, profit and expenses are required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("finance")
    .insert([
      {
        tenant_id: tenantId,
        date,
        profit,
        expenses,
        created_at: new Date().toISOString(),
      },
    ])
    .select("id, date, profit, expenses, created_at")
    .single();

  if (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to create finance entry" },
      { status: 500 }
    );
  }

  return NextResponse.json({ item: data }, { status: 201 });
}
