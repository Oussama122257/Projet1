import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Anthropic from "@anthropic-ai/sdk";
import { AIProvider, DayContent } from "@/types";

function parseAIResponse(text: string): { days: DayContent[] } {
  // Extract JSON from potential markdown code blocks
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, text];
  const jsonStr = jsonMatch[1]?.trim() || text.trim();
  return JSON.parse(jsonStr);
}

export async function generateWithOpenAI(prompt: string): Promise<{ days: DayContent[] }> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: "You are a social media content strategist. Always respond with valid JSON only.",
      },
      { role: "user", content: prompt },
    ],
    temperature: 0.8,
    max_tokens: 16000,
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("No response from OpenAI");

  return parseAIResponse(content);
}

export async function generateWithGemini(prompt: string): Promise<{ days: DayContent[] }> {
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

  const result = await model.generateContent(
    `You are a social media content strategist. Always respond with valid JSON only.\n\n${prompt}`
  );

  const content = result.response.text();
  if (!content) throw new Error("No response from Gemini");

  return parseAIResponse(content);
}

export async function generateWithClaude(prompt: string): Promise<{ days: DayContent[] }> {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 16000,
    messages: [
      {
        role: "user",
        content: `You are a social media content strategist. Always respond with valid JSON only. No markdown, no explanation.\n\n${prompt}`,
      },
    ],
  });

  const content = response.content[0];
  if (content.type !== "text") throw new Error("No text response from Claude");

  return parseAIResponse(content.text);
}

export async function generateContent(
  prompt: string,
  provider: AIProvider = "openai"
): Promise<{ days: DayContent[] }> {
  switch (provider) {
    case "openai":
      return generateWithOpenAI(prompt);
    case "gemini":
      return generateWithGemini(prompt);
    case "claude":
      return generateWithClaude(prompt);
    default:
      return generateWithOpenAI(prompt);
  }
}
