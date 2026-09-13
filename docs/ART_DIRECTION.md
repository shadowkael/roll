# 《那个谁》美术方向与资产清单

本页记录重做版首批实际游戏美术。生成方式为 **内置 image_gen**；已将最终图片复制进项目，运行时不依赖生成工具的默认目录。两张均为原创生成素材，2026-09-13 制作。

## 视觉方向

校园使用暖白纸张、鼠尾草绿、陶土红与淡彩铅笔线条。封面与近景人物共享纸张质感；可行走校园由应用的 Canvas 渲染，插画承担标题页与交谈近景，避免把一张静态插画误当作可探索场景。

人物相识前保留发型、眼镜、军训帽和姿态等识别线索；局部面部遮罩随理解阶段减弱，清晰后的肖像保留自然、克制的五官。理解与亲近不等同，已看清的面容不因关系下降而再次模糊。

## 文件与接入约定

- `public/art/campus-cover.png`：1672 × 941 PNG，横向大学校园鸟瞰插画。画面左上为标题预留柔和纸色区域；不包含文字、标识或 UI。
- `public/art/portraits.png`：1254 × 1254 PNG，严格 2 × 2 均分人物肖像图集；每格 627 × 627。左上李屿、右上陈可、左下周舟、右下教官。完整自然五官用于清晰阶段。

四格背景定位建议使用 `background-size: 200% 200%`，顺序对应 `0% 0%`、`100% 0%`、`0% 100%`、`100% 100%`。容器保持正方形，避免拉伸。面部区域大约为单格的水平 31%—70%、垂直 20%—59%；可按角色微调，帽檐与眼镜宜保留部分轮廓。不要使用覆盖整张图片的高斯模糊，因为服装和动作应从一开始就可辨识。

## 目视检查

已检查最终生成图：封面是横向淡彩校园，跑道、教学楼、宿舍、路径和银杏清晰，左上可叠标题，无图中文字与水印；四人肖像均可识别，脸部自然，四象限没有相互重叠，头部完整，适合按四格独立显示。人物衣服自然延伸到每格底部，在 UI 中按胸像裁切。

## 最终生成提示词

### 校园封面

```text
Use case: illustration-story
Asset type: production cover illustration for a literary 2D isometric Chinese university life exploration game, title “那个谁” (do not write title in image).
Primary request: A beautiful warm hand-painted watercolor and colored-pencil September Chinese university campus seen from a high oblique bird's-eye view, horizontal wide landscape 16:9. Meandering pale stone footpaths connect a terracotta athletics running track with a green center field, modest cream red-tile academic buildings, a dormitory courtyard and a library. Ginkgo and plane trees with soft sage green leaves and tiny early yellow accents. A few tiny students in muted camouflage training uniforms strolling or gathering, faceless at this distance.
Style/medium: sophisticated illustrated travel sketchbook; delicate imperfect pencil architectural lines, transparent watercolor washes, subtle textured warm ivory paper, gentle atmospheric depth. 2D painted storybook illustration, coherent perspective, legible buildings and paths.
Composition/framing: campus itself fills right two thirds and bottom, airy pale paper and softly painted tree canopy toward upper left allowing an interface title overlay; balanced winding diagonal paths, no map labels, no UI, no framing border.
Lighting/mood: early September warm morning, nostalgic, quiet, inviting, human scale.
Color palette: warm ivory #f4efdf, sage greens, muted ochre, terracotta running track, dusty blue-grey shadows. Restrained colors, light values.
Constraints: no letters, no Chinese text, no text whatsoever, no watermarks, no logos, no distinct facial details, no photorealism, no glossy 3D, no dramatic fantasy architecture, no Japanese school motifs. High-quality finished illustration with plenty of calm negative space.
```

### 人物肖像表

```text
Use case: illustration-story
Asset type: one production character portrait sprite sheet for a quiet literary Chinese university life game, exactly four distinct character busts arranged in a STRICTLY EVEN 2 by 2 grid.
Primary request: Square canvas, four evenly divided quadrants, seamless uniform warm ivory paper background. Every character is shown as a separate complete chest-up portrait occupying only their own quadrant, with identical head size, full head and hat/hair visible, generous background margins. No frames or divider lines. Head centers precisely at (25% width, 20% height), (75% width, 20% height), (25% width, 70% height), (75% width, 70% height). Shoulders and chest contained in each quadrant; no body parts cross the central horizontal or vertical lines.
Top LEFT: Li Yu, 18-20 year old male Chinese freshman with short black hair under a slightly crooked soft camouflage military-training cap, youthful slim face, casual green camouflage training jacket, reserved but open expression, loose relaxed posture.
Top RIGHT: Chen Ke, 18-20 year old female Chinese freshman, shoulder-length straight black hair, slim round wire glasses, muted green camouflage training jacket, holding one plain closed cream book against her chest, observant quiet expression, no hat.
Bottom LEFT: Zhou Zhou, 18-20 year old Chinese freshman with cropped short black hair, soft friendly androgynous youthful face, warm slight smile, loose camouflage training jacket, relaxed shoulders, no hat.
Bottom RIGHT: a young adult Chinese military-training instructor age 26-30, male, upright posture, neat camouflage cap and neatly fitted muted camouflage uniform, calm serious approachable face.
Style/medium: sophisticated hand-painted delicate transparent watercolor and fine imperfect colored pencil linework on warm ivory paper, literary storybook art, gentle natural facial proportions, minimal line detail, fully visible natural understated eyes, noses and mouths for all four. Painterly, warm, restrained, NOT anime, NOT photorealistic, NOT 3D.
Lighting/mood: soft warm September daylight, gentle diffuse shadows.
Color palette: warm ivory paper #f4efdf, muted sage green and olive camouflage with subtle brown accents, charcoal black hair, natural warm skin, tiny dusty rose cheek accents.
Constraints: four characters only, one in each equal quadrant; no overlapping; no character cut off at top or sides; each face forward or subtle three-quarter facing toward viewer; eyes at same relative height in every quadrant. No words, names, letters, numbers, logos, watermark, insignia or readable book text. Do not add any dividers, collage frames, decorations or background objects. The game will crop every exact quadrant as an independent portrait, so symmetric sizing and clean crop margins are essential.
```

## 生成源位置

- 校园：`/Users/apple/.codex/generated_images/01a09aac-a85b-7021-b2e6-1ed943c1ef4e/exec-2641c53d-f48f-4b6d-886a-2ff249ccddff.png`
- 肖像：`/Users/apple/.codex/generated_images/01a09aac-a85b-7021-b2e6-1ed943c1ef4e/exec-6df14375-003a-4850-acba-9bcd53f858d3.png`

项目只引用 `public/art/` 内的副本，源文件留作制作记录。

