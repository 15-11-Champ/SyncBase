import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// --------------------- DELETE ---------------------
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { id } = await context.params; // ⭐ FIXED — MUST AWAIT

  if (!id) {
    return NextResponse.json(
      { success: false, error: "Missing service ID" },
      { status: 400 }
    );
  }

  const { error } = await supabase.from("services").delete().eq("id", id);

  if (error) {
    console.error("Supabase delete error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }

  return NextResponse.json({ success: true });
}

// --------------------- PUT (UPDATE) ---------------------
export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { id } = await context.params; // ⭐ FIXED — MUST AWAIT
  const body = await req.json();

  const { data, error } = await supabase
    .from("services")
    .update(body)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Supabase update error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }

  return NextResponse.json({ success: true, data });
}
