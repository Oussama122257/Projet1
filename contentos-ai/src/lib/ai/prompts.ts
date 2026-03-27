import { Platform, Tone } from "@/types";

export function buildContentPrompt(
  niche: string,
  audience: string,
  tone: Tone,
  platforms: Platform[],
  dayStart: number = 1,
  dayEnd: number = 30
): string {
  const platformInstructions = platforms
    .map((p) => {
      switch (p) {
        case "pinterest":
          return `"pinterest": { "title": "SEO-optimized pin title", "description": "Keyword-rich description (500 chars max)", "keywords": ["keyword1", "keyword2", ...up to 10] }`;
        case "instagram":
          return `"instagram": { "hook": "Attention-grabbing first line", "caption": "Engaging caption (2200 chars max)", "cta": "Clear call to action", "hashtags": ["#tag1", "#tag2", ...up to 30] }`;
        case "facebook":
          return `"facebook": { "text": "Engaging post text optimized for Facebook algorithm", "hashtags": ["#tag1", "#tag2", ...up to 5] }`;
        case "threads":
          return `"threads": { "text": "Short, punchy text (500 chars max) optimized for Threads" }`;
      }
    })
    .join(",\n          ");

  return `You are an expert social media content strategist. Generate ${dayEnd - dayStart + 1} days of social media content.

NICHE: ${niche}
TARGET AUDIENCE: ${audience}
TONE: ${tone}
PLATFORMS: ${platforms.join(", ")}

TONE GUIDELINES:
- emotional: Use storytelling, empathy, personal experiences. Connect on a human level.
- viral: Use controversial takes, hot opinions, pattern interrupts. Create shareable moments.
- authority: Use data, expertise, case studies. Position as industry leader.

Generate content for days ${dayStart} to ${dayEnd}. Each day must be unique and build upon the previous days to create a cohesive content strategy.

IMPORTANT: Each day MUST include an image_prompt field with a Lovart-ready prompt like:
"Pinterest vertical design (1000x1500), soft feminine aesthetic, emotional mood, text overlay: [HOOK FROM THAT DAY], high contrast, viral style"

Respond ONLY with valid JSON in this exact format:
{
  "days": [
    {
      "day": ${dayStart},
      "platforms": {
          ${platformInstructions}
      },
      "image_prompt": "Lovart-ready prompt here"
    }
  ]
}

Generate all ${dayEnd - dayStart + 1} days. Ensure variety in hooks, angles, and content types across the 30 days.`;
}

export function buildSingleDayPrompt(
  niche: string,
  audience: string,
  tone: Tone,
  platforms: Platform[],
  dayNumber: number
): string {
  return buildContentPrompt(niche, audience, tone, platforms, dayNumber, dayNumber);
}
