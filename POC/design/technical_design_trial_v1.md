---
AIGC:
    Label: "1"
    ContentProducer: 001191110102MACQD9K64018705
    ProduceID: 2064199640680971_0/project_7658448532017398042-files/四年/design/technical_design_trial_v1.md
    ReservedCode1: ""
    ContentPropagator: 001191110102MACQD9K64028705
    PropagateID: 2064199640680971#1783579181839
    ReservedCode2: ""
---
# 「那个谁」试玩版技术设计文档

> **目标**：基于已验证的HTML原型v4，搭建一个可部署、可分享的正式试玩版。
> **范围**：军训场景完整可玩（3个子场景 + 节奏游戏 + 揭面结算）。
> **技术栈**：HTML5 + CSS3 + Vanilla JavaScript（单页应用，无需框架）。

---

## 一、产品概述

### 1.1 产品名
**那个谁**

### 1.2 核心表达
人与人的连接，让模糊变清晰。军训里你记不住每个人的名字——直到你和某个人产生了连接，ta才从"那个谁"变成了一个具体的人。

### 1.3 试玩版范围
仅包含「军训篇」一个章节，含3个子场景：
1. 站军姿（探索式交互 → 三选一）
2. 拉歌对唱（回合制对抗 → 三选一）
3. 阅兵领队选拔（探索 → 节奏游戏 → 结果）

完成后进入结算页（含揭面动画 + 遗憾目录）。

### 1.4 用户体验目标
- 完整游玩时长：8-12分钟
- 首次打开3秒内可交互
- 手机端竖屏优先，兼容桌面端

---

## 二、整体架构

### 2.1 文件结构

```
trial-v1/
├── index.html          # 入口文件
├── css/
│   └── style.css       # 全局样式
├── js/
│   ├── app.js          # 主控制器（场景调度、状态管理）
│   ├── scene-engine.js # 场景引擎（加载、渲染、切换）
│   ├── interaction.js  # 交互系统（探索、点击、气泡）
│   ├── rhythm-game.js  # 节奏游戏引擎
│   ├── singing.js      # 拉歌回合制系统
│   ├── tags.js         # 跨场景标签系统
│   ├── afterglow.js    # 余韵/后果展示系统
│   ├── face-reveal.js  # 揭面动画系统
│   └── results.js      # 结算页/遗憾目录
├── data/
│   ├── scenes.json     # 三个场景的完整数据
│   ├── characters.json # 角色定义
│   └── regrets.json    # 遗憾目录文案
├── assets/
│   ├── bg/             # 场景背景图（BG-1/2/3）
│   ├── chars/          # 角色立绘（CH-1~5）
│   ├── ui/             # UI素材（标题页、结果卡）
│   └── fx/             # 特效素材（揭面模糊/清晰态）
└── README.md
```

### 2.2 页面流程

```
标题页 (TITLE)
  ↓
开场 / 子场景 × N（探索 → 选择 → 余韵）
  ↓
章末过场 (INTERLUDE) — 小动画 + 本章羁绊揭面
  ↓
遗憾清单 (REGRETS) — ★ 情感高潮（试玩版为本章清单）
  ↓
结尾字卡 → 重玩
```

> 体验总纲见 `product_experience_v1.md`。旧版「结算页同时揭面+遗憾」需拆分为过场与清单两页。

### 2.3 竖屏布局规格

```
┌──────────────────────────┐
│ 场景标签      引导提示     │ 48px, 顶部信息栏
├──────────────────────────┤
│                          │
│                          │
│    【场景画面区】          │ 60-70% 屏幕高度
│    背景 + 角色精灵        │
│    可点击元素有呼吸动画    │
│                          │
│                          │
├──────────────────────────┤
│  叙事文字 / 气泡对话       │ 底部叙事区
│                          │
│  [选项按钮]               │ 选择出现时
└──────────────────────────┘
最大宽度 480px，居中显示
```

---

## 三、状态管理

### 3.1 全局状态对象

