-- WhyFire 积分系统数据库 Schema
-- Credit System Database Schema

-- 启用 UUID 扩展
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 积分包配置表
CREATE TABLE credit_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  credits INTEGER NOT NULL,
  price INTEGER NOT NULL, -- 价格（分）
  original_price INTEGER,
  bonus INTEGER DEFAULT 0,
  popular BOOLEAN DEFAULT FALSE,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 用户积分表
CREATE TABLE user_credits (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  balance INTEGER DEFAULT 0,
  total_purchased INTEGER DEFAULT 0,
  total_used INTEGER DEFAULT 0,
  total_bonus INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 积分交易记录表
CREATE TABLE credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('purchase', 'use', 'refund', 'bonus')),
  amount INTEGER NOT NULL,
  balance INTEGER NOT NULL,
  package_id UUID REFERENCES credit_packages(id),
  order_id UUID,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 支付订单表
CREATE TABLE payment_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  package_id UUID NOT NULL REFERENCES credit_packages(id),
  amount INTEGER NOT NULL,
  credits INTEGER NOT NULL,
  bonus INTEGER DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
  wechat_order_id VARCHAR(64),
  wechat_prepay_id VARCHAR(64),
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expired_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- 索引
CREATE INDEX idx_user_credits_user ON user_credits(user_id);
CREATE INDEX idx_credit_transactions_user ON credit_transactions(user_id);
CREATE INDEX idx_credit_transactions_created ON credit_transactions(created_at DESC);
CREATE INDEX idx_credit_transactions_type ON credit_transactions(type);
CREATE INDEX idx_payment_orders_user ON payment_orders(user_id);
CREATE INDEX idx_payment_orders_status ON payment_orders(status);
CREATE INDEX idx_payment_orders_created ON payment_orders(created_at DESC);
CREATE INDEX idx_payment_orders_wechat_order ON payment_orders(wechat_order_id);

-- 更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- credit_packages 更新触发器
CREATE TRIGGER update_credit_packages_updated_at
    BEFORE UPDATE ON credit_packages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- user_credits 更新触发器
CREATE TRIGGER update_user_credits_updated_at
    BEFORE UPDATE ON user_credits
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 初始积分包数据
INSERT INTO credit_packages (name, credits, price, original_price, bonus, popular, description, sort_order) VALUES
('体验包', 10, 100, NULL, 0, FALSE, '10次生成体验', 1),
('基础包', 50, 490, 500, 0, FALSE, '50次生成', 2),
('超值包', 120, 990, 1200, 10, TRUE, '120次+10次赠送', 3),
('专业包', 300, 1990, 3000, 30, FALSE, '300次+30次赠送', 4),
('企业包', 1000, 4990, 10000, 100, FALSE, '1000次+100次赠送', 5);

-- 用户积分初始化触发器（新用户注册时自动创建积分记录）
CREATE OR REPLACE FUNCTION handle_new_user_credits()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_credits (user_id, balance, total_purchased, total_used, total_bonus)
    VALUES (NEW.id, 0, 0, 0, 0);
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 如果使用 Supabase Auth，在用户创建时自动初始化积分
-- CREATE TRIGGER on_auth_user_created
--     AFTER INSERT ON auth.users
--     FOR EACH ROW
--     EXECUTE FUNCTION handle_new_user_credits();

-- RLS (Row Level Security) 策略

-- credit_packages 表 RLS
ALTER TABLE credit_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "积分包配置对所有用户只读"
    ON credit_packages FOR SELECT
    USING (active = TRUE);

CREATE POLICY "管理员可管理积分包配置"
    ON credit_packages FOR ALL
    USING (auth.jwt() ->> 'role' = 'admin');

-- user_credits 表 RLS
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "用户只能查看自己的积分"
    ON user_credits FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "用户不能直接修改积分（通过函数操作）"
    ON user_credits FOR ALL
    USING (FALSE);

-- credit_transactions 表 RLS
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "用户只能查看自己的交易记录"
    ON credit_transactions FOR SELECT
    USING (auth.uid() = user_id);

-- payment_orders 表 RLS
ALTER TABLE payment_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "用户只能查看自己的订单"
    ON payment_orders FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "用户可以创建订单"
    ON payment_orders FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- 辅助函数：获取用户当前积分
