# 「那个谁」视觉资产制作指南 v3

> **用途**：AI 生图 / 外包 brief / 工程对接  
> **风格定调**：`visual_guide_v2.md` — **实景 + 手绘线稿，故事中无五官，羁绊揭面**  
> **取代**：`visual_asset_brief_v2.md`（3D Q 版 Prompt 仅作历史参考）

---

## 一、风格关键词

### 1.1 必达

- **Photorealistic military training ground**（写实军训操场实景）
- **Hand-drawn ink sketch overlay**（手绘线稿叠层）
- **Faceless characters**（无五官，靠姿态表达）
- **Warm nostalgic faded photo**（暖色怀旧、轻褪色）
- **Chinese university freshman military training**（中国大学军训）

### 1.2 禁止（红线）

- ❌ 任何故事进行中的**五官**（眼、鼻、嘴、眉）
- ❌ 3D 盲盒 / 泡泡玛特 / 光遇式全抽象（非目标风）
- ❌ 日系大眼立绘、Galgame 风格
- ❌ 简笔画火柴人（**仅工程线框**，不可进正式包）
- ❌ 发光边缘、魔法粒子、奇幻元素
- ❌ 与军训无关的科幻/游戏 UI 装饰

---

## 二、色彩规范

| 用途 | 色值 | 说明 |
|------|------|------|
| 手绘线稿 | `#7a756c` | 暖灰褐，主线条 |
| 手绘辅助线 | `#5a6b52` | 淡军绿，阴影/迷彩暗示 |
| 揭面后肤色 | `#e8d0c0` | 自然暖肤，仅揭面资产 |
| 文字主色 | `#e8e0d4` | 米白 UI |
| 强调/交互 | `#c4956a` | 暖橙 |
| UI 背景 | `#1a1a1a` | 深灰 |
| 实景暖调 | 整体偏 `#e8c878`～`#d4a574` | 九月阳光 |
| 帽徽红 / 星黄 | `#cc2222` / `#ffcc00` | 作训帽徽 |

---

## 三、资产分层与编号

### 3.1 实景底图（BG）— 无人物

| 编号 | 场景 | 描述 | 尺寸 |
|------|------|------|------|
| BG-1 | 站军姿 | 夏日上午操场，阳光自右上，塑胶/水泥地面，远景跑道与教学楼，**无人** | 1920×1080（16:9） |
| BG-2 | 拉歌休息 | 同场低角度，地面纹理清晰，远处模糊人影可省略，**无清晰人物** | 1920×1080（16:9） |
| BG-3 | 领队选拔 | 方阵视角，前方为空地（教官位），两侧远景队列虚化，午后长影 | 1920×1080（16:9） |

可选：**BG-1b / 2b / 3b** 共 6 张「选择后果」状态底图（整图切换，见方案 C）。

### 3.2 手绘角色（SK）— 透明 PNG，无五官

每个角色 2～3 姿态，**正常～略缩短比例（5～6 头身）**，线稿或线稿+淡彩。

| 编号 | 角色 | 场景 | 姿态 | 区分 |
|------|------|------|------|------|
| SK-1 | 摇晃同学 | S1 | ① 摇晃 ② 被扶稳 | 帽檐歪、名字贴「李」 |
| SK-2 | 排长 | S2 | ① 紧张立正 ② 领唱（身体前倾） | 红臂章 |
| SK-3 | 高个男生 | S2 | ① 手放膝假装打拍 ② 缩回去 | 高一头 |
| SK-4 | 教官 | S1～S3 | ① 背手巡视 ② 正面对话 ③ 吹哨 | 胸哨、笔挺 |
| SK-5 | 主角 | 全程 | ① 背站 ② 举手 ③ 侧走正步 | **仅背/侧面** |

### 3.3 揭面资产（FX）— 用于章末过场

| 编号 | 描述 |
|------|------|
| FX-1 | 羁绊·模糊：线稿剪影，脸部 blur 或虚线空廓 |
| FX-2 | 羁绊·清晰：同角色淡彩肖像（**仅章末过场**） |
| FX-3 | 未羁绊：空白线稿 +「你没看清 ta 的脸」 |
| FX-4 | 主角：全剧终遗憾清单之后（可选） |
| FX-5 | 章末过场：Interlude 用动效素材（空操场、哨声字卡等） |

### 3.4 UI

| 编号 | 描述 |
|------|------|
| UI-1 | 标题页：产品名 + 开始；背景可用 BG-1 虚化 |
| UI-2 | 遗憾清单页（全剧/本章高潮，滚动文案） |
| UI-3 | 章末过场框架（动画 + 揭面位） |

---

## 四、AI Prompt 模板

### 4.1 实景底图（无人物）

**通用模板**

