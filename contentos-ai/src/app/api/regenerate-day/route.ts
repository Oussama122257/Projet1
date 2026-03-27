import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildSingleDayPrompt } from "@/lib/ai/prompts";
import { generateContent } from "@/lib/ai/providers";
import { AIProvider } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { plan_id, day_number, provider = "openai" }: {
      plan_id: string;
      day_number: number;
      provider?: AIProvider;
    } = await req.json();

    // Get the plan
    const { data: plan, error: planError } = await supabase
      .from("content_plans")
      .select("*")
      .eq("id", plan_id)
      .eq("user_id", user.id)
      .single();

    if (planError || !plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    const prompt = buildSingleDayPrompt(
      plan.niche,
      plan.audience,
      plan.tone,
      plan.platforms,
      day_number
    );

    const result = await generateContent(prompt, provider);
    const newDayData = result.days[0];

    // Update the day
    const { error: updateError } = await supabase
      .from("content_days")
      .update({ data: newDayData })
      .eq("plan_id", plan_id)
      .eq("day_number", day_number);

    if (updateError) throw updateError;

    return NextResponse.json({ day: newDayData });
  } catch (error: unknown) {
    console.error("Regenerate error:", error);
    const message = error instanceof Error ? error.message : "Failed to regenerate day";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
