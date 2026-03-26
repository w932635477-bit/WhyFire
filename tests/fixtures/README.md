# 测试音频文件

本目录包含用于测试的音频文件。

## 目录结构

```
fixtures/
├── voices/          # 声音样本
│   ├── sample-voice-30s.mp3    # 30 秒声音样本
│   └── sample-voice-10s.mp3    # 10 秒声音样本
├── bgm/             # BGM 样本
│   ├── sample-bgm-60s.mp3      # 60 秒 BGM
│   └── sample-bgm-30s.mp3      # 30 秒 BGM
└── samples/         # 测试样本
    ├── test-rap-60s.mp3        # 60 秒 Rap 测试
    ├── test-rap-30s.mp3        # 30 秒 Rap 测试
    └── test-vocals-60s.mp3     # 60 秒人声测试
```

## 生成文件

运行以下命令生成测试音频：

```bash
npx tsx tests/fixtures/generate-fixtures.ts
```

## 注意事项

- 这些是用于测试的静音/噪音音频
- 实际功能测试应使用真实的音频文件
- 真实音频可从 OSS 下载：`https://whyfire-02.oss-cn-beijing.aliyuncs.com/test/`
