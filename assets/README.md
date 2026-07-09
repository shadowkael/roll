# 美术资产目录

竖屏 **1080×1920（9:16）**。放入文件后刷新游戏即可预览（需 `npm run dev`）。

## 目录

```
assets/
├── bg/           # 实景底图 JPG（无人物）
├── sk/           # 手绘角色 PNG（透明底、无五官）
├── hotspots/     # 场景叠层与热区坐标
└── source/       # PS 工程 / 参考图（可选，不打包进部署）
```

## P0 制作顺序（Scene1）

1. `bg/bg-1.jpg` — 操场空镜
2. `sk/sk-4-stand.png` — 教官
3. `sk/sk-5-stand-back.png` — 主角（背影）
4. `sk/sk-1-sway.png` — 摇晃同学

Prompt 全文见 **`docs/ART_PROMPTS.md`**。

## 导出规范

| 类型 | 格式 | 说明 |
|------|------|------|
| BG | JPG 85% | 1080 宽，可略裁切 |
| SK | PNG-24 | 透明底，线稿 `#7a756c` |
| 命名 | 小写+连字符 | 如 `sk-1-sway.png` |

## 状态追踪

编辑 `asset-manifest.json` 里对应项的 `status`：`pending` → `wip` → `done`。

## 对齐预览

浏览器打开 `tools/art-align.html`，上传 BG/SK 拖拽对齐，导出坐标到 `hotspots/scene1.json`。
