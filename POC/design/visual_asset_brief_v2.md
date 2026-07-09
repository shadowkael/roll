---
AIGC:
    Label: "1"
    ContentProducer: 001191110102MACQD9K64018705
    ProduceID: 2064199640680971_0/project_7658448532017398042-files/四年/design/visual_asset_brief_v2.md
    ReservedCode1: ""
    ContentPropagator: 001191110102MACQD9K64028705
    PropagateID: 2064199640680971#1783579184152
    ReservedCode2: ""
---
# 「那个谁」视觉资产制作指南 v2

> ⚠️ **已 superseded**：请以 [`visual_asset_brief_v3.md`](./visual_asset_brief_v3.md) 为准。  
> 下文 3D Q 版 Prompt 仅作历史参考。

> **用途**：供 AI 图像生成工具（Claude / GPT / Gemini / Midjourney 等）制作试玩版所需的全部视觉资产。
> **参考图**：`concept_art/IMG_1457.PNG`（3D Q版渲染，泡泡玛特盲盒质感）

---

## 一、总体风格定义

### 1.1 风格关键词
- **3D cute chibi render**（3D Q版渲染）
- **Blind box toy texture**（盲盒玩具质感）
- **Pop Mart style**（泡泡玛特风格）
- **Soft matte finish**（柔和哑光质感）
- **Warm nostalgic atmosphere**（温暖怀旧氛围）

### 1.2 禁止事项（红线）
- ❌ **禁止任何五官**：无眼、无嘴、无鼻、无眉毛、无腮红点、无任何面部细节
- ❌ **禁止发光特效**：无光晕、无发光边缘、无能量场
- ❌ **禁止披风/斗篷**：角色身上不能有任何飘逸布料
- ❌ **禁止日系动漫风格**：不要大眼睛、不要漫画线
- ❌ **禁止光遇风格过拟合**：不要过于抽象/空灵/飘渺
- ❌ **禁止肤色偏黄**：肤色必须偏粉（见下方色值）

### 1.3 色彩规范

| 用途 | 色值 | 说明 |
|------|------|------|
| **人物肤色** | **#F5D5C8** | 暖粉米色，中国人肤色偏粉调 |
| 文字主色 | #e8e0d4 | 米白色 |
| 强调/交互色 | #c4956a | 暖橙色 |
| UI背景 | #1a1a1a | 深灰近黑 |
| 迷彩绿（主色） | #4a6741 | 军绿色 |
| 迷彩绿（辅色） | #5c7a52 | 浅军绿 |
| 帽徽红 | #cc2222 | 五星红旗红底 |
| 帽徽黄星 | #ffcc00 | 五角星黄色 |
| 黑色作训鞋 | #2a2a2a | 近黑 |

---

## 二、人物设计规范

### 2.1 通用人物规格
- **头身比**：头部占身体 1/3（Q版比例）
- **头部**：完全光滑圆润，无任何五官。有头发轮廓（从帽檐下露出少量发丝暗示性别）
- **身体**：小巧，通过姿态/动作传达情绪（不靠表情）
- **肤色**：#F5D5C8（暖粉米色）
- **渲染质感**：3D盲盒玩具感，柔和哑光，有轻微阴影和景深

### 2.2 军训服装规范（必须严格遵守）

#### 参训学生标准着装
- **帽子**：绿色平顶作训帽（软帽，帽檐平直）。正面中央有**小型五星红旗帽徽**（红色底 + 五颗黄色五角星，尺寸约占帽面1/6）
- **上衣**：07式/19式绿色丛林迷彩作训服。翻领，前胸两个贴袋（带袋盖），扣子扣合
- **裤子**：同款迷彩作训裤，直筒
- **鞋子**：黑色作训鞋/迷彩胶鞋
- **可选细节**：白色T恤领口微微露出；左胸或帽檐可能有名字贴

#### 教官标准着装
- 同款迷彩作训服，但更整洁笔挺
- 同款作训帽 + 小型五星红旗帽徽
- **胸前哨子**（挂在脖子上，银色或黑色）
- 站姿明显比学生笔挺，是区分教官与学生的核心方式

