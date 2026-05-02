export interface ApiKey {
  id: string;
  name: string;
  key: string;
  created_at: number;
  last_used: number | null;
  is_active: number;
}

export interface Task {
  id: string;
  task_id: string | null;
  type: string;
  model: string | null;
  status: string;
  input_params: string | null;
  result_url: string | null;
  credits_used: number | null;
  error_message: string | null;
  created_at: number;
  updated_at: number;
}

export interface McpServer {
  id: string;
  name: string;
  config: string;
  is_active: number;
  created_at: number;
}

export interface Webhook {
  id: string;
  url: string;
  events: string;
  secret: string | null;
  is_active: number;
  created_at: number;
}

export interface KieApiResponse<T = unknown> {
  code: number;
  msg: string;
  data: T;
}

export interface VideoGenerateRequest {
  prompt: string;
  model?: string;
  aspectRatio?: string;
  duration?: number;
  imageUrl?: string;
  callbackUrl?: string;
}

export interface ImageGenerateRequest {
  prompt: string;
  model?: string;
  aspectRatio?: string;
  imageUrl?: string;
  callbackUrl?: string;
}

export interface MusicGenerateRequest {
  prompt: string;
  model?: string;
  customMode?: boolean;
  title?: string;
  tags?: string;
  instrumental?: boolean;
  callbackUrl?: string;
}
