"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/input";
import { PLATFORM_LABEL } from "@/components/status";
import type { Platform } from "@prisma/client";

/**
 * Attach published content to an approved application.
 *
 * The platform-native content id is what the tracking service polls, so it's
 * extracted from the URL rather than asked for separately — creators paste the
 * link they already have.
 */
function extractContentId(url: string, platform: Platform): string | null {
  try {
    const parsed = new URL(url);
    if (platform === "TIKTOK") {
      // https://www.tiktok.com/@user/video/7412345678901234567
      const match = parsed.pathname.match(/\/video\/(\d+)/);
      return match?.[1] ?? null;
    }
    if (platform === "YOUTUBE") {
      // youtu.be/<id> or youtube.com/watch?v=<id> or /shorts/<id>
      if (parsed.hostname.includes("youtu.be")) {
        return parsed.pathname.slice(1) || null;
      }
      const short = parsed.pathname.match(/\/shorts\/([\w-]+)/);
      if (short) return short[1];
      return parsed.searchParams.get("v");
    }
    if (platform === "INSTAGRAM") {
      // instagram.com/p/<shortcode>/ or /reel/<shortcode>/
      const match = parsed.pathname.match(/\/(?:p|reel|reels)\/([\w-]+)/);
      return match?.[1] ?? null;
    }
    return null;
  } catch {
    return null;
  }
}

export function SubmitContentPanel({
  applicationId,
  campaignTitle,
  platforms,
}: {
  applicationId: string;
  campaignTitle: string;
  platforms: Platform[];
}) {
  const router = useRouter();
  const [platform, setPlatform] = React.useState<Platform>(platforms[0]);
  const [url, setUrl] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const contentId = extractContentId(url, platform);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!contentId) {
      setError(
        `That doesn't look like a ${PLATFORM_LABEL[platform]} post URL. Paste the full link to your published content.`
      );
      return;
    }

    setSubmitting(true);

    const res = await fetch(`/api/applications/${applicationId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contentId, contentUrl: url, platform }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error?.message ?? "Could not attach that content");
      setSubmitting(false);
      return;
    }

    setUrl("");
    router.refresh();
    setSubmitting(false);
  }

  return (
    <Card className="p-5">
      <div className="flex items-start gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-md border border-accent/25 bg-accent-muted">
          <Link2 className="size-4 text-accent" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-display text-[0.9375rem] font-medium text-ink">
            {campaignTitle}
          </p>
          <p className="mt-0.5 text-xs text-ink-secondary">
            Approved — link your published post to start earning.
          </p>
        </div>
      </div>

      <form onSubmit={submit} className="mt-4 space-y-3">
        <div className="grid gap-3 sm:grid-cols-[10rem_1fr]">
          <Field label="Platform" htmlFor={`platform-${applicationId}`}>
            <Select
              id={`platform-${applicationId}`}
              value={platform}
              onChange={(e) => setPlatform(e.target.value as Platform)}
            >
              {platforms.map((p) => (
                <option key={p} value={p}>
                  {PLATFORM_LABEL[p]}
                </option>
              ))}
            </Select>
          </Field>

          <Field
            label="Post URL"
            htmlFor={`url-${applicationId}`}
            hint={contentId ? `Detected id ${contentId}` : undefined}
          >
            <Input
              id={`url-${applicationId}`}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.tiktok.com/@you/video/7412345678901234567"
              required
            />
          </Field>
        </div>

        {error && <p className="text-xs text-danger">{error}</p>}

        <Button type="submit" size="sm" loading={submitting}>
          Attach content
        </Button>
      </form>
    </Card>
  );
}
