"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Check, Link2, Unlink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PLATFORM_COLOR, PLATFORM_LABEL } from "@/components/status";
import type { Platform } from "@prisma/client";
import { formatCount, formatDate, relativeTime } from "@/lib/utils";

type Connection = {
  platform: Platform;
  connected: boolean;
  integrationAvailable: boolean;
  username: string | null;
  displayName: string | null;
  followerCount: number;
  connectedAt: string | null;
  lastSyncedAt: string | null;
  needsReconnect: boolean;
};

const SCOPES: Record<Platform, string> = {
  TIKTOK: "Profile, follower stats, and video list",
  INSTAGRAM: "Profile and media insights (Business/Creator accounts)",
  YOUTUBE: "Channel data and video analytics",
};

export function ConnectionCards({
  connections,
  error,
  justConnected,
}: {
  connections: Connection[];
  error?: string;
  justConnected?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = React.useState<Platform | null>(null);

  async function disconnect(platform: Platform) {
    setBusy(platform);
    await fetch("/api/social", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ platform }),
    });
    router.refresh();
    setBusy(null);
  }

  return (
    <div className="space-y-4">
      {error && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-md border border-danger/25 bg-danger-muted px-4 py-3 text-sm text-danger"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          {error}
        </div>
      )}

      {justConnected && (
        <div className="flex items-start gap-2.5 rounded-md border border-success/25 bg-success-muted px-4 py-3 text-sm text-success">
          <Check className="mt-0.5 size-4 shrink-0" aria-hidden />
          {PLATFORM_LABEL[justConnected.toUpperCase() as Platform] ??
            justConnected}{" "}
          connected. Your content on this platform can now be tracked.
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        {connections.map((connection) => {
          const color = PLATFORM_COLOR[connection.platform];
          const disabled = !connection.integrationAvailable;

          return (
            <Card
              key={connection.platform}
              className="flex flex-col p-5"
              style={
                connection.connected
                  ? { borderColor: `${color}40` }
                  : undefined
              }
            >
              <div className="flex items-start justify-between">
                <div
                  className="flex size-10 items-center justify-center rounded-md border"
                  style={{
                    background: `${color}14`,
                    borderColor: `${color}33`,
                  }}
                >
                  <span
                    className="size-2.5 rounded-full"
                    style={{ background: color, boxShadow: `0 0 10px ${color}66` }}
                    aria-hidden
                  />
                </div>

                {connection.connected ? (
                  <Badge tone="success" dot>
                    Connected
                  </Badge>
                ) : disabled ? (
                  <Badge>Phase 2</Badge>
                ) : (
                  <Badge tone="neutral" dot>
                    Not connected
                  </Badge>
                )}
              </div>

              <h3 className="mt-4 font-display text-base font-medium tracking-[-0.01em] text-ink">
                {PLATFORM_LABEL[connection.platform]}
              </h3>

              {connection.connected ? (
                <div className="mt-2 space-y-1">
                  <p className="text-sm text-ink-secondary">
                    @{connection.username}
                  </p>
                  <p className="tabular text-xs text-ink-tertiary">
                    {formatCount(connection.followerCount)} followers
                  </p>
                </div>
              ) : (
                <p className="mt-2 text-xs leading-relaxed text-ink-secondary">
                  {disabled
                    ? "Tracking for this platform ships in phase 2. You can still target it on campaigns."
                    : SCOPES[connection.platform]}
                </p>
              )}

              <div className="flex-1" />

              {connection.needsReconnect && (
                <p className="mt-4 rounded-md border border-warning/25 bg-warning-muted px-3 py-2 text-xs text-warning">
                  Your access token expired. Reconnect to resume tracking.
                </p>
              )}

              {connection.connected && connection.connectedAt && (
                <p className="mt-4 text-[0.6875rem] text-ink-tertiary">
                  Linked {formatDate(connection.connectedAt)}
                  {connection.lastSyncedAt &&
                    ` · synced ${relativeTime(connection.lastSyncedAt)}`}
                </p>
              )}

              <div className="mt-4">
                {connection.connected ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full"
                    loading={busy === connection.platform}
                    onClick={() => disconnect(connection.platform)}
                  >
                    <Unlink className="size-3.5" />
                    Disconnect
                  </Button>
                ) : (
                  <Button
                    asChild={!disabled}
                    size="sm"
                    className="w-full"
                    disabled={disabled}
                    variant={disabled ? "secondary" : "primary"}
                  >
                    {disabled ? (
                      <span>Coming soon</span>
                    ) : (
                      <a
                        href={`/api/social/${connection.platform.toLowerCase()}/connect`}
                      >
                        <Link2 className="size-3.5" />
                        Connect {PLATFORM_LABEL[connection.platform]}
                      </a>
                    )}
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      <p className="text-xs leading-relaxed text-ink-tertiary">
        We never post on your behalf, never read your messages, and never store
        your password. Access tokens are encrypted with AES-256-GCM and are
        deleted the moment you disconnect.
      </p>
    </div>
  );
}