```javascript
const GameState = {
  // 场景选择记录
  choices: {
    scene1: null,  // 'A' | 'B' | 'C' | null(超时)
    scene2: null,
    scene3: null   // 'volunteer' | 'recommend_other' | 'silent'
  },
  
  // 节奏游戏结果（仅scene3选择volunteer时有值）
  rhythmResult: null,  // { passed: bool, perfect: int, good: int, miss: int }
  
  // 性格标签（hidden，玩家不可见）
  tags: {
    bold: 0,
    support: 0,
    quiet: 0
  },
  
  // 各角色互动计数器
  interactions: {
    classmate: 0,   // 摇晃同学
    instructor: 0,  // 教官
    squadLeader: 0, // 排长
    tallGuy: 0,     // 高个男生
    roommate: 0,    // 室友
    self: 0         // 点击自己
  },
  
  // 揭面记录
  bonds: {
    classmate: false,
    squadLeader: false,
    tallGuy: false,
    instructor: false,
    roommate: false,
    protagonist: false
  },
  
  // 特殊标记
  flags: {
    s1_instructor_glanced: false,  // 教官是否扫视过你
    s2_highGuy_offered: false,     // 高个男生是否提出过要领唱
    s3_instructor_doubted: false   // 教官是否表示怀疑
  }
};
```

### 3.2 标签计算规则

| 场景 | 选择 | 标签变化 |
|------|------|---------|
| S1 | A: 报告教官 | bold += 2 |
| S1 | B: 悄悄撑一把 | support += 2 |
| S1 | C: 挪半步 / 超时 | quiet += 2 |
| S2 | A: 站起来领唱 | bold += 2 |
| S2 | B: 跟大家一起吼 | support += 2 |
| S2 | C: 不出声 | quiet += 2 |
| S3 | 自荐 | bold += 2 |
| S3 | 推荐别人 | support += 1 |
| S3 | 不报名 | quiet += 2 |

### 3.3 跨场景影响规则

| 前序组合 | 影响点 | 表现 |
|---------|--------|------|
| S1-bold + S2-bold | 室友评价 | "你是不是太急了？" |
| S1-quiet + S2-bold | 室友惊讶 | "你今天怎么变了个人？" |
| S1-support + S2-quiet | 摇晃同学后问 | "是不是你扶的我？" |
| S2-bold + S3-volunteer | 教官认可链 | "又是你。行。" |
| S2-quiet + S3-volunteer | 教官怀疑链 | "你确定？" + 节奏游戏难度微增 |

### 3.4 揭面判定规则

| 角色 | 羁绊条件 | 揭面时机 |
|------|---------|---------|
| 摇晃同学 | S1选择A或B | S1结算气泡后 |
| 排长 | S2选择A 且 interactions.squadLeader ≥ 2 | S2结算 |
| 高个男生 | interactions.tallGuy ≥ 3 | S2结算 |
| 教官 | (S3自荐且通过) 或 interactions.instructor ≥ 3 | S3结算 |
| 室友 | interactions.roommate ≥ 5（跨场景累计） | 最终结算 |
| 主角 | 完成全部章节 | 全通关后 |

---

## 四、场景数据格式

### 4.1 场景数据结构

