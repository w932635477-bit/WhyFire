# 方言Rap技术验证计划

## 一、验证目标

验证以下8种方言的Rap生成能力：
- [x] 普通话（基准）
- [ ] 粤语
- [ ] 四川话
- [ ] 东北话
- [ ] 山东话
- [ ] 上海话
- [ ] 河南话
- [ ] 湖南话

## 二、技术方案选择

### 方案A：Step-Audio 2（官方推荐，最新）

| 项目 | 信息 |
|------|------|
| 官方仓库 | https://github.com/stepfun-ai/Step-Audio |
| 状态 | 旧仓库已停止维护，推荐使用 Step-Audio 2 |
| 方言支持 | 粤语、四川话（明确支持） |
| Rap支持 | ✅ 支持 (RAP标签) |
| 显存需求 | 8GB (TTS-3B模型) |

### 方案B：CosyVoice 2/3（阿里开源）

| 项目 | 信息 |
|------|------|
| GitHub | https://github.com/FunAudioLLM/CosyVoice |
| 方言支持 | 18种方言 |
| Rap支持 | ❓ 需验证 |

### 方案C：在线API快速验证

| 平台 | 用途 |
|------|------|
| 跃问App (Step-Audio官方) | 快速测试RAP和方言 |
| Suno API | 对比中文Rap效果 |

---

## 三、验证步骤

### Phase 1: 在线快速验证（30分钟）

**目标**：不部署本地环境，先用在线服务验证核心能力

#### 1.1 Step-Audio在线测试

1. 下载跃问App或访问在线版本
2. 测试用例：

```
测试1 - 普通话RAP:
请用普通话唱一段Rap，内容是关于打工人的一天

测试2 - 粤语RAP:
请用粤语唱一段Rap，内容是关于美食

测试3 - 四川话RAP:
请用四川话唱一段Rap，内容是关于火锅

测试4 - 东北话RAP:
请用东北话唱一段Rap，内容是关于冬天

测试5 - 上海话RAP:
请用上海话唱一段Rap，内容是关于生活
```

#### 1.2 Suno在线测试（对比基准）

1. 访问 suno.ai
2. 输入方言歌词测试效果

### Phase 2: 本地部署验证（2-4小时）

#### 2.1 环境准备

```bash
# 检查GPU
nvidia-smi

# 需要的硬件
# 最低: RTX 3060 (8GB显存)
# 推荐: RTX 3090/4090 (24GB显存)
```

#### 2.2 部署Step-Audio-TTS-3B

```bash
# 克隆仓库
git clone https://github.com/stepfun-ai/Step-Audio.git
cd Step-Audio

# 创建环境
conda create -n stepaudio python=3.10
conda activate stepaudio

# 安装依赖
pip install -r requirements.txt

# 下载模型 (需要git lfs)
git lfs install
git clone https://huggingface.co/stepfun-ai/Step-Audio-Tokenizer
git clone https://huggingface.co/stepfun-ai/Step-Audio-TTS-3B
```

#### 2.3 运行TTS测试

```bash
# 启动TTS Demo
python tts_app.py --model-path ./
```

#### 2.4 验证脚本

创建 `test_dialect_rap.py`:

```python
"""方言Rap生成测试脚本"""

test_cases = [
    {
        "dialect": "普通话",
        "text": "(RAP) 打工人打工魂，打工都是人上人",
        "expected": "正常普通话Rap"
    },
    {
        "dialect": "粤语",
        "text": "(粤语)(RAP) 食得系福，着得系福，最紧要开心",
        "expected": "粤语Rap"
    },
    {
        "dialect": "四川话",
        "text": "(四川话)(RAP) 火锅火锅真好吃，辣得跳脚也不怕",
        "expected": "四川话Rap"
    },
    {
        "dialect": "东北话",
        "text": "(东北话)(RAP) 哎呀妈呀太冷了，东北的冬天真够呛",
        "expected": "东北话Rap"
    },
    {
        "dialect": "山东话",
        "text": "(山东话)(RAP) 山东大汉真豪爽，煎饼卷大葱真香",
        "expected": "山东话Rap"
    },
    {
        "dialect": "上海话",
        "text": "(上海话)(RAP) 上海滩的风景好，小笼包子味道妙",
        "expected": "上海话Rap"
    },
    {
        "dialect": "河南话",
        "text": "(河南话)(RAP) 中中中，河南话真中",
        "expected": "河南话Rap"
    },
    {
        "dialect": "湖南话",
        "text": "(湖南话)(RAP) 辣椒炒肉真好吃，湘菜味道顶呱呱",
        "expected": "湖南话Rap"
    }
]

# 评分标准
scoring = """
评分维度 (1-5分):
1. 方言准确度: 发音是否符合该方言特色
2. Rap节奏感: 是否有明显的节奏和韵律
3. 清晰度: 歌词是否清晰可辨
4. 自然度: 听起来是否自然流畅
5. 整体效果: 综合评价
"""
```

