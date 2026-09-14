# 《那个谁》美术方向与资产清单

本页记录《那个谁》重做版的封面、人物肖像与本轮新增的近景环境和动作表现。三张图集／插画均为 2026-09-13 使用 **内置 image_gen** 制作的原创生成素材，实际图片保存在项目内；可动人物、道具与镜头由 Canvas 代码绘制，运行时不依赖生成工具目录。

2026-09-13 此前已核验线上九个公开文件与 `eb6d132` 构建产物逐项 SHA-256 一致。本轮新增近景环境、逐镜交互与声音增强仍在工作区，**尚未发布**。这里的资产说明不代替本轮浏览器画面、触控或听感验收。

## 视觉方向

校园使用暖白纸张、鼠尾草绿、陶土红与淡彩铅笔线条。可行走校园由 Canvas 绘制，封面提供整体气氛。交流时拉近到六种地点背景，前景人物的头、躯干、肢体与道具独立变换，随着当前句和已选回应做出递物、倾听、点头、摆动或走动。原人物肖像图集保留供人物与回忆展示使用。

人物相识前保留发型、眼镜、军训帽和姿态等识别线索。动画近景的面部从留白逐步增加眉眼鼻口；肖像展示继续使用局部面部遮罩随理解阶段减弱的方式，保持自然、克制的五官。理解与亲近不等同，已看清的面容不因关系下降而再次模糊。主角仍保留代入空间，必要时只用前景的手臂、裤腿或鞋呈现动作。

日常细节服务于不同年龄的理解：十七至十九岁的玩家能够感受新校园里的小小试探，毕业多年的人也能认出衣架碰响、食堂找座、挂断电话后坐一会儿的分寸。物件与动作承载熟悉感，人物关系从同学、室友、朋友和师生之间的具体回应自然展开。

## 文件与接入约定

- `public/art/campus-cover.png`：1672 × 941 PNG，横向大学校园鸟瞰插画。画面左上为标题预留柔和纸色区域；不包含文字、标识或 UI。
- `public/art/portraits.png`：1254 × 1254 PNG，严格 2 × 2 均分人物肖像图集；每格 627 × 627。左上李屿、右上陈可、左下周舟、右下教官。完整自然五官用于清晰阶段。
- `public/art/scene-backgrounds.png`：1254 × 1254 PNG，2 列 × 3 行的六地点近景图集，每格 627 × 418。按行依次为宿舍、图书馆、食堂、操场、树荫、校门；背景无人物，供可动人物与道具叠加。完整来源和生成提示词见 [近景环境与动画人物](CINEMATIC_ART.md)。

四格背景定位建议使用 `background-size: 200% 200%`，顺序对应 `0% 0%`、`100% 0%`、`0% 100%`、`100% 100%`。容器保持正方形，避免拉伸。面部区域大约为单格的水平 31%—70%、垂直 20%—59%；可按角色微调，帽檐与眼镜宜保留部分轮廓。不要使用覆盖整张图片的高斯模糊，因为服装和动作应从一开始就可辨识。

## 近景交互与模块分工

`src/scene-content.mjs` 的 `getScenePlan(dialogue, state)` 将每行原有文字映射为一个镜头，配置全景、人物或细节的焦点，以及当前动作、道具和演员归属。衣架、小票、帽扣、餐盘、水壶纸条和未按下的手表都有对应细节。`actor` 与 `propOwner` 把玩家递还小票、教官走近或室友碰鞋区分开，避免所有动作落到同一个人物身上。

`src/cinematic.mjs` 负责环境图集、可动人物、面部渐显、道具、昼夜光线与热点位置。`src/main.mjs` 和 `src/encounter.css` 负责逐镜字幕、可点击热点、直接回应和回看这段对话。观察热点用于留意眼前细节，选项出现前不会替玩家决定捡小票、帮忙或自荐；最后一镜交还原有选择。直接回应可跳过演出，回看可展开当前对话原文。设置中的减少动态选项保留阅读和操作反馈。

近景的数据与画面分别维护，具体约定见 [近景演出方向](SCENE_DIRECTION.md) 和 [近景环境与动画人物](CINEMATIC_ART.md)。逻辑层仍决定时间、关系和回忆，观察镜头本身不会额外积累认识程度。

## 音乐与动作的配合

`src/audio.mjs` 用 Web Audio 实时演奏为本项目编写的两段原创配乐：《九月的小路》与《灯亮起来以后》。轻钢琴、拨弦和低音量和声随昼夜变化；进入交流近景后，音乐降低音量与旋律密度，为阅读和物件声音留出空间。训练节拍期间停止背景乐，页面隐藏后停止发声。

纸页、衣料、扣件、餐盘和脚步有对应的短音效，倾听或点头等不必发声的动作保持安静。音乐与音效分别开关，背景音乐音量独立调节；当前没有音效音量滑块。音频须在玩家操作后启用，初次扉页不会自动发声。乐谱、配器与接入细节见 [音乐与声音](AUDIO_DIRECTION.md)。

## 首批素材目视记录

首批封面与肖像的制作记录中已检查生成图：封面是横向淡彩校园，跑道、教学楼、宿舍、路径和银杏清晰，左上可叠标题，无图中文字与水印；四人肖像均可识别，脸部自然，四象限没有相互重叠，头部完整，适合按四格独立显示。人物衣服自然延伸到每格底部，在 UI 中按胸像裁切。

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

项目只引用 `public/art/` 内的副本，源文件留作制作记录。新增六地点近景图集的源位置和提示词保存在 [CINEMATIC_ART.md](CINEMATIC_ART.md)。当前工作区与线上版本的区别、实际验证进展和发布状态由 [HANDOFF.md](../HANDOFF.md) 统一记录。

