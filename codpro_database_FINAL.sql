-- ============================================================
-- COD PRO v5 — Supabase PostgreSQL Schema
-- Arabic RTL SaaS Platform for Algeria E-Commerce (COD)
-- ============================================================

-- ============================================================
-- EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ============================================================
-- TABLE: profiles
-- Auto-created on signup via trigger
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id          UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name   TEXT,
    email       TEXT,
    avatar_url  TEXT,
    plan        TEXT        NOT NULL DEFAULT 'free',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: daily_logs
-- Daily COD metrics per user per date
-- ============================================================
CREATE TABLE IF NOT EXISTS public.daily_logs (
    id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    log_date        DATE        NOT NULL,
    leads           INTEGER     NOT NULL DEFAULT 0,
    confirmed       INTEGER     NOT NULL DEFAULT 0,
    delivered       INTEGER     NOT NULL DEFAULT 0,
    returned        INTEGER     NOT NULL DEFAULT 0,
    revenue         NUMERIC(12, 2) NOT NULL DEFAULT 0,
    ad_spend        NUMERIC(12, 2) NOT NULL DEFAULT 0,
    cogs            NUMERIC(12, 2) NOT NULL DEFAULT 0,
    shipping_cost   NUMERIC(12, 2) NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT daily_logs_user_date_unique UNIQUE (user_id, log_date)
);

-- ============================================================
-- TABLE: products
-- Product catalog
-- ============================================================
CREATE TABLE IF NOT EXISTS public.products (
    id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name        TEXT        NOT NULL,
    price       NUMERIC(12, 2) NOT NULL DEFAULT 0,
    cost        NUMERIC(12, 2) NOT NULL DEFAULT 0,
    category    TEXT,
    supplier    TEXT,
    stock       INTEGER     NOT NULL DEFAULT 0,
    status      TEXT        NOT NULL DEFAULT 'active',
    image_url   TEXT,
    description TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: campaigns
-- Ad campaigns
-- ============================================================
CREATE TABLE IF NOT EXISTS public.campaigns (
    id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name        TEXT        NOT NULL,
    platform    TEXT,
    budget      NUMERIC(12, 2) NOT NULL DEFAULT 0,
    spent       NUMERIC(12, 2) NOT NULL DEFAULT 0,
    leads       INTEGER     NOT NULL DEFAULT 0,
    confirmed   INTEGER     NOT NULL DEFAULT 0,
    status      TEXT        NOT NULL DEFAULT 'active',
    start_date  DATE,
    end_date    DATE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: sourcing
-- Supplier pipeline
-- ============================================================
CREATE TABLE IF NOT EXISTS public.sourcing (
    id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    supplier_name   TEXT        NOT NULL,
    product_name    TEXT        NOT NULL,
    price           NUMERIC(12, 2) NOT NULL DEFAULT 0,
    moq             INTEGER     NOT NULL DEFAULT 1,
    lead_time       TEXT,
    status          TEXT        NOT NULL DEFAULT 'prospect',
    country         TEXT,
    contact         TEXT,
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: orders
-- Individual customer orders
-- ============================================================
CREATE TABLE IF NOT EXISTS public.orders (
    id                  UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    order_number        TEXT        NOT NULL,
    product_name        TEXT        NOT NULL,
    customer_name       TEXT        NOT NULL,
    customer_phone      TEXT        NOT NULL,
    wilaya              TEXT        NOT NULL,
    commune             TEXT,
    address             TEXT,
    quantity            INTEGER     NOT NULL DEFAULT 1,
    price               NUMERIC(12, 2) NOT NULL DEFAULT 0,
    total               NUMERIC(12, 2) NOT NULL DEFAULT 0,
    status              TEXT        NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending', 'confirmed', 'shipped', 'delivered', 'returned')),
    delivery_company    TEXT,
    tracking_number     TEXT,
    notes               TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: subscription_events
-- Stripe billing events
-- ============================================================
CREATE TABLE IF NOT EXISTS public.subscription_events (
    id                      UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id                 UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    stripe_customer_id      TEXT,
    stripe_subscription_id  TEXT,
    event_type              TEXT        NOT NULL,
    plan                    TEXT,
    amount                  NUMERIC(12, 2),
    currency                TEXT        NOT NULL DEFAULT 'usd',
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- ROW LEVEL SECURITY — Enable on all tables
-- ============================================================
ALTER TABLE public.profiles             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_logs           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sourcing             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_events  ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- RLS POLICIES: profiles
-- ============================================================
CREATE POLICY "profiles_select_own"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (id = auth.uid());

CREATE POLICY "profiles_insert_own"
    ON public.profiles FOR INSERT
    TO authenticated
    WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_update_own"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_delete_own"
    ON public.profiles FOR DELETE
    TO authenticated
    USING (id = auth.uid());


-- ============================================================
-- RLS POLICIES: daily_logs
-- ============================================================
CREATE POLICY "daily_logs_select_own"
    ON public.daily_logs FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "daily_logs_insert_own"
    ON public.daily_logs FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "daily_logs_update_own"
    ON public.daily_logs FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "daily_logs_delete_own"
    ON public.daily_logs FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());


-- ============================================================
-- RLS POLICIES: products
-- ============================================================
CREATE POLICY "products_select_own"
    ON public.products FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "products_insert_own"
    ON public.products FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "products_update_own"
    ON public.products FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "products_delete_own"
    ON public.products FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());


-- ============================================================
-- RLS POLICIES: campaigns
-- ============================================================
CREATE POLICY "campaigns_select_own"
    ON public.campaigns FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "campaigns_insert_own"
    ON public.campaigns FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "campaigns_update_own"
    ON public.campaigns FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "campaigns_delete_own"
    ON public.campaigns FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());


-- ============================================================
-- RLS POLICIES: sourcing
-- ============================================================
CREATE POLICY "sourcing_select_own"
    ON public.sourcing FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "sourcing_insert_own"
    ON public.sourcing FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "sourcing_update_own"
    ON public.sourcing FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "sourcing_delete_own"
    ON public.sourcing FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());


-- ============================================================
-- RLS POLICIES: orders
-- ============================================================
CREATE POLICY "orders_select_own"
    ON public.orders FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "orders_insert_own"
    ON public.orders FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "orders_update_own"
    ON public.orders FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "orders_delete_own"
    ON public.orders FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());


