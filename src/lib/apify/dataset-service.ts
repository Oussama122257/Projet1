import { ApifyClient } from "./client";

const PAGE_SIZE = 250;
const MAX_ITEMS = 5000; // safety cap per run

export class ApifyDatasetService {
  constructor(private client: ApifyClient = new ApifyClient()) {}

  /** GET /v2/datasets/{datasetId}/items — paginated retrieval of all items. */
  async getAllItems(datasetId: string): Promise<unknown[]> {
    const items: unknown[] = [];
    let offset = 0;
    for (;;) {
      const page = await this.client.request<unknown[]>(
        `/datasets/${encodeURIComponent(datasetId)}/items`,
        { query: { format: "json", offset, limit: PAGE_SIZE, clean: "true" } },
      );
      items.push(...page);
      if (page.length < PAGE_SIZE || items.length >= MAX_ITEMS) break;
      offset += PAGE_SIZE;
    }
    return items;
  }
}
