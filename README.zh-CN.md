# Pomodoro

> [English](README.md) | 简体中文

一款基于 **Electron + TypeScript** 的极简桌面番茄钟计时器。工作时，一个 100×100 的置顶窗口浮动在屏幕右上角；休息时自动隐藏。简洁的 LCD 风格倒计时界面，帮助你保持专注。

> 🔔 完整周期：25 分钟工作 → 5 分钟短休息 → 循环。每完成 4 个工作周期后，进入 15 分钟长休息。自动循环。

## 功能特性

- **零漂移倒计时** — 基于绝对 `endTime` 计算，非递减计数器
- **自动循环番茄钟** — 工作 → 短休息 → 工作 → ... → 长休息（每第 4 次）
- **工作窗口始终置顶** — 100×100 无边框窗口，右上角定位，休息时自动隐藏
- **三档窗口尺寸** — 大 / 中 / 小，原地缩放，窗口位置保持不变
- **LCD 风格显示** — [Orbitron](https://fonts.google.com/specimen/Orbitron) 字体搭配四色进度环
- **系统托盘控制** — 通过托盘图标菜单启动 / 暂停 / 重置 / 跳过 / 退出
- **托盘和窗口右键菜单内容一致** — 置顶 / 取消置顶、开始 / 暂停、重置、跳过、尺寸、语言、帮助、退出
- **中英文双语** — 菜单内随时切换 English / 中文，选择写入 `settings.json`，下次启动自动恢复
- **双击启动 / 暂停** — 直接双击计时器窗口
- **拖拽移动** — 左键按住计时器窗口拖拽即可重新定位
- **阶段切换通知** — 工作和休息切换时弹出桌面通知
- **帮助** 菜单在浏览器中打开 [GitHub 项目主页](https://github.com/yangjinlong86/pomodoro)
- **版本号** — 菜单底部显示当前版本（如 `番茄钟 V0.2.0`）
- **单实例运行** — 同时只允许运行一个应用实例

## 截图

<!-- 在此添加你自己的截图 -->
<!-- ![工作阶段](screenshots/work.png) -->

## 环境要求

- Node.js 18+（开发环境为 Node 22）
- npm

## 安装

```bash
npm install
```

> `.npmrc` 使用 [npmmirror](https://npmmirror.com/) 镜像下载 Electron 和 electron-builder 二进制文件，确保下载稳定。

## 开发

```bash
# 热重载开发模式（需要图形界面）
npm run dev

# 类型检查
npm run typecheck

# 代码检查
npm run lint

# 运行测试
npm test

# 运行单个测试文件
npx vitest run tests/pomodoro-engine.test.ts
```

> 应用需要图形界面。在无头机器上，请在桌面会话中运行或使用 `xvfb-run`。

## 构建与打包

```bash
# 生产构建 → dist/{main,preload,renderer}
npm run build

# 预览构建后的应用
npm start

# Linux 打包（AppImage + deb）→ release/
npm run dist:linux
```

## 使用方式

| 操作 | 方式 |
|------|------|
| 启动 / 暂停计时器 | 托盘菜单、右键计时器窗口，或**双击**计时器窗口 |
| 重置计时器 | 托盘菜单或右键点击计时器窗口 |
| 跳转到下一阶段 | 托盘菜单或右键点击计时器窗口 |
| 切换始终置顶 | 托盘菜单或右键点击计时器窗口（**置顶 / 取消置顶**） |
| 调整窗口尺寸 | 菜单 ▸ **尺寸** ▸ 小 / 中 / 大（原地缩放） |
| 切换语言 | 菜单 ▸ **语言** ▸ English / 中文（自动保存） |
| 打开 GitHub 项目主页 | 菜单 ▸ **帮助** |
| 移动窗口 | 左键按住计时器窗口拖拽 |
| 显示上下文菜单 | 右键点击计时器窗口 |
| 退出 | 托盘菜单或右键点击计时器窗口 |

## 项目架构

```
src/
  shared/      类型、配置（时长）、格式化（MM:SS）、IPC 通道、i18n 字典
  timer/       PomodoroEngine — 纯状态机，零 Electron/DOM 依赖
  main/        Electron 主进程
    window-options.ts   浏览器窗口选项（100×100、无边框、置顶）
    visibility.ts       辅助函数：工作时显示 / 休息时隐藏、托盘标签
    menu.ts             托盘菜单与上下文菜单模板构建器（多语言）
    window.ts           窗口创建（右上角定位）
    tray.ts             托盘图标、提示、菜单更新
    settings.ts         加载 / 保存用户目录下的 `settings.json`
    index.ts            应用生命周期、引擎计时、IPC、通知、语言切换
  preload/     contextBridge 暴露 window.api 给渲染进程
  renderer/    100×100 极简 UI（HTML/CSS/TS），由 window.api 驱动
    fonts/            Orbitron 粗体字体（本地嵌入）
tests/         Vitest — 引擎、格式化、主逻辑、设置、冒烟测试
```

### 关键设计决策

- **纯函数 / Electron 分离** — `window-options.ts`、`visibility.ts`、`menu.ts` 只从 `electron` 导入 *类型*，因此单元测试可以在不启动 Electron 的情况下无头运行
- **安全性** — `contextIsolation: true`、`nodeIntegration: false`、`sandbox: true`、严格 CSP、preload 是主进程和渲染进程之间的唯一桥梁
- **可测试性** — `PomodoroEngine` 接受可注入的 `now: () => number` 时钟，使所有计时逻辑在测试中 100% 确定
- **零漂移计时** — 剩余秒数始终由 `endTime - now()` 计算，从不递减

## 手动冒烟检查清单

在带有图形界面的真实桌面上运行：

```bash
npm install
npm run dev    # 或: npm run build && npm start
```

预期结果：

1. 一个 **100×100 无边框窗口** 出现在**右上角**。
2. 窗口**始终置顶**。
3. 以 Orbitron 字体显示 `25:00`，黑色背景上带有四色环。
4. **托盘图标**右键菜单：置顶/取消置顶、开始/暂停、重置、跳过、尺寸、语言、帮助、退出，底部显示版本号（`番茄钟 V0.2.0`）。
5. **右键**点击计时器窗口显示相同菜单。
6. **双击**计时器窗口可切换开始 / 暂停。
7. **左键按住拖拽**可移动窗口。
8. **尺寸** ▸ 小 / 中 / 大 在**原位**缩放，不会重置回右上角。
9. **语言** ▸ English / 中文 即时切换所有文案（菜单、托盘提示、阶段文字、通知、版本号），并写入用户目录的 `settings.json` 持久化。
10. 启动计时器后开始倒计时；到达 0 时**自动进入**休息阶段，窗口**隐藏**，弹出桌面通知。
11. 休息结束后自动循环回工作阶段，窗口**重新显示**。
12. 完成 4 个工作周期后，休息阶段为 15 分钟长休息。

## 技术栈

- [Electron](https://www.electronjs.org/) 33 — 桌面应用框架
- [TypeScript](https://www.typescriptlang.org/) 5.7 — 类型安全 JavaScript
- [electron-vite](https://evite.netlify.app/) 2.3 — 构建工具
- [Vite](https://vitejs.dev/) 5.4 — 打包工具
- [Vitest](https://vitest.dev/) 2.1 — 测试框架
- [ESLint](https://eslint.org/) 9 — 代码检查

## 许可证

MIT