#### 区分原则
- 教官 vs 学生：靠**站姿、气质、哨子**，不靠服装颜色
- 不同排的学生：服装**完全一样**，区分靠**位置、名字贴、小配件**（如排长有红色臂章）

---

## 三、需要制作的资产清单

### 3.1 场景背景图（3张）

| 编号 | 场景 | 描述 | 尺寸建议 |
|------|------|------|----------|
| BG-1 | 操场·站军姿 | 夏日清晨的操场，阳光从右上方洒下，远景有跑道和教学楼，地面是灰色水泥或塑胶地面，有淡淡的光影 | 1080×1920（9:16竖屏） |
| BG-2 | 操场·休息拉歌 | 同一个操场，但视角略低（坐姿视角），远处是另一排学生的轮廓，阳光偏暖黄（接近中午） | 1080×1920 |
| BG-3 | 操场·领队选拔 | 操场方阵视角，前方是教官站立的位置，两侧有其他方阵的模糊轮廓，午后光线，地面有长长的影子 | 1080×1920 |

### 3.2 角色立绘/精灵图（5个角色）

每个角色需要 2-3 个姿态，用于不同场景和状态。

| 编号 | 角色 | 出现场景 | 需要的姿态 | 区分特征 |
|------|------|---------|-----------|---------|
| CH-1 | 摇晃同学（小李） | S1 | ①站立摇晃（快晕）②被扶住/被扶走后稳定 | 帽檐歪了，脸色比其他角色更浅 |
| CH-2 | 排长 | S2 | ①站姿（紧张）②领唱（张嘴+握拳）③被安慰 | 红色臂章，比其他学生略高 |
| CH-3 | 高个男生 | S2 | ①站立（手放膝盖假装打拍子）②缩回去（低头）| 比周围角色高一个头 |
| CH-4 | 教官 | S1/S2/S3 | ①背面站姿（扫视）②正面（问话）③吹哨 | 胸前哨子，站姿笔挺，气质严肃 |
| CH-5 | 主角（你） | 全程 | ①背面站姿（默认）②举手（自荐）③走正步（侧面）④坐姿 | 永远以背面/侧面出现，直到揭面 |

### 3.3 状态图/特效

| 编号 | 资产 | 描述 |
|------|------|------|
| FX-1 | 羁绊揭面·模糊态 | 角色剪影，面容区域模糊/马赛克/虚线轮廓 |
| FX-2 | 羁绊揭面·清晰态 | 角色有完整五官的面容（仅在揭面动画中使用） |
| FX-3 | 空白剪影 | 完全没有内容的角色轮廓，配文"你没看清ta的脸" |
| FX-4 | 节奏游戏·Perfect | 命中时的粒子/闪光效果 |
| FX-5 | 节奏游戏·Miss | 角色踉跄的小动画帧 |

### 3.4 UI 元素

| 编号 | 资产 | 描述 |
|------|------|------|
| UI-1 | 标题页 | 产品名"那个谁"+ 开始按钮 + 背景氛围图 |
| UI-2 | 结果卡 | 结局展示页，含遗憾目录文案区域 |
| UI-3 | 揭面动画页 | 结算时的角色揭面展示框架 |

---

## 四、AI 生图 Prompt 模板

> 以下 prompt 模板已针对主流 AI 图像生成工具优化。使用时根据具体工具微调。

### 4.1 场景背景 Prompt 模板

```
3D cute chibi render style, blind box toy texture like Pop Mart, soft matte finish. 
[场景描述]. 
Warm nostalgic summer atmosphere, golden hour lighting with soft shadows.
No characters in the scene, environment only.
Color palette: warm yellow-orange tones with military green accents.
Vertical composition 9:16 ratio, 1080x1920 resolution.
No glow effects, no lens flare, no fantasy elements.
```

#### BG-1 操场·站军姿 专用 Prompt
```
3D cute chibi render style, blind box toy texture like Pop Mart. 
A Chinese university military training ground at early morning. 
Gray concrete parade ground with long morning shadows. 
In the background: a running track, simple teaching buildings, a few trees. 
Warm golden morning light from the upper right, creating soft shadows on the ground.
The scene feels vast and slightly intimidating from a freshman's perspective.
No characters present, environment only.
Vertical composition, warm nostalgic atmosphere, soft matte 3D render quality.
```

