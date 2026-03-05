import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/utils/supabase/server";

function getTenantId(req: NextRequest): string | null {
  return (
    req.nextUrl.searchParams.get("tenant_id") ||
    req.headers.get("x-tenant-id") ||
    null
  );
}

export async function POST(req: NextRequest) {
  console.log("🚀 POST /api/services CALLED");
  try {
    const supabase = await createServerSupabaseClient();

    const tenantId = getTenantId(req);
    console.log("📍 Tenant ID:", tenantId);

    if (!tenantId) {
      console.warn("⚠️ Missing tenant_id");
      return NextResponse.json({ success: false, error: "tenant_id required" }, { status: 400 });
    }

    const body = await req.json();
    console.log("📦 Request Body:", body);

    // Convert invalid/empty values safely
    const durationValue =
      body.duration === "" || body.duration === null ? null : Number(body.duration);

    const priceValue =
      body.price === "" || body.price === null ? null : Number(body.price);

    const insertPayload = {
      tenant_id: tenantId,
      name: body.name,
      price: priceValue,
      duration: durationValue,
      category: body.category,
      gender: body.gender,
    };

    console.log("🔃 Attempting Supabase Insert:", insertPayload);

    const { data, error } = await supabase
      .from("services")
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      console.error("💥 SUPABASE ERROR:", error);
      return NextResponse.json(
        {
          success: false,
          error: error.message || "Supabase insert failed",
          details: error.details,
          code: error.code
        },
        { status: 400 }
      );
    }

    if (!data) {
      console.warn("⚠️ Insert returned no data");
      return NextResponse.json({ success: false, error: "No data returned after insert" }, { status: 500 });
    }

    console.log("✅ Insert Success:", data);

    return NextResponse.json({
      success: true,
      service: data,
    });

  } catch (err: any) {
    console.error("💥 SYSTEM ERROR in /api/services [POST]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    const tenantId = getTenantId(req);

    let query = supabase
      .from("services")
      .select("*")
      .order("created_at", { ascending: true });

    if (tenantId) {
      query = query.eq("tenant_id", tenantId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Supabase fetch error:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (err: any) {
    console.error("GET /services route error:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