```
Photorealistic photograph of a Chinese university military training ground,
[time of day and lighting description].
Warm nostalgic color grading, slightly faded like an old phone photo,
subtle film grain, soft shadows.
Empty scene, NO people, NO characters.
Realistic plastic track or concrete parade ground,
distant teaching buildings and trees.
Horizontal composition 16:9 landscape widescreen, documentary style.
No fantasy, no anime, no 3D render, no toy texture.
```

**BG-1 站军姿**

```
Photorealistic Chinese university parade ground, early September morning.
Golden sunlight from upper right, long shadows on gray ground.
Running track edge, simple beige campus buildings in soft focus background.
Empty, no people. Warm yellow-orange nostalgic grade, slight desaturation.
Horizontal 16:9 landscape, documentary photography style.
```

### 4.2 手绘角色（透明底）

**通用模板**

```
Hand-drawn ink sketch on pure white background, transparent export.
Chinese university student in military training camouflage uniform,
green flat training cap with small red flag badge.
[pose description]. NO facial features — completely blank face area,
no eyes, no nose, no mouth. Emotion shown ONLY through body posture.
Single figure, full body, 5-6 head proportions (NOT chibi, NOT Pop Mart).
Line color warm gray-brown, loose sketchy diary style, imperfect lines.
No anime eyes, no 3D render, no color fill required (line art only OK).
```

**SK-1 摇晃同学**

```
Hand-drawn ink sketch, white background. Military training uniform.
Figure wobbling, dizzy, leaning sideways, arms slightly out.
Cap tilted, small name tag showing only Chinese character "李".
NO face features. Pale suggestion through posture only. Full body.
```

**SK-5 主角（你）**

```
Hand-drawn ink sketch, white background. Military training uniform.
Figure viewed from BEHIND or strict SIDE profile, never front-facing.
Default standing at attention. NO facial features visible.
Full body, diary sketch style.
```

### 4.3 揭面·清晰肖像（FX-2）

```
Gentle hand-painted portrait, warm soft watercolor or colored pencil style.
Chinese university student, [character traits: e.g. young male, short hair].
Kind natural eyes, subtle smile — FIRST time face is shown.
Matches military training context, nostalgic warm lighting.
NOT chibi, NOT anime exaggeration, NOT 3D blind box.
Square or vertical portrait, clean background.
```

### 4.4 合成参考（给设计师 / 引擎）

**不推荐**：AI 一次生成「实景+带脸人物」——难以保证无五官与风格统一。  
**推荐流程**：

1. 生成 BG（无人物）  
2. 生成 SK（白底线稿）  
3. 引擎按坐标叠加 SK 于 BG  
4. 揭面时 FX-1 → FX-2 过渡  

---

## 五、工程对接要点

| 项目 | 说明 |
|------|------|
| 热区 | 每 SK 或场景元素对应矩形/多边形坐标（见 scenes JSON） |
| 锚点 | 角色脚点贴地，统一 bottom-center |
| 格式 | BG: JPG/WebP 85%；SK/FX: PNG 透明 |
| 命名 | `bg_scene1.jpg`, `sk_classmate_wobble.png`, `fx_reveal_classmate_clear.png` |
| 占位 | 开发期可用 SVG 线稿，规格同 SK |

---

## 六、制作优先级

### P0（军训试玩版）

1. BG-1 / BG-2 / BG-3  
2. SK-1 / SK-4 / SK-5（各 1～2 姿态）  
3. UI-1 / UI-2 框架  
4. FX-1 / FX-3  

### P1

5. SK-2 / SK-3  
6. FX-2（已羁绊角色各 1 张）  
7. 选择后果态 BG 或 SK 姿态变体  

### P2

8. FX-4 主角揭面  
9. 节奏关专用素材  
10. 百团大战等新章 BG/SK 扩展  

---

## 七、质量检查清单

**实景底图**

- [ ] 无清晰可辨人脸？  
- [ ] 暖色怀旧、非动漫非 3D？  
- [ ] 军训元素可信（操场、九月光）？  

**手绘角色**

- [ ]  absolutely 无五官？  
- [ ] 非 Q 版盲盒比例？  
- [ ] 姿态能读懂情绪？  
- [ ] 透明底 PNG，线稿色统一？  

**揭面**

- [ ] FX-2 与 SK 同一人可识别？  
- [ ] 仅用于结算，故事内不出现？  

---

## 八、风格板（开工前必做 1 张）

**三联画**：同一场景

1. 仅 BG-1 实景  
2. BG-1 + SK-1 线稿叠加（无脸）  
3. 结算态 FX-2 小肖像 + 文案 mock  

团队对齐后再批量出图。

---

## 修订记录

| 版本 | 说明 |
|------|------|
| v2 | 3D Q 版盲盒 + Pop Mart Prompt |
| v3 | 实景 + 手绘；Prompt 与资产分层重写 |
