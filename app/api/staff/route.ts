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

  const insertPayload: any = {
    tenant_id: tenantId,
    name: body.fullName || body.name,
    phone: body.phone,
    role: body.position || body.role,
  };
  if (body.email) insertPayload.email = body.email;

  const { data, error } = await supabase
    .from("staff")
    .insert(insertPayload)
    .select("*")
    .single();

  if (error) {
    console.error("💥 Staff Insert Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to add staff" },
      { status: 400 }
    );
  }

  return NextResponse.json({ success: true, staff: data });
}

export async function GET(req: NextRequest) {
  const supabase = await createServerSupabaseClient();

  const tenantId = getTenantId(req);

  let query = supabase
    .from("staff")
    .select("*")
    .order("created_at", { ascending: false });

  if (tenantId) {
    query = query.eq("tenant_id", tenantId);
  }

  const { data, error } = await query;

  return NextResponse.json({ data, error });
}