```json
{
  "id": "scene_1",
  "title": "站军姿",
  "intro": [
    "九月的操场。",
    "太阳很大。",
    "你第一次穿这身迷彩服。有点大。"
  ],
  "background": "assets/bg/bg_scene1.jpg",
  "elements": [
    {
      "id": "sun",
      "type": "interactive",
      "label": "太阳",
      "position": { "top": "8%", "right": "15%" },
      "sprite": null,
      "clickResponses": [
        {
          "text": "好晒……",
          "animation": "fade_bubble"
        },
        {
          "text": "你感觉脖子上的汗已经流到后背了",
          "animation": "fade_bubble"
        },
        {
          "text": "太阳没理你",
          "animation": "fade_bubble"
        }
      ]
    },
    {
      "id": "instructor",
      "type": "interactive",
      "label": "教官",
      "position": { "top": "25%", "left": "15%" },
      "sprite": "assets/chars/ch_instructor_back.png",
      "clickResponses": [
        { "text": "你不敢靠近。学长说了，别和教官对视" },
        { "text": "他好像在盯别的排" },
        { "text": "你缩了缩脖子" }
      ],
      "specialEvent": {
        "trigger": "click_count_2",
        "condition": null,
        "action": "instructor_glance",
        "description": "教官突然转头看向你的方向"
      }
    },
    {
      "id": "classmate",
      "type": "interactive",
      "label": "摇晃的同学",
      "position": { "top": "40%", "right": "20%" },
      "sprite": "assets/chars/ch_classmate_wobble.png",
      "clickZones": [
        {
          "zone": "head",
          "responses": [
            { "text": "他的帽檐歪了。你想帮他扶正，但你的手悬在半空又缩回去了——你不熟" },
            { "text": "他眼神有点涣散。嘴里好像在念叨什么……'别倒别倒别倒'" }
          ]
        },
        {
          "zone": "body",
          "responses": [
            { "text": "他晃得更厉害了。像个不倒翁，但快倒的那种" },
            {
              "text": "他快要倒了",
              "showChoice": "support_choice"
            }
          ]
        },
        {
          "zone": "face",
          "responses": [
            { "text": "他嘴唇发白。你想喊他名字，但你不认识他" },
            {
              "text": "你要报告教官吗？",
              "showChoice": "report_choice"
            }
          ]
        }
      ]
    },
    {
      "id": "self",
      "type": "interactive",
      "label": "你",
      "position": { "top": "45%", "left": "30%" },
      "sprite": "assets/chars/ch_protagonist_back.png",
      "clickResponses": [
        { "text": "你的腿已经麻了。15分钟像150分钟" },
        { "text": "你感觉自己也在晃，但你是装的那种" },
        { "text": "你看了看自己的脚。它们稳稳地钉在地上" }
      ]
    },
    {
      "id": "ground",
      "type": "interactive",
      "label": "地面",
      "position": { "bottom": "20%", "left": "0", "width": "100%", "height": "20%" },
      "clickResponses": [
        { "text": "地上有只蚂蚁在爬。它不在乎什么军训" },
        { "text": "你盯着蚂蚁看了一会儿。突然觉得它比你自由" },
        { "text": "……", "showChoice": "step_aside" }
      ]
    },
    {
      "id": "bg_students",
      "type": "atmosphere",
      "label": "远处背景同学",
      "position": { "top": "55%", "right": "5%" },
      "sprite": "assets/chars/bg_students.png",
      "clickResponses": [
        { "text": "他们也在站。有个人的姿势比你好多了" },
        { "text": "没人注意到这边。大家都在撑" }
      ]
    }
  ],
  "choices": [
    {
      "id": "A",
      "label": "报告教官！",
      "triggeredBy": "classmate.face.click_2",
      "tags": { "bold": 2 },
      "consequence": {
        "sceneChange": "instructor_turns",
        "narration": [
          "教官转身看向你。",
          "全排的人头转向你。"
        ],
        "afterglow": [
          { "delay": 2000, "text": "室友小声说\"你真喊了啊\"", "speaker": "roommate" },
          { "delay": 4000, "transition": "二十分钟后，解散哨响了" }
        ]
      }
    },
    {
      "id": "B",
      "label": "悄悄撑他一把",
      "triggeredBy": "classmate.body.click_2",
      "tags": { "support": 2 },
      "consequence": {
        "sceneChange": "player_leans",
        "narration": [
          "你的姿势歪了。",
          "隔壁教官瞄了一眼。"
        ],
        "afterglow": [
          { "delay": 2000, "text": "同学看了你一眼，嘴唇动了动，没说出话", "speaker": "classmate" },
          { "delay": 4000, "transition": "二十分钟后，解散哨响了" }
        ]
      }
    },
    {
      "id": "C",
      "label": "往旁边挪半步",
      "triggeredBy": "ground.click_3",
      "tags": { "quiet": 2 },
      "consequence": {
        "sceneChange": "player_feet_shift",
        "narration": [
          "你的脚位移了半步。",
          "你和同学之间的距离变了。"
        ],
        "afterglow": [
          { "delay": 2000, "text": "你的影子和他的影子重叠了一点" },
          { "delay": 4000, "transition": "二十分钟后，解散哨响了" }
        ]
      }
    }
  ],
  "timeout": {
    "duration": 30000,
    "action": "classmate_falls",
    "narration": [
      "同学自己站稳了。",
      "但后来他又晃了一次，倒了。",
      "你听到了救护车的声音。",
      "画面变暗。"
    ],
    "tags": { "quiet": 2 },
    "choiceId": "C"
  }
}
```

