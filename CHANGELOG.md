# Changelog

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
