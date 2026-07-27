/**
 * Smart content ranking: combines AI content score with freshness and
 * configurable diversity rules. Historical-similarity and audience-fit terms
 * strengthen as the destination's intelligence profile accumulates data
 * (those factors are already folded into the per-pipeline aiScore by the
 * scoring worker; this module handles ordering + diversity at pick time).
 */

export interface RankableItem {
  pipelineMediaId: string;
  mediaId: string;
  aiScore: number | null;
  addedAt: Date;
  sourceId: string | null;
  contentType: string | null;
  hookType: string | null;
}

export interface RecentPost {
  sourceId: string | null;
  contentType: string | null;
  hookType: string | null;
}

export interface DiversityRules {
  maxConsecutiveSameSource: number;
  maxConsecutiveSameType: number;
  maxConsecutiveSameHook: number;
}

export const DEFAULT_DIVERSITY_RULES: DiversityRules = {
  maxConsecutiveSameSource: 2,
  maxConsecutiveSameType: 3,
  maxConsecutiveSameHook: 3,
};

const FRESHNESS_HALF_LIFE_DAYS = 14;

function freshnessScore(addedAt: Date, now: Date): number {
  const ageDays = (now.getTime() - addedAt.getTime()) / 86_400_000;
  return 100 * Math.pow(0.5, ageDays / FRESHNESS_HALF_LIFE_DAYS);
}

function trailingRun<T>(items: T[], key: (t: T) => string | null): { key: string | null; length: number } {
  if (items.length === 0) return { key: null, length: 0 };
  const k = key(items[items.length - 1]);
  let len = 0;
  for (let i = items.length - 1; i >= 0; i--) {
    if (key(items[i]) === k && k !== null) len++;
    else break;
  }
  return { key: k, length: len };
}

/**
 * Diversity penalty for a candidate given the most recent published posts
 * (newest last). Exceeding a configured consecutive-run cap disqualifies the
 * candidate (-Infinity → filtered); approaching it applies a graded penalty.
 */
export function diversityAdjustment(
  candidate: RankableItem,
  recentPosts: RecentPost[],
  rules: DiversityRules,
): number {
  let penalty = 0;
  const checks: {
    run: { key: string | null; length: number };
    candidateKey: string | null;
    max: number;
  }[] = [
    {
      run: trailingRun(recentPosts, (p) => p.sourceId),
      candidateKey: candidate.sourceId,
      max: rules.maxConsecutiveSameSource,
    },
    {
      run: trailingRun(recentPosts, (p) => p.contentType),
      candidateKey: candidate.contentType,
      max: rules.maxConsecutiveSameType,
    },
    {
      run: trailingRun(recentPosts, (p) => p.hookType),
      candidateKey: candidate.hookType,
      max: rules.maxConsecutiveSameHook,
    },
  ];

  for (const { run, candidateKey, max } of checks) {
    if (candidateKey === null || run.key === null || candidateKey !== run.key) continue;
    if (run.length >= max) return Number.NEGATIVE_INFINITY;
    penalty += 15 * (run.length / max);
  }
  return -penalty;
}

export interface RankedItem extends RankableItem {
  finalScore: number;
  reasons: string[];
}

export function rankPool(
  items: RankableItem[],
  recentPosts: RecentPost[],
  rules: DiversityRules = DEFAULT_DIVERSITY_RULES,
  now: Date = new Date(),
): RankedItem[] {
  return items
    .map((item) => {
      const ai = item.aiScore ?? 50;
      const fresh = freshnessScore(item.addedAt, now);
      const diversity = diversityAdjustment(item, recentPosts, rules);
      const finalScore = 0.75 * ai + 0.15 * fresh + 0.1 * 50 + diversity;
      const reasons: string[] = [`AI score ${ai}`, `freshness ${Math.round(fresh)}`];
      if (diversity === Number.NEGATIVE_INFINITY) {
        reasons.push("blocked by diversity rules (consecutive-run cap reached)");
      } else if (diversity < 0) {
        reasons.push(`diversity penalty ${Math.round(diversity)}`);
      }
      return { ...item, finalScore, reasons };
    })
    .filter((i) => Number.isFinite(i.finalScore))
    .sort((a, b) => b.finalScore - a.finalScore);
}
