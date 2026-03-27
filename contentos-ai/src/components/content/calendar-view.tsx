"use client";

import { DayContent } from "@/types";
import { cn } from "@/lib/utils";

interface CalendarViewProps {
  days: DayContent[];
  onSelectDay: (day: DayContent) => void;
  selectedDay?: number;
}

export function CalendarView({ days, onSelectDay, selectedDay }: CalendarViewProps) {
  const weeks: (DayContent | null)[][] = [];
  let currentWeek: (DayContent | null)[] = [];

  // Fill in the first week offset (start on Monday)
  const startPadding = 0; // Day 1 starts on Monday
  for (let i = 0; i < startPadding; i++) {
    currentWeek.push(null);
  }

  days.forEach((day) => {
    currentWeek.push(day);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });

  // Fill remaining days in the last week
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push(null);
    }
    weeks.push(currentWeek);
  }

  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="w-full">
      {/* Header */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((d) => (
          <div
            key={d}
            className="text-center text-xs font-medium text-muted-foreground py-2"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {weeks.flat().map((day, index) => (
          <button
            key={index}
            disabled={!day}
            onClick={() => day && onSelectDay(day)}
            className={cn(
              "aspect-square rounded-lg border p-1.5 text-left transition-all flex flex-col",
              day
                ? "hover:border-violet-300 hover:bg-violet-50 dark:hover:bg-violet-950/30 cursor-pointer"
                : "bg-slate-50 dark:bg-slate-900/50 cursor-default opacity-30",
              day && selectedDay === day.day &&
                "border-violet-500 bg-violet-50 dark:bg-violet-950/50 shadow-sm"
            )}
          >
            {day && (
              <>
                <span className="text-sm font-bold">{day.day}</span>
                <div className="flex flex-wrap gap-0.5 mt-auto">
                  {Object.keys(day.platforms).map((p) => (
                    <div
                      key={p}
                      className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        p === "pinterest" && "bg-red-400",
                        p === "instagram" && "bg-pink-400",
                        p === "facebook" && "bg-blue-400",
                        p === "threads" && "bg-slate-400"
                      )}
                    />
                  ))}
                </div>
              </>
            )}
          </button>
        ))}
      </div>

      {/* Legend */}
      <div className="flex gap-4 mt-4 justify-center">
        {[
          { label: "Pinterest", color: "bg-red-400" },
          { label: "Instagram", color: "bg-pink-400" },
          { label: "Facebook", color: "bg-blue-400" },
          { label: "Threads", color: "bg-slate-400" },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <div className={cn("w-2 h-2 rounded-full", item.color)} />
            <span className="text-xs text-muted-foreground">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
