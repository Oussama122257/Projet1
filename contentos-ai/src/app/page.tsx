import Link from "next/link";
import { Sparkles, ArrowRight, Calendar, Zap, Download, Globe } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50 dark:from-slate-950 dark:via-slate-900 dark:to-violet-950">
      {/* Nav */}
      <nav className="border-b border-slate-200/60 dark:border-slate-800/60 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 text-white">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="font-bold text-lg">ContentOS AI</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/auth/login"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Log In
            </Link>
            <Link
              href="/auth/signup"
              className="text-sm font-medium px-4 py-2 rounded-lg bg-gradient-to-r from-violet-500 to-indigo-600 text-white hover:from-violet-600 hover:to-indigo-700 transition-all shadow-sm"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-24 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-100 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 text-sm font-medium mb-8">
          <Sparkles className="h-3.5 w-3.5" />
          Powered by GPT-4o, Gemini &amp; Claude
        </div>
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight max-w-4xl mx-auto leading-tight">
          30 Days of Content.
          <br />
          <span className="bg-gradient-to-r from-violet-500 to-indigo-600 bg-clip-text text-transparent">
            One Click.
          </span>
        </h1>
        <p className="mt-6 text-xl text-muted-foreground max-w-2xl mx-auto">
          Generate a full month of social media content for Pinterest, Instagram,
          Facebook &amp; Threads — complete with hooks, captions, CTAs, hashtags, and
          image prompts.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Link
            href="/auth/signup"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-600 text-white font-medium text-lg hover:from-violet-600 hover:to-indigo-700 transition-all shadow-lg shadow-violet-500/25"
          >
            Start Generating Free
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <h2 className="text-3xl font-bold text-center mb-12">
          Everything you need for content domination
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              icon: Calendar,
              title: "30-Day Calendar",
              desc: "Visualize your entire month of content at a glance with our calendar view.",
            },
            {
              icon: Globe,
              title: "4 Platforms",
              desc: "Pinterest, Instagram, Facebook & Threads — all optimized for each platform.",
            },
            {
              icon: Zap,
              title: "3 AI Models",
              desc: "Choose between GPT-4o, Gemini Pro, or Claude for generation.",
            },
            {
              icon: Download,
              title: "Export Anywhere",
              desc: "Export as JSON, CSV, or copy all content with one click.",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 hover:shadow-lg transition-shadow"
            >
              <div className="h-10 w-10 rounded-lg bg-violet-100 dark:bg-violet-950/50 flex items-center justify-center mb-4">
                <feature.icon className="h-5 w-5 text-violet-600 dark:text-violet-400" />
              </div>
              <h3 className="font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <div className="rounded-3xl bg-gradient-to-r from-violet-500 to-indigo-600 p-12 text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to automate your content?
          </h2>
          <p className="text-violet-100 text-lg mb-8 max-w-xl mx-auto">
            Join creators and agencies who save 40+ hours per month with AI-generated content strategies.
          </p>
          <Link
            href="/auth/signup"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white text-violet-600 font-medium text-lg hover:bg-violet-50 transition-colors shadow-lg"
          >
            Get Started Free
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-6 py-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-violet-500" />
            <span className="text-sm font-medium">ContentOS AI</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} ContentOS AI. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
