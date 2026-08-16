import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Link2,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Counter } from "@/components/ui/counter";
import { PlatformMarks } from "@/components/marketing/platform-marks";
import { HowItWorks } from "@/components/marketing/how-it-works";

const AUDIENCE = [
  {
    eyebrow: "For brands",
    title: "Pay for performance you can actually verify",
    body: "Every view and click is pulled straight from the platform's own API and written to an immutable snapshot series. No screenshots, no trust-me dashboards — and budget caps that mathematically cannot be overrun.",
    points: [
      "CPM, CPC or hybrid pricing per campaign",
      "Applicant pipeline from pending to paid",
      "Spend tracked against budget in real time",
    ],
    href: "/register?role=brand",
    cta: "Start a campaign",
  },
  {
    eyebrow: "For creators",
    title: "Get paid automatically, without chasing anyone",
    body: "Connect your accounts once. We track the content, calculate what you've earned every hour, and transfer it to your own Stripe account the moment you cross the threshold.",
    points: [
      "Earnings recalculated hourly, not monthly",
      "Payouts straight to your Stripe account",
      "Fraud checks that protect your reputation",
    ],
    href: "/register?role=influencer",
    cta: "Join as a creator",
  },
];

const PROOF = [
  { value: 4_970_335, label: "Views tracked", format: "number" as const },
  { value: 2_619_562, label: "Creator earnings accrued", format: "money" as const },
  { value: 5, label: "Fraud flags raised", format: "number" as const },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* ---------------------------------------------------------------- nav */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-surface/80 backdrop-blur-xl">
        <div className="container flex h-14 items-center justify-between">
          <Logo />
          <nav className="hidden items-center gap-7 text-sm text-ink-secondary md:flex">
            <a href="#how" className="transition-colors hover:text-ink">
              How it works
            </a>
            <a href="#brands" className="transition-colors hover:text-ink">
              For brands
            </a>
            <a href="#creators" className="transition-colors hover:text-ink">
              For creators
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/register">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* -------------------------------------------------------------- hero */}
      <section className="relative overflow-hidden">
        <div className="grid-lines absolute inset-0" aria-hidden />
        <div className="container relative py-20 md:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <Badge tone="accent" className="animate-fade-up">
              <span className="size-1.5 rounded-full bg-accent" aria-hidden />
              TikTok live · Instagram &amp; YouTube in phase 2
            </Badge>

            <h1
              className="mt-6 animate-fade-up font-display text-display-md text-ink md:text-display-lg"
              style={{ animationDelay: "60ms" }}
            >
              Influencer campaigns that{" "}
              <span className="text-accent">pay themselves out</span>
            </h1>

            <p
              className="mx-auto mt-6 max-w-xl animate-fade-up text-base leading-relaxed text-ink-secondary md:text-lg"
              style={{ animationDelay: "120ms" }}
            >
              PayLoop tracks real content performance across TikTok, Instagram and
              YouTube, calculates what each creator has earned, screens for
              fraudulent traffic, and sends the money — every hour, without anyone
              filing an invoice.
            </p>

            <div
              className="mt-9 flex animate-fade-up flex-col items-center justify-center gap-3 sm:flex-row"
              style={{ animationDelay: "180ms" }}
            >
              <Button asChild size="lg">
                <Link href="/register?role=brand">
                  Launch a campaign
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href="/register?role=influencer">I&apos;m a creator</Link>
              </Button>
            </div>

            <p
              className="mt-4 animate-fade-up text-xs text-ink-tertiary"
              style={{ animationDelay: "220ms" }}
            >
              No card required · Creators keep 100% of what they earn
            </p>
          </div>

          {/* live proof strip */}
          <div
            className="mx-auto mt-16 grid max-w-3xl animate-fade-up grid-cols-1 gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-3"
            style={{ animationDelay: "280ms" }}
          >
            {PROOF.map((stat) => (
              <div key={stat.label} className="bg-surface-raised px-6 py-6 text-center">
                <div className="font-display text-2xl font-semibold text-ink">
                  <Counter value={stat.value} format={stat.format} />
                </div>
                <div className="mt-1 text-xs text-ink-tertiary">{stat.label}</div>
              </div>
            ))}
          </div>

          <div className="mt-14">
            <PlatformMarks />
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------- how it works */}
      <section id="how" className="border-t border-border/60 py-20">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow">The loop</p>
            <h2 className="mt-3 font-display text-display-sm text-ink">
              Three steps, then it runs itself
            </h2>
          </div>
          <div className="mt-12">
            <HowItWorks />
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------- two audiences */}
      <section className="border-t border-border/60 py-20">
        <div className="container grid gap-6 lg:grid-cols-2">
          {AUDIENCE.map((block, i) => (
            <div
              key={block.eyebrow}
              id={i === 0 ? "brands" : "creators"}
              className="flex flex-col rounded-lg border border-border bg-surface-raised p-8 shadow-card"
            >
              <p className="eyebrow">{block.eyebrow}</p>
              <h3 className="mt-3 font-display text-2xl font-semibold tracking-[-0.02em] text-ink">
                {block.title}
              </h3>
              <p className="mt-4 text-sm leading-relaxed text-ink-secondary">
                {block.body}
              </p>
              <ul className="mt-6 space-y-3">
                {block.points.map((point) => (
                  <li key={point} className="flex items-start gap-2.5 text-sm text-ink-secondary">
                    <BadgeCheck className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
                    {point}
                  </li>
                ))}
              </ul>
              <div className="mt-8 pt-2">
                <Button asChild variant={i === 0 ? "primary" : "secondary"}>
                  <Link href={block.href}>
                    {block.cta}
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ----------------------------------------------------------- features */}
      <section className="border-t border-border/60 py-20">
        <div className="container">
          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                icon: Link2,
                title: "Connect once",
                body: "OAuth into TikTok, Instagram or YouTube. Tokens are AES-256-GCM encrypted at rest and never leave our servers.",
              },
              {
                icon: BarChart3,
                title: "Measured hourly",
                body: "Every poll appends an immutable snapshot. That series is what charts render from and what disputes are settled against.",
              },
              {
                icon: ShieldCheck,
                title: "Screened before it pays",
                body: "Engagement ratios, geographic concentration and sustained growth spikes are checked on every sync. Anything suspicious holds the payout for human review.",
              },
              {
                icon: Wallet,
                title: "Paid via Stripe Connect",
                body: "Creators onboard their own connected account. Transfers are idempotent, so a retry can never double-pay.",
              },
              {
                icon: BadgeCheck,
                title: "Budgets that hold",
                body: "A viral post can't overdraw a campaign — earnings are capped by remaining budget at calculation time, not reconciled after the fact.",
              },
              {
                icon: ArrowRight,
                title: "Auditable end to end",
                body: "Every status transition writes a timestamped record: who changed what, when, and why.",
              },
            ].map((feature) => (
              <div key={feature.title}>
                <div className="flex size-9 items-center justify-center rounded-md border border-border bg-surface-overlay">
                  <feature.icon className="size-4 text-accent" aria-hidden />
                </div>
                <h3 className="mt-4 font-display text-[0.9375rem] font-medium text-ink">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-secondary">
                  {feature.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------------- cta */}
      <section className="border-t border-border/60 py-20">
        <div className="container">
          <div className="relative overflow-hidden rounded-lg border border-accent/25 bg-surface-raised px-8 py-14 text-center shadow-glow">
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                backgroundImage:
                  "radial-gradient(30rem 16rem at 50% 0%, rgba(178,92,255,0.16), transparent 70%)",
              }}
              aria-hidden
            />
            <div className="relative">
              <h2 className="font-display text-display-sm text-ink">
                Close the loop on your next campaign
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-ink-secondary">
                Set the rate, approve the creators, and let the platform handle
                tracking, fraud screening and payment.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button asChild size="lg">
                  <Link href="/register">
                    Create your account
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="ghost">
                  <Link href="/login">Sign in to an existing account</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/60 py-10">
        <div className="container flex flex-col items-center justify-between gap-4 text-sm text-ink-tertiary sm:flex-row">
          <Logo />
          <p>Performance-verified influencer payouts.</p>
        </div>
      </footer>
    </div>
  );
}
