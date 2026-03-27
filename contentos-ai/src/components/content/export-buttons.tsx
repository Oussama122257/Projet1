"use client";

import { DayContent, ContentPlan } from "@/types";
import { Button } from "@/components/ui/button";
import { FileJson, FileSpreadsheet, Copy } from "lucide-react";
import { toast } from "sonner";

interface ExportButtonsProps {
  plan: ContentPlan;
  days: DayContent[];
}

function exportAsJSON(plan: ContentPlan, days: DayContent[]) {
  const data = {
    plan: {
      niche: plan.niche,
      audience: plan.audience,
      tone: plan.tone,
      platforms: plan.platforms,
      created_at: plan.created_at,
    },
    days,
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `contentos-${plan.niche.replace(/\s+/g, "-").toLowerCase()}-${new Date().toISOString().split("T")[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
  toast.success("Exported as JSON");
}

function exportAsCSV(plan: ContentPlan, days: DayContent[]) {
  const headers = [
    "Day",
    "Platform",
    "Hook/Title",
    "Caption/Description/Text",
    "CTA",
    "Hashtags/Keywords",
    "Image Prompt",
  ];

  const rows: string[][] = [];

  days.forEach((day) => {
    Object.entries(day.platforms).forEach(([platform, data// eslint-disable-next-line @typescript-eslint/no-explicit-any
]: [string, Record<string, any>]) => {
      const row = [
        String(day.day),
        platform,
        data.hook || data.title || "",
        data.caption || data.description || data.text || "",
        data.cta || "",
        (data.hashtags || data.keywords || []).join(", "),
        day.image_prompt || "",
      ];
      rows.push(row);
    });
  });

  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `contentos-${plan.niche.replace(/\s+/g, "-").toLowerCase()}-${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  toast.success("Exported as CSV");
}

function copyAllContent(days: DayContent[]) {
  let text = "";
  days.forEach((day) => {
    text += `\n=== DAY ${day.day} ===\n`;
    Object.entries(day.platforms).forEach(([platform, data// eslint-disable-next-line @typescript-eslint/no-explicit-any
]: [string, Record<string, any>]) => {
      text += `\n[${platform.toUpperCase()}]\n`;
      if (data.title) text += `Title: ${data.title}\n`;
      if (data.hook) text += `Hook: ${data.hook}\n`;
      if (data.description) text += `Description: ${data.description}\n`;
      if (data.caption) text += `Caption: ${data.caption}\n`;
      if (data.text) text += `Text: ${data.text}\n`;
      if (data.cta) text += `CTA: ${data.cta}\n`;
      if (data.hashtags) text += `Hashtags: ${data.hashtags.join(" ")}\n`;
      if (data.keywords) text += `Keywords: ${data.keywords.join(", ")}\n`;
    });
    if (day.image_prompt) {
      text += `\n[IMAGE PROMPT]\n${day.image_prompt}\n`;
    }
  });

  navigator.clipboard.writeText(text);
  toast.success("All content copied to clipboard");
}

export function ExportButtons({ plan, days }: ExportButtonsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" size="sm" onClick={() => exportAsJSON(plan, days)}>
        <FileJson className="mr-2 h-4 w-4" />
        Export JSON
      </Button>
      <Button variant="outline" size="sm" onClick={() => exportAsCSV(plan, days)}>
        <FileSpreadsheet className="mr-2 h-4 w-4" />
        Export CSV
      </Button>
      <Button variant="outline" size="sm" onClick={() => copyAllContent(days)}>
        <Copy className="mr-2 h-4 w-4" />
        Copy All
      </Button>
    </div>
  );
}
