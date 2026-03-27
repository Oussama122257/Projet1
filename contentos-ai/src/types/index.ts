export type Platform = "pinterest" | "instagram" | "facebook" | "threads";

export type Tone = "emotional" | "viral" | "authority";

export type AIProvider = "openai" | "gemini" | "claude";

export interface PinterestContent {
  title: string;
  description: string;
  keywords: string[];
}

export interface InstagramContent {
  hook: string;
  caption: string;
  cta: string;
  hashtags: string[];
}

export interface FacebookContent {
  text: string;
  hashtags: string[];
}

export interface ThreadsContent {
  text: string;
}

export interface DayContent {
  day: number;
  platforms: {
    pinterest?: PinterestContent;
    instagram?: InstagramContent;
    facebook?: FacebookContent;
    threads?: ThreadsContent;
  };
  image_prompt: string;
}

export interface ContentPlan {
  id: string;
  user_id: string;
  niche: string;
  audience: string;
  tone: Tone;
  platforms: Platform[];
  created_at: string;
}

export interface ContentDay {
  id: string;
  plan_id: string;
  day_number: number;
  data: DayContent;
  created_at: string;
}

export interface GenerateRequest {
  niche: string;
  audience: string;
  tone: Tone;
  platforms: Platform[];
  provider?: AIProvider;
}

export interface GenerateResponse {
  plan_id: string;
  days: DayContent[];
}

export interface User {
  id: string;
  email: string;
  created_at: string;
  plan: "starter" | "pro" | "agency";
  generations_used: number;
  generations_limit: number;
}

export interface PricingPlan {
  name: string;
  price: number;
  generations: number | "unlimited";
  features: string[];
  popular?: boolean;
}