#### BG-2 操场·休息拉歌 专用 Prompt
```
3D cute chibi render style, blind box toy texture like Pop Mart. 
A Chinese university military training ground at midday rest time. 
Lower camera angle (sitting perspective), showing the ground texture and distant silhouettes of students. 
Open field with some patches of green grass at the edges. 
Warm yellow midday sunlight, slightly hazy atmosphere.
No characters present, environment only.
Vertical composition, warm energetic atmosphere, soft matte 3D render quality.
```

#### BG-3 操场·领队选拔 专用 Prompt
```
3D cute chibi render style, blind box toy texture like Pop Mart. 
A Chinese university parade ground in the afternoon for squad leader selection. 
Camera at formation level, looking toward the front where an instructor would stand. 
Other模糊 formation outlines on both sides. 
Afternoon golden light with very long dramatic shadows on the ground. 
Tense but hopeful atmosphere.
No characters present, environment only.
Vertical composition, dramatic warm lighting, soft matte 3D render quality.
```

### 4.2 角色立绘 Prompt 模板

```
3D cute chibi render style, blind box toy texture like Pop Mart, soft matte finish.
[角色描述].
Completely smooth featureless round head with NO facial features at all — no eyes, no nose, no mouth, no blush marks.
Skin tone: #F5D5C8 (warm pink-beige, Chinese skin tone, slightly pink not yellow).
Cute chibi proportions with head being 1/3 of total body height.
[服装描述].
No glow effects, no halos, no capes, no cloaks on the character.
Character stands/sits on a simple clean background.
Full body view, vertical orientation.
```

#### CH-1 摇晃同学（小李）专用 Prompt
```
3D cute chibi render style, blind box toy texture like Pop Mart.
A cute chibi Chinese university student about to faint during military training.
Completely smooth featureless round head, NO facial features at all.
Skin tone #F5D5C8 (warm pink-beige).
Wearing green woodland camouflage military training jacket with two chest pockets, matching pants, green flat-topped training cap with small five-star red flag cap badge (red background with 5 small yellow stars), tilted to one side, black training shoes.
The character is wobbling/dizzy, body leaning to one side, arms slightly out for balance.
A name tag on the cap brim shows only the character "李" (too small to read clearly).
The character looks paler than others.
Full body view, clean simple background.
No glow, no halo, no cape, no cloak.
```

#### CH-2 排长 专用 Prompt
```
3D cute chibi render style, blind box toy texture like Pop Mart.
A cute chibi Chinese university student serving as squad leader during military training.
Completely smooth featureless round head, NO facial features at all.
Skin tone #F5D5C8 (warm pink-beige).
Wearing green woodland camouflage military training uniform (jacket with two chest pockets, matching pants), green flat-topped training cap with small five-star red flag cap badge, black training shoes.
A red armband on the left arm indicating squad leader role.
Standing nervously, fists slightly clenched at sides, posture tense.
Slightly taller than other students.
Full body view, clean simple background.
No glow, no halo, no cape, no cloak.
```

#### CH-3 高个男生 专用 Prompt
```
3D cute chibi render style, blind box toy texture like Pop Mart.
A tall cute chibi Chinese university male student during military training.
Completely smooth featureless round head, NO facial features at all.
Skin tone #F5D5C8 (warm pink-beige).
Wearing green woodland camouflage military training uniform, green flat-topped training cap with small five-star red flag cap badge, black training shoes.
Noticeably taller than surrounding characters (about 1 head taller).
Hands on knees, posture suggesting he's secretly practicing conducting/drill movements.
Shy/hesitant body language.
Full body view, clean simple background.
No glow, no halo, no cape, no cloak.
```

