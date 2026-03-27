import { NextRequest, NextResponse } from "next/server";
import { buildContentPrompt } from "@/lib/ai/prompts";
import { generateContent } from "@/lib/ai/providers";
import { createServerClient } from "@supabase/ssr";
import { AIProvider, Platform, Tone } from "@/types";

// Webhook endpoint for n8n automation
export async function POST(req: NextRequest) {
  try {
    // Verify webhook secret
    const authHeader = req.headers.get("authorization");
    const webhookSecret = process.env.WEBHOOK_SECRET;

    if (webhookSecret && authHeader !== `Bearer ${webhookSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      user_id,
      niche,
      audience,
      tone,
      platforms,
      provider = "openai",
    }: {
      user_id: string;
      niche: string;
      audience: string;
      tone: Tone;
      platforms: Platform[];
      provider?: AIProvider;
    } = body;

    if (!user_id || !niche || !audience || !tone || !platforms?.length) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { cookies: { getAll: () => [], setAll: () => {} } }
    );

    const prompt = buildContentPrompt(niche, audience, tone, platforms);
    const result = await generateContent(prompt, provider);

    const { data: plan, error: planError } = await supabase
      .from("content_plans")
      .insert({ user_id, niche, audience, tone, platforms })
      .select()
      .single();

    if (planError) throw planError;

    const dayRows = result.days.map((day) => ({
      plan_id: plan.id,
      day_number: day.day,
      data: day,
    }));

    const { error: daysError } = await supabase.from("content_days").insert(dayRows);
    if (daysError) throw daysError;

    return NextResponse.json({
      success: true,
      plan_id: plan.id,
      days_generated: result.days.length,
    });
  } catch (error: unknown) {
    console.error("Webhook error:", error);
    const message = error instanceof Error ? error.message : "Webhook processing failed";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
