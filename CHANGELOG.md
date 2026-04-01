# Changelog

## [2.2.0] - 2026-04-01

### Added
- 视频文件上传支持：MP4、MOV、AVI 等格式自动提取音频（FFmpeg.wasm 客户端处理）
- 分享链接解析：粘贴抖音、网易云、汽水音乐链接自动提取音频（yt-dlp + OSS）
- V5 流式音频：TEXT_SUCCESS 时即返回流式 URL，用户提前 30-50 秒听到翻唱结果
- MV 视频代理：新增 /api/video-proxy 解决 COEP 跨域视频加载问题
- URL 解析 API：新增 /api/cover/resolve-url 支持多平台音频链接解析
- 登录 OTP 自动提交：输入完 6 位验证码自动验证，无需手动点击

### Changed
- COEP 策略从 require-corp 改为 credentialless，兼容 FFmpeg.wasm SharedArrayBuffer
- 轮询策略优化：统一 2 秒间隔 + 90 秒超时（适配 V5 生成速度）
- 翻唱生成进度显示优化：超过 20 秒后显示已用时间提示
- 登录表单错误信息更精细：区分验证码错误、频率限制、网络失败等场景
- 防重复提交：loadingRef 防止 OTP 验证并发请求

### Fixed
- 登录测试断言更新：匹配新的 OTP 错误信息文案
- 敏感词错误处理：新增 SENSITIVE_WORD_ERROR 状态识别
- 连续网络错误容忍度从 10 次降至 5 次，更快失败

## [2.1.0] - 2026-03-31

### Added
- 定价页面重写为三层模型（Free / Lite / Pro）+ 按次购买积分包
- 首页新增定价展示区块，3 个定价卡片直接展示
- 登录表单中文翻译，更好的错误处理（频率限制、网络错误等）
- Hero 区背景视频支持，覆盖暗色渐变遮罩

### Changed
- 登录流程简化为纯 OTP 验证码，移除 emailRedirectTo 魔法链接
- 中间件不再保护 /sonic-gallery/pricing 页面（公开访问）
- 数据库新用户初始积分从 2 提升到 6（3 次免费翻唱）
- 积分包从 4 档简化为 3 档：¥6.9 / ¥29 / ¥69

### Removed
- 移除微信登录按钮组件（wechat-login-button.tsx）
- 移除首页多余的 Cover/Rap/Gallery 导航栏
- 移除 layout 级别的 TopNavBar（改由首页自行管理）

### Fixed
- 修复登录后跳转到 /create（现正确跳转到 /sonic-gallery）
- 修复定价页面需要登录才能查看的问题
- 更新登录表单测试以匹配中文界面