#### CH-4 教官 专用 Prompt
```
3D cute chibi render style, blind box toy texture like Pop Mart.
A cute chibi Chinese military training instructor.
Completely smooth featureless round head, NO facial features at all.
Skin tone #F5D5C8 (warm pink-beige).
Wearing green woodland camouflage military training uniform (neater and more pressed than students), green flat-topped training cap with small five-star red flag cap badge, black training shoes.
A whistle hangs from a lanyard around the neck (silver or black).
Standing with extremely straight posture, conveying authority and discipline.
Confident, evaluating bearing. Arms may be crossed or at sides.
Full body view, clean simple background.
No glow, no halo, no cape, no cloak.
```

#### CH-5 主角（你）专用 Prompt
```
3D cute chibi render style, blind box toy texture like Pop Mart.
A cute chibi Chinese university freshman, viewed from behind or side angle.
Completely smooth featureless round head, NO facial features at all.
Skin tone #F5D5C8 (warm pink-beige).
Wearing standard green woodland camouflage military training uniform, green flat-topped training cap with small five-star red flag cap badge, black training shoes.
Default standing posture (at attention, slightly nervous).
ALWAYS shown from back or side view — never facing the camera.
Full body view, clean simple background.
No glow, no halo, no cape, no cloak.
```

### 4.3 揭面动画资产 Prompt 模板

#### 模糊态（未揭面）
```
3D cute chibi render style, blind box toy texture.
A cute chibi character silhouette with completely obscured face.
The face area is covered by a soft blur/mosaic/frosted glass effect, revealing nothing.
Body in standard military training uniform (green camouflage).
Mysterious, distant atmosphere.
Clean background, vertical orientation.
No glow, no halo, no cape.
```

#### 清晰态（揭面后）
```
3D cute chibi render style, blind box toy texture.
A cute chibi character with a gentle, warm face revealed for the first time.
Soft friendly features, kind eyes, slight natural smile.
Chinese university student appearance, [具体角色特征].
Warm golden lighting suggesting a moment of connection and memory.
Clean background, vertical orientation.
No glow, no halo, no cape.
```

---

## 五、色彩对照速查表

| 元素 | 色值 | 视觉描述 |
|------|------|----------|
| 人物肤色 | #F5D5C8 | 暖粉米色（偏粉不偏黄） |
| 迷彩主绿 | #4a6741 | 丛林绿 |
| 迷彩辅绿 | #5c7a52 | 浅丛林绿 |
| 帽徽红 | #cc2222 | 国旗红 |
| 帽徽黄星 | #ffcc00 | 五星黄 |
| 作训鞋 | #2a2a2a | 近黑 |
| UI背景 | #1a1a1a | 深灰近黑 |
| 文字 | #e8e0d4 | 米白 |
| 强调色 | #c4956a | 暖橙 |
| 排长臂章 | #cc3333 | 红色 |

---

## 六、资产制作优先级

### P0（试玩版必须有）
1. 3张场景背景（BG-1/2/3）
2. 教官角色立绘（CH-4）
3. 主角角色立绘（CH-5，背面）
4. 摇晃同学立绘（CH-1）
5. 标题页 UI（UI-1）

### P1（试玩版重要提升）
6. 排长立绘（CH-2）
7. 高个男生立绘（CH-3）
8. 结果卡 UI（UI-2）
9. 揭面·模糊态（FX-1）
10. 揭面·空白剪影（FX-3）

### P2（正式版需要）
11. 揭面·清晰态（FX-2，每个角色各一张）
12. 节奏游戏特效（FX-4/5）
13. 揭面动画页框架（UI-3）
14. 各角色多姿态变体

---

## 七、质量检查清单

生成每张图后，逐项检查：
- [ ] 头部完全光滑，无任何五官痕迹？
- [ ] 肤色是暖粉米色（不偏黄）？
- [ ] 帽子是绿色平顶作训帽，有小型五星红旗帽徽？
- [ ] 服装是绿色丛林迷彩，翻领+两个贴袋？
- [ ] 没有披风/斗篷/发光边缘/光晕？
- [ ] 整体是3D Q版盲盒质感（不是日系动漫/不是光遇抽象风）？
- [ ] 角色比例是Q版（头占1/3）？

---

> 本内容由 Coze AI 生成，请遵循相关法律法规及《人工智能生成合成内容标识办法》使用与传播。
