-- 订阅系统数据库设计
-- Subscription System Schema

-- 订阅计划表
CREATE TABLE IF NOT EXISTS subscription_plans (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  price INTEGER NOT NULL,           -- 价格（分）
  credits_per_month INTEGER NOT NULL, -- 每月积分数
  features JSONB NOT NULL,          -- 功能列表
  max_resolution VARCHAR(20) NOT NULL, -- 最大分辨率
  dialects TEXT[] NOT NULL,         -- 支持的方言
  has_watermark BOOLEAN NOT NULL DEFAULT true,
  priority_queue BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 用户订阅表
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id VARCHAR(50) NOT NULL REFERENCES subscription_plans(id),
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- active, expired, cancelled, pending
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  wechat_subscription_id VARCHAR(100), -- 微信订阅ID
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'active', 'expired', 'cancelled'))
);

-- 订阅支付记录表
CREATE TABLE IF NOT EXISTS subscription_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES user_subscriptions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, paid, failed, refunded
  wechat_order_id VARCHAR(100),
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_payment_status CHECK (status IN ('pending', 'paid', 'failed', 'refunded'))
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_period_end ON user_subscriptions(current_period_end);
CREATE INDEX IF NOT EXISTS idx_subscription_payments_subscription_id ON subscription_payments(subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_payments_user_id ON subscription_payments(user_id);

-- RLS 策略
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_payments ENABLE ROW LEVEL SECURITY;

-- 订阅计划：所有人可读
CREATE POLICY "订阅计划公开可读" ON subscription_plans
  FOR SELECT USING (active = true);

-- 用户订阅：用户只能查看自己的订阅
CREATE POLICY "用户查看自己的订阅" ON user_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "用户创建自己的订阅" ON user_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 订阅支付：用户只能查看自己的支付记录
CREATE POLICY "用户查看自己的支付记录" ON subscription_payments
  FOR SELECT USING (auth.uid() = user_id);

-- 初始数据：订阅计划
INSERT INTO subscription_plans (id, name, price, credits_per_month, features, max_resolution, dialects, has_watermark, priority_queue, sort_order) VALUES
('free', '免费版', 0, 0,
  '["每日2积分", "基础场景", "基础字幕"]'::jsonb,
  '720p',
  ARRAY['mandarin'],
  true, false, 0),

('lite', '轻量版', 8900, 60,
  '["每月60积分", "全部场景", "高级字幕", "无水印", "1080p导出", "2种方言"]'::jsonb,
  '1080p',
  ARRAY['mandarin', 'cantonese'],
  false, false, 1),

('pro', '专业版', 13900, 200,
  '["每月200积分", "全部场景", "高级特效", "无水印", "1080p导出", "全部方言", "优先队列", "专属客服"]'::jsonb,
  '1080p',
  ARRAY['mandarin', 'cantonese', 'dongbei', 'sichuan'],
  false, true, 2)
ON CONFLICT (id) DO NOTHING;

-- 更新时间触发器
CREATE OR REPLACE FUNCTION update_subscription_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER subscription_plans_updated_at
  BEFORE UPDATE ON subscription_plans
  FOR EACH ROW EXECUTE FUNCTION update_subscription_updated_at();

CREATE TRIGGER user_subscriptions_updated_at
  BEFORE UPDATE ON user_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_subscription_updated_at();

-- 订阅续费函数
CREATE OR REPLACE FUNCTION renew_subscription(
  p_subscription_id UUID
) RETURNS void AS $$
DECLARE
  v_subscription user_subscriptions%ROWTYPE;
  v_plan subscription_plans%ROWTYPE;
BEGIN
  -- 获取订阅信息
  SELECT * INTO v_subscription FROM user_subscriptions WHERE id = p_subscription_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION '订阅不存在';
  END IF;

  -- 获取计划信息
  SELECT * INTO v_plan FROM subscription_plans WHERE id = v_subscription.plan_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION '计划不存在';
  END IF;

  -- 更新订阅周期
  UPDATE user_subscriptions
  SET
    current_period_start = NOW(),
    current_period_end = NOW() + INTERVAL '1 month',
    status = 'active',
    updated_at = NOW()
  WHERE id = p_subscription_id;

  -- 增加用户积分
  PERFORM add_user_credits(
    v_subscription.user_id,
    v_plan.credits_per_month,
    'bonus',
    '订阅续费赠送积分',
    NULL,
    NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 检查用户权益函数
CREATE OR REPLACE FUNCTION check_user_entitlement(
  p_user_id UUID,
  p_entitlement TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_subscription user_subscriptions%ROWTYPE;
  v_plan subscription_plans%ROWTYPE;
BEGIN
  -- 获取用户当前活跃订阅
  SELECT * INTO v_subscription
  FROM user_subscriptions
  WHERE user_id = p_user_id
    AND status = 'active'
    AND current_period_end > NOW()
  ORDER BY current_period_end DESC
  LIMIT 1;

  -- 如果没有订阅，使用免费版
  IF NOT FOUND THEN
    SELECT * INTO v_plan FROM subscription_plans WHERE id = 'free';
  ELSE
    SELECT * INTO v_plan FROM subscription_plans WHERE id = v_subscription.plan_id;
  END IF;

  -- 检查权益
  CASE p_entitlement
    WHEN '1080p' THEN
      RETURN v_plan.max_resolution = '1080p';
    WHEN 'no_watermark' THEN
      RETURN NOT v_plan.has_watermark;
    WHEN 'priority_queue' THEN
      RETURN v_plan.priority_queue;
    WHEN 'all_dialects' THEN
      RETURN array_length(v_plan.dialects, 1) >= 4;
    ELSE
      RETURN false;
  END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
