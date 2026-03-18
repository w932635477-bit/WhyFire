# WhyFire v2.0 数据库设计

> 返回 [TDD 主文档](./TDD.md)

---

## 1. 数据库选型

| 组件 | 选择 | 用途 |
|------|------|------|
| **PostgreSQL** | Supabase | 主数据库，关系型数据存储 |
| **Redis** | Upstash | 缓存、会话、任务队列 |
| **对象存储** | Cloudflare R2 | 文件存储（视频、音频、图片） |

---

## 2. PostgreSQL 表结构设计

### 2.1 ER 图

```
┌─────────────┐       ┌─────────────────┐       ┌─────────────┐
│  profiles   │       │  subscriptions  │       │   orders    │
│             │       │                 │       │             │
│ id (PK)     │───┐   │ id (PK)         │   ┌───│ id (PK)     │
│ email       │   └──►│ user_id (FK)    │◄──┘   │ user_id (FK)│
│ nickname    │       │ plan_type       │       │ amount      │
│ role        │       │ status          │       │ status      │
└─────────────┘       └─────────────────┘       └─────────────┘
       │
       │
       ▼
┌─────────────┐       ┌─────────────────┐       ┌─────────────┐
│ user_points │       │ point_records   │       │   videos    │
│             │       │                 │       │             │
│ id (PK)     │       │ id (PK)         │       │ id (PK)     │
│ user_id (FK)│───┐   │ user_id (FK)    │   ┌───│ user_id (FK)│
│ balance     │   └──►│ type            │◄──┘   │ lyrics_id   │──┐
│ total_earned│       │ amount          │       │ video_url   │  │
└─────────────┘       │ balance_after   │       └─────────────┘  │
                      └─────────────────┘                        │
                                                                 │
                                                                 ▼
                                                         ┌─────────────┐
                                                         │   lyrics    │
                                                         │             │
                                                         │ id (PK)     │
                                                         │ user_id(FK) │
                                                         │ content     │
                                                         │ scene_type  │
                                                         │ chat_history│
                                                         └─────────────┘

关系说明:
- 用户 1:N 歌词 (一个用户可以创建多个歌词)
- 歌词 1:N 视频 (一个歌词可以用于多个视频)
- 视频 N:1 歌词 (一个视频使用一个歌词)
```

### 2.2 用户表 (users)

利用 Supabase Auth，扩展 profiles 表：

```sql
-- 扩展 Supabase auth.users
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email VARCHAR(255),
  phone VARCHAR(20) UNIQUE,
  nickname VARCHAR(50),
  avatar_url VARCHAR(500),
  role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('guest', 'user', 'vip', 'admin')),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deleted')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS 策略
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- 索引
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_role ON public.profiles(role);
```

### 2.3 订阅表 (subscriptions)

```sql
CREATE TABLE public.subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  plan_type VARCHAR(20) NOT NULL CHECK (plan_type IN ('free', 'light', 'pro')),
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled', 'pending')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  auto_renew BOOLEAN DEFAULT false,
  stripe_subscription_id VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_dates CHECK (end_date > start_date)
);

-- 索引
CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX idx_subscriptions_end_date ON public.subscriptions(end_date);

-- RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscriptions"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);
```

### 2.4 订单表 (orders)

```sql
CREATE TYPE payment_method AS ENUM ('wechat', 'alipay', 'stripe');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded', 'cancelled');
CREATE TYPE product_type AS ENUM ('subscription', 'points');

CREATE TABLE public.orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_no VARCHAR(32) UNIQUE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL NOT NULL,
  product_type product_type NOT NULL,
  product_detail JSONB NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  payment_method payment_method,
  payment_status payment_status DEFAULT 'pending',
  paid_at TIMESTAMPTZ,
  expired_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_amount CHECK (amount > 0)
);

-- 索引
CREATE INDEX idx_orders_user_id ON public.orders(user_id);
CREATE INDEX idx_orders_order_no ON public.orders(order_no);
CREATE INDEX idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX idx_orders_created_at ON public.orders(created_at DESC);

-- RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own orders"
  ON public.orders FOR SELECT
  USING (auth.uid() = user_id);
```

### 2.5 积分表 (user_points)

