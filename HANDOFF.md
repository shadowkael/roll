# HANDOFF

> 工作切片交接文档。每完成一个可交付切片后必须更新本文件，使「代码状态 + 交接说明 + 验收标准」三者对齐。约定见 `.cursor/rules/handoff.mdc`。

**最后更新：** 2026-07-14  
**分支：** `main`（含 Scene1 透视 + HANDOFF/README 文档；是否已 push 以 `git status` 为准）  
**线上：** http://139.224.30.109:8000/（需 push 后才含本切片）

---

# 当前目标

横屏目视确认 Scene1 透视（教官更远、同学与自己体量相当），必要时在 `art-align` 微调后部署；保持 `HANDOFF.md` 与代码切片同步。

最终用户体验：横屏打开军训篇，Scene1 实景底图 + 手绘 SK 叠层透视自然，热区可点；随后 Scene2/3 Ink 叙事 → 节奏游戏 → 揭面结算可完整走通。

---

# 已完成

- **本切片（即将 / 刚提交）：** Scene1 透视粗调 + `HANDOFF.md` / README / `.cursor/rules/handoff.mdc`  
  - 文件：`assets/hotspots/scene1.json`、`tools/art-align.html`、`HANDOFF.md`、`README.md`、`.cursor/rules/handoff.mdc`  
  - 教官 `bottom: 42%` / `width: 5.5%`；同学 `width: 18.5%` 与自己同深度对齐可视身高  
  - 测试：本地合成预览；待横屏目视终验
- **`d39b67f`** Migrate Scene2 and Scene3 narrative into the Ink pipeline.  
  - 文件：`stories/military.ink`、`ink/military.json`、`ink/military.sha256`、`js/ink-controller.js`、`js/scenes/scene2-ink.js`、`js/scenes/scene3-ink.js`、`js/scenes/scene2.js`、`js/scenes/scene3.js`、`docs/INK.md`、`README.md`  
  - 测试：`npm run ink:check`；本地走通 `# handoff:rhythm` / `# handoff:ending`
- **`63c2eff`** Align Scene1 hotspots to landscape art layers.  
  - 文件：`assets/hotspots/scene1.json`、`js/scene-compositor.js`、`css/style.css`、`tools/art-align.html`  
  - 测试：美术模式叠层 + `?debugHotspots=1` 热区可见
- **`1dae2d5`** Add landscape P0 Scene1 art and align docs to 16:9.  
  - 文件：`assets/bg/bg-1.jpg`、`assets/sk/sk-*.png`、`docs/ART_*.md`、manifest  
  - 测试：本地 `serve` 可见 BG/SK
- **`4dd4754`** Serve `.mjs` as JavaScript（生产 ES modules 可加载）
- **`0b79974` … `d2e3f51`** CI：`package-lock`、Linux 跳过 inklecate、`ink:check`、pre-commit、SSH 私钥部署、Actions Node 24

---

# 正在进行

- **文件：** 无进行中的代码编辑（等待目视验收）
- **已做到：** 透视参数与交接文档已入库（见上一节本切片）
- **剩余步骤：**
  1. 横屏打开 `tools/art-align.html` / 游戏确认比例
  2. 若需微调：改 JSON → 再更新本文件 → commit
  3. （可选）`git push origin main` 触发部署
- **未提交修改：** 否（本提交之后应干净；若有本地未跟踪预览图勿提交）

---

# 技术决策

- **Scene1–3 叙事进 Ink，玩法用 `# handoff`：** 保持单故事源（`stories/military.ink`），节奏游戏 / 结算仍用 JS 模块，避免把非分支玩法硬塞进 Ink。
- **图层与热区以 JSON 为准（`assets/hotspots/scene1.json`）：** `scene-compositor.js` 在 art-mode 下生成叠层与不可见热区，CSS 线框仅作无资产回退。
- **横屏 16:9 舞台：** BG 1920×1080；对齐工具舞台 640×360，百分比坐标与线上一致。
- **同学按身高对齐 width，而非同 width%：** 精灵画布宽高比不同，同宽会导致同学过矮。
- **CI Linux 不跑 inklecate：** 以已提交的 `ink/military.json` + `ink/military.sha256` + `npm run ink:check` 保证源与产物一致；本机改 ink 须先 build。
- **部署用 `SSH_PRIVATE_KEY`：** 服务器仅公钥登录；已放弃 Actions 密码部署。

放弃过的方案：

- Scene2/3 继续整段 legacy JS 叙事 — 与 Scene1 Ink 管线分裂，难维护标签与变量。
- 对搜索引擎 URL 用 scrape、对热区写死在 DOM — 不利于美术迭代与 art-mode 单一数据源。

---

# 已知问题

- **当前报错：** 无已知阻塞性运行时错误；Scene1 透视仍待人工目视验收。
- **未覆盖边界：**
  - `loadProgress` 跨会话精确恢复到任意 knot / 玩法中段尚未做
  - Scene2/3 尚无正式 BG/SK（多依赖线框或占位）
  - 竖屏 / 小屏仅为降级，非一等体验
- **临时 / stub：**
  - `js/scenes/scene1.js`、`scene2.js`、`scene3.js` 旧逻辑保留参考或薄包装
  - 揭示 / FX 资产、分享与分析未做
  - `docs/INK.md` 个别旧表述可能仍写 `handoff:scene2` → legacy（以 `ink-controller.js` 与实际标签为准）

---

# 验收标准

## 功能行为

- [ ] Scene1：教官脚底明显在更远地面；近处自己与同学体量观感相当
- [ ] Scene1 热区（太阳 / 教官 / 同学头身 / 自己 / 地面等）可点，Ink 推进正常
- [ ] Scene1 → Scene2 → Scene3 → `# handoff:rhythm` → 结算/`# handoff:ending` 可走通
- [ ] 生产站 ES modules 加载正常（页面「开始」有响应）

## 测试命令

```bash
npm install
npm run build
npm test                 # ink:check
npm run dev              # http://localhost:3000
# 或临时端口：npx serve -l 3010 .
```

对齐微调：http://localhost:3000/tools/art-align.html  
热区调试：http://localhost:3000/?debugHotspots=1

## 成功条件

- 上述勾选项在横屏浏览器（或真机横屏）目视 + 点击通过
- `npm test` 通过；若改过 `.ink`，`ink/military.json` 与 sha 已更新且已提交
- `HANDOFF.md` 与当前分支 / 未提交状态一致

---

# 下一步

运行 `npm run dev`，打开 http://localhost:3000/tools/art-align.html 横屏目视 Scene1；若不满意则微调后改 `assets/hotspots/scene1.json` 并再更新本文件，满意则执行 `git push origin main` 部署。
