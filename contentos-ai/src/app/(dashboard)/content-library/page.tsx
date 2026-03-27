"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useContentLibrary, useContentGeneration } from "@/hooks/use-content";
import { DayContent, ContentDay } from "@/types";
import { DayCard } from "@/components/content/day-card";
import { CalendarView } from "@/components/content/calendar-view";
import { ExportButtons } from "@/components/content/export-buttons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Calendar, LayoutList, Copy, Library } from "lucide-react";

export default function ContentLibraryPage() {
  const searchParams = useSearchParams();
  const { plans, loading, fetchPlans } = useContentLibrary();
  const { regenerateDay } = useContentGeneration();
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<DayContent | null>(null);
  const [regeneratingDay, setRegeneratingDay] = useState<number | null>(null);

  useEffect(() => {
    fetchPlans();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const planFromUrl = searchParams.get("plan");
    if (planFromUrl) {
      setSelectedPlanId(planFromUrl);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!selectedPlanId && plans.length > 0) {
      setSelectedPlanId(plans[0].id);
    }
  }, [plans, selectedPlanId]);

  const selectedPlan = plans.find((p) => p.id === selectedPlanId);
  const days: DayContent[] = (selectedPlan?.content_days || [])
    .sort((a: ContentDay, b: ContentDay) => a.day_number - b.day_number)
    .map((d: ContentDay) => d.data);

  const handleRegenerate = async (dayNumber: number) => {
    if (!selectedPlanId) return;
    setRegeneratingDay(dayNumber);
    try {
      await regenerateDay(selectedPlanId, dayNumber);
      toast.success(`Day ${dayNumber} regenerated!`);
      fetchPlans();
    } catch {
      toast.error("Failed to regenerate day");
    } finally {
      setRegeneratingDay(null);
    }
  };

  const handleDuplicate = async () => {
    if (!selectedPlan) return;
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          niche: selectedPlan.niche,
          audience: selectedPlan.audience,
          tone: selectedPlan.tone,
          platforms: selectedPlan.platforms,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Plan duplicated! Generating new content...");
      const data = await res.json();
      setSelectedPlanId(data.plan_id);
      fetchPlans();
    } catch {
      toast.error("Failed to duplicate plan");
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (plans.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Content Library</h1>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Library className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No content plans yet</h3>
            <p className="text-muted-foreground mb-4">
              Generate your first 30-day content plan to get started.
            </p>
            <a href="/generate">
              <Button>Generate Content</Button>
            </a>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Content Library</h1>
        <div className="flex items-center gap-3">
          <Select
            value={selectedPlanId || ""}
            onValueChange={setSelectedPlanId}
          >
            <SelectTrigger className="w-[280px]">
              <SelectValue placeholder="Select a plan" />
            </SelectTrigger>
            <SelectContent>
              {plans.map((plan) => (
                <SelectItem key={plan.id} value={plan.id}>
                  {plan.niche} — {new Date(plan.created_at).toLocaleDateString()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedPlan && (
        <>
          {/* Plan Info */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <CardTitle>{selectedPlan.niche}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Audience: {selectedPlan.audience} | Tone: {selectedPlan.tone}
                  </p>
                  <div className="flex gap-1 mt-2">
                    {selectedPlan.platforms?.map((p: string) => (
                      <Badge key={p} variant="outline">
                        {p}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <ExportButtons plan={selectedPlan} days={days} />
                  <Button variant="outline" size="sm" onClick={handleDuplicate}>
                    <Copy className="mr-2 h-4 w-4" />
                    Duplicate Plan
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Content Views */}
          <Tabs defaultValue="cards">
            <TabsList>
              <TabsTrigger value="calendar" className="gap-2">
                <Calendar className="h-4 w-4" /> Calendar
              </TabsTrigger>
              <TabsTrigger value="cards" className="gap-2">
                <LayoutList className="h-4 w-4" /> Cards
              </TabsTrigger>
            </TabsList>

            <TabsContent value="calendar" className="mt-4">
              <Card>
                <CardContent className="p-6">
                  <CalendarView
                    days={days}
                    onSelectDay={setSelectedDay}
                    selectedDay={selectedDay?.day}
                  />
                </CardContent>
              </Card>
              {selectedDay && (
                <div className="mt-4">
                  <DayCard
                    day={selectedDay}
                    onRegenerate={handleRegenerate}
                    regenerating={regeneratingDay === selectedDay.day}
                  />
                </div>
              )}
            </TabsContent>

            <TabsContent value="cards" className="mt-4 space-y-3">
              {days.map((day) => (
                <DayCard
                  key={day.day}
                  day={day}
                  onRegenerate={handleRegenerate}
                  regenerating={regeneratingDay === day.day}
                />
              ))}
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