CREATE OR REPLACE FUNCTION get_user_credits(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    user_balance INTEGER;
BEGIN
    SELECT balance INTO user_balance
    FROM user_credits
    WHERE user_id = user_uuid;

    RETURN COALESCE(user_balance, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 辅助函数：增加用户积分
CREATE OR REPLACE FUNCTION add_user_credits(
    user_uuid UUID,
    credit_amount INTEGER,
    transaction_type VARCHAR(20),
    pkg_id UUID DEFAULT NULL,
    ord_id UUID DEFAULT NULL,
    trans_description TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    new_balance INTEGER;
    transaction_uuid UUID;
BEGIN
    -- 更新用户积分
    INSERT INTO user_credits (user_id, balance, total_purchased, total_used, total_bonus)
    VALUES (user_uuid, credit_amount,
            CASE WHEN transaction_type IN ('purchase', 'bonus') THEN credit_amount ELSE 0 END,
            0,
            CASE WHEN transaction_type = 'bonus' THEN credit_amount ELSE 0 END)
    ON CONFLICT (user_id)
    DO UPDATE SET
        balance = user_credits.balance + credit_amount,
        total_purchased = user_credits.total_purchased +
            CASE WHEN transaction_type IN ('purchase') THEN credit_amount ELSE 0 END,
        total_bonus = user_credits.total_bonus +
            CASE WHEN transaction_type = 'bonus' THEN credit_amount ELSE 0 END,
        updated_at = NOW()
    RETURNING balance INTO new_balance;

    -- 创建交易记录
    INSERT INTO credit_transactions (user_id, type, amount, balance, package_id, order_id, description)
    VALUES (user_uuid, transaction_type, credit_amount, new_balance, pkg_id, ord_id, trans_description)
    RETURNING id INTO transaction_uuid;

    RETURN transaction_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 辅助函数：扣除用户积分
CREATE OR REPLACE FUNCTION deduct_user_credits(
    user_uuid UUID,
    credit_amount INTEGER,
    ord_id UUID DEFAULT NULL,
    trans_description TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    current_balance INTEGER;
    new_balance INTEGER;
    transaction_uuid UUID;
    result JSONB;
BEGIN
    -- 获取当前余额
    SELECT balance INTO current_balance
    FROM user_credits
    WHERE user_id = user_uuid;

    IF current_balance IS NULL THEN
        RETURN jsonb_build_object('success', FALSE, 'error', '用户积分记录不存在');
    END IF;

    IF current_balance < credit_amount THEN
        RETURN jsonb_build_object('success', FALSE, 'error', '积分余额不足', 'balance', current_balance);
    END IF;

    -- 更新用户积分
    UPDATE user_credits
    SET balance = balance - credit_amount,
        total_used = total_used + credit_amount,
        updated_at = NOW()
    WHERE user_id = user_uuid
    RETURNING balance INTO new_balance;

    -- 创建交易记录
    INSERT INTO credit_transactions (user_id, type, amount, balance, order_id, description)
    VALUES (user_uuid, 'use', -credit_amount, new_balance, ord_id, trans_description)
    RETURNING id INTO transaction_uuid;

    RETURN jsonb_build_object(
        'success', TRUE,
        'transactionId', transaction_uuid,
        'balance', new_balance
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 辅助函数：获取用户交易记录
CREATE OR REPLACE FUNCTION get_user_transactions(
    user_uuid UUID,
    limit_count INTEGER DEFAULT 20,
    offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    type VARCHAR(20),
    amount INTEGER,
    balance INTEGER,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ct.id,
        ct.type,
        ct.amount,
        ct.balance,
        ct.description,
        ct.created_at
    FROM credit_transactions ct
    WHERE ct.user_id = user_uuid
    ORDER BY ct.created_at DESC
    LIMIT limit_count
    OFFSET offset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 注释
COMMENT ON TABLE credit_packages IS '积分包配置表';
COMMENT ON TABLE user_credits IS '用户积分表';
COMMENT ON TABLE credit_transactions IS '积分交易记录表';
COMMENT ON TABLE payment_orders IS '支付订单表';

COMMENT ON COLUMN credit_packages.price IS '价格（单位：分）';
COMMENT ON COLUMN credit_packages.original_price IS '原价（单位：分），用于显示折扣';
COMMENT ON COLUMN payment_orders.amount IS '支付金额（单位：分）';
COMMENT ON COLUMN credit_transactions.amount IS '积分变动数量，正数为增加，负数为减少';
COMMENT ON COLUMN credit_transactions.balance IS '交易后的积分余额';
