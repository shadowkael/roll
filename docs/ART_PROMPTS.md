# Roll · 军训篇 · AI 生图 Prompt 包

> 复制到 **Gemini**（Gemini Advanced / Imagen）或 Midjourney 使用。  
> 风格定调：`POC/design/visual_guide_v2.md`

---

## 制作顺序（建议）

```
① BG-1 操场空镜  →  ② SK-4 教官  →  ③ SK-5 主角  →  ④ SK-1 同学
```

先定 BG，再在 `tools/art-align.html` 里对齐角色位置。

---

## 全局 Negative Prompt（每条都加）

```
anime, chibi, Pop Mart, blind box, 3D render, cartoon, big eyes, galgame,
facial features, eyes, nose, mouth, smile, cute, fantasy, sci-fi UI,
glowing edges, magic particles, watermark, text overlay, logo,
low quality, blurry, oversaturated, cold blue tone, winter snow
```

---

## BG-1 · 站军姿操场（空镜）

**用途**：Scene1 底图 + 定镜「九月·操场」  
**文件**：`assets/bg/bg-1.jpg`（另存 `opening.jpg` 可同源）

```
Photorealistic photograph of a Chinese university military training parade ground,
early September morning, clear sky.
Golden sunlight from upper right at 45 degrees, long soft shadows on gray concrete ground.
Edge of red plastic running track visible at bottom, simple beige campus buildings
and green trees in soft bokeh background.
Empty scene — absolutely NO people, NO silhouettes, NO characters.
Warm nostalgic color grading like a 2015 smartphone photo,
slightly faded, subtle film grain, gentle vignette.
Vertical composition 9:16 portrait, camera at student eye level standing in formation.
Documentary photography, natural colors, not HDR, not cinematic teal-orange.
```

**Gemini 补充说明（粘贴到对话）：**
> 中国大学军训操场，九月上午，写实照片。不要任何人物。竖图 9:16。暖黄怀旧色调。

**验收**：无人、阳光从右上、地面有跑道线、远景教学楼虚化。

---

## SK-4 · 教官（背手巡视）

**文件**：`assets/sk/sk-4-stand.png`

```
Hand-drawn ink sketch on pure white background, export as transparent PNG.
Chinese military training instructor, male, age 25-30,
standing upright with hands clasped behind back, chest out, looking slightly to the side.
Green camouflage uniform, green flat training cap with small red star badge,
whistle on chest string, black boots.
NO facial features — completely blank smooth face, no eyes nose mouth.
Warm gray-brown ink lines #7a756c, subtle olive green shadow strokes #5a6b52.
Full body, 5-6 head proportions, NOT chibi, NOT anime.
Loose diary-margin sketch style, imperfect hand-drawn lines.
Single figure only, centered, vertical portrait orientation.
```

---

## SK-5 · 主角（背站）

**文件**：`assets/sk/sk-5-stand-back.png`

```
Hand-drawn ink sketch on pure white background, transparent PNG.
Chinese university freshman in military training camouflage uniform,
viewed strictly from BEHIND — back of head and shoulders visible,
standing at attention, feet together, arms at sides.
Green flat training cap, same uniform as peers.
NO face visible — back view only, no profile, no front.
Warm gray-brown ink #7a756c, diary sketch style, 5-6 head tall.
Full body, single figure, slightly warmer line tone than other characters (#c4956a hint OK).
NOT chibi, NOT 3D, NOT anime.
```

---

## SK-1 · 摇晃同学（姿态 ①）

**文件**：`assets/sk/sk-1-sway.png`

```
Hand-drawn ink sketch on pure white background, transparent PNG.
Chinese university freshman in military training uniform,
body leaning sideways as if dizzy, knees slightly bent, arms slightly out for balance.
Green flat cap TILTED to one side, small name tag on chest showing only one Chinese character "李".
NO facial features — blank smooth face area, no eyes nose mouth.
Posture must clearly read as "about to fall" / unsteady.
Warm gray-brown ink #7a756c, olive shadow #5a6b52.
Full body, 5-6 head proportions, NOT chibi.
Single figure, diary sketch style.
```

**姿态 ②（P1 可选）** → `sk-1-steady.png`：同一角色，被扶稳后站直，帽仍略歪。

---

## SK-bg · 远景队列剪影（P2 可选）

**文件**：`assets/sk/sk-bg-silhouettes.png`

```
Hand-drawn ink sketch, three small military training figures in a row,
seen from distance, simplified silhouettes, standing at attention.
NO facial features, very minimal detail, low contrast gray-brown lines.
Transparent background, horizontal group, figures small scale.
Same uniform style, faded opacity suitable for background layer.
```

---

## PS 后期（统一风格）

1. BG 上叠 SK 前：BG 调暖 `#e8c878` 倾向，轻降饱和
2. SK 去白底：「选择 → 颜色范围 → 白色」删底，或混合模式「正片叠底」
3. 线稿统一：`图像 → 调整 → 色相/饱和度` 把线条倾向 `#7a756c`
4. 导出 PNG-24，勾选「透明度」

---

## 完成后

1. 文件放入 `assets/bg/`、`assets/sk/`
2. `asset-manifest.json` 对应项改 `"status": "done"`
3. 打开 `tools/art-align.html` 微调坐标 → 更新 `assets/hotspots/scene1.json`
4. 刷新游戏 Scene1 自动切换为美术模式
