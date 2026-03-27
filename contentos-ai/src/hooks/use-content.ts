"use client";

import { useState } from "react";
import { ContentPlan, ContentDay, GenerateRequest, AIProvider } from "@/types";

export function useContentGeneration() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = async (data: GenerateRequest) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to generate content");
      }

      return await res.json();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Unknown error";
      setError(message);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const regenerateDay = async (
    planId: string,
    dayNumber: number,
    provider?: AIProvider
  ) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/regenerate-day", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan_id: planId, day_number: dayNumber, provider }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to regenerate day");
      }

      return await res.json();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Unknown error";
      setError(message);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  return { generate, regenerateDay, loading, error };
}

export function useContentLibrary() {
  const [plans, setPlans] = useState<(ContentPlan & { content_days: ContentDay[] })[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/content");
      if (!res.ok) throw new Error("Failed to fetch content");
      const data = await res.json();
      setPlans(data.plans);
    } catch {
      // Handle silently
    } finally {
      setLoading(false);
    }
  };

  return { plans, loading, fetchPlans };
}
