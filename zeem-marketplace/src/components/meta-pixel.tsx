"use client";

import Script from "next/script";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

/** Client-side Meta Pixel bootstrap (PageView on load). */
export function MetaPixel() {
  if (!PIXEL_ID) return null;
  return (
    <Script id="meta-pixel" strategy="afterInteractive">
      {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${PIXEL_ID}');
fbq('track', 'PageView');`}
    </Script>
  );
}

/**
 * Fire the browser-side Purchase the moment a COD order is placed.
 * `eventId` comes from the order API; the server CAPI re-sends the same id
 * on delivery so Meta deduplicates and keeps one attributed Purchase.
 */
export function trackPurchase(params: {
  eventId: string;
  value: number;
  contentIds: string[];
}) {
  window.fbq?.(
    "track",
    "Purchase",
    {
      value: params.value,
      currency: "DZD",
      content_ids: params.contentIds,
      content_type: "product",
    },
    { eventID: params.eventId }
  );
}

export function trackInitiateCheckout(value: number, contentIds: string[]) {
  window.fbq?.("track", "InitiateCheckout", {
    value,
    currency: "DZD",
    content_ids: contentIds,
    content_type: "product",
  });
}
