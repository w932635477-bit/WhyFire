-- =====================================================
-- WhyFire v2.0 - 视频模板数据库 Schema
-- =====================================================

-- 视频模板表
CREATE TABLE IF NOT EXISTS video_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL,
  style VARCHAR(50) NOT NULL,
  thumbnail_url TEXT NOT NULL,
  preview_video_url TEXT,
  template_file_url TEXT,

  duration INTEGER DEFAULT 30,
  aspect_ratio VARCHAR(10) DEFAULT '16:9',

  customizable_fields JSONB DEFAULT '[]',

  background_music_url TEXT,
  music_style VARCHAR(50),

  use_count INTEGER DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0,
  rating_count INTEGER DEFAULT 0,

  premium BOOLEAN DEFAULT FALSE,
  price INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- 约束
  CONSTRAINT valid_aspect_ratio CHECK (aspect_ratio IN ('16:9', '9:16', '1:1')),
  CONSTRAINT valid_rating CHECK (rating >= 0 AND rating <= 5),
  CONSTRAINT valid_category CHECK (category IN ('product', 'funny', 'ip', 'vlog', 'festival', 'seasonal')),
  CONSTRAINT valid_style CHECK (style IN ('modern', 'retro', 'minimalist', 'dynamic', 'elegant'))
);

-- 用户模板使用记录表
CREATE TABLE IF NOT EXISTS user_template_usages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES video_templates(id) ON DELETE CASCADE,
  project_id UUID,
  customized_fields JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 模板评分表
CREATE TABLE IF NOT EXISTS template_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES video_templates(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- 确保每个用户对每个模板只能评分一次
  UNIQUE(user_id, template_id)
);

-- =====================================================
-- 索引
-- =====================================================

-- 模板表索引
CREATE INDEX IF NOT EXISTS idx_templates_category ON video_templates(category);
CREATE INDEX IF NOT EXISTS idx_templates_style ON video_templates(style);
CREATE INDEX IF NOT EXISTS idx_templates_premium ON video_templates(premium);
CREATE INDEX IF NOT EXISTS idx_templates_active ON video_templates(active);
CREATE INDEX IF NOT EXISTS idx_templates_rating ON video_templates(rating DESC);
CREATE INDEX IF NOT EXISTS idx_templates_use_count ON video_templates(use_count DESC);
CREATE INDEX IF NOT EXISTS idx_templates_created_at ON video_templates(created_at DESC);

-- 使用记录表索引
CREATE INDEX IF NOT EXISTS idx_template_usages_user ON user_template_usages(user_id);
CREATE INDEX IF NOT EXISTS idx_template_usages_template ON user_template_usages(template_id);
CREATE INDEX IF NOT EXISTS idx_template_usages_created_at ON user_template_usages(created_at DESC);

-- 评分表索引
CREATE INDEX IF NOT EXISTS idx_template_ratings_template ON template_ratings(template_id);
CREATE INDEX IF NOT EXISTS idx_template_ratings_user ON template_ratings(user_id);

-- =====================================================
-- 触发器：自动更新 updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_video_templates_updated_at
  BEFORE UPDATE ON video_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 触发器：更新模板评分
-- =====================================================