```sql
CREATE TABLE public.user_points (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  balance INTEGER DEFAULT 0 CHECK (balance >= 0),
  total_earned INTEGER DEFAULT 0,
  total_spent INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE UNIQUE INDEX idx_user_points_user_id ON public.user_points(user_id);

-- RLS
ALTER TABLE public.user_points ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own points"
  ON public.user_points FOR SELECT
  USING (auth.uid() = user_id);
```

### 2.6 积分记录表 (point_records)

```sql
CREATE TYPE point_record_type AS ENUM ('purchase', 'gift', 'spend', 'signin', 'refund', 'invite', 'subscribe');

CREATE TABLE public.point_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type point_record_type NOT NULL,
  amount INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  related_id UUID,
  remark VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_point_records_user_id ON public.point_records(user_id);
CREATE INDEX idx_point_records_type ON public.point_records(type);
CREATE INDEX idx_point_records_created_at ON public.point_records(created_at DESC);

-- RLS
ALTER TABLE public.point_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own records"
  ON public.point_records FOR SELECT
  USING (auth.uid() = user_id);
```

### 2.7 视频作品表 (videos)

```sql
CREATE TYPE scene_type AS ENUM ('product', 'funny', 'ip', 'vlog');
CREATE TYPE dialect_type AS ENUM ('mandarin', 'dongbei', 'cantonese', 'sichuan');
CREATE TYPE video_status AS ENUM ('draft', 'generating', 'completed', 'failed');

CREATE TABLE public.videos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title VARCHAR(100),
  scene_type scene_type NOT NULL,
  dialect dialect_type NOT NULL DEFAULT 'mandarin',
  lyrics_id UUID REFERENCES public.lyrics(id) ON DELETE SET NULL,  -- 关联歌词
  music_url VARCHAR(500),
  video_url VARCHAR(500),
  thumbnail_url VARCHAR(500),
  duration INTEGER,
  status video_status DEFAULT 'draft',
  is_public BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_videos_user_id ON public.videos(user_id);
CREATE INDEX idx_videos_status ON public.videos(status);
CREATE INDEX idx_videos_scene_type ON public.videos(scene_type);
CREATE INDEX idx_videos_lyrics_id ON public.videos(lyrics_id);
CREATE INDEX idx_videos_created_at ON public.videos(created_at DESC);
CREATE INDEX idx_videos_is_public ON public.videos(is_public) WHERE is_public = true;

-- RLS
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own videos"
  ON public.videos FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Public videos are viewable"
  ON public.videos FOR SELECT
  USING (is_public = true);
```

### 2.8 歌词表 (lyrics)

> **设计说明**：歌词与视频采用 **一对多** 关系。一个歌词可以被多个视频使用（用户可能用同一歌词生成不同风格的视频），但每个视频只能关联一个歌词。歌词独立于视频存在，支持先创建歌词后关联视频的创作流程。

```sql
CREATE TABLE public.lyrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  dialect dialect_type NOT NULL DEFAULT 'mandarin',
  style VARCHAR(50),
  scene_type scene_type,  -- 场景类型，用于生成时的上下文
  chat_history JSONB DEFAULT '[]',
  version INTEGER DEFAULT 1,
  is_finalized BOOLEAN DEFAULT false,  -- 是否已定稿
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_lyrics_user_id ON public.lyrics(user_id);
CREATE INDEX idx_lyrics_scene_type ON public.lyrics(scene_type);
CREATE INDEX idx_lyrics_created_at ON public.lyrics(created_at DESC);

-- RLS
ALTER TABLE public.lyrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own lyrics"
  ON public.lyrics FOR ALL
  USING (auth.uid() = user_id);
```

> **关系变更**：
> - `video_id` 从歌词表移除，改为视频表中存储 `lyrics_id`
> - 新增 `user_id` 直接关联用户，歌词独立于视频存在
> - 新增 `is_finalized` 标记歌词是否定稿
> - 新增 `scene_type` 记录歌词对应的场景类型

### 2.9 模板表 (templates)

```sql
CREATE TABLE public.templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  category scene_type NOT NULL,
  preview_url VARCHAR(500),
  video_url VARCHAR(500),
  config JSONB NOT NULL DEFAULT '{}',
  is_premium BOOLEAN DEFAULT false,
  use_count INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_templates_category ON public.templates(category);
CREATE INDEX idx_templates_status ON public.templates(status);
CREATE INDEX idx_templates_sort_order ON public.templates(sort_order);
```

