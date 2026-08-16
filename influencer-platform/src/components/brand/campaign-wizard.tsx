"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, ArrowLeft, ArrowRight, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { PLATFORM_LABEL, PRICING_LABEL } from "@/components/status";
import { cn, formatMoney } from "@/lib/utils";

type PricingModel = "CPM" | "CPC" | "HYBRID";
type Platform = "TIKTOK" | "INSTAGRAM" | "YOUTUBE";

const STEPS = [
  { id: "basics", label: "Basics" },
  { id: "pricing", label: "Pricing" },
  { id: "targeting", label: "Targeting" },
  { id: "budget", label: "Budget" },
  { id: "review", label: "Review" },
] as const;

type StepId = (typeof STEPS)[number]["id"];

const PRICING_HELP: Record<PricingModel, string> = {
  CPM: "Pay per 1,000 views. Best for awareness — cost scales with reach.",
  CPC: "Pay per click. Best for signups and sales — you only pay for intent.",
  HYBRID: "Pay for both reach and clicks. Costs more, but rewards creators who deliver on both.",
};

function toCents(input: string): number {
  const value = Number.parseFloat(input);
  return Number.isFinite(value) ? Math.round(value * 100) : 0;
}

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function CampaignWizard() {
  const router = useRouter();
  const [step, setStep] = React.useState<StepId>("basics");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [form, setForm] = React.useState({
    title: "",
    description: "",
    brief: "",
    pricingModel: "CPM" as PricingModel,
    cpmRate: "3.00",
    cpcRate: "0.40",
    platforms: ["TIKTOK"] as Platform[],
    hashtags: "",
    targetCountries: "DZ",
    budget: "5000",
    threshold: "10",
    startDate: isoDate(new Date()),
    endDate: isoDate(new Date(Date.now() + 30 * 86_400_000)),
    launchNow: true,
  });

  const stepIndex = STEPS.findIndex((s) => s.id === step);

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  /** Per-step gating, so Next is disabled rather than failing on the server. */
  const stepValid: Record<StepId, boolean> = {
    basics: form.title.trim().length >= 3,
    pricing:
      form.pricingModel === "CPM"
        ? toCents(form.cpmRate) > 0
        : form.pricingModel === "CPC"
          ? toCents(form.cpcRate) > 0
          : toCents(form.cpmRate) > 0 && toCents(form.cpcRate) > 0,
    targeting: form.platforms.length > 0,
    budget:
      toCents(form.budget) >= 1000 &&
      toCents(form.threshold) >= 100 &&
      new Date(form.endDate) > new Date(form.startDate),
    review: true,
  };

  function next() {
    const idx = STEPS.findIndex((s) => s.id === step);
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1].id);
  }
  function back() {
    const idx = STEPS.findIndex((s) => s.id === step);
    if (idx > 0) setStep(STEPS[idx - 1].id);
  }

  function togglePlatform(platform: Platform) {
    set(
      "platforms",
      form.platforms.includes(platform)
        ? (form.platforms.filter((p) => p !== platform) as Platform[])
        : ([...form.platforms, platform] as Platform[])
    );
  }

  async function submit() {
    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title,
        description: form.description || undefined,
        brief: form.brief || undefined,
        pricingModel: form.pricingModel,
        cpmRate:
          form.pricingModel === "CPC" ? 0 : toCents(form.cpmRate),
        cpcRate:
          form.pricingModel === "CPM" ? 0 : toCents(form.cpcRate),
        budgetCents: toCents(form.budget),
        minPayoutThresholdCents: toCents(form.threshold),
        platforms: form.platforms,
        startDate: new Date(form.startDate).toISOString(),
        endDate: new Date(form.endDate).toISOString(),
        hashtags: form.hashtags
          .split(/[\s,]+/)
          .map((t) => t.trim())
          .filter(Boolean),
        targetCountries: form.targetCountries
          .split(/[\s,]+/)
          .map((c) => c.trim().toUpperCase())
          .filter((c) => c.length === 2),
        status: form.launchNow ? "ACTIVE" : "DRAFT",
      }),
    });

    const body = await res.json();

    if (!res.ok) {
      setError(
        body?.error?.message ??
          "Could not create the campaign. Check the values and try again."
      );
      setSubmitting(false);
      return;
    }

    router.push(`/brand/campaigns/${body.data.id}`);
    router.refresh();
  }

  return (
    <div>
      {/* ------------------------------------------------------------ stepper */}
      <ol className="flex items-center gap-1.5">
        {STEPS.map((s, i) => {
          const done = i < stepIndex;
          const current = i === stepIndex;
          return (
            <li key={s.id} className="flex flex-1 flex-col gap-2">
              <div
                className={cn(
                  "h-0.5 rounded-full transition-colors",
                  done || current ? "bg-accent" : "bg-surface-hover"
                )}
              />
              <span
                className={cn(
                  "text-[0.6875rem] transition-colors",
                  current
                    ? "font-medium text-accent"
                    : done
                      ? "text-ink-secondary"
                      : "text-ink-tertiary"
                )}
              >
                {s.label}
              </span>
            </li>
          );
        })}
      </ol>

      <div className="mt-8 min-h-[22rem]">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-5"
          >
            {step === "basics" && (
              <>
                <Field label="Campaign title" htmlFor="title">
                  <Input
                    id="title"
                    value={form.title}
                    onChange={(e) => set("title", e.target.value)}
                    placeholder="Ramadan Data Bundles"
                    autoFocus
                  />
                </Field>
                <Field
                  label="Short description"
                  htmlFor="description"
                  hint="Shown on the marketplace card"
                >
                  <Textarea
                    id="description"
                    value={form.description}
                    onChange={(e) => set("description", e.target.value)}
                    placeholder="What creators will be making, in a sentence or two."
                  />
                </Field>
                <Field
                  label="Creative brief"
                  htmlFor="brief"
                  hint="Requirements, do's and don'ts"
                >
                  <Textarea
                    id="brief"
                    value={form.brief}
                    onChange={(e) => set("brief", e.target.value)}
                    placeholder="Open with the problem, demo the product in under 15s, close with the promo code."
                  />
                </Field>
              </>
            )}

            {step === "pricing" && (
              <>
                <div className="grid gap-2.5">
                  {(["CPM", "CPC", "HYBRID"] as PricingModel[]).map((model) => (
                    <button
                      key={model}
                      type="button"
                      onClick={() => set("pricingModel", model)}
                      className={cn(
                        "rounded-md border p-4 text-left transition-all",
                        form.pricingModel === model
                          ? "border-accent/50 bg-accent-muted/50"
                          : "border-border bg-surface-raised hover:border-ink-tertiary/40"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-display text-sm font-medium text-ink">
                          {PRICING_LABEL[model]}
                        </span>
                        {form.pricingModel === model && (
                          <Check className="size-4 text-accent" aria-hidden />
                        )}
                      </div>
                      <p className="mt-1.5 text-xs leading-relaxed text-ink-secondary">
                        {PRICING_HELP[model]}
                      </p>
                    </button>
                  ))}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {form.pricingModel !== "CPC" && (
                    <Field
                      label="Rate per 1,000 views"
                      htmlFor="cpmRate"
                      hint="USD"
                    >
                      <Input
                        id="cpmRate"
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={form.cpmRate}
                        onChange={(e) => set("cpmRate", e.target.value)}
                      />
                    </Field>
                  )}
                  {form.pricingModel !== "CPM" && (
                    <Field label="Rate per click" htmlFor="cpcRate" hint="USD">
                      <Input
                        id="cpcRate"
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={form.cpcRate}
                        onChange={(e) => set("cpcRate", e.target.value)}
                      />
                    </Field>
                  )}
                </div>

                <div className="rounded-md border border-border bg-surface-raised p-4">
                  <p className="text-xs text-ink-tertiary">
                    At these rates, a post doing 250,000 views and 4,000 clicks
                    would earn
                  </p>
                  <p className="tabular mt-1.5 font-display text-lg font-semibold text-accent">
                    {formatMoney(
                      (form.pricingModel !== "CPC"
                        ? Math.floor((250_000 * toCents(form.cpmRate)) / 1000)
                        : 0) +
                        (form.pricingModel !== "CPM"
                          ? 4_000 * toCents(form.cpcRate)
                          : 0)
                    )}
                  </p>
                </div>
              </>
            )}

            {step === "targeting" && (
              <>
                <div>
                  <p className="text-[0.8125rem] font-medium text-ink-secondary">
                    Platforms
                  </p>
                  <p className="mt-1 text-xs text-ink-tertiary">
                    Tracking is live on TikTok. Instagram and YouTube can be
                    targeted now and will start reporting when phase 2 ships.
                  </p>
                  <div className="mt-3 grid gap-2">
                    {(["TIKTOK", "INSTAGRAM", "YOUTUBE"] as Platform[]).map(
                      (platform) => {
                        const selected = form.platforms.includes(platform);
                        return (
                          <button
                            key={platform}
                            type="button"
                            onClick={() => togglePlatform(platform)}
                            className={cn(
                              "flex items-center justify-between rounded-md border px-4 py-3 text-left transition-all",
                              selected
                                ? "border-accent/50 bg-accent-muted/50"
                                : "border-border bg-surface-raised hover:border-ink-tertiary/40"
                            )}
                          >
                            <span className="text-sm text-ink">
                              {PLATFORM_LABEL[platform]}
                            </span>
                            <div className="flex items-center gap-2">
                              {platform !== "TIKTOK" && (
                                <Badge>Phase 2</Badge>
                              )}
                              {selected && (
                                <Check className="size-4 text-accent" aria-hidden />
                              )}
                            </div>
                          </button>
                        );
                      }
                    )}
                  </div>
                </div>

                <Field
                  label="Hashtags"
                  htmlFor="hashtags"
                  hint="Space or comma separated"
                >
                  <Input
                    id="hashtags"
                    value={form.hashtags}
                    onChange={(e) => set("hashtags", e.target.value)}
                    placeholder="#YourBrand #Campaign2026"
                  />
                </Field>

                <Field
                  label="Target countries"
                  htmlFor="countries"
                  hint="Two-letter codes"
                >
                  <Input
                    id="countries"
                    value={form.targetCountries}
                    onChange={(e) => set("targetCountries", e.target.value)}
                    placeholder="DZ, MA, TN"
                  />
                </Field>
              </>
            )}

            {step === "budget" && (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Total budget" htmlFor="budget" hint="USD">
                    <Input
                      id="budget"
                      type="number"
                      step="1"
                      min="10"
                      value={form.budget}
                      onChange={(e) => set("budget", e.target.value)}
                    />
                  </Field>
                  <Field
                    label="Payout threshold"
                    htmlFor="threshold"
                    hint="Minimum before transfer"
                  >
                    <Input
                      id="threshold"
                      type="number"
                      step="1"
                      min="1"
                      value={form.threshold}
                      onChange={(e) => set("threshold", e.target.value)}
                    />
                  </Field>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Starts" htmlFor="startDate">
                    <Input
                      id="startDate"
                      type="date"
                      value={form.startDate}
                      onChange={(e) => set("startDate", e.target.value)}
                    />
                  </Field>
                  <Field label="Ends" htmlFor="endDate">
                    <Input
                      id="endDate"
                      type="date"
                      value={form.endDate}
                      onChange={(e) => set("endDate", e.target.value)}
                    />
                  </Field>
                </div>

                <label className="flex cursor-pointer items-start gap-3 rounded-md border border-border bg-surface-raised p-4">
                  <input
                    type="checkbox"
                    checked={form.launchNow}
                    onChange={(e) => set("launchNow", e.target.checked)}
                    className="mt-0.5 size-4 accent-[#B25CFF]"
                  />
                  <span>
                    <span className="block text-sm text-ink">
                      Publish immediately
                    </span>
                    <span className="mt-0.5 block text-xs text-ink-secondary">
                      Creators can find and apply to this campaign right away.
                      Leave unchecked to save as a draft.
                    </span>
                  </span>
                </label>

                <p className="text-xs text-ink-tertiary">
                  Earnings are capped at the remaining budget at calculation time,
                  so a viral post can never overdraw this number.
                </p>
              </>
            )}

            {step === "review" && (
              <div className="space-y-4">
                <div className="rounded-lg border border-border bg-surface-raised p-5">
                  <h3 className="font-display text-base font-medium text-ink">
                    {form.title || "Untitled campaign"}
                  </h3>
                  {form.description && (
                    <p className="mt-2 text-sm leading-relaxed text-ink-secondary">
                      {form.description}
                    </p>
                  )}

                  <div className="mt-4 flex flex-wrap gap-1.5">
                    <Badge tone="accent">{PRICING_LABEL[form.pricingModel]}</Badge>
                    {form.platforms.map((p) => (
                      <Badge key={p}>{PLATFORM_LABEL[p]}</Badge>
                    ))}
                    <Badge tone={form.launchNow ? "success" : "neutral"}>
                      {form.launchNow ? "Publishes now" : "Saves as draft"}
                    </Badge>
                  </div>

                  <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-border pt-4 text-sm">
                    {[
                      ["Budget", formatMoney(toCents(form.budget))],
                      [
                        "Payout threshold",
                        formatMoney(toCents(form.threshold)),
                      ],
                      ...(form.pricingModel !== "CPC"
                        ? [["Per 1,000 views", formatMoney(toCents(form.cpmRate))]]
                        : []),
                      ...(form.pricingModel !== "CPM"
                        ? [["Per click", formatMoney(toCents(form.cpcRate))]]
                        : []),
                      ["Starts", form.startDate],
                      ["Ends", form.endDate],
                    ].map(([label, value]) => (
                      <div key={label}>
                        <dt className="text-xs text-ink-tertiary">{label}</dt>
                        <dd className="tabular mt-0.5 text-ink">{value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>

                {error && (
                  <div
                    role="alert"
                    className="flex items-start gap-2.5 rounded-md border border-danger/25 bg-danger-muted px-3 py-2.5 text-sm text-danger"
                  >
                    <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
                    {error}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-8 flex items-center justify-between border-t border-border pt-5">
        <Button
          variant="ghost"
          onClick={back}
          disabled={stepIndex === 0 || submitting}
        >
          <ArrowLeft className="size-4" />
          Back
        </Button>

        {step === "review" ? (
          <Button onClick={submit} loading={submitting}>
            {form.launchNow ? "Publish campaign" : "Save draft"}
          </Button>
        ) : (
          <Button onClick={next} disabled={!stepValid[step]}>
            Continue
            <ArrowRight className="size-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
