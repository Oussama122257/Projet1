import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: plans, error } = await supabase
      .from("content_plans")
      .select("*, content_days(*)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ plans: plans || [] });
  } catch (error: unknown) {
    console.error("Content fetch error:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch content";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
