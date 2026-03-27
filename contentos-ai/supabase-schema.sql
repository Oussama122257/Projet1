-- ContentOS AI — Supabase Database Schema
-- Run this in your Supabase SQL Editor to create the required tables

-- Users table (extends Supabase Auth)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  plan TEXT NOT NULL DEFAULT 'starter' CHECK (plan IN ('starter', 'pro', 'agency')),
  generations_used INTEGER NOT NULL DEFAULT 0,
  generations_limit INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Content Plans
CREATE TABLE IF NOT EXISTS public.content_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  niche TEXT NOT NULL,
  audience TEXT NOT NULL,
  tone TEXT NOT NULL CHECK (tone IN ('emotional', 'viral', 'authority')),
  platforms JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Content Days
CREATE TABLE IF NOT EXISTS public.content_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES public.content_plans(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL,
  data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(plan_id, day_number)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_content_plans_user_id ON public.content_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_content_days_plan_id ON public.content_days(plan_id);

-- Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_days ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- Content Plans policies
CREATE POLICY "Users can view own plans"
  ON public.content_plans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own plans"
  ON public.content_plans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own plans"
  ON public.content_plans FOR DELETE
  USING (auth.uid() = user_id);

-- Content Days policies
CREATE POLICY "Users can view own content days"
  ON public.content_days FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.content_plans
      WHERE content_plans.id = content_days.plan_id
      AND content_plans.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create content days for own plans"
  ON public.content_days FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.content_plans
      WHERE content_plans.id = content_days.plan_id
      AND content_plans.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own content days"
  ON public.content_days FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.content_plans
      WHERE content_plans.id = content_days.plan_id
      AND content_plans.user_id = auth.uid()
    )
  );

-- Auto-create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, plan, generations_used, generations_limit)
  VALUES (NEW.id, NEW.email, 'starter', 0, 1);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
