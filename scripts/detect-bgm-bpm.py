#!/usr/bin/env python3
"""
BGM BPM 检测脚本

使用 librosa 检测 BGM 文件的 BPM
"""

import librosa
import os
import sys
import json

def detect_bpm(file_path):
    """检测音频文件的 BPM"""
    try:
        # 加载音频文件
        y, sr = librosa.load(file_path, sr=None)
        duration = len(y) / sr

        # 检测 BPM
        tempo, _ = librosa.beat.beat_track(y=y, sr=sr)

        # tempo 可能是数组，取第一个值
        if hasattr(tempo, '__iter__'):
            tempo = float(tempo[0])
        else:
            tempo = float(tempo)

        return {
            'bpm': round(tempo, 1),
            'duration': round(duration, 1),
            'sample_rate': sr,
            'success': True
        }
    except Exception as e:
        return {
            'bpm': 0,
            'duration': 0,
            'error': str(e),
            'success': False
        }

def main():
    bgm_dir = '/Users/weilei/Desktop/BGM'

    print('=' * 60)
    print('BGM BPM 检测')
    print('=' * 60)

    results = []

    # 遍历 BGM 目录
    for filename in sorted(os.listdir(bgm_dir)):
        if filename.endswith(('.mp3', '.wav', '.flac', '.ogg', '.m4a')):
            file_path = os.path.join(bgm_dir, filename)
            print(f'\n检测: {filename}')

            result = detect_bpm(file_path)
            result['filename'] = filename

            if result['success']:
                print(f'  BPM: {result["bpm"]}')
                print(f'  时长: {result["duration"]}s')
                print(f'  采样率: {result["sample_rate"]}Hz')
                results.append(result)
            else:
                print(f'  错误: {result.get("error", "Unknown error")}')

    print('\n' + '=' * 60)
    print('检测结果汇总')
    print('=' * 60)

    print('\n```typescript')
    print('// 添加到 src/lib/music/bgm-library.ts')
    print('')

    for r in results:
        if r['success']:
            # 生成 ID（从文件名）
            base_name = os.path.splitext(r['filename'])[0]
            bgm_id = base_name.lower().replace(' ', '-').replace('.', '-')

            # 根据文件名推测风格
            style_tags = 'hip-hop, rap beat'
            energy = 'medium'
            mood = ['confident']

            if 'trap' in base_name.lower() or 'apt' in base_name.lower():
                style_tags = 'trap, dark, heavy 808, southern hip-hop'
                energy = 'high'
                mood = ['aggressive', 'confident']
            elif 'brazil' in base_name.lower() or 'brazli' in base_name.lower():
                style_tags = 'brazilian phonk, drill, heavy bass'
                energy = 'high'
                mood = ['intense', 'energetic']
            elif '暖' in base_name or 'gray' in base_name.lower():
                style_tags = 'lo-fi, chill, ambient, smooth'
                energy = 'low'
                mood = ['relaxed', 'dreamy']
            elif '财' in base_name or '精彩' in base_name:
                style_tags = 'pop rap, upbeat, positive'
                energy = 'high'
                mood = ['happy', 'confident']
            elif '因果' in base_name:
                style_tags = 'dark trap, drill, mysterious'
                energy = 'medium'
                mood = ['dark', 'mysterious']

            print(f'''{{
  id: '{bgm_id}',
  url: 'https://YOUR-OSS-URL/bgm/{r['filename']}',  // TODO: 上传到 OSS 后替换
  bpm: {int(r['bpm'])},
  styleTags: '{style_tags}',
  energy: '{energy}',
  mood: {json.dumps(mood)},
  duration: {int(r['duration'])},
}},''')

    print('```')

if __name__ == '__main__':
    main()
