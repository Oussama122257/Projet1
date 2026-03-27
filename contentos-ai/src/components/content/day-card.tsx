"use client";

import { useState } from "react";
import { DayContent, Platform } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChevronDown,
  ChevronUp,
  Copy,
  RefreshCw,
  ImageIcon,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

interface DayCardProps {
  day: DayContent;
  onRegenerate?: (dayNumber: number) => Promise<void>;
  regenerating?: boolean;
}

const platformColors: Record<Platform, string> = {
  pinterest: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
  instagram: "bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300",
  facebook: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  threads: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
};

function copyToClipboard(text: string, label: string) {
  navigator.clipboard.writeText(text);
  toast.success(`${label} copied to clipboard`);
}

function PlatformSection({
  platform,
  data,
}: {
  platform: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Record<string, any>;
}) {
  if (!data) return null;

  return (
    <div className="space-y-2">
      <Badge className={platformColors[platform as Platform] || ""}>
        {platform.charAt(0).toUpperCase() + platform.slice(1)}
      </Badge>

      <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 space-y-3">
        {platform === "pinterest" && (
          <>
            <div>
              <p className="text-xs text-muted-foreground font-medium mb-1">Title</p>
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium">{data.title}</p>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0"
                  onClick={() => copyToClipboard(data.title, "Title")}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium mb-1">Description</p>
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm">{data.description}</p>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0"
                  onClick={() => copyToClipboard(data.description, "Description")}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
            {data.keywords?.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground font-medium mb-1">SEO Keywords</p>
                <div className="flex flex-wrap gap-1">
                  {data.keywords.map((kw: string, i: number) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {kw}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {platform === "instagram" && (
          <>
            <div>
              <p className="text-xs text-muted-foreground font-medium mb-1">Hook</p>
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold">{data.hook}</p>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0"
                  onClick={() => copyToClipboard(data.hook, "Hook")}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium mb-1">Caption</p>
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm whitespace-pre-wrap">{data.caption}</p>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0"
                  onClick={() => copyToClipboard(data.caption, "Caption")}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium mb-1">CTA</p>
              <p className="text-sm font-medium text-violet-600 dark:text-violet-400">
                {data.cta}
              </p>
            </div>
            {data.hashtags?.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground font-medium mb-1">Hashtags</p>
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm text-blue-600 dark:text-blue-400">
                    {data.hashtags.join(" ")}
                  </p>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0"
                    onClick={() => copyToClipboard(data.hashtags.join(" "), "Hashtags")}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}

        {(platform === "facebook" || platform === "threads") && (
          <div>
            <p className="text-xs text-muted-foreground font-medium mb-1">Post</p>
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm whitespace-pre-wrap">{data.text}</p>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                onClick={() => copyToClipboard(data.text, "Post")}
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
            {data.hashtags?.length > 0 && (
              <p className="text-sm text-blue-600 dark:text-blue-400 mt-2">
                {data.hashtags.join(" ")}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function DayCard({ day, onRegenerate, regenerating }: DayCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader
        className="cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-white text-sm font-bold">
              {day.day}
            </div>
            <div>
              <CardTitle className="text-base">Day {day.day}</CardTitle>
              <div className="flex gap-1 mt-1">
                {Object.keys(day.platforms).map((p) => (
                  <Badge
                    key={p}
                    variant="outline"
                    className="text-[10px] py-0"
                  >
                    {p}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onRegenerate && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                disabled={regenerating}
                onClick={(e) => {
                  e.stopPropagation();
                  onRegenerate(day.day);
                }}
              >
                {regenerating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            )}
            {expanded ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-4 pt-0">
          {Object.entries(day.platforms).map(([platform, data]) => (
            <PlatformSection key={platform} platform={platform} data={data} />
          ))}

          {/* Image Prompt */}
          {day.image_prompt && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">
                  Lovart Image Prompt
                </span>
              </div>
              <div className="bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-950/30 dark:to-indigo-950/30 rounded-lg p-4 flex items-start justify-between gap-2">
                <p className="text-sm italic">{day.image_prompt}</p>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0"
                  onClick={() => copyToClipboard(day.image_prompt, "Image prompt")}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
