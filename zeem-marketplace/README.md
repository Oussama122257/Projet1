# Zeem Marketplace (Zeem.dz)

**Algeria's multi-vendor fashion marketplace** — COD-first, covering all 58 Wilayas, with
multi-courier logistics (Yalidine · ZR Express · Algérie Poste) and AI superpowers.

## Stack

| Layer | Tech |
|---|---|
| Frontend/API | Next.js 15 (App Router, Server Components) · TypeScript · Tailwind CSS · shadcn-style UI (Radix) · Framer Motion |
| State | Zustand (cart, wilaya) · TanStack Query (server state) |
| Database | PostgreSQL (Supabase/Neon) · Prisma ORM |
| Cache | Upstash Redis (wilayas + courier fees) |
| Auth | Auth.js v5 — phone/password credentials + Google OAuth, role-based middleware |
| AI | OpenAI (GPT-4o) — smart search, product descriptions, chatbot RAG · deterministic size & price engines |
| Ads | Meta Pixel (browser) + Conversions API via `facebook-nodejs-business-sdk` (server, deduplicated) |

## Quick start

```bash
cd zeem-marketplace
cp .env.example .env          # fill DATABASE_URL + AUTH_SECRET at minimum
npm install
npx prisma migrate dev        # creates schema
npm run db:seed               # 58 wilayas, communes, courier fees, demo data
npm run dev
```

Demo accounts (password `zeem1234`):
- **Admin** `0550 00 00 01` → `/dashboard/admin`
- **Vendeur** `0550 00 00 02` → `/dashboard/seller`
- **Agent** `0550 00 00 03` → `/dashboard/agent`

Everything degrades gracefully without optional keys: no OpenAI key → keyword search,
template descriptions, FAQ-only chatbot; no Redis → direct DB; no Meta creds → pixel
events logged as SKIPPED; no courier API keys → in-app printable waybills.

## Business rules implemented

- **Fast Checkout ("Acheter Maintenant")** — 5 fields (nom, téléphone +213 auto-formaté,
  wilaya, commune, adresse), guest order (`buyerId = null`), single product.
- **Cart checkout (multi-vendor)** — one parent `Order`, one `Shipment` per store, each
  with its own courier + fee; itemized total shown to the buyer.
- **COD reconciliation** — agent taps *Collecté ✅* → shipment `DELIVERED` + `PAYOUT`
  transaction (`cod − commission − shipping`) + store balance credit, atomically; then
  server-side Meta `Purchase` fires with the browser event's `eventID` (deduplicated).
- **Shipping** — per-courier per-wilaya fee grid (admin-editable, Redis-cached), zone
  fallback (north 500 DA → deep south 1200 DA); cheapest active courier wins.
- **Seller verification** — stores start inactive; admin approves with business licence.

## Key directories

```
prisma/               schema + seed (58 wilayas, communes, fees, demo data)
src/lib/orders.ts     fast checkout, cart split, COD collection (core logic)
src/lib/shipping.ts   fee calculation + courier selection
src/lib/delivery/     Yalidine / ZR Express / Algérie Poste adapters
src/lib/ai/           search, describe, price, size, chatbot
src/lib/meta/capi.ts  server-side Conversions API + audit log
src/app/(store)/      public storefront (home, products, cart, checkout, tracking)
src/app/dashboard/    seller / admin / agent dashboards
```