### 4.2 场景2特殊结构：拉歌回合制

```json
{
  "id": "scene_2",
  "title": "休息时间",
  "type": "singing_battle",
  "rounds": [
    {
      "phase": "opponent_open",
      "narration": "对面排起哄：\"来一个！来一个！\"",
      "duration": 3000
    },
    {
      "phase": "free_explore",
      "description": "玩家可自由探索场景中的元素（限时15秒）",
      "elements": ["squad_leader", "tall_guy", "instructor_bottle", "roommate", "self"]
    },
    {
      "phase": "opponent_sings",
      "narration": [
        "对面排开始唱了。",
        "\"团结就是力量——\"",
        "声音很大。整齐。"
      ],
      "duration": 5000
    },
    {
      "phase": "player_choice",
      "prompt": "你们排需要回应。你——",
      "choices": [
        { "id": "A", "label": "站起来领唱", "tags": { "bold": 2 } },
        { "id": "B", "label": "跟大家一起吼", "tags": { "support": 2 } },
        { "id": "C", "label": "不出声", "tags": { "quiet": 2 } }
      ]
    },
    {
      "phase": "player_reaction",
      "dependsOn": "player_choice",
      "A": {
        "narration": [
          "你站了起来。",
          "你方同学先愣了一秒。",
          "然后有人开始跟。",
          "高个男生的手在膝盖上跟着你的节奏打拍子。",
          "对面排有人收了笑脸。"
        ],
        "duration": 8000
      },
      "B": {
        "narration": [
          "几十个人的声音混在一起。",
          "你听不出自己，但你能感觉到震动。",
          "排长终于找到调了，声音大了起来。",
          "对面排的气势被压了一点。"
        ],
        "duration": 7000
      },
      "C": {
        "narration": [
          "你旁边的淡定的同学也没唱。他看了你一眼。",
          "你们排的声音明显弱了一截。",
          "对面排大笑：\"他们不行！\"",
          "教官的脸色有点不好看。"
        ],
        "duration": 7000
      }
    },
    {
      "phase": "afterglow",
      "dependsOn": "player_choice",
      "A": [
        { "delay": 2000, "text": "对面排安静了" },
        { "delay": 4000, "text": "你方有人喊\"好！\"" },
        { "delay": 5000, "text": "排长看你的眼神变了——不是感谢，是那种\"你怎么比我先站出来\"的复杂", "speaker": "squad_leader" },
        { "delay": 6000, "text": "教官拍了下大腿", "speaker": "instructor" },
        { "delay": 7000, "transition": "拉歌结束后，你发现自己的手心是湿的" }
      ],
      "B": [
        { "delay": 2000, "text": "歌声结束了，大家都在喘" },
        { "delay": 4000, "text": "淡定的同学说\"还行\"", "speaker": "roommate" },
        { "delay": 5000, "text": "对面排不服：\"再来！\"但你们教官吹哨了" },
        { "delay": 6000, "transition": "那一刻你觉得你们排像个人了" }
      ],
      "C": [
        { "delay": 2000, "text": "对面排的嘲笑声" },
        { "delay": 4000, "text": "你们排有人小声说\"唱啊\"" },
        { "delay": 5000, "text": "没人回应" },
        { "delay": 6000, "text": "教官看了看你们排，没说话", "speaker": "instructor" },
        { "delay": 7000, "transition": "你告诉自己这不是你的性格。但你不确定" }
      ]
    }
  ]
}
```

---

## 五、节奏游戏引擎

### 5.1 技术参数

| 参数 | 值 | 说明 |
|------|-----|------|
| 节拍数 | 16 | 模拟正步走一个完整方队通过 |
| 节拍间隔 | 850ms | 模拟正步速度（约118步/分钟） |
| 滚动速度 | 280px/s | 节拍线从右向左滚动 |
| Perfect窗口 | ±80ms | 精确命中 |
| Good窗口 | ±160ms | 大致命中 |
| Miss | >±160ms | 错过 |
| 通过阈值 | Perfect+Good ≥ 12 | 16次中至少12次命中 |

