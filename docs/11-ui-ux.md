# 11. UI/UX Architecture

## Identity

ContentLoop's own visual identity — a calm, dark-first "operations console" aesthetic: deep neutral surfaces, one confident indigo accent, generous whitespace, dense-but-legible data displays, subtle motion. Inspired by the *quality bar* of Linear/Stripe/Notion without copying their interfaces. AI elements share a consistent visual signature (✦ glyph, soft gradient border) so users always know when they're looking at AI output, and every AI card carries sample size + confidence + date range.

## Stack

Next.js App Router + TypeScript, Tailwind CSS with design tokens, shadcn/ui-convention components (cva variants), Framer Motion (subtle, 150–250 ms), Lucide icons, Recharts, React Query for server state, Zustand for the few client-global concerns (command palette, sidebar collapse).

## Information architecture

Sidebar (collapsible): Dashboard · Pipelines · Sources · Content · Calendar · Analytics · Experiments · AI Studio · Integrations · Workflows · Jobs · Logs · Settings. Global command palette (⌘K): create pipeline, add source, search content, ask AI, run scan, open calendar/analytics, create experiment.

## Key screens

- **Dashboard** — KPI row (views, reach, engagement, published), AI insight cards, today's recommendations, upcoming posts, pipeline health, performance trend.
- **Pipelines** — list with health; detail: sources, pool (ranked grid), schedule, brand voice, AI settings, autopilot mode, destination.
- **Sources** — table with status, monitoring frequency, last scan, found/imported counts, pipelines using it; add flow includes the mandatory rights attestation.
- **Content** — virtualized media grid; cards show thumbnail, AI score, performance, source, pipeline, status; hover actions (preview, analyze, schedule, assign, archive); sorts by AI score, prediction, recency, historical performance. Detail page: player, analysis, similar top performers, recommended time/pipeline, actions.
- **Calendar** — week/month, per-pipeline colors, drag to reschedule (pre-publish only).
- **Analytics** — charts + heatmap + top content + "What works for you" strategy page (data-backed findings vs AI recommendations, visually distinct).
- **Experiments** — design wizard enforcing methodology, live results with sample-size state, verdicts with confidence.
- **AI Studio** — assistant chat (tool-calling), brand voice editor, recommendations feed, approval center, audit log.
- **Onboarding wizard** — welcome → connect Metricool → add sources (with attestation) → first pipeline → schedule → enable AI → brand voice → review → activate, with a live workflow preview.

## Component system

Primitives (`src/components/ui`): Button, Input, Label, Select, Badge, Card, Table, Modal/Dialog, Drawer, Tooltip, Toast, Skeleton, EmptyState, ErrorState, ConfirmDialog, Tabs, CommandPalette. Feature components compose primitives only — no ad-hoc styling outside tokens.

## UX standards

Optimistic updates for light mutations; skeletons for all async surfaces; empty/error states designed for every screen; keyboard navigation + visible focus + ARIA labels; virtualized lists over ~100 rows; SSE for live job/workflow status; responsive down to mobile (sidebar → bottom sheet); reduced-motion respect.
