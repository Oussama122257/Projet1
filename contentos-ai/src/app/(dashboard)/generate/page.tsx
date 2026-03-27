"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useContentGeneration } from "@/hooks/use-content";
import { Platform, Tone, AIProvider } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Sparkles, Loader2, Zap, Brain, Bot } from "lucide-react";

const platforms: { value: Platform; label: string; color: string }[] = [
  { value: "pinterest", label: "Pinterest", color: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300" },
  { value: "instagram", label: "Instagram", color: "bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300" },
  { value: "facebook", label: "Facebook", color: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300" },
  { value: "threads", label: "Threads", color: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" },
];

const tones: { value: Tone; label: string; description: string }[] = [
  { value: "emotional", label: "Emotional", description: "Storytelling & empathy" },
  { value: "viral", label: "Viral", description: "Hot takes & shareability" },
  { value: "authority", label: "Authority", description: "Data & expertise" },
];

const providers: { value: AIProvider; label: string; icon: React.ReactNode }[] = [
  { value: "openai", label: "GPT-4o", icon: <Zap className="h-4 w-4" /> },
  { value: "gemini", label: "Gemini Pro", icon: <Brain className="h-4 w-4" /> },
  { value: "claude", label: "Claude", icon: <Bot className="h-4 w-4" /> },
];

export default function GeneratePage() {
  const [niche, setNiche] = useState("");
  const [audience, setAudience] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>([]);
  const [tone, setTone] = useState<Tone>("viral");
  const [provider, setProvider] = useState<AIProvider>("openai");
  const { generate, loading } = useContentGeneration();
  const router = useRouter();

  const togglePlatform = (platform: Platform) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform) ? prev.filter((p) => p !== platform) : [...prev, platform]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedPlatforms.length === 0) {
      toast.error("Please select at least one platform");
      return;
    }

    try {
      toast.loading("Generating 30 days of content...", { id: "generating" });
      const result = await generate({
        niche,
        audience,
        tone,
        platforms: selectedPlatforms,
        provider,
      });
      toast.dismiss("generating");
      toast.success("Content generated successfully!");
      router.push(`/content-library?plan=${result.plan_id}`);
    } catch (err: unknown) {
      toast.dismiss("generating");
      toast.error(err instanceof Error ? err.message : "Failed to generate content");
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Generate Content</h1>
        <p className="text-muted-foreground mt-1">
          Create 30 days of AI-powered social media content in minutes.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Niche & Audience */}
        <Card>
          <CardHeader>
            <CardTitle>Content Details</CardTitle>
            <CardDescription>Tell us about your brand and audience</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="niche">Niche / Topic</Label>
              <Input
                id="niche"
                placeholder="e.g., Organic skincare, Digital marketing, Fitness coaching"
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="audience">Target Audience</Label>
              <Textarea
                id="audience"
                placeholder="e.g., Women 25-40 interested in natural beauty, small business owners looking to grow online"
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                required
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Platforms */}
        <Card>
          <CardHeader>
            <CardTitle>Platforms</CardTitle>
            <CardDescription>Select which platforms to generate content for</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {platforms.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => togglePlatform(p.value)}
                  className={`px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                    selectedPlatforms.includes(p.value)
                      ? "border-violet-500 bg-violet-50 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 shadow-sm"
                      : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tone */}
        <Card>
          <CardHeader>
            <CardTitle>Content Tone</CardTitle>
            <CardDescription>Choose the style for your content</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {tones.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setTone(t.value)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    tone === t.value
                      ? "border-violet-500 bg-violet-50 dark:bg-violet-950/50 shadow-sm"
                      : "border-slate-200 dark:border-slate-700 hover:border-slate-300"
                  }`}
                >
                  <div className="font-medium">{t.label}</div>
                  <div className="text-xs text-muted-foreground mt-1">{t.description}</div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* AI Provider */}
        <Card>
          <CardHeader>
            <CardTitle>AI Provider</CardTitle>
            <CardDescription>Choose which AI model generates your content</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {providers.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setProvider(p.value)}
                  className={`p-4 rounded-xl border-2 flex items-center gap-3 transition-all ${
                    provider === p.value
                      ? "border-violet-500 bg-violet-50 dark:bg-violet-950/50 shadow-sm"
                      : "border-slate-200 dark:border-slate-700 hover:border-slate-300"
                  }`}
                >
                  {p.icon}
                  <span className="font-medium">{p.label}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <Button
          type="submit"
          size="lg"
          disabled={loading}
          className="w-full bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 h-14 text-lg"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Generating 30 Days...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-5 w-5" />
              Generate 30 Days Content
            </>
          )}
        </Button>
      </form>

      {/* Loading State */}
      {loading && (
        <Card>
          <CardContent className="p-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-violet-500" />
                <p className="font-medium">AI is crafting your content strategy...</p>
              </div>
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                This may take 30-60 seconds for all 30 days.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
