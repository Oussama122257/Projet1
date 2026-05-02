const BASE = '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  const data = await res.json() as T;
  if (!res.ok) throw new Error((data as { error?: string }).error || 'Request failed');
  return data;
}

export const api = {
  // Health
  health: () => request<{ status: string; version: string }>('/health'),

  // Settings
  getSettings: () => request<{ settings: Record<string, string> }>('/settings'),
  setSetting: (key: string, value: string) => request<{ success: boolean }>('/settings', { method: 'POST', body: JSON.stringify({ key, value }) }),

  // API Keys
  getApiKeys: () => request<{ keys: ApiKey[] }>('/api-keys'),
  createApiKey: (name: string) => request<ApiKey>('/api-keys', { method: 'POST', body: JSON.stringify({ name }) }),
  deleteApiKey: (id: string) => request<{ success: boolean }>(`/api-keys/${id}`, { method: 'DELETE' }),
  activateApiKey: (id: string) => request<{ success: boolean }>(`/api-keys/${id}/activate`, { method: 'PATCH' }),

  // KIE.ai proxy
  getCredit: () => request<KieCredit>('/kie/credit'),
  generateVideo: (params: VideoParams) => request<TaskResult>('/kie/video/generate', { method: 'POST', body: JSON.stringify(params) }),
  getVideoStatus: (taskId: string) => request<unknown>(`/kie/video/status/${taskId}`),
  generateImage: (params: ImageParams) => request<TaskResult>('/kie/image/generate', { method: 'POST', body: JSON.stringify(params) }),
  generateMusic: (params: MusicParams) => request<TaskResult>('/kie/music/generate', { method: 'POST', body: JSON.stringify(params) }),
  getTaskStatus: (taskId: string) => request<unknown>(`/kie/task/${taskId}`),
  getDownloadUrl: (resourceUrl: string) => request<unknown>('/kie/download-url', { method: 'POST', body: JSON.stringify({ resourceUrl }) }),

  // Tasks
  getTasks: (params?: { type?: string; status?: string; limit?: number; offset?: number }) => {
    const q = new URLSearchParams(params as Record<string, string>).toString();
    return request<{ tasks: Task[]; total: number }>(`/tasks${q ? '?' + q : ''}`);
  },
  getTaskStats: () => request<TaskStats>('/tasks/stats'),
  deleteTask: (id: string) => request<{ success: boolean }>(`/tasks/${id}`, { method: 'DELETE' }),

  // MCP
  getMcpServers: () => request<{ servers: McpServer[] }>('/mcp'),
  getMcpTemplate: () => request<McpTemplate>('/mcp/template'),
  createMcpServer: (name: string, config: unknown) => request<McpServer>('/mcp', { method: 'POST', body: JSON.stringify({ name, config }) }),
  updateMcpServer: (id: string, data: Partial<McpServer>) => request<{ success: boolean }>(`/mcp/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteMcpServer: (id: string) => request<{ success: boolean }>(`/mcp/${id}`, { method: 'DELETE' }),

  // Webhooks
  getWebhooks: () => request<{ webhooks: Webhook[] }>('/webhooks'),
  createWebhook: (url: string, events: string[], secret?: string) => request<Webhook>('/webhooks', { method: 'POST', body: JSON.stringify({ url, events, secret }) }),
  deleteWebhook: (id: string) => request<{ success: boolean }>(`/webhooks/${id}`, { method: 'DELETE' }),
};

export interface ApiKey { id: string; name: string; key: string; created_at: number; last_used: number | null; is_active: number; }
export interface Task { id: string; task_id: string | null; type: string; model: string | null; status: string; input_params: string | null; result_url: string | null; credits_used: number | null; error_message: string | null; created_at: number; updated_at: number; }
export interface TaskResult { localId: string; taskId: string | null; status: string; }
export interface TaskStats { total: number; by_type: { type: string; count: number }[]; by_status: { status: string; count: number }[]; credits_used: number; }
export interface McpServer { id: string; name: string; config: string; is_active: number; created_at: number; }
export interface McpTemplate { claude_desktop_config: unknown; installation: Record<string, string>; capabilities: string[]; claude_desktop_path: Record<string, string>; }
export interface Webhook { id: string; url: string; events: string; secret: string | null; is_active: number; created_at: number; }
export interface KieCredit { data?: { credit?: number; totalCredit?: number; usedCredit?: number } }
export interface VideoParams { prompt: string; model?: string; aspectRatio?: string; duration?: number; imageUrl?: string; }
export interface ImageParams { prompt: string; model?: string; aspectRatio?: string; imageUrl?: string; }
export interface MusicParams { prompt: string; model?: string; customMode?: boolean; title?: string; tags?: string; instrumental?: boolean; }
