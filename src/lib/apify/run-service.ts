import { env } from "@/lib/env";
import { ApifyClient } from "./client";
import type { ApifyRunData } from "./types";

/**
 * Build the Actor input from a JSON template with {{placeholders}}.
 * The template comes from APIFY_INPUT_TEMPLATE or a per-source override, and
 * must be authored against the chosen Actor's documented input schema.
 * Default template covers the common "list of profile URLs" convention many
 * Instagram scraper Actors document (directUrls + resultsLimit), but it is
 * NOT assumed correct for every Actor — operators must verify.
 */
export function buildActorInput(
  vars: { url: string; username: string; limit: number },
  templateOverride?: unknown,
): Record<string, unknown> {
  const raw =
    templateOverride ??
    (env().APIFY_INPUT_TEMPLATE ? JSON.parse(env().APIFY_INPUT_TEMPLATE!) : null) ??
    { directUrls: ["{{url}}"], resultsLimit: "{{limit}}" };

  const substituted = JSON.parse(
    JSON.stringify(raw)
      .replaceAll("{{url}}", vars.url)
      .replaceAll("{{username}}", vars.username)
      .replaceAll('"{{limit}}"', String(vars.limit))
      .replaceAll("{{limit}}", String(vars.limit)),
  );
  return substituted as Record<string, unknown>;
}

export class ApifyRunService {
  constructor(private client: ApifyClient = new ApifyClient()) {}

  /** POST /v2/acts/{actorId}/runs — start a run, never wait for it. */
  async startRun(actorId: string, input: Record<string, unknown>): Promise<ApifyRunData> {
    const res = await this.client.request<{ data: ApifyRunData }>(
      `/acts/${encodeURIComponent(actorId)}/runs`,
      { method: "POST", body: input },
    );
    return res.data;
  }

  /** GET /v2/actor-runs/{runId} */
  async getRun(runId: string): Promise<ApifyRunData> {
    const res = await this.client.request<{ data: ApifyRunData }>(
      `/actor-runs/${encodeURIComponent(runId)}`,
    );
    return res.data;
  }

  /** POST /v2/actor-runs/{runId}/abort */
  async abortRun(runId: string): Promise<ApifyRunData> {
    const res = await this.client.request<{ data: ApifyRunData }>(
      `/actor-runs/${encodeURIComponent(runId)}/abort`,
      { method: "POST" },
    );
    return res.data;
  }

  isTerminal(status: ApifyRunData["status"]): boolean {
    return ["SUCCEEDED", "FAILED", "TIMED-OUT", "ABORTED"].includes(status);
  }
}