### 5.2 游戏状态机

```
IDLE → STARTING → PLAYING → EVALUATING → RESULT

IDLE:      等待触发
STARTING:  倒计时 "3, 2, 1, 走！"（2秒）
PLAYING:   16个节拍依次滚动，玩家点击判定
EVALUATING: 最后一个节拍结束后，计算结果（1.5秒）
RESULT:    显示通过/失败，衔接后续叙事
```

### 5.3 视觉布局

```
┌──────────────────────────────────┐
│                                  │
│   🚶 (角色侧面剪影，走步动画)     │
│                                  │
│  ─ ─ ─ ● ─ ─ ─ ─ ● ─ ─ ─      │  ← 节拍线滚动轨道
│              ↓                   │
│          【击！】                 │  ← 打击判定区（固定位置）
│                                  │
│   得分: ●●●○○○○  连击: 3        │
│   进度: ████████░░░░░░░░  8/16  │
└──────────────────────────────────┘
```

### 5.4 视觉反馈

| 事件 | 表现 |
|------|------|
| Perfect | 角色步伐有力 + 打击区闪光 + 粒子效果 + 清脆"咔"声 |
| Good | 角色步伐还行 + 打击区微亮 |
| Miss | 角色踉跄/顺拐 + 画面轻微抖动 + 旁边同学偷笑 |
| 连续3个Perfect | 教官微微点头（画面右侧小动画） |
| 连续3个Miss | 对面排有人指指点点 |
| 最后3个全Perfect | 画面变亮，角色走得特别自信 |
| 最后3个全Miss | 角色开始顺拐，画面轻微变暗 |
| 通过 | 全屏短暂白光闪烁 + "PASS"字样 |
| 失败 | 画面轻微变灰 + "..."字样 |

### 5.5 难度调整

当 S2-quiet + S3-volunteer 时（教官怀疑链）：
- 节拍间隔缩短为 750ms（更快）
- Perfect窗口缩小为 ±60ms
- 体现"你不够格"的叙事压力

---

## 六、交互系统

### 6.1 探索模式

场景进入后，画面中显示多个可交互元素，玩家可以自由点击探索。

**元素状态**：
- `idle`：微弱呼吸动画（scale 1.0 ↔ 1.03，2秒循环）
- `hover`：轻微放大 + 边框高亮（暖橙色）
- `clicked`：弹出气泡对话
- `revealed`：选择已浮现

**引导提示**：场景进入后，底部显示引导文字 "← 点击场景中的元素探索"（3秒后消失）

### 6.2 选择浮现机制

选择**不是**一开始就有的按钮。选择通过以下方式浮现：
1. 点击特定元素的特定次数（如点同学脸部第2次 → 浮现"报告教官"）
2. 点击特定区域组合（如先点纸巾再点人 → 浮现选择）
3. 超时自动触发（30秒无操作 → 自动进入默认路径）

选择浮现时：
- 选项按钮从元素位置弹出（带弹跳动画）
- 暖橙边框 + 脉冲高亮
- 其他元素变暗（opacity 降低到 0.3）

### 6.3 气泡对话系统

```javascript
// 气泡数据结构
{
  text: "对话内容",
  position: { top: "40%", left: "50%" },  // 相对于触发元素
  speaker: "classmate",  // 用于显示说话者标识（可选）
  animation: "fade_in_up",  // 动画类型
  duration: 3000,  // 自动消失时间，0=需手动关闭
  type: "narration" | "dialogue" | "thought"  // 气泡样式不同
}
```

气泡样式：
- **narration**（旁白）：米白色文字，无背景，逐字淡入
- **dialogue**（对话）：白色圆角气泡，带小三角指向角色
- **thought**（内心）：斜体，带半透明背景

### 6.4 场景切换

```
当前场景画面淡出（500ms）
  → 黑屏过渡（500ms）
  → 过渡文字淡入（1500ms显示）
  → 过渡文字淡出（500ms）
  → 新场景画面淡入（500ms）
```

---

