import { env } from "@/lib/env";
import { ApifyClient } from "./client";
import type { ApifyActorData } from "./types";

/**
 * Actor configuration & validation. The Actor ID is operator-configurable
 * (APIFY_ACTOR_ID); we make no assumptions about its input schema — see
 * buildActorInput() in run-service.ts for the template-driven input mapping.
 */
export class ApifyActorService {
  constructor(private client: ApifyClient = new ApifyClient()) {}

  configuredActorId(): string {
    const id = env().APIFY_ACTOR_ID;
    if (!id) throw new Error("APIFY_ACTOR_ID is not configured");
    return id;
  }

  /** Fetch Actor metadata — used to validate configuration at setup time. */
  async getActor(actorId?: string): Promise<ApifyActorData> {
    const id = actorId ?? this.configuredActorId();
    // Path-safe: Apify accepts "username~actor-name" or the actor ID.
    const res = await this.client.request<{ data: ApifyActorData }>(
      `/acts/${encodeURIComponent(id)}`,
    );
    return res.data;
  }
}