### 2.10 异步任务表 (async_tasks)

```sql
CREATE TYPE task_type AS ENUM ('music_generation', 'video_synthesis');
CREATE TYPE task_status AS ENUM ('pending', 'processing', 'completed', 'failed');

CREATE TABLE public.async_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_type task_type NOT NULL,
  status task_status DEFAULT 'pending',
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  related_id UUID,
  input_data JSONB NOT NULL,
  output_data JSONB,
  error_message TEXT,
  progress INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  CONSTRAINT valid_progress CHECK (progress >= 0 AND progress <= 100)
);

-- 索引
CREATE INDEX idx_async_tasks_status ON public.async_tasks(status);
CREATE INDEX idx_async_tasks_user_id ON public.async_tasks(user_id);
CREATE INDEX idx_async_tasks_type_status ON public.async_tasks(task_type, status);
```

---

## 3. Redis 数据结构设计

### 3.1 会话缓存

```redis
# 用户会话
session:{user_id} = { profile, subscription, points }
TTL: 3600s (1小时)

# 命令
SET session:123e4567-e89b {...} EX 3600
GET session:123e4567-e89b
DEL session:123e4567-e89b
```

### 3.2 限流计数器

```redis
# API 限流 (滑动窗口)
ratelimit:{user_id}:{endpoint} = [timestamp1, timestamp2, ...]
TTL: 60s

# 命令示例 (使用 Upstash Redis)
RPUSH ratelimit:user123:lyrics_generate 1700000000
EXPIRE ratelimit:user123:lyrics_generate 60
LLEN ratelimit:user123:lyrics_generate
```

### 3.3 任务队列

```redis
# 音乐生成任务队列
queue:music_generation = [task_id1, task_id2, ...]

# 任务状态
task:music:{task_id} = { status, progress, result_url, error }
TTL: 3600s (1小时)

# 命令
LPUSH queue:music_generation task_id_123
RPOP queue:music_generation
SET task:music:task_id_123 '{"status":"processing","progress":30}' EX 3600
```

### 3.4 游客配额

```redis
# 游客每日配额 (IP 限制)
guest:quota:{ip}:{date} = count
TTL: 86400s (24小时)

# 命令
INCR guest:quota:192.168.1.1:2026-03-18
GET guest:quota:192.168.1.1:2026-03-18
```

### 3.5 热点数据缓存

```redis
# 模板列表缓存
cache:templates:all = [...templates]
TTL: 300s (5分钟)

# 订阅方案缓存
cache:subscription_plans = [...plans]
TTL: 86400s (24小时)

# 用户积分缓存
cache:points:{user_id} = balance
TTL: 60s
```

---

## 4. 数据库触发器

### 4.1 自动更新 updated_at

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 应用到所有需要的表
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_videos_updated_at
  BEFORE UPDATE ON public.videos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lyrics_updated_at
  BEFORE UPDATE ON public.lyrics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 4.2 新用户自动创建积分账户

```sql
CREATE OR REPLACE FUNCTION create_user_points()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_points (user_id, balance, total_earned)
  VALUES (NEW.id, 5, 5); -- 新用户赠送 5 积分
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_user_points_trigger
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION create_user_points();
```

### 4.3 订单支付成功后处理

```sql
CREATE OR REPLACE FUNCTION process_paid_order()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.payment_status = 'paid' AND OLD.payment_status != 'paid' THEN
    -- 根据产品类型处理
    IF NEW.product_type = 'points' THEN
      -- 增加积分
      UPDATE public.user_points
      SET balance = balance + (NEW.product_detail->>'points')::int,
          total_earned = total_earned + (NEW.product_detail->>'points')::int,
          updated_at = NOW()
      WHERE user_id = NEW.user_id;

      -- 记录积分变动
      INSERT INTO public.point_records (user_id, type, amount, balance_after, related_id, remark)
      SELECT
        NEW.user_id,
        'purchase',
        (NEW.product_detail->>'points')::int,
        balance,
        NEW.id,
        '购买积分包'
      FROM public.user_points
      WHERE user_id = NEW.user_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER process_paid_order_trigger
  AFTER UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION process_paid_order();
```

