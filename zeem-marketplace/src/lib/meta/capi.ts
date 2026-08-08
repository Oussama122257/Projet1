import crypto from "crypto";
import { db } from "@/lib/db";

/**
 * Meta Conversions API (server-side pixel).
 *
 * Dedup strategy (critical for COD):
 *  1. Browser fires `Purchase` with eventID = order.pixelEventId the moment
 *     the COD order is placed (optimistic — Meta needs the signal fast for
 *     ad optimization).
 *  2. When the delivery agent marks cash as collected, the server fires the
 *     SAME eventID via CAPI. Meta deduplicates, keeping the richer event.
 * Every server call is logged to PixelEventLog for the admin Pixel Manager.
 */

function sha256(value: string): string {
  return crypto.createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

export interface PurchasePayload {
  eventId: string;
  orderId: string;
  phone?: string | null; // E.164, hashed before sending
  firstName?: string | null;
  value: number; // DZD
  contentIds: string[];
  numItems: number;
  sourceUrl?: string;
}

export async function sendServerPurchase(payload: PurchasePayload): Promise<void> {
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const accessToken = process.env.META_CAPI_ACCESS_TOKEN;

  const logBase = {
    eventName: "Purchase",
    eventId: payload.eventId,
    orderId: payload.orderId,
    payload: {
      value: payload.value,
      currency: "DZD",
      content_ids: payload.contentIds,
      num_items: payload.numItems,
    },
  };

  if (!pixelId || !accessToken) {
    await db.pixelEventLog.create({
      data: { ...logBase, status: "SKIPPED", error: "Pixel not configured" },
    });
    return;
  }

  try {
    // SDK is CJS; dynamic import keeps it out of edge/client bundles.
    const sdk = await import("facebook-nodejs-business-sdk");
    const { FacebookAdsApi, ServerEvent, EventRequest, UserData, CustomData } = sdk;

    FacebookAdsApi.init(accessToken);

    const userData = new UserData().setCountry(sha256("dz"));
    if (payload.phone) userData.setPhones([sha256(payload.phone)]);
    if (payload.firstName) userData.setFirstName(sha256(payload.firstName));

    const customData = new CustomData()
      .setCurrency("DZD")
      .setValue(payload.value)
      .setContentIds(payload.contentIds)
      .setContentType("product")
      .setNumItems(payload.numItems);

    const event = new ServerEvent()
      .setEventName("Purchase")
      .setEventTime(Math.floor(Date.now() / 1000))
      .setEventId(payload.eventId) // ← dedup key shared with browser pixel
      .setUserData(userData)
      .setCustomData(customData)
      .setActionSource("website");
    if (payload.sourceUrl) event.setEventSourceUrl(payload.sourceUrl);

    const request = new EventRequest(accessToken, pixelId).setEvents([event]);
    if (process.env.META_TEST_EVENT_CODE) {
      request.setTestEventCode(process.env.META_TEST_EVENT_CODE);
    }
    await request.execute();

    await db.pixelEventLog.create({ data: { ...logBase, status: "SENT" } });
  } catch (error) {
    await db.pixelEventLog.create({
      data: {
        ...logBase,
        status: "FAILED",
        error: error instanceof Error ? error.message : String(error),
      },
    });
  }
}