### Phase 3: CosyVoice验证（如果Step-Audio效果不理想）

```bash
# 克隆CosyVoice
git clone https://github.com/FunAudioLLM/CosyVoice.git
cd CosyVoice

# 安装依赖
conda create -n cosyvoice python=3.10
conda activate cosyvoice
pip install -r requirements.txt

# 下载模型
# 从ModelScope下载
```

---

## 四、验证结果记录模板

### 测试结果表

| 方言 | Step-Audio在线 | Step-Audio本地 | CosyVoice | 评分 | 备注 |
|------|---------------|----------------|-----------|------|------|
| 普通话 | - | - | - | - | 基准 |
| 粤语 | - | - | - | - | |
| 四川话 | - | - | - | - | |
| 东北话 | - | - | - | - | |
| 山东话 | - | - | - | - | |
| 上海话 | - | - | - | - | |
| 河南话 | - | - | - | - | |
| 湖南话 | - | - | - | - | |

### 评分标准

- 5分: 完美支持，方言地道，Rap节奏感强
- 4分: 良好支持，方言基本准确，有节奏感
- 3分: 部分支持，方言有偏差，节奏一般
- 2分: 勉强支持，方言不准确，节奏弱
- 1分: 不支持，完全是普通话或无法生成

---

## 五、硬件需求确认

在开始之前，请先确认你的硬件：

```bash
# 运行此命令查看GPU信息
nvidia-smi

# 最低要求
# GPU: NVIDIA RTX 3060 或更高
# 显存: 8GB+
# 内存: 16GB+
# 存储: 50GB可用空间
```

---

## 六、快速开始命令

```bash
# 检查环境
python --version  # 需要 3.10+
nvidia-smi        # 检查GPU

# 如果没有GPU或想快速验证，先使用在线服务
# 跃问App / Suno.ai

# 本地部署（有GPU的情况）
git clone https://github.com/stepfun-ai/Step-Audio.git
cd Step-Audio
pip install -r requirements.txt
python tts_app.py --model-path ./
```

---

## 七、下一步行动

1. **立即执行**：检查你的Mac是否有足够的资源（注：Mac可能不支持CUDA）
2. **备选方案**：如果Mac不支持，使用云GPU服务（AutoDL/阿里云）
3. **在线验证**：先用跃问App或Suno快速测试效果

---

## 八、预期结论

根据技术调研，预期结果：

| 方言 | 预期支持度 | 依据 |
|------|-----------|------|
| 普通话 | ⭐⭐⭐⭐⭐ | 所有模型都支持 |
| 粤语 | ⭐⭐⭐⭐⭐ | Step-Audio明确支持 |
| 四川话 | ⭐⭐⭐⭐⭐ | Step-Audio明确支持 |
| 东北话 | ⭐⭐⭐⭐ | 可能有效，待验证 |
| 山东话 | ⭐⭐⭐ | 不确定，需验证 |
| 上海话 | ⭐⭐⭐ | 不确定，需验证 |
| 河南话 | ⭐⭐⭐ | 不确定，需验证 |
| 湖南话 | ⭐⭐⭐ | 不确定，需验证 |

---

*创建时间: 2026-03-21*
*状态: 待验证*
