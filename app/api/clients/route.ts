import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/utils/supabase/server";

function getTenantId(req: NextRequest | Request): string | null {
  const url = new URL(req.url);
  return (
    url.searchParams.get("tenant_id") ||
    req.headers.get("x-tenant-id") ||
    null
  );
}

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();

  const tenantId = getTenantId(req);
  if (!tenantId) {
    return NextResponse.json({ error: "tenant_id required" }, { status: 400 });
  }

  const body = await req.json();

  const { data, error } = await supabase
    .from("clients")
    .insert({
      tenant_id: tenantId,
      full_name: body.fullName,
      email: body.email,
      phone: body.phone,
      address: body.address,
      notes: body.notes
    })
    .select("*");

  if (error) return NextResponse.json({ error }, { status: 400 });

  return NextResponse.json({ success: true, client: data[0] });
}

export async function GET(req: NextRequest) {
  const supabase = await createServerSupabaseClient();

  const tenantId = getTenantId(req);

  let query = supabase
    .from("clients")
    .select("*")
    .order("created_at", { ascending: false });

  if (tenantId) {
    query = query.eq("tenant_id", tenantId);
  }

  const { data, error } = await query;

  return NextResponse.json({ data, error });
}
