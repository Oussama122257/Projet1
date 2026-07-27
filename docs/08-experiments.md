# 8. A/B Testing Methodology

## Test design rules (enforced at creation)

1. **One controlled variable per experiment.** Allowed variables: CAPTION, HOOK, POSTING_TIME, HASHTAGS, THUMBNAIL, FORMAT, LENGTH, CTA.
2. **Comparable exposure.** Variants publish to the *same destination* within the same experiment window; POSTING_TIME tests use content matched on AI score (±5) and content type.
3. **No junk tests.** The API rejects designs comparing unrelated videos on unrelated variables; the UI explains the design requirement ("Same content, Caption A vs Caption B").
4. **Original content untouched** unless the user explicitly configures variant transformations.

## Data model

`experiments` (hypothesis, variable, primaryMetric, status DRAFT/RUNNING/COMPLETED/STOPPED, dates, winner, confidence) → `experiment_variants` (configuration JSON) → `experiment_results` (aggregates + sampleSize per variant). Scheduled posts carry `experimentVariantId`, so results aggregate directly from `post_performance`.

## Winner determination

- Minimum sample size per variant (default: 5 posts *and* metric denominator ≥ 1000 impressions where applicable) before any verdict; otherwise status stays "collecting" and the UI says sample is insufficient.
- Effect size = relative lift on the primary metric; a two-proportion z-test (rate metrics) or Welch's t-test (continuous metrics) yields a p-value.
- Verdict labels: `winner + HIGH confidence` (p<0.05 & n adequate), `leading + MEDIUM` (consistent direction, underpowered), `inconclusive`. **The system never claims statistical significance the math doesn't support**, and never auto-applies a winner in ASSISTED mode — it recommends ("Continue testing short captions before permanently changing the pipeline").

## AI's role

- **Proposal:** Claude receives computed historical aggregates (e.g. "short captions +18% avg engagement, n=42 vs n=37") and proposes: hypothesis, variants, primary metric, duration, success criteria. Stored as a DRAFT for approval.
- **Interpretation:** after completion, Claude receives the computed lift, sample sizes and p-value, and writes the narrative + recommendation. The stats come from code, not the model.
