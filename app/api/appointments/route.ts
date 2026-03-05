import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/utils/supabase/server";

function getTenantId(req: NextRequest): string | null {
  return (
    req.nextUrl.searchParams.get("tenant_id") ||
    req.headers.get("x-tenant-id") ||
    null
  );
}

function normalizeTime(timeStr: string) {
  if (!timeStr) return null;
  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})(?::\d{2})?(?:\s?([aApP][mM]))?$/)
  if (!match) return timeStr;

  let hours = parseInt(match[1]);
  const minutes = match[2];
  const modifier = match[3]?.toUpperCase();

  if (modifier === "PM" && hours < 12) hours += 12;
  else if (modifier === "AM" && hours === 12) hours = 0;

  return `${String(hours).padStart(2, '0')}:${minutes}:00`;
}

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();

  const tenantId = getTenantId(req);
  if (!tenantId) {
    return NextResponse.json({ error: "tenant_id required" }, { status: 400 });
  }

  const body = await req.json();

  let clientId = body.clientId;

  // If no clientId, try to find or create one (useful for booking widget)
  if (!clientId && body.clientPhone) {
    const { data: existingClient } = await supabase
      .from("clients")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("phone", body.clientPhone)
      .single();

    if (existingClient) {
      clientId = existingClient.id;
    } else {
      const { data: newClient, error: clientError } = await supabase
        .from("clients")
        .insert({
          tenant_id: tenantId,
          full_name: body.clientName,
          phone: body.clientPhone,
          email: body.clientEmail
        })
        .select("id")
        .single();

      if (!clientError && newClient) {
        clientId = newClient.id;
      }
    }
  }

  const { data, error } = await supabase
    .from("appointments")
    .insert({
      tenant_id: tenantId,
      client_id: clientId,
      staff_id: body.staffId || null,
      service_id: body.serviceId,
      service_name: body.serviceName,
      service_price: body.servicePrice,
      date: body.date,
      start_time: normalizeTime(body.startTime),
      status: "upcoming"
    })
    .select(`
        *,
        clients(full_name, phone, email),
        staff(name),
        services(name, price)
      `);

  if (error) {
    console.error("Appointment Insert Error:", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true, appointment: data ? data[0] : null });
}
