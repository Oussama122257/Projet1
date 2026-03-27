"use client";

import { useAuth } from "@/hooks/use-auth";
import { useThemeStore } from "@/lib/store";
import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Moon, Sun, User, Key } from "lucide-react";

export default function SettingsPage() {
  const { user, loading } = useAuth();
  const { darkMode, toggleDarkMode, setDarkMode } = useThemeStore();

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    if (stored === "dark") {
      setDarkMode(true);
    } else if (!stored && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setDarkMode(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account and preferences.</p>
      </div>

      {/* Profile */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <User className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle>Profile</CardTitle>
              <CardDescription>Your account information</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-muted-foreground text-xs">Email</Label>
            <p className="font-medium">{user?.email}</p>
          </div>
          <div>
            <Label className="text-muted-foreground text-xs">Account ID</Label>
            <p className="font-mono text-sm text-muted-foreground">{user?.id}</p>
          </div>
          <div>
            <Label className="text-muted-foreground text-xs">Member since</Label>
            <p className="text-sm">
              {user?.created_at
                ? new Date(user.created_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : "—"}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            {darkMode ? (
              <Moon className="h-5 w-5 text-muted-foreground" />
            ) : (
              <Sun className="h-5 w-5 text-muted-foreground" />
            )}
            <div>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>Customize the look and feel</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <Label>Dark Mode</Label>
              <p className="text-sm text-muted-foreground">
                Switch between light and dark theme
              </p>
            </div>
            <Switch checked={darkMode} onCheckedChange={toggleDarkMode} />
          </div>
        </CardContent>
      </Card>

      {/* API Keys Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Key className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle>API Configuration</CardTitle>
              <CardDescription>AI provider settings</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm">OpenAI (GPT-4o)</span>
            <Badge variant="outline">Configured via env</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Google Gemini</span>
            <Badge variant="outline">Configured via env</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Anthropic Claude</span>
            <Badge variant="outline">Configured via env</Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            API keys are configured through environment variables for security.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
