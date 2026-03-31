-- WhyFire Database Schema
-- Run this in Supabase SQL Editor

-- ============================================
-- 1. public.users (profiles linked to auth.users)
-- ============================================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  email TEXT,
  wechat_openid TEXT,
  wechat_unionid TEXT,
  plan TEXT NOT NULL DEFAULT 'free'
    CHECK (plan IN ('free', 'lite', 'pro')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-create profile + credits on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, display_name, avatar_url, phone, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', '创作者'),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture'),
    COALESCE(NEW.raw_user_meta_data->>'phone', NEW.phone),
    COALESCE(NEW.email, '')
  );
  INSERT INTO public.user_credits (user_id, balance, total_purchased, total_used)
  VALUES (NEW.id, 6, 6, 0)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 2. public.user_credits
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_credits (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  balance INTEGER NOT NULL DEFAULT 0 CHECK (balance >= 0),
  total_purchased INTEGER NOT NULL DEFAULT 0,
  total_used INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- 3. public.credit_transactions
-- ============================================
CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('purchase', 'use', 'refund', 'bonus')),
  amount INTEGER NOT NULL,
  balance INTEGER NOT NULL,
  package_id UUID,
  order_id UUID,
  description TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_credit_transactions_user ON public.credit_transactions(user_id, created_at DESC);

-- ============================================
-- 4. public.credit_packages
-- ============================================
CREATE TABLE IF NOT EXISTS public.credit_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  credits INTEGER NOT NULL,
  price INTEGER NOT NULL,          -- price in fen (cents)
  original_price INTEGER,
  bonus INTEGER NOT NULL DEFAULT 0,
  popular BOOLEAN NOT NULL DEFAULT false,
  description TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed credit packages (idempotent)
INSERT INTO public.credit_packages (name, credits, price, original_price, bonus, popular, description, sort_order)
VALUES
  ('单次体验', 2, 690, NULL, 0, false, '1 次翻唱，适合尝鲜', 1),
  ('5 次包', 10, 2900, NULL, 0, false, '5 次翻唱，¥5.8/次', 2),
  ('15 次包', 30, 6900, 9900, 0, true, '15 次翻唱，¥4.6/次，最划算', 3)
ON CONFLICT DO NOTHING;

-- ============================================
-- 5. public.payment_orders
-- ============================================
CREATE TABLE IF NOT EXISTS public.payment_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  package_id UUID NOT NULL REFERENCES public.credit_packages(id),
  amount INTEGER NOT NULL,
  credits INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
  wechat_order_id TEXT,
  wechat_prepay_id TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expired_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '30 minutes')
);

CREATE INDEX IF NOT EXISTS idx_payment_orders_user ON public.payment_orders(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_orders_wechat ON public.payment_orders(wechat_order_id) WHERE wechat_order_id IS NOT NULL;

-- ============================================
-- 6. public.videos
-- ============================================
CREATE TABLE IF NOT EXISTS public.videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  thumbnail_url TEXT,
  video_url TEXT,
  duration INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'processing'
    CHECK (status IN ('completed', 'processing', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_videos_user ON public.videos(user_id, created_at DESC);

-- ============================================
-- Row Level Security (RLS)
-- ============================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_packages ENABLE ROW LEVEL SECURITY;

-- users: read/update own profile
CREATE POLICY "Users can read own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

-- user_credits: read own
CREATE POLICY "Users can read own credits" ON public.user_credits FOR SELECT USING (auth.uid() = user_id);

-- credit_transactions: read own
CREATE POLICY "Users can read own transactions" ON public.credit_transactions FOR SELECT USING (auth.uid() = user_id);

-- payment_orders: read/insert own
CREATE POLICY "Users can read own orders" ON public.payment_orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own orders" ON public.payment_orders FOR INSERT WITH CHECK (auth.uid() = user_id);

-- videos: full CRUD on own
CREATE POLICY "Users can read own videos" ON public.videos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own videos" ON public.videos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own videos" ON public.videos FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own videos" ON public.videos FOR DELETE USING (auth.uid() = user_id);

-- credit_packages: anyone can read active packages
CREATE POLICY "Anyone can read active packages" ON public.credit_packages FOR SELECT USING (active = true);

-- ============================================
-- RPC: add_user_credits
-- ============================================
CREATE OR REPLACE FUNCTION public.add_user_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_type TEXT,
  p_description TEXT,
  p_order_id UUID DEFAULT NULL,
  p_package_id UUID DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  v_new_balance INTEGER;
BEGIN
  UPDATE public.user_credits
  SET
    balance = balance + p_amount,
    total_purchased = CASE WHEN p_type IN ('purchase', 'bonus') THEN total_purchased + p_amount ELSE total_purchased END,
    total_used = CASE WHEN p_type = 'use' THEN total_used + ABS(p_amount) ELSE total_used END,
    updated_at = now()
  WHERE user_id = p_user_id
  RETURNING balance INTO v_new_balance;

  INSERT INTO public.credit_transactions (user_id, type, amount, balance, package_id, order_id, description)
  VALUES (p_user_id, p_type, p_amount, v_new_balance, p_package_id, p_order_id, p_description);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- RPC: deduct_user_credits
-- ============================================
CREATE OR REPLACE FUNCTION public.deduct_user_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_description TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_balance INTEGER;
BEGIN
  SELECT balance INTO v_balance FROM public.user_credits WHERE user_id = p_user_id FOR UPDATE;

  IF v_balance < p_amount THEN
    RETURN false;
  END IF;

  UPDATE public.user_credits
  SET balance = balance - p_amount,
      total_used = total_used + p_amount,
      updated_at = now()
  WHERE user_id = p_user_id;

  INSERT INTO public.credit_transactions (user_id, type, amount, balance, description)
  VALUES (p_user_id, 'use', -p_amount, v_balance - p_amount, p_description);

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
