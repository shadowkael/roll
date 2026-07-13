# 美术工作流：PS 热区 + AI 生图

> 定调见 `POC/design/visual_guide_v2.md` 与 `POC/design/visual_asset_brief_v3.md`  
> 目标：**实景底图 + 手绘无五官线稿**，章末过场揭面。  
> **完整 Prompt 包**：`docs/ART_PROMPTS.md`（建议从这里开始复制生图）

## 单人流程（开发 + PS）

```
1. AI 生成 BG 底图（无人物）
2. AI 生成 SK 角色 PNG（透明底、无五官）
3. PS 合成定稿帧 → 导出 assets/bg/、assets/sk/
4. PS 在同一画布上标热区 → 导出 JSON（见下）
5. scene-compositor.js 叠层 + 热区点击（后续替换 CSS 简笔画）
```

无需 Figma；Gemini / Midjourney / SD 等通过**复制 Prompt** 使用（Cursor 内也可按 Prompt 包生图）。

---

## 资产清单（军训试玩版优先）

| 优先级 | 编号 | 说明 |
|--------|------|------|
| P0 | BG-1 | 站军姿操场空镜 |
| P0 | SK-1 | 摇晃同学（2 姿态） |
| P0 | SK-4 | 教官背手 |
| P0 | SK-5 | 主角背站 |
| P1 | BG-2 | 拉歌休息 |
| P1 | SK-2 / SK-3 | 排长、高个 |
| P2 | FX-1～3 | 章末揭面 |

尺寸：背景 / 场景定镜 **1920×1080（16:9）横屏**；角色 SK 透明底立绘（单人竖构图即可）。

---

## BG-1 Prompt（Gemini / MJ 通用）

**实景 · 站军姿 · 空镜**

```
Photorealistic Chinese university parade ground, early September morning.
Golden sunlight from upper right, long shadows on gray ground.
Running track edge, simple campus buildings in soft focus background.
Empty scene, NO people, NO characters.
Warm yellow-orange nostalgic grade, slight desaturation, subtle film grain.
Horizontal composition 16:9 landscape, documentary photography style.
No fantasy, no anime, no 3D render, no toy texture.
```

---

## SK-1 Prompt（摇晃同学 · 线稿透明底）

```
Hand-drawn ink sketch of a Chinese university freshman in military training uniform,
slightly swaying posture, tilted cap brim, name tag blank or single character "李".
Faceless: NO eyes, NO nose, NO mouth — smooth blank face or hair shadow only.
Warm gray-brown line art #7a756c, light olive shadow hints #5a6b52.
Transparent background PNG, 5-6 head tall proportion, not chibi.
Single character, centered, full body visible.
No 3D, no anime big eyes, no emoji style.
```

---

## PS 热区标注

1. 打开合成稿（BG + SK 对齐后的 Scene1 定稿）
2. 用矩形工具框选可点击区域（太阳、教官、同学头/身、地面、自己、背景人群）
3. 记录相对坐标（百分比，与现有 `showBubble(1, text, top, left)` 一致）
4. 导出 `assets/hotspots/scene1.json` 示例：

```json
{
  "scene": "scene1",
  "base": "assets/bg/bg-1.jpg",
  "layers": [
    { "id": "instructor", "src": "assets/sk/sk-4-stand.png", "x": "12%", "y": "28%", "w": "18%" }
  ],
  "hotspots": [
    { "id": "sun", "knot": "s1_hotspot_sun", "shape": "rect", "top": "5%", "left": "55%", "w": "25%", "h": "20%" },
    { "id": "classmate_head", "knot": "s1_hotspot_classmate_head", "shape": "rect", "top": "32%", "left": "48%", "w": "12%", "h": "10%" }
  ]
}
```

5. `scene1-ink.js` 已按 `data-el` / `data-part` 映射 knot；换视觉后改为读取 JSON 或保留相同 id。

---

## 色彩速查

| 用途 | 色值 |
|------|------|
| 线稿主色 | `#7a756c` |
| 线稿辅助 | `#5a6b52` |
| 揭面肤色 | `#e8d0c0` |
| UI 文字 | `#e8e0d4` |
| 交互强调 | `#c4956a` |

---

## 红线（正式包禁止）

- 故事进行中出现五官
- CSS 简笔画火柴人对外发布
- 3D 盲盒 / 光遇式全抽象
- 与军训无关的奇幻 UI

工程原型中的 CSS 占位仅用于玩法验证，上线前替换为 BG+SK 合成。