## 七、结算页 & 揭面系统

### 7.1 结算页结构

```
┌──────────────────────────────────┐
│                                  │
│         军训篇 · 完              │
│                                  │
│  ┌──────────────────────────┐   │
│  │  遗憾目录                  │   │
│  │                          │   │
│  │  "你一直站在最前面。      │   │
│  │   后来你累了，             │   │
│  │   但你不好意思退。"        │   │
│  │                          │   │
│  └──────────────────────────┘   │
│                                  │
│  ┌─── 你记住的人 ───┐           │
│  │                  │           │
│  │ [揭面角色1]       │           │
│  │ [揭面角色2]       │           │
│  │ [空白剪影]        │           │
│  │ [空白剪影]        │           │
│  │                  │           │
│  └──────────────────┘           │
│                                  │
│         [再玩一次]               │
└──────────────────────────────────┘
```

### 7.2 揭面动画流程

1. 页面展示"你记住的人"区域
2. 每个角色位置依次亮起
3. **已建立羁绊的角色**：
   - 先展示模糊态剪影（1秒）
   - 面容从模糊到清晰缓慢浮现（1.5秒动画）
   - 配一句与该角色相关的遗憾/回忆文案
4. **未建立羁绊的角色**：
   - 保持空白剪影 + 虚线轮廓
   - 配文"你没看清ta的脸"
5. **主角揭面**（仅全通关后）：
   - 一面镜子/水面/手机屏幕的意象
   - 面容极缓慢浮现（3秒）
   - 配文"你终于看清了自己"

### 7.3 遗憾目录生成逻辑

```javascript
function generateRegretText(state) {
  const path = [state.choices.scene1, state.choices.scene2, state.choices.scene3];
  const rhythmPassed = state.rhythmResult?.passed;
  
  // 组合型遗憾（优先匹配）
  const comboRegrets = {
    "A_A_volunteer_pass": "你一直站在最前面。后来你累了，但你不好意思退",
    "A_A_volunteer_fail": "你出了两次头，第三次没接住。有人说你'虎头蛇尾'",
    "C_A_volunteer_pass": "你在最后一刻站出来了。但没人知道你之前去了哪里",
    "C_C_silent": "三天，你什么都没说。后来你想了想，你觉得那是你最安静的三天",
    "B_C_silent": "你扶过一次人。但后来很多次你都没伸手。你在想哪次更像你",
    "A_C_volunteer": "你站出来了，又安静了，又站出来了。别人看不懂你，你自己也看不懂"
  };
  
  // 通用遗憾（所有路径都有）
  const universalRegrets = [
    "军训结束那天，你和教官合了影。你站在后排。照片里你笑得不太自然——但你确实在笑",
    "你后来翻过军训的照片。你记得那天很热。但你不记得谁站在你旁边"
  ];
  
  // 选择专属遗憾
  const choiceRegrets = {
    A: "你报告了教官。同学后来好了。但他看你的眼神变了——他不知道是该感谢你，还是觉得你多事",
    B: "你撑了他一把。他没说什么。但你发现你的迷彩服肩膀那块湿了——不知道是汗还是什么",
    C: "你挪了半步。什么也没发生。但那天晚上你想：如果我没挪那半步呢"
  };
  
  return {
    combo: comboRegrets[getPathKey(path, rhythmPassed)] || null,
    choice: choiceRegrets[state.choices.scene1],
    universal: universalRegrets
  };
}
```

---

## 八、动画规格

### 8.1 CSS动画预设

```css
/* 呼吸动画 - 可交互元素 */
@keyframes breathe {
  0%, 100% { transform: scale(1.0); }
  50% { transform: scale(1.03); }
}

/* 脉冲高亮 - 引导点击 */
@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 8px rgba(196, 149, 106, 0.3); }
  50% { box-shadow: 0 0 20px rgba(196, 149, 106, 0.8); }
}

/* 气泡淡入上升 */
@keyframes fade_in_up {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* 场景切换淡出 */
@keyframes scene_fade_out {
  from { opacity: 1; }
  to { opacity: 0; }
}

/* 选择按钮弹出 */
@keyframes choice_pop {
  0% { transform: scale(0); opacity: 0; }
  70% { transform: scale(1.1); }
  100% { transform: scale(1); opacity: 1; }
}

/* 揭面 - 模糊到清晰 */
@keyframes face_reveal {
  0% { filter: blur(20px); opacity: 0.3; }
  60% { filter: blur(5px); opacity: 0.7; }
  100% { filter: blur(0px); opacity: 1; }
}

/* 过渡文字淡入 */
@keyframes text_fade_in {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* 逐字淡入 */
@keyframes char_reveal {
  from { opacity: 0; }
  to { opacity: 1; }
}
```