CREATE OR REPLACE FUNCTION update_template_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE video_templates
  SET
    rating = (
      SELECT COALESCE(AVG(rating), 0)
      FROM template_ratings
      WHERE template_id = COALESCE(NEW.template_id, OLD.template_id)
    ),
    rating_count = (
      SELECT COUNT(*)
      FROM template_ratings
      WHERE template_id = COALESCE(NEW.template_id, OLD.template_id)
    )
  WHERE id = COALESCE(NEW.template_id, OLD.template_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

CREATE TRIGGER update_template_rating_trigger
  AFTER INSERT OR UPDATE OR DELETE ON template_ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_template_rating();

-- =====================================================
-- 初始模板数据
-- =====================================================

INSERT INTO video_templates (name, description, category, style, thumbnail_url, duration, customizable_fields, premium, price) VALUES
-- 产品推广模板
('产品展示-A', '简约现代产品展示模板，适合电子产品、时尚单品等', 'product', 'modern', '/templates/thumbs/product-a.jpg', 30,
  '[{"key": "productName", "type": "text", "label": "产品名称", "required": true, "placeholder": "输入产品名称"}, {"key": "productImage", "type": "image", "label": "产品图片", "required": true, "validation": {"fileTypes": ["jpg", "png", "webp"], "maxSize": 5242880}}]'::jsonb,
  FALSE, 0),

('产品展示-B', '高端优雅产品展示模板，适合奢侈品、珠宝首饰', 'product', 'elegant', '/templates/thumbs/product-b.jpg', 45,
  '[{"key": "productName", "type": "text", "label": "产品名称", "required": true}, {"key": "productImage", "type": "image", "label": "产品图片", "required": true}, {"key": "brandLogo", "type": "image", "label": "品牌Logo", "required": false}]'::jsonb,
  TRUE, 100),

-- 搞笑模板
('搞笑日常-A', '轻松搞笑风格模板，适合日常趣事分享', 'funny', 'dynamic', '/templates/thumbs/funny-a.jpg', 15,
  '[{"key": "joke", "type": "text", "label": "搞笑内容", "required": true, "placeholder": "输入你的搞笑段子"}, {"key": "sticker", "type": "image", "label": "贴纸/表情", "required": false}]'::jsonb,
  FALSE, 0),

('搞笑配音-A', '经典搞笑配音模板，适合配音创作', 'funny', 'dynamic', '/templates/thumbs/funny-b.jpg', 20,
  '[{"key": "dialogue", "type": "text", "label": "台词内容", "required": true, "validation": {"maxLength": 200}}, {"key": "voiceStyle", "type": "text", "label": "配音风格", "required": false}]'::jsonb,
  FALSE, 0),

-- IP混剪模板
('IP混剪-A', '热门IP混剪模板，适合影视、动漫混剪', 'ip', 'dynamic', '/templates/thumbs/ip-a.jpg', 60,
  '[{"key": "videoClips", "type": "video", "label": "视频片段", "required": true, "validation": {"fileTypes": ["mp4", "mov"], "maxSize": 104857600}}, {"key": "bgm", "type": "music", "label": "背景音乐", "required": true}]'::jsonb,
  TRUE, 200),

-- 日常Vlog模板
('日常Vlog-A', '清新简约Vlog模板，适合日常生活记录', 'vlog', 'minimalist', '/templates/thumbs/vlog-a.jpg', 60,
  '[{"key": "title", "type": "text", "label": "视频标题", "required": true}, {"key": "videoClips", "type": "video", "label": "视频片段", "required": true}]'::jsonb,
  FALSE, 0),

('旅行Vlog-A', '旅行记录专用模板，适合游记、景点介绍', 'vlog', 'modern', '/templates/thumbs/vlog-b.jpg', 90,
  '[{"key": "location", "type": "text", "label": "目的地", "required": true}, {"key": "videoClips", "type": "video", "label": "视频片段", "required": true}, {"key": "bgm", "type": "music", "label": "背景音乐", "required": false}]'::jsonb,
  TRUE, 150),

-- 节日主题模板
('节日祝福-A', '通用节日祝福模板，适合各类节日', 'festival', 'elegant', '/templates/thumbs/festival-a.jpg', 20,
  '[{"key": "greeting", "type": "text", "label": "祝福语", "required": true, "placeholder": "输入你的祝福"}, {"key": "recipientName", "type": "text", "label": "收件人名字", "required": false}]'::jsonb,
  FALSE, 0),

('春节祝福-A', '春节专属祝福模板，喜庆中国风', 'festival', 'retro', '/templates/thumbs/festival-spring.jpg', 25,
  '[{"key": "greeting", "type": "text", "label": "新春祝福", "required": true}, {"key": "year", "type": "text", "label": "生肖年份", "required": false}]'::jsonb,
  FALSE, 0),

-- 季节主题模板
('春夏清新-A', '春夏季节清新模板，适合自然、户外内容', 'seasonal', 'minimalist', '/templates/thumbs/seasonal-spring.jpg', 30,
  '[{"key": "videoClips", "type": "video", "label": "视频片段", "required": true}, {"key": "bgm", "type": "music", "label": "背景音乐", "required": false}]'::jsonb,
  FALSE, 0),

('秋冬温暖-A', '秋冬季节温暖模板，适合温馨、治愈内容', 'seasonal', 'elegant', '/templates/thumbs/seasonal-autumn.jpg', 30,
  '[{"key": "videoClips", "type": "video", "label": "视频片段", "required": true}, {"key": "moodText", "type": "text", "label": "心情文字", "required": false}]'::jsonb,
  FALSE, 0);

-- =====================================================
-- 视图：热门模板
-- =====================================================

CREATE OR REPLACE VIEW popular_templates AS
SELECT
  id,
  name,
  description,
  category,
  style,
  thumbnail_url,
  rating,
  use_count,
  premium,
  price
FROM video_templates
WHERE active = TRUE
ORDER BY use_count DESC, rating DESC
LIMIT 20;

-- =====================================================
-- 视图：最新模板
-- =====================================================

CREATE OR REPLACE VIEW latest_templates AS
SELECT
  id,
  name,
  description,
  category,
  style,
  thumbnail_url,
  rating,
  premium,
  price,
  created_at
FROM video_templates
WHERE active = TRUE
ORDER BY created_at DESC
LIMIT 20;

-- =====================================================
-- 视图：高分模板
-- =====================================================

CREATE OR REPLACE VIEW top_rated_templates AS
SELECT
  id,
  name,
  description,
  category,
  style,
  thumbnail_url,
  rating,
  rating_count,
  use_count,
  premium,
  price
FROM video_templates
WHERE active = TRUE AND rating_count >= 10
ORDER BY rating DESC, rating_count DESC
LIMIT 20;

-- =====================================================
-- 注释
-- =====================================================

COMMENT ON TABLE video_templates IS '视频模板表，存储所有可用的视频模板信息';
COMMENT ON TABLE user_template_usages IS '用户模板使用记录，记录用户使用模板的历史';
COMMENT ON TABLE template_ratings IS '模板评分表，存储用户对模板的评分和评论';

COMMENT ON COLUMN video_templates.category IS '模板分类：product(产品推广), funny(搞笑), ip(IP混剪), vlog(日常Vlog), festival(节日主题), seasonal(季节主题)';
COMMENT ON COLUMN video_templates.style IS '模板风格：modern(现代), retro(复古), minimalist(极简), dynamic(动感), elegant(优雅)';
COMMENT ON COLUMN video_templates.customizable_fields IS '可自定义字段配置，JSON格式存储';
COMMENT ON COLUMN video_templates.premium IS '是否为付费模板';
COMMENT ON COLUMN video_templates.price IS '模板价格（积分）';
