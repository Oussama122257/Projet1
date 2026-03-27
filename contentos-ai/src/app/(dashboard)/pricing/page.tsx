"use client";

import { PricingPlan } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";

const pricingPlans: PricingPlan[] = [
  {
    name: "Starter",
    price: 0,
    generations: 1,
    features: [
      "1 content generation/month",
      "All 4 platforms",
      "30-day content calendar",
      "Export as JSON & CSV",
      "Basic support",
    ],
  },
  {
    name: "Pro",
    price: 29,
    generations: 10,
    popular: true,
    features: [
      "10 content generations/month",
      "All 4 platforms",
      "30-day content calendar",
      "Export as JSON & CSV",
      "Image prompts (Lovart-ready)",
      "Choose AI provider",
      "Regenerate individual days",
      "Priority support",
    ],
  },
  {
    name: "Agency",
    price: 99,
    generations: "unlimited",
    features: [
      "Unlimited generations",
      "All 4 platforms",
      "30-day content calendar",
      "Export as JSON & CSV",
      "Image prompts (Lovart-ready)",
      "Choose AI provider",
      "Regenerate individual days",
      "Webhook / n8n integration",
      "Duplicate plans",
      "Dedicated support",
    ],
  },
];

export default function PricingPage() {
  return (
    <div className="space-y-8">
      <div className="text-center max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold tracking-tight">Simple, transparent pricing</h1>
        <p className="text-muted-foreground mt-2">
          Choose the plan that fits your content needs. Upgrade or downgrade at any time.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {pricingPlans.map((plan) => (
          <Card
            key={plan.name}
            className={`relative ${
              plan.popular
                ? "border-violet-500 shadow-lg shadow-violet-500/10 scale-105"
                : ""
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-gradient-to-r from-violet-500 to-indigo-600 text-white border-0">
                  Most Popular
                </Badge>
              </div>
            )}
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-xl">{plan.name}</CardTitle>
              <CardDescription>
                <span className="text-4xl font-bold text-foreground">
                  ${plan.price}
                </span>
                <span className="text-muted-foreground">/month</span>
              </CardDescription>
              <p className="text-sm text-muted-foreground">
                {plan.generations === "unlimited"
                  ? "Unlimited generations"
                  : `${plan.generations} generation${plan.generations === 1 ? "" : "s"}/month`}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm">
                    <Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Button
                className={`w-full ${
                  plan.popular
                    ? "bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700"
                    : ""
                }`}
                variant={plan.popular ? "default" : "outline"}
              >
                {plan.price === 0 ? "Get Started Free" : "Subscribe"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-center text-sm text-muted-foreground">
        <p>All plans include a 7-day free trial. Cancel anytime.</p>
      </div>
    </div>
  );
}
