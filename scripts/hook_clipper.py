#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
WhyFire 钩子开头视频剪辑工具
功能：自动下载视频并截取前3-5秒作为钩子开头
"""

import os
import subprocess
import sys
from pathlib import Path

# 项目根目录
PROJECT_ROOT = Path(__file__).parent.parent
INPUT_DIR = PROJECT_ROOT / "hooks" / "input"
OUTPUT_DIR = PROJECT_ROOT / "hooks" / "output"

# 确保目录存在
INPUT_DIR.mkdir(parents=True, exist_ok=True)
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


def check_ffmpeg():
    """检查 FFmpeg 是否已安装"""
    try:
        result = subprocess.run(
            ["ffmpeg", "-version"],
            capture_output=True,
            text=True
        )
        if result.returncode == 0:
            print("✅ FFmpeg 已安装")
            return True
    except FileNotFoundError:
        print("❌ FFmpeg 未安装")
        print("请安装 FFmpeg: brew install ffmpeg (Mac) 或 apt install ffmpeg (Linux)")
        return False
    return False


def check_ytdlp():
    """检查 yt-dlp 是否已安装"""
    try:
        result = subprocess.run(
            ["python3", "-m", "yt_dlp", "--version"],
            capture_output=True,
            text=True
        )
        if result.returncode == 0:
            print("✅ yt-dlp 已安装")
            return True
    except FileNotFoundError:
        print("❌ yt-dlp 未安装")
        print("请安装: pip3 install yt-dlp")
        return False
    return False


def download_video(url, output_path):
    """使用 yt-dlp 下载视频"""
    print(f"📥 正在下载视频: {url}")

    cmd = [
        "python3", "-m", "yt_dlp",
        "-f", "best[ext=mp4]",
        "-o", str(output_path),
        "--no-playlist",
        url
    ]

    try:
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode == 0:
            print(f"✅ 下载完成: {output_path}")
            return True
        else:
            print(f"❌ 下载失败: {result.stderr}")
            return False
    except Exception as e:
        print(f"❌ 下载出错: {e}")
        return False


def clip_hook(input_path, output_path, duration=5):
    """
    截取视频前N秒作为钩子开头

    Args:
        input_path: 输入视频路径
        output_path: 输出视频路径
        duration: 截取时长（秒）
    """
    print(f"✂️ 正在截取前 {duration} 秒...")

    cmd = [
        "ffmpeg",
        "-i", str(input_path),
        "-t", str(duration),
        "-c:v", "libx264",  # 重新编码视频
        "-c:a", "aac",       # 重新编码音频
        "-preset", "fast",   # 编码速度
        "-y",                # 覆盖已存在的文件
        str(output_path)
    ]

    try:
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode == 0:
            print(f"✅ 剪辑完成: {output_path}")
            return True
        else:
            print(f"❌ 剪辑失败: {result.stderr}")
            return False
    except Exception as e:
        print(f"❌ 剪辑出错: {e}")
        return False


def get_video_info(video_path):
    """获取视频信息"""
    cmd = [
        "ffprobe",
        "-v", "quiet",
        "-print_format", "json",
        "-show_format",
        "-show_streams",
        str(video_path)
    ]

    try:
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode == 0:
            import json
            info = json.loads(result.stdout)
            duration = float(info.get("format", {}).get("duration", 0))
            print(f"📊 视频时长: {duration:.2f} 秒")
            return duration
    except Exception as e:
        print(f"⚠️ 获取视频信息失败: {e}")
    return None


def process_video(video_path, hook_type="通用", duration=5):
    """
    处理单个视频：剪辑前N秒作为钩子开头

    Args:
        video_path: 本地视频路径
        hook_type: 钩子类型（用于分类）
        duration: 截取时长
    """
    print(f"\n{'='*50}")
    print(f"🎬 处理视频: {video_path}")
    print(f"📁 钩子类型: {hook_type}")
    print(f"⏱️ 截取时长: {duration}秒")
    print(f"{'='*50}\n")

    input_path = Path(video_path)

    # 检查文件是否存在
    if not input_path.exists():
        print(f"❌ 文件不存在: {input_path}")
        return False

    # 获取视频信息
    get_video_info(input_path)

    # 创建类型目录
    type_dir = OUTPUT_DIR / hook_type
    type_dir.mkdir(parents=True, exist_ok=True)

    # 生成输出文件名
    import time
    timestamp = int(time.time())
    original_name = input_path.stem
    output_path = type_dir / f"{original_name}_hook_{timestamp}.mp4"

    # 剪辑
    if clip_hook(input_path, output_path, duration):
        print(f"\n✅ 成功！输出文件: {output_path}")
        return True

    return False


def main():
    """主函数"""
    print("=" * 60)
    print("🎬 WhyFire 钩子开头视频剪辑工具")
    print("=" * 60)

    # 检查 FFmpeg
    if not check_ffmpeg():
        sys.exit(1)

    print("\n" + "=" * 60)

    # 测试模式
    if len(sys.argv) == 1:
        print("\n使用方法:")
        print("  python3 hook_clipper.py <视频路径> [钩子类型] [时长]")
        print("\n示例:")
        print("  python3 hook_clipper.py input_video.mp4 痛点型 5")
        print("  python3 hook_clipper.py my_video.mp4 好奇型 3")
        print("\n说明:")
        print("  - 视频 > 钩子类型 > 截取时长（秒）")
        print("  - 输出文件保存在 hooks/output/<钩子类型>/ 目录")
        print("\n")
        return

    # 解析参数
    url_or_path = sys.argv[1]
    hook_type = sys.argv[2] if len(sys.argv) > 2 else "通用"
    duration = int(sys.argv[3]) if len(sys.argv) > 3 else 5

    # 处理视频
    process_video(url_or_path, hook_type, duration)


if __name__ == "__main__":
    main()