---

## 5. TypeScript 类型定义

```typescript
// types/database.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string | null
          phone: string | null
          nickname: string | null
          avatar_url: string | null
          role: 'guest' | 'user' | 'vip' | 'admin'
          status: 'active' | 'suspended' | 'deleted'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email?: string | null
          phone?: string | null
          nickname?: string | null
          avatar_url?: string | null
          role?: 'guest' | 'user' | 'vip' | 'admin'
          status?: 'active' | 'suspended' | 'deleted'
        }
        Update: {
          email?: string | null
          phone?: string | null
          nickname?: string | null
          avatar_url?: string | null
          role?: 'guest' | 'user' | 'vip' | 'admin'
          status?: 'active' | 'suspended' | 'deleted'
        }
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          plan_type: 'free' | 'light' | 'pro'
          status: 'active' | 'expired' | 'cancelled' | 'pending'
          start_date: string
          end_date: string
          auto_renew: boolean
          stripe_subscription_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          plan_type: 'free' | 'light' | 'pro'
          start_date: string
          end_date: string
          auto_renew?: boolean
        }
        Update: {
          plan_type?: 'free' | 'light' | 'pro'
          status?: 'active' | 'expired' | 'cancelled' | 'pending'
          auto_renew?: boolean
        }
      }
      user_points: {
        Row: {
          id: string
          user_id: string
          balance: number
          total_earned: number
          total_spent: number
          updated_at: string
        }
        Insert: never
        Update: never
      }
      videos: {
        Row: {
          id: string
          user_id: string
          title: string | null
          scene_type: 'product' | 'funny' | 'ip' | 'vlog'
          dialect: 'mandarin' | 'dongbei' | 'cantonese' | 'sichuan'
          lyrics_id: string | null
          music_url: string | null
          video_url: string | null
          thumbnail_url: string | null
          duration: number | null
          status: 'draft' | 'generating' | 'completed' | 'failed'
          is_public: boolean
          view_count: number
          config: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          scene_type: 'product' | 'funny' | 'ip' | 'vlog'
          dialect?: 'mandarin' | 'dongbei' | 'cantonese' | 'sichuan'
          title?: string
          lyrics_id?: string
        }
        Update: {
          title?: string
          lyrics_id?: string
          music_url?: string
          video_url?: string
          status?: 'draft' | 'generating' | 'completed' | 'failed'
        }
      }
      lyrics: {
        Row: {
          id: string
          user_id: string
          content: string
          dialect: 'mandarin' | 'dongbei' | 'cantonese' | 'sichuan'
          style: string | null
          scene_type: 'product' | 'funny' | 'ip' | 'vlog' | null
          chat_history: Json
          version: number
          is_finalized: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          content: string
          dialect?: 'mandarin' | 'dongbei' | 'cantonese' | 'sichuan'
          style?: string
          scene_type?: 'product' | 'funny' | 'ip' | 'vlog'
        }
        Update: {
          content?: string
          style?: string
          version?: number
          is_finalized?: boolean
        }
      }
    }
    Views: {}
    Functions: {}
    Enums: {
      scene_type: 'product' | 'funny' | 'ip' | 'vlog'
      dialect_type: 'mandarin' | 'dongbei' | 'cantonese' | 'sichuan'
      video_status: 'draft' | 'generating' | 'completed' | 'failed'
    }
  }
}

// 导出便捷类型
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Subscription = Database['public']['Tables']['subscriptions']['Row']
export type UserPoints = Database['public']['Tables']['user_points']['Row']
export type Video = Database['public']['Tables']['videos']['Row']
```

---

## 6. 数据库迁移策略

### 6.1 迁移文件命名规范

```
migrations/
├── 20260318000001_init_schema.sql
├── 20260318000002_add_triggers.sql
├── 20260318000003_add_templates.sql
└── 20260319000001_add_async_tasks.sql
```

### 6.2 迁移命令

```bash
# 使用 Supabase CLI
supabase db push

# 或手动执行
psql -f migrations/20260318000001_init_schema.sql
```

---

*返回 [TDD 主文档](./TDD.md)*
