import { Link2, LineChart, Banknote } from "lucide-react";

const STEPS = [
  {
    icon: Link2,
    step: "01",
    title: "Connect & apply",
    body: "Creators link their TikTok, Instagram or YouTube account and apply to campaigns. Brands approve the roster they want.",
    detail: "OAuth · encrypted tokens",
  },
  {
    icon: LineChart,
    step: "02",
    title: "We measure, hourly",
    body: "Once content is posted, every hour we pull fresh metrics, append a snapshot, and recalculate earnings against the campaign's pricing model.",
    detail: "CPM · CPC · Hybrid",
  },
  {
    icon: Banknote,
    step: "03",
    title: "Money moves itself",
    body: "Fraud checks run on every sync. Clean earnings above the threshold transfer straight to the creator's Stripe account.",
    detail: "Stripe Connect · idempotent",
  },
];

export function HowItWorks() {
  return (
    <ol className="relative grid gap-6 md:grid-cols-3">
      {/* Connector rail behind the cards, desktop only. */}
      <div
        className="absolute left-0 right-0 top-[3.25rem] hidden h-px bg-gradient-to-r from-transparent via-border to-transparent md:block"
        aria-hidden
      />

      {STEPS.map((item) => (
        <li
          key={item.step}
          className="relative rounded-lg border border-border bg-surface-raised p-6 shadow-card"
        >
          <div className="flex items-center justify-between">
            <div className="flex size-9 items-center justify-center rounded-md border border-accent/25 bg-accent-muted">
              <item.icon className="size-4 text-accent" aria-hidden />
            </div>
            <span className="tabular font-display text-xs font-medium text-ink-tertiary">
              {item.step}
            </span>
          </div>

          <h3 className="mt-5 font-display text-base font-medium tracking-[-0.01em] text-ink">
            {item.title}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-ink-secondary">
            {item.body}
          </p>
          <p className="mt-4 border-t border-border pt-3 text-xs text-ink-tertiary">
            {item.detail}
          </p>
        </li>
      ))}
    </ol>
  );
}
