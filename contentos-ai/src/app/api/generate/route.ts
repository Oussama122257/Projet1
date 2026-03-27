import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildContentPrompt } from "@/lib/ai/prompts";
import { generateContent } from "@/lib/ai/providers";
import { AIProvider, Platform, Tone } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      niche,
      audience,
      tone,
      platforms,
      provider = "openai",
    }: {
      niche: string;
      audience: string;
      tone: Tone;
      platforms: Platform[];
      provider?: AIProvider;
    } = body;

    if (!niche || !audience || !tone || !platforms?.length) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check usage limits
    const { data: profile } = await supabase
      .from("users")
      .select("plan, generations_used, generations_limit")
      .eq("id", user.id)
      .single();

    if (profile && profile.generations_used >= profile.generations_limit && profile.plan !== "agency") {
      return NextResponse.json(
        { error: "Generation limit reached. Please upgrade your plan." },
        { status: 403 }
      );
    }

    // Generate content
    const prompt = buildContentPrompt(niche, audience, tone, platforms);
    const result = await generateContent(prompt, provider);

    // Save content plan
    const { data: plan, error: planError } = await supabase
      .from("content_plans")
      .insert({
        user_id: user.id,
        niche,
        audience,
        tone,
        platforms,
      })
      .select()
      .single();

    if (planError) throw planError;

    // Save content days
    const dayRows = result.days.map((day) => ({
      plan_id: plan.id,
      day_number: day.day,
      data: day,
    }));

    const { error: daysError } = await supabase.from("content_days").insert(dayRows);
    if (daysError) throw daysError;

    // Update usage
    if (profile) {
      await supabase
        .from("users")
        .update({ generations_used: profile.generations_used + 1 })
        .eq("id", user.id);
    }

    return NextResponse.json({ plan_id: plan.id, days: result.days });
  } catch (error: unknown) {
    console.error("Generate error:", error);
    const message = error instanceof Error ? error.message : "Failed to generate content";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
