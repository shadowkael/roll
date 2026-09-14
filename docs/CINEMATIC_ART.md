# 近景环境与动画人物

2026-09-13，为沉浸式交互重做增加。

## 背景图集

- 文件：`public/art/scene-backgrounds.png`
- 1254 × 1254 PNG；严格 2列 × 3行，每格 627 × 418。
- 顺序：宿舍、图书馆、食堂、操场、树荫、校门。
- 使用内置 image_gen 生成。已目视确认六种环境、完整边缘、无人物、无文字及水印。运行时由 Canvas 按格取图，环境镜头有缓动。
- 原始文件：`/Users/apple/.codex/generated_images/01a09aac-a85b-7021-b2e6-1ed943c1ef4e/exec-9071ef42-605b-42df-a76d-4761844de60a.png`

## 动画和清晰程度

`src/cinematic.mjs` 使用 code-native Canvas 绘制可动人物。躯干、头、肢体和手中物件独立变换；不同分镜手势实际影响姿态。面容从留白到出现眉眼鼻口，服装和发型从一开始可辨认。新面部细节会在约 1.25 秒内渐显；衣服与四肢使用柔和渐层、弧形迷彩、布料细纹和褶皱，头发以圆缓弧线与发丝表现。不会放大静态肖像冒充近景动画。

广角镜头里，桌面人物约画面 58% 高。人物镜头明确推近为腰部以上的中近景（桌面 1.58 倍，手机 1.5 倍），保留头顶的标题空间；道具镜头推近为手和物件特写（桌面 2 倍，手机 1.85 倍），按当前手势自动将物件移到屏幕中央偏上，避免被字幕覆盖。热点位置由 renderer 返回 CSS 像素坐标供 DOM 无障碍按钮使用。减少动态开启时停用环境摇曳、自动动作及镜头缓动，用户操作仍可即时反馈。

分镜的 `actor` 可以是玩家或某位 NPC。玩家折衣、递还小票等使用前景手臂；玩家踏步使用前景裤腿和鞋，避免让 NPC 代替玩家完成选择。`propOwner: 'player'` 明确区分玩家手持物与脚下的鞋。校园时钟进入晚上时，近景也会压低环境亮度并增加暖色灯光。

`tests/cinematic.test.mjs` 覆盖六环境和全部道具、手势、移动屏幕热点、暂停、减少动态，以及面部渐显时间。背景图片已目视检查，最终浏览器整体验收由主任务统一执行。

## 最终提示词

```text
Use case: illustration-story
Asset type: production environment background atlas for a literary Chinese university life game. One canvas with SIX equally sized scenes in a STRICT 2 COLUMN by 3 ROW grid. Overall image square; every cell is a wide 3:2 landscape scene. All six cells exact equal width and height, no gutters and no frames. Every scene must stay within its own cell and not overlap. No people anywhere: animated game characters will be composited over these backgrounds.
Style: exquisite warm paper watercolor and fine colored-pencil narrative illustration, muted sage, ivory, ochre, terracotta, restrained modern Chinese campus realism, September afternoon, soft dappled light, textured painterly edges; no anime, no photorealism, no 3D.
TOP LEFT: freshman dormitory interior, simple Chinese university room with bunk bed and wooden desk toward the left and back, neatly folded bedding, a window on right with soft sun; open pale warm floor and wall through center right reserved for standing animated figures.
TOP RIGHT: university library public reading room, wide softly glowing windows behind, low shelves along far wall, warm wood reading table and empty chairs at left, pale calm unobstructed center and right for figures.
MIDDLE LEFT: university dining hall, warm pale terrazzo, canteen counters and muted metal tray shelving in distance, a few empty wooden tables around outer sides, gentle noon window light, clear open center.
MIDDLE RIGHT: university athletics field close view, terracotta running track sweeping across bottom and lower midground, sage turf behind, distant cream campus buildings, low trees; open center, soft late September sun.
BOTTOM LEFT: quiet university ginkgo-tree shade and a long simple wood bench across left background, dappled leafy shadows over pale stone path, a calm sunlit lawn on right, intimate foliage framing upper corners, open center for figures.
BOTTOM RIGHT: Chinese university entrance welcome area, stone gate pillars distant, modest campus buildings and ginkgo beyond, several plain cardboard boxes of folded muted green training uniforms stacked at left foreground and a wooden distribution table at right edge, clear middle foreground for figures.
Composition: camera at human eye level for all six scenes, each a believable intimate stage at a distance of three meters, not aerial, coherent perspective. Draw every cell edge to edge. Avoid a white margin. Character placement reserved in the middle 45% of each scene; no large foreground objects obscuring the center.
Constraints: exact 2x3 grid in the stated order; no text, no characters, no faces, no letters, no logos, no watermarks. Do not put text labels on buildings, book spines, banners or boxes.
```
