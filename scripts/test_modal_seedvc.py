#!/usr/bin/env python3
"""
测试 Modal Seed-VC API
"""
import requests
import json
import time

# API endpoints
HEALTH_URL = "https://w932635477--seed-vc-real-seedvc-health.modal.run"
CONVERT_URL = "https://w932635477--seed-vc-real-seedvc-convert.modal.run"

# 测试音频 (使用公开可用的音频文件)
# 这些是示例 URL，实际使用时需要替换为真实的音频文件
TEST_AUDIO = {
    "source": "https://github.com/Plachtaa/seed-vc/raw/master/test_audio/source.wav",
    "reference": "https://github.com/Plachtaa/seed-vc/raw/master/test_audio/reference.wav"
}

def test_health():
    """测试健康检查端点"""
    print("🔍 Testing health endpoint...")
    try:
        resp = requests.get(HEALTH_URL, timeout=30)
        print(f"  Status: {resp.status_code}")
        print(f"  Response: {resp.json()}")
        return resp.status_code == 200
    except Exception as e:
        print(f"  Error: {e}")
        return False

def test_convert():
    """测试声音转换端点"""
    print("\n🎵 Testing convert endpoint...")
    print("  注意: GPU 推理需要几分钟时间（首次启动需下载模型）")

    payload = {
        "source_audio_url": TEST_AUDIO["source"],
        "reference_audio_url": TEST_AUDIO["reference"],
        "f0_condition": True,
        "fp16": True,
        "diffusion_steps": 10,
        "length_adjust": 1.0,
        "inference_cfg_rate": 0.7
    }

    print(f"  Request: {json.dumps(payload, indent=4)}")

    try:
        start = time.time()
        resp = requests.post(CONVERT_URL, json=payload, timeout=540)  # 9 分钟超时
        elapsed = time.time() - start

        print(f"  Status: {resp.status_code}")
        print(f"  Time: {elapsed:.1f}s")

        result = resp.json()
        print(f"  Response: {json.dumps(result, indent=2)[:1000]}")

        if result.get("status") == "completed":
            print(f"\n✅ 转换成功!")
            print(f"  输出音频长度: {len(result.get('output_audio', ''))} 字符 (base64)")
            print(f"  音频时长: {result.get('duration', 'N/A')} 秒")
        else:
            print(f"\n❌ 转换失败: {result.get('error', 'Unknown error')}")

        return result.get("status") == "completed"

    except requests.exceptions.Timeout:
        print("  ❌ Timeout (>540s)")
        return False
    except Exception as e:
        print(f"  ❌ Error: {e}")
        return False

if __name__ == "__main__":
    print("=" * 60)
    print("Modal Seed-VC API 测试")
    print("=" * 60)

    # 测试健康检查
    health_ok = test_health()

    if health_ok:
        # 测试转换
        convert_ok = test_convert()
    else:
        print("\n⚠️ 跳过转换测试（健康检查失败）")
        convert_ok = False

    print("\n" + "=" * 60)
    print(f"结果: Health={'✅' if health_ok else '❌'} | Convert={'✅' if convert_ok else '❌'}")
    print("=" * 60)
