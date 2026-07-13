# Ink 叙事集成说明

Roll 使用 [Ink](https://github.com/inkle/ink) 编写分支叙事，浏览器端通过 [inkjs](https://github.com/ylohse/inkjs) 运行编译后的 JSON。

## 目录结构

```
stories/military.ink    # 源剧本（军训篇）
ink/military.json       # 编译产物（需提交，供静态部署）
ink/military.sha256     # 源剧本指纹（ink:build 写入；CI 用 ink:check 校验）
js/ink-runtime.js       # Story 加载、jump/drain、变量同步
js/ink-controller.js    # 标签解析、UI 驱动、advanceInk 主循环
js/ink-game.js          # 对外导出 startGame()
js/scenes/scene1-ink.js # Scene1 热区 → Ink knot 映射
js/vendor/ink.mjs       # inkjs 浏览器 bundle（npm run vendor:ink 复制）
```

## 开发与编译

```bash
npm install
npm run build          # ink:build + vendor:ink（同时更新 military.sha256）
npm run ink:check      # 确认 .ink 与已提交编译戳一致（CI 必跑）
npm run dev            # 本地 http://localhost:3000
npm run ink:watch      # 监听 .ink 变更并重新编译
```

改完 `stories/*.ink` 后务必在 macOS/Windows 执行 `npm run ink:build`，并提交：

- `ink/military.json`
- `ink/military.sha256`

Linux CI 无法运行 inklecate；若只改了 `.ink` 却未更新上述文件，`npm run ink:check` 会失败。

### 提交前检查（pre-commit）

`npm install` / `npm prepare` 会把本仓库的 `githooks/` 设为 `core.hooksPath`。之后每次 `git commit` 自动跑 `ink:check`；不一致则拒绝提交。

手动启用：

```bash
npm run hooks:install
```

临时跳过（不推荐）：`git commit --no-verify`

## 运行时流程

1. 玩家点击「开始」→ `startGame()` 加载 `ink/military.json`
2. `advanceInk()` 循环 `story.Continue()`，逐行处理文本与 `# tag`
3. Scene1 探索：玩家点击热区 → `inkRuntime.jump('s1_hotspot_*')` → 继续 `advanceInk()`
4. 出现选项时 `waitForChoice()` → `story.ChooseChoiceIndex(n)`
5. `# handoff:scene2` 时交给 legacy JS（`scene2.js`）继续节奏游戏等玩法

## 标签约定

| 标签 | 参数 | 作用 |
|------|------|------|
| `flow` | opening / transition | 切换开场/过场屏 |
| `sfx` | opening / ding / thud / scene1_ambient / scene2_ambient / scene3_ambient | 音效 |
| `establish` | 图片 key | 定镜全屏（3s） |
| `establish_title` | 标题文字 | 定镜标题 |
| `scene` | scene1 / scene2 / scene3 | 进入场景 DOM |
| `explore_hint` | 秒数 | 探索倒计时 UI（默认 15s） |
| `timeout` | 毫秒 | 超时未选择则跳转 |
| `timeout_knot` | knot 名 | 超时目标（默认 s1_timeout） |
| `narration` | sceneId | 旁白（同步） |
| `narration_seq` | sceneId | 旁白后自动 advanceInk |
| `bubble` | id, top, left | 气泡位置与文案 |
| `choices` | sceneId | 标记（选项由 inkjs 原生 choices 驱动） |
| `clear_timers` | — | 清除 engine 定时器 |
| `hide_explore_hint` | — | 隐藏探索提示 |
| `handoff` | scene2 / rhythm / ending | 交给 JS 玩法模块（节奏、结算）；Scene2/3 叙事已在 Ink 内 |

## Ink 变量 ↔ `state.js`

| Ink VAR | S 字段 |
|---------|--------|
| bold / support / quiet | S.tags.* |
| s1_choice / s2_choice / s3_choice | S.s1Choice / S.s2Choice / S.s3Choice |
| bond_classmate | S.bonds.classmate |
| click_* | 仅 Ink 内计数，不同步 |

`ink-runtime.syncFromInk()` 在每次 drain 后写回 localStorage。

## 扩展新章节

1. 在 `stories/` 新增 `military_ch2.ink`，主文件末尾 `INCLUDE` 或复制 knot
2. 新场景热区仿照 `scene1-ink.js` 写 `scene2-ink.js`
3. 玩法模块（节奏、清单）仍用 JS；Ink 用 `# handoff:rhythm` 等标签交接
4. `npm run ink:build` 后提交 `ink/military.json`

## 部署注意

静态服务器**没有** `node_modules`，务必：

- 提交 `ink/military.json`
- 提交 `js/vendor/ink.mjs`
- CI 可在 deploy 前执行 `npm run build`
