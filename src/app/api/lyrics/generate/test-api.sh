#!/bin/bash
# 歌词生成 API 测试脚本

API_URL="http://localhost:3000/api/lyrics/generate"

echo "=========================================="
echo "测试 1: 产品推广场景 - 普通话"
echo "=========================================="
curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "scene": "product",
    "dialect": "mandarin",
    "productInfo": {
      "name": "燕之屋鲜炖燕窝",
      "sellingPoints": ["新鲜", "营养", "方便", "0添加"]
    }
  }'
echo -e "\n"

echo "=========================================="
echo "测试 2: 搞笑洗脑场景 - 粤语"
echo "=========================================="
curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "scene": "funny",
    "dialect": "cantonese",
    "funnyInfo": {
      "theme": "打工人的日常",
      "keywords": ["摸鱼", "内卷", "加班", "996"]
    }
  }'
echo -e "\n"

echo "=========================================="
echo "测试 3: IP混剪场景 - 东北话"
echo "=========================================="
curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "scene": "ip",
    "dialect": "dongbei",
    "ipInfo": {
      "name": "原神",
      "coreElements": ["角色", "剧情", "探索"],
      "mood": "酷炫"
    }
  }'
echo -e "\n"

echo "=========================================="
echo "测试 4: 日常Vlog场景 - 四川话"
echo "=========================================="
curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "scene": "vlog",
    "dialect": "sichuan",
    "vlogInfo": {
      "activities": ["吃火锅", "逛街", "看电影"],
      "location": "成都太古里",
      "mood": "轻松"
    }
  }'
echo -e "\n"

echo "=========================================="
echo "测试 5: 缺少必填字段 - 应该返回错误"
echo "=========================================="
curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "scene": "product"
  }'
echo -e "\n"

echo "测试完成！"
