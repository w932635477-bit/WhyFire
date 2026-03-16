#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
WhyFire 钩子视频分类入库工具
功能：扫描输入目录的视频，辅助分类并入库
"""

import os
import shutil
from pathlib import Path

# 项目根目录
PROJECT_ROOT = Path(__file__).parent.parent
INPUT_DIR = PROJECT_ROOT / "hooks" / "input"
OUTPUT_DIR = PROJECT_ROOT / "hooks" / "output"

# 钩子类型定义
HOOK_TYPES = [
    "痛点型",
    "好奇型",
    "数字型",
    "反差型",
    "情绪型",
    "权威型",
    "紧迫型",
    "故事型",
    "提问型",
    "其他"
]

# 确保目录存在
def ensure_dirs():
    INPUT_DIR.mkdir(parents=True, exist_ok=True)
    for hook_type in HOOK_TYPES:
        (OUTPUT_DIR / hook_type).mkdir(parents=True, exist_ok=True)


def scan_input_videos():
    """扫描输入目录中的所有视频文件"""
    video_extensions = [".mp4", ".mov", ".avi", ".mkv", ".webm"]
    videos = []

    for file in INPUT_DIR.iterdir():
        if file.is_file() and file.suffix.lower() in video_extensions:
            videos.append(file)

    return sorted(videos)


def get_video_info(video_path):
    """获取视频信息"""
    import subprocess
    import json

    cmd = [
        "ffprobe",
        "-v", "quiet",
        "-print_format", "json",
        "-show_format",
        str(video_path)
    ]

    try:
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode == 0:
            info = json.loads(result.stdout)
            duration = float(info.get("format", {}).get("duration", 0))
            size = int(info.get("format", {}).get("size", 0))
            return {
                "duration": duration,
                "size_mb": size / (1024 * 1024)
            }
    except Exception as e:
        print(f"⚠️ 获取视频信息失败: {e}")
    return {"duration": 0, "size_mb": 0}


def move_to_category(video_path, category):
    """将视频移动到分类目录"""
    dest_dir = OUTPUT_DIR / category
    dest_dir.mkdir(parents=True, exist_ok=True)

    # 生成新文件名
    original_name = video_path.stem
    new_name = f"{original_name}.mp4"
    dest_path = dest_dir / new_name

    # 如果文件已存在，添加序号
    counter = 1
    while dest_path.exists():
        new_name = f"{original_name}_{counter}.mp4"
        dest_path = dest_dir / new_name
        counter += 1

    # 移动文件
    shutil.move(str(video_path), str(dest_path))
    print(f"✅ 已移动到: {dest_path}")
    return dest_path


def list_status():
    """列出当前库的状态"""
    print("\n" + "=" * 60)
    print("📊 钩子库状态")
    print("=" * 60)

    total = 0

    for hook_type in HOOK_TYPES:
        type_dir = OUTPUT_DIR / hook_type
        if type_dir.exists():
            videos = list(type_dir.glob("*.mp4"))
            count = len(videos)
            total += count
            if count > 0:
                print(f"  {hook_type}: {count} 个")

    print("-" * 60)
    print(f"  总计: {total} 个钩子视频")
    print("=" * 60 + "\n")


def interactive_sort():
    """交互式分类"""
    videos = scan_input_videos()

    if not videos:
        print("\n📁 输入目录中没有视频文件")
        print(f"请将视频放入: {INPUT_DIR}")
        return

    print(f"\n📂 发现 {len(videos)} 个待分类视频\n")
    list_status()

    for i, video in enumerate(videos, 1):
        info = get_video_info(video)

        print(f"\n{'='*60}")
        print(f"📹 视频 {i}/{len(videos)}: {video.name}")
        print(f"   时长: {info['duration']:.1f}秒 | 大小: {info['size_mb']:.1f}MB")
        print("="*60)

        # 显示分类选项
        print("\n选择分类:")
        for j, hook_type in enumerate(HOOK_TYPES, 1):
            print(f"  {j}. {hook_type}")
        print(f"  0. 跳过")
        print(f"  q. 退出")

        choice = input("\n请输入选项: ").strip()

        if choice.lower() == 'q':
            print("退出分类")
            break
        elif choice == '0':
            print("跳过")
            continue

        try:
            idx = int(choice) - 1
            if 0 <= idx < len(HOOK_TYPES):
                category = HOOK_TYPES[idx]
                move_to_category(video, category)
            else:
                print("❌ 无效选项，跳过")
        except ValueError:
            print("❌ 无效输入，跳过")

    print("\n")
    list_status()


def batch_sort_from_mapping(mapping_file):
    """根据映射文件批量分类"""
    import json

    mapping_path = Path(mapping_file)
    if not mapping_path.exists():
        print(f"❌ 映射文件不存在: {mapping_file}")
        return

    with open(mapping_path, 'r', encoding='utf-8') as f:
        mapping = json.load(f)

    for video_name, category in mapping.items():
        video_path = INPUT_DIR / video_name
        if video_path.exists():
            if category in HOOK_TYPES:
                move_to_category(video_path, category)
            else:
                print(f"⚠️ 未知分类 '{category}': {video_name}")
        else:
            print(f"⚠️ 视频不存在: {video_name}")

    list_status()


def main():
    """主函数"""
    ensure_dirs()

    print("=" * 60)
    print("🎬 WhyFire 钩子视频分类工具")
    print("=" * 60)
    print(f"\n📁 输入目录: {INPUT_DIR}")
    print(f"📁 输出目录: {OUTPUT_DIR}")
    print("\n使用方法:")
    print("  1. 将剪辑好的钩子视频放入 hooks/input/ 目录")
    print("  2. 运行: python3 hook_sorter.py")
    print("  3. 逐个选择分类")
    print("\n")

    # 检查是否有参数
    import sys
    if len(sys.argv) > 1:
        if sys.argv[1] == "status":
            list_status()
        elif sys.argv[1] == "batch" and len(sys.argv) > 2:
            batch_sort_from_mapping(sys.argv[2])
    else:
        interactive_sort()


if __name__ == "__main__":
    main()
