-- ============================================================
-- COD PRO v5 — COMPLETE DATABASE
-- Paste in Supabase SQL Editor → Run
-- ============================================================
-- Clean start
DROP TABLE IF EXISTS public.subscription_events CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.sourcing CASCADE;
DROP TABLE IF EXISTS public.campaigns CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.daily_logs CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.get_dashboard_stats(UUID) CASCADE;
-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
-- PROFILES
CREATE TABLE public.profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name  TEXT DEFAULT '',
  email      TEXT,
  plan       TEXT DEFAULT 'free' CHECK (plan IN ('free','pro','team')),
  store_name TEXT DEFAULT 'متجري',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
-- DAILY LOGS
CREATE TABLE public.daily_logs (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  log_date      DATE NOT NULL,
  leads         INTEGER DEFAULT 0,
  confirmed     INTEGER DEFAULT 0,
  delivered     INTEGER DEFAULT 0,
  returned      INTEGER DEFAULT 0,
  revenue       DECIMAL(12,2) DEFAULT 0,
  ad_spend      DECIMAL(12,2) DEFAULT 0,
  cogs          DECIMAL(12,2) DEFAULT 0,
  shipping_cost DECIMAL(12,2) DEFAULT 0,
  other_costs   DECIMAL(12,2) DEFAULT 0,
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, log_date)
);
-- PRODUCTS
CREATE TABLE public.products (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name       TEXT NOT NULL,
  sale_price DECIMAL(12,2) DEFAULT 0,
  cost_price DECIMAL(12,2) DEFAULT 0,
  status     TEXT DEFAULT 'testing',
  category   TEXT,
  supplier   TEXT,
  win_score  INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
-- CAMPAIGNS
CREATE TABLE public.campaigns (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name         TEXT NOT NULL,
  platform     TEXT,
  status       TEXT DEFAULT 'active',
  daily_budget DECIMAL(10,2) DEFAULT 0,
  leads        INTEGER DEFAULT 0,
  confirmed    INTEGER DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT now()
);
-- SOURCING
CREATE TABLE public.sourcing (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  product_name TEXT NOT NULL,
  supplier_url TEXT,
  unit_cost    DECIMAL(10,2) DEFAULT 0,
  min_order    INTEGER DEFAULT 1,
  ship_days    INTEGER DEFAULT 21,
  stage        TEXT DEFAULT 'research',
  created_at   TIMESTAMPTZ DEFAULT now()
);
-- ORDERS
CREATE TABLE public.orders (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  product_name TEXT,
  wilaya       TEXT,
  total_amount DECIMAL(12,2) DEFAULT 0,
  status       TEXT DEFAULT 'pending',
  created_at   TIMESTAMPTZ DEFAULT now()
);
-- SUBSCRIPTION EVENTS
CREATE TABLE public.subscription_events (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_type  TEXT,
  plan_from   TEXT,
  plan_to     TEXT,
  amount      DECIMAL(10,2),
  created_at  TIMESTAMPTZ DEFAULT now()
);
-- INDEXES
CREATE INDEX idx_daily_logs_user ON public.daily_logs(user_id, log_date DESC);
CREATE INDEX idx_products_user   ON public.products(user_id);
CREATE INDEX idx_campaigns_user  ON public.campaigns(user_id);
-- RLS
ALTER TABLE public.profiles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_logs          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sourcing            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "p1" ON public.profiles            FOR ALL USING (auth.uid() = id);
CREATE POLICY "p2" ON public.daily_logs          FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "p3" ON public.products            FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "p4" ON public.campaigns           FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "p5" ON public.sourcing            FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "p6" ON public.orders              FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "p7" ON public.subscription_events FOR ALL USING (auth.uid() = user_id);
-- AUTO-CREATE PROFILE ON SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
-- DASHBOARD STATS FUNCTION
CREATE OR REPLACE FUNCTION public.get_dashboard_stats(p_user_id UUID)
RETURNS JSON AS $$
DECLARE v_today JSON; v_week JSON; v_products JSON;
BEGIN
  SELECT row_to_json(t) INTO v_today FROM (
    SELECT leads, confirmed, delivered, returned, revenue, ad_spend,
      ROUND(revenue - cogs - shipping_cost - ad_spend - other_costs, 0) AS net_profit,
      CASE WHEN ad_spend>0 THEN ROUND(revenue/ad_spend,2) ELSE 0 END AS roas,
      CASE WHEN leads>0 THEN ROUND(ad_spend/leads,0) ELSE 0 END AS cpa
    FROM public.daily_logs
    WHERE user_id=p_user_id AND log_date=CURRENT_DATE
  ) t;
  SELECT row_to_json(w) INTO v_week FROM (
    SELECT SUM(leads) AS total_leads, SUM(revenue) AS total_revenue,
      SUM(revenue-cogs-shipping_cost-ad_spend-other_costs) AS total_profit,
      ROUND(AVG(CASE WHEN ad_spend>0 THEN revenue/ad_spend ELSE 0 END),2) AS avg_roas
    FROM public.daily_logs
    WHERE user_id=p_user_id AND log_date >= DATE_TRUNC('week',CURRENT_DATE)
  ) w;
  SELECT row_to_json(p) INTO v_products FROM (
    SELECT COUNT(*) AS total,
      COUNT(*) FILTER (WHERE status='winner') AS winners,
      COUNT(*) FILTER (WHERE status='testing') AS testing,
      COUNT(*) FILTER (WHERE status='failed') AS failed
    FROM public.products WHERE user_id=p_user_id
  ) p;
  RETURN json_build_object(
    'today',    COALESCE(v_today,    '{}'::json),
    'week',     COALESCE(v_week,     '{}'::json),
    'products', COALESCE(v_products, '{}'::json)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- FIX EXISTING USERS without profiles
INSERT INTO public.profiles (id, email, full_name)
SELECT id, email, split_part(email,'@',1)
FROM auth.users
ON CONFLICT (id) DO NOTHING;
-- VERIFY
SELECT 'Tables created:' AS status, COUNT(*) AS count
FROM information_schema.tables
WHERE table_schema='public';
SELECT email, full_name, plan FROM public.profiles;
