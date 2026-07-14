# Roll

**从「那个谁」到「有人」——大学四年的互动叙事游戏。**

军训篇试玩版：探索式交互 + 跨场景标签 + 节奏游戏 + 揭面结算。

## 当前状态与交接

持续更新的切片交接见 **[HANDOFF.md](./HANDOFF.md)**（目标 / 已完成 / 进行中 / 决策 / 已知问题 / 验收 / 下一步）。

约定：**每完成一个可交付切片，必须更新 `HANDOFF.md`**，使代码状态、交接说明与验收标准三者对齐。Agent 侧规则见 `.cursor/rules/handoff.mdc`。

线上试玩：**http://139.224.30.109:8000/**

## 快速开始

```bash
npm install
npm run build    # 编译 Ink（若本机有 inklecate）+ 复制 inkjs
npm test         # ink:check — 源与编译戳一致
npm run dev      # http://localhost:3000
```

浏览器**横屏**体验最佳。

| 用途 | 地址 |
|------|------|
| 游戏 | http://localhost:3000/ |
| Scene1 图层对齐 | http://localhost:3000/tools/art-align.html |
| 热区调试 | http://localhost:3000/?debugHotspots=1 |

叙事：`docs/INK.md` · 美术：`docs/ART_WORKFLOW.md` · 部署：`DEPLOY.md`

## 项目结构

```
roll/
├── HANDOFF.md              # 切片交接（持续更新）
├── index.html              # 入口
├── css/style.css           # 全局样式
├── stories/military.ink    # Ink 源剧本
├── ink/military.json       # 编译产物（需提交）
├── ink/military.sha256     # 与源一致性戳（CI / pre-commit）
├── docs/INK.md             # Ink 集成说明
├── docs/ART_WORKFLOW.md    # PS 热区 + AI 生图流程
├── DEPLOY.md               # GitHub Actions / SSH 部署
├── assets/
│   ├── bg/                 # 场景底图（16:9）
│   ├── sk/                 # 角色叠层
│   └── hotspots/           # 图层 + 热区 JSON（art-mode 数据源）
├── tools/art-align.html    # 本地百分比对齐工具
├── js/
│   ├── app.js              # 入口
│   ├── scene-compositor.js # BG/SK + 热区合成
│   ├── ink-game.js         # startGame()
│   ├── ink-controller.js   # Ink 标签 / advanceInk / handoff
│   ├── ink-runtime.js      # Story 加载与变量同步
│   ├── vendor/ink.mjs      # inkjs 浏览器 bundle
│   ├── state.js            # 状态管理 + localStorage
│   ├── engine.js           # 定时器引擎
│   ├── narration.js        # 打字机旁白
│   ├── sfx.js              # Web Audio 音效
│   ├── ui.js               # UI 辅助函数
│   ├── rhythm-game.js      # 节奏游戏
│   ├── results.js          # 结算 / 遗憾目录 / 揭面
│   ├── images.js           # 场景定镜图路径
│   └── scenes/
│       ├── scene1-ink.js   # Scene1 热区 → Ink
│       ├── scene2-ink.js   # Scene2 热区 → Ink
│       ├── scene3-ink.js   # Scene3 热区 → Ink
│       └── scene{1,2,3}.js # 旧版参考 / 薄包装
└── POC/                    # 原始 POC（设计文档 + 原型）
```

## 玩法

1. **场景探索** — 点击太阳、教官、同学等元素，从探索中浮现选择
2. **三场景分支** — 站军姿 → 拉歌 → 领队选拔，选择影响后续叙事
3. **节奏游戏** — 自荐领队时触发正步节奏判定（16 节拍，12 次命中通过）
4. **揭面结算** — 遗憾目录 + 「你记住的人」

## 技术栈

- HTML5 + CSS3 + Vanilla JavaScript（ES Modules）
- **Ink + inkjs** — 军训篇开场与 Scene1–3 叙事；节奏游戏 / 结算经 `# handoff:rhythm` / `# handoff:ending` 交给 JS
- Web Audio API 合成音效
- localStorage 进度存档
- 静态部署（自有机 + GitHub Actions；也可 Netlify / Vercel / Pages）

## 设计文档

详见 `POC/design/` 目录：

- `product_experience_v1.md` — **体验总纲**：大学特有场景、章末过场揭面、遗憾清单高潮
- `visual_guide_v2.md` — 视觉定调：实景 + 手绘，无五官，羁绊揭面
- `visual_asset_brief_v3.md` — 资产清单与 AI Prompt
- `scene_script_military_v4.md` — 军训完整剧本
- `technical_design_trial_v1.md` — 技术架构
- `四年_交互设计v3_军训.md` — 交互设计

## 部署

### GitHub Actions → 公网服务器

见 [DEPLOY.md](./DEPLOY.md)。push 到 `main` 后自动部署到 `139.224.30.109`。

仓库 Secrets 需配置：`SSH_HOST`、`SSH_USERNAME`、`SSH_PRIVATE_KEY`（服务器仅公钥登录）。安全组放行 **22** 与 **8000**。

访问地址：**http://139.224.30.109:8000/**

### 静态托管（备选）

也可将整个项目目录上传至 Netlify 或 Vercel；若改过 Ink，部署前先 `npm run build` 并提交 `ink/` 产物。

---

*Roll · 军训篇 · 2026*