-- ============================================================
-- RLS POLICIES: subscription_events
-- ============================================================
CREATE POLICY "subscription_events_select_own"
    ON public.subscription_events FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "subscription_events_insert_own"
    ON public.subscription_events FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "subscription_events_update_own"
    ON public.subscription_events FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "subscription_events_delete_own"
    ON public.subscription_events FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());


-- ============================================================
-- TRIGGER: Auto-create profile on signup
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, email, avatar_url, plan, created_at, updated_at)
    VALUES (
        NEW.id,
        NEW.raw_user_meta_data ->> 'full_name',
        NEW.email,
        NEW.raw_user_meta_data ->> 'avatar_url',
        'free',
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();


-- ============================================================
-- TRIGGER: Auto-update updated_at on daily_logs
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER daily_logs_set_updated_at
    BEFORE UPDATE ON public.daily_logs
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER orders_set_updated_at
    BEFORE UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER profiles_set_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();


-- ============================================================
-- INDEXES — Common query patterns
-- ============================================================

-- daily_logs: fetch by user + date range
CREATE INDEX IF NOT EXISTS idx_daily_logs_user_id        ON public.daily_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_daily_logs_user_date      ON public.daily_logs (user_id, log_date DESC);

-- products: fetch by user + status/category
CREATE INDEX IF NOT EXISTS idx_products_user_id          ON public.products (user_id);
CREATE INDEX IF NOT EXISTS idx_products_user_status      ON public.products (user_id, status);
CREATE INDEX IF NOT EXISTS idx_products_user_category    ON public.products (user_id, category);

-- campaigns: fetch by user + status
CREATE INDEX IF NOT EXISTS idx_campaigns_user_id         ON public.campaigns (user_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_user_status     ON public.campaigns (user_id, status);
CREATE INDEX IF NOT EXISTS idx_campaigns_user_platform   ON public.campaigns (user_id, platform);

-- sourcing: fetch by user + status
CREATE INDEX IF NOT EXISTS idx_sourcing_user_id          ON public.sourcing (user_id);
CREATE INDEX IF NOT EXISTS idx_sourcing_user_status      ON public.sourcing (user_id, status);

-- orders: fetch by user + status/wilaya/date
CREATE INDEX IF NOT EXISTS idx_orders_user_id            ON public.orders (user_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_status        ON public.orders (user_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_user_wilaya        ON public.orders (user_id, wilaya);
CREATE INDEX IF NOT EXISTS idx_orders_user_created_at    ON public.orders (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_order_number       ON public.orders (user_id, order_number);

-- subscription_events: fetch by user + stripe ids
CREATE INDEX IF NOT EXISTS idx_sub_events_user_id        ON public.subscription_events (user_id);
CREATE INDEX IF NOT EXISTS idx_sub_events_customer_id    ON public.subscription_events (stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_sub_events_subscription_id ON public.subscription_events (stripe_subscription_id);