### 8.2 动画时长规范

| 动画类型 | 时长 | 缓动函数 |
|---------|------|---------|
| 气泡出现 | 300ms | ease-out |
| 气泡消失 | 200ms | ease-in |
| 场景淡出 | 500ms | ease-in-out |
| 场景淡入 | 500ms | ease-in-out |
| 过渡文字 | 1500ms显示 | ease |
| 选择弹出 | 400ms | cubic-bezier(0.175, 0.885, 0.32, 1.275) |
| 揭面动画 | 1500ms | ease-in-out |
| 主角揭面 | 3000ms | ease-in-out |

---

## 九、移动端适配

### 9.1 响应式断点

```css
/* 手机竖屏（主要目标） */
@media (max-width: 480px) {
  /* 全屏显示，无黑边 */
}

/* 手机横屏 */
@media (orientation: landscape) and (max-height: 480px) {
  /* 提示用户旋转屏幕 */
}

/* 平板/桌面 */
@media (min-width: 481px) {
  /* 居中显示，max-width: 480px，两侧黑边 */
}
```

### 9.2 触摸优化

- 所有可点击区域最小 44×44px（Apple HIG标准）
- 触摸反馈：`touchstart` 立即响应（不用 `click` 的 300ms 延迟）
- 防止双击缩放：`touch-action: manipulation`
- 防止长按菜单：`-webkit-touch-callout: none`

### 9.3 性能要求

- 首屏加载 < 3秒（3G网络）
- 场景切换 < 1秒
- 节奏游戏帧率 ≥ 30fps
- 图片资源使用 WebP 格式 + JPEG 降级
- 关键CSS内联，非关键JS异步加载

---

## 十、部署方案

### 10.1 最简部署
- 静态文件托管（GitHub Pages / Vercel / Netlify）
- 无需后端
- 无需数据库
- URL：如 `https://name-of-game.vercel.app`

### 10.2 分享方式
- 直接分享URL
- 试玩版无登录/注册
- 打开即玩，8-12分钟完成

### 10.3 后续扩展点
- 新增场景：只需添加新的 scene JSON + 背景图 + 角色图
- 新增角色：只需添加立绘 + 羁绊条件
- 揭面系统：扩展为全游戏通关节奏
- 存档系统：后续可加 localStorage 存档，实现跨session继续

---

## 十一、开发里程碑

### M1：框架搭建（1-2天）
- [ ] 项目结构初始化
- [ ] 标题页 + 场景切换路由
- [ ] 基础场景渲染（背景 + 可交互元素）
- [ ] 气泡对话系统

### M2：场景1实现（1-2天）
- [ ] 站军姿场景完整交互
- [ ] 三个选择浮现机制
- [ ] 选择后余韵系统
- [ ] 超时机制

### M3：场景2实现（2天）
- [ ] 拉歌回合制流程
- [ ] 自由探索阶段
- [ ] 三个选择的对抗反应
- [ ] 余韵系统

### M4：场景3实现（2-3天）
- [ ] 领队选拔探索交互
- [ ] 教官差异化开场
- [ ] 节奏游戏引擎
- [ ] 通过后/失败后/不报名三条叙事线

### M5：结算页（1-2天）
- [ ] 遗憾目录展示
- [ ] 揭面动画系统
- [ ] 重玩功能

### M6：打磨（1-2天）
- [ ] 动画调优
- [ ] 移动端适配
- [ ] 性能优化
- [ ] 部署上线

**预计总工期：8-13天**

---

> 本内容由 Coze AI 生成，请遵循相关法律法规及《人工智能生成合成内容标识办法》使用与传播。
