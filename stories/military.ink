// Roll · 军训篇 · Ink 主剧本
// 编译: npm run ink:build

// --- 全局变量（与 js/state.js 同步）---
VAR bold = 0
VAR support = 0
VAR quiet = 0
VAR bond_classmate = false
VAR s1_choice = ""
VAR s2_choice = ""
VAR s3_choice = ""
VAR click_sun = 0
VAR click_instructor = 0
VAR click_classmate_head = 0
VAR click_classmate_body = 0
VAR click_ground = 0
VAR click_self = 0
VAR click_bggroup = 0
VAR click_leader = 0
VAR click_tallguy = 0
VAR click_enemy = 0
VAR click_self2 = 0
VAR click_roommate2 = 0
VAR click_inst3 = 0
VAR click_self3 = 0
VAR click_room3 = 0

// --- 入口 ---
-> start

=== start ===
# flow:opening
# sfx:opening
-> opening_line_1

=== opening_line_1 ===
九月的操场
-> opening_line_2

=== opening_line_2 ===
太阳很大
-> opening_line_3

=== opening_line_3 ===
你第一次穿这身迷彩服 有点大
-> opening_line_4

=== opening_line_4 ===
帽子压住了眉毛
-> opening_line_5

=== opening_line_5 ===
你不认识任何人
-> transition_stand

=== transition_stand ===
# flow:transition
-> trans_stand_1

=== trans_stand_1 ===
站军姿
-> trans_stand_2

=== trans_stand_2 ===
十五分钟
-> trans_stand_3

=== trans_stand_3 ===
不能动
-> establishing_s1

=== establishing_s1 ===
# establish:opening
# establish_title:九月 · 操场
.
-> scene1_enter

=== scene1_enter ===
# scene:scene1
# sfx:scene1_ambient
# explore_hint:15
# timeout:45000
# timeout_knot:s1_timeout
# narration:1
阳光从右边打过来。教官背着手在前面走。你旁边那个人晃了有一会儿了。
-> DONE

// --- Scene1 热区（由 JS 跳转）---

=== s1_hotspot_sun ===
{
    - click_sun < 1:
        ~ click_sun = click_sun + 1
        # bubble:1:65%:10%
        # sfx:ding
        好晒……
        -> DONE
    - click_sun < 2:
        ~ click_sun = click_sun + 1
        # bubble:1:55%:12%
        # sfx:ding
        你感觉脖子上的汗已经流到后背了
        -> DONE
    - else:
        ~ click_sun = click_sun + 1
        # bubble:1:60%:8%
        # sfx:ding
        太阳没理你
        -> DONE
}

=== s1_hotspot_instructor ===
{
    - click_instructor < 1:
        ~ click_instructor = click_instructor + 1
        # bubble:1:15%:28%
        # sfx:ding
        你不敢靠近。学长说了，别和教官对视
        -> DONE
    - click_instructor < 2:
        ~ click_instructor = click_instructor + 1
        # bubble:1:18%:25%
        # sfx:ding
        他好像在盯别的排
        -> DONE
    - else:
        ~ click_instructor = click_instructor + 1
        # bubble:1:15%:30%
        # sfx:ding
        你缩了缩脖子
        -> DONE
}

=== s1_hotspot_classmate_head ===
{
    - click_classmate_head < 1:
        ~ click_classmate_head = click_classmate_head + 1
        # bubble:1:52%:38%
        # sfx:ding
        他的帽檐歪了。你想帮他扶正，但你的手悬在半空又缩回去了——你不熟
        -> DONE
    - else:
        ~ click_classmate_head = click_classmate_head + 1
        # choices:1
        # choice_knot:s1_pick_report
        * [报告教官！]
            -> s1_pick_report
        * [撑他一把]
            -> s1_choice_B
        * [再观察一下]
            -> DONE
}

=== s1_pick_report ===
-> s1_choice_A

=== s1_hotspot_classmate_body ===
{
    - click_classmate_body < 1:
        ~ click_classmate_body = click_classmate_body + 1
        # bubble:1:55%:45%
        # sfx:ding
        他晃得更厉害了。像个不倒翁，但快倒的那种
        -> DONE
    - else:
        ~ click_classmate_body = click_classmate_body + 1
        # choices:1
        * [撑他一把]
            -> s1_choice_B
        * [算了]
            -> DONE
}

=== s1_hotspot_classmate_other ===
-> s1_hotspot_classmate_body

=== s1_hotspot_ground ===
{
    - click_ground < 1:
        ~ click_ground = click_ground + 1
        # bubble:1:40%:70%
        # sfx:ding
        地上有只蚂蚁在爬。它不在乎什么军训
        -> DONE
    - click_ground < 2:
        ~ click_ground = click_ground + 1
        # bubble:1:35%:68%
        # sfx:ding
        你盯着蚂蚁看了一会儿。突然觉得它比你自由
        -> DONE
    - else:
        ~ click_ground = click_ground + 1
        # choices:1
        * [往旁边挪半步]
            -> s1_choice_C
}

=== s1_hotspot_self ===
{
    - click_self < 1:
        ~ click_self = click_self + 1
        # bubble:1:35%:42%
        # sfx:ding
        你的腿已经麻了。15分钟像150分钟
        -> DONE
    - click_self < 2:
        ~ click_self = click_self + 1
        # bubble:1:33%:44%
        # sfx:ding
        你感觉自己也在晃，但你是装的那种
        -> DONE
    - else:
        ~ click_self = click_self + 1
        # bubble:1:36%:46%
        # sfx:ding
        你看了看自己的脚。它们稳稳地钉在地上
        -> DONE
}

=== s1_hotspot_bggroup ===
{
    - click_bggroup < 1:
        ~ click_bggroup = click_bggroup + 1
        # bubble:1:78%:38%
        # sfx:ding
        他们也在站。有个人的姿势比你好多了
        -> DONE
    - else:
        ~ click_bggroup = click_bggroup + 1
        # bubble:1:78%:38%
        # sfx:ding
        没人注意到这边。大家都在撑
        -> DONE
}

// --- Scene1 核心选择 ---

=== s1_choice_A ===
~ bold = bold + 2
~ bond_classmate = true
~ s1_choice = "A"
# sfx:thud
# clear_timers
# hide_explore_hint
-> s1_after_A

=== s1_after_A ===
# narration_seq:1
教官转身看向你。全排的人头转向你。你喊了声"报告"。声音比你预想的大。
-> s1_after_A_2

=== s1_after_A_2 ===
# narration_seq:1
室友小声说"你真喊了啊"
-> transition_1_2

=== s1_choice_B ===
~ support = support + 2
~ bond_classmate = true
~ s1_choice = "B"
# sfx:thud
# clear_timers
# hide_explore_hint
-> s1_after_B

=== s1_after_B ===
# narration_seq:1
你的手搭上了他的胳膊。你的姿势歪了。他没看你。但他站稳了。
-> s1_after_B_2

=== s1_after_B_2 ===
# narration_seq:1
同学看了你一眼，嘴唇动了动，没说出话
-> transition_1_2

=== s1_choice_C ===
~ quiet = quiet + 2
~ s1_choice = "C"
# sfx:thud
# clear_timers
# hide_explore_hint
-> s1_after_C

=== s1_after_C ===
# narration_seq:1
你的脚位移了半步。你和同学之间的距离变了。你没碰到他。你也没走远。
-> s1_after_C_2

=== s1_after_C_2 ===
# narration_seq:1
你的影子和他的影子重叠了一点
-> transition_1_2

=== s1_timeout ===
~ quiet = quiet + 2
~ s1_choice = "C"
# sfx:thud
# clear_timers
# hide_explore_hint
# narration_seq:1
同学自己站稳了。但后来他又晃了一次，倒了。你听到了救护车的声音。
-> transition_1_2

=== transition_1_2 ===
# flow:transition
-> trans_12_1

=== trans_12_1 ===
二十分钟后。
-> trans_12_2

=== trans_12_2 ===
解散哨响了。
-> establish_s2

=== establish_s2 ===
# establish:scene1
# establish_title:拉歌
.
-> scene2_enter

// --- Scene2 拉歌 ---

=== scene2_enter ===
# scene:scene2
# sfx:scene2_ambient
# explore_hint:15
# timeout:28000
# timeout_knot:s2_show_choices
# narration:2
你们排坐成一排。对面也是。拉歌。
-> scene2_line_2

=== scene2_line_2 ===
# narration_seq:2
对面排起哄："来一个！来一个！"
-> scene2_line_3

=== scene2_line_3 ===
# narration:2
"一二三四五，我们等得好辛苦！""一二三四六，你们快点凑一凑！"全场笑了。
-> DONE

=== s2_hotspot_leader ===
~ click_leader = click_leader + 1
{
  - click_leader == 1:
        # bubble:2:20%:42%
        # sfx:ding
        他脸红了。他是被大家推出来的
  - click_leader == 2:
        # bubble:2:22%:44%
        # sfx:ding
        他小声问旁边的人"唱什么来着"
  - else:
        # bubble:2:20%:40%
        # sfx:ding
        他突然转头看你——"你会唱什么？"
}
-> DONE

=== s2_hotspot_tallguy ===
~ click_tallguy = click_tallguy + 1
{
  - click_tallguy == 1:
        # bubble:2:70%:40%
        # sfx:ding
        他在偷偷练动作。假装在打拍子，其实在练指挥
  - click_tallguy == 2:
        # bubble:2:68%:42%
        # sfx:ding
        他注意到你在看他，假装什么都没发生
  - else:
        # bubble:2:72%:38%
        # sfx:ding
        他突然小声说"要不我来？"然后又缩回去了
}
-> DONE

=== s2_hotspot_enemy ===
~ click_enemy = click_enemy + 1
{
  - click_enemy == 1:
        # bubble:2:42%:14%
        # sfx:ding
        他们站成一排，气势很足。有个人做了个鬼脸
  - click_enemy <= 3:
        # bubble:2:40%:12%
        # sfx:ding
        "一二三四五，我们等得好辛苦！"
  - else:
        # bubble:2:42%:14%
        # sfx:ding
        对面排安静了。他们在等你们的回应。
}
-> DONE

=== s2_hotspot_self2 ===
~ click_self2 = click_self2 + 1
# bubble:2:42%:55%
# sfx:ding
你累得不想动。但你知道得选一个
-> DONE

=== s2_hotspot_roommate2 ===
~ click_roommate2 = click_roommate2 + 1
{
  - click_roommate2 == 1:
        # bubble:2:72%:58%
        # sfx:ding
        他在那边和别人聊天。没注意到你这边
  - else:
        # bubble:2:72%:58%
        # sfx:ding
        他回头看了你一眼，做了个"加油"的口型
}
-> DONE

=== s2_show_choices ===
# clear_timers
# hide_explore_hint
# narration_seq:2
对面排唱了一段。声音很大。整齐。"团结就是力量——"唱完了。他们看着你们。
-> s2_choices

=== s2_choices ===
# choices:2
* [站起来领唱] -> s2_choice_A
* [跟大家一起吼] -> s2_choice_B
* [不出声] -> s2_choice_C

=== s2_choice_A ===
~ bold = bold + 2
~ s2_choice = "A"
# sfx:thud
# clear_timers
# hide_explore_hint
-> s2_after_A

=== s2_after_A ===
# narration_seq:2
你站了起来。你方同学先愣了一秒。然后有人开始跟。
-> s2_after_A_2

=== s2_after_A_2 ===
# narration_seq:2
对面排有人收了笑脸。排长看你的眼神变了。
-> s2_after_A_3

=== s2_after_A_3 ===
# narration_seq:2
拉歌结束后，你发现自己的手心是湿的
-> transition_2_3

=== s2_choice_B ===
~ support = support + 2
~ s2_choice = "B"
# sfx:thud
# clear_timers
# hide_explore_hint
-> s2_after_B

=== s2_after_B ===
# narration_seq:2
几十个人的声音混在一起。你听不出自己，但你能感觉到震动。
-> s2_after_B_2

=== s2_after_B_2 ===
# narration_seq:2
排长终于找到调了，声音大了起来。
-> s2_after_B_3

=== s2_after_B_3 ===
# narration_seq:2
那一刻你觉得你们排像个人了
-> transition_2_3

=== s2_choice_C ===
~ quiet = quiet + 2
~ s2_choice = "C"
# sfx:thud
# clear_timers
# hide_explore_hint
-> s2_after_C

=== s2_after_C ===
# narration_seq:2
你旁边的同学也没唱。他看了你一眼。你们排的声音明显弱了一截。
-> s2_after_C_2

=== s2_after_C_2 ===
# narration_seq:2
对面排大笑："他们不行！"
-> s2_after_C_3

=== s2_after_C_3 ===
# narration_seq:2
你告诉自己这不是你的性格。但你不确定
-> transition_2_3

=== transition_2_3 ===
# flow:transition
教官拍了拍手。
-> trans_23_2

=== trans_23_2 ===
"集合。"
-> establish_s3

=== establish_s3 ===
# establish:scene2
# establish_title:阅兵领队选拔
.
-> scene3_enter

// --- Scene3 领队选拔 ---

=== scene3_enter ===
# scene:scene3
# sfx:scene3_ambient
# explore_hint:15
# timeout:40000
# timeout_knot:s3_timeout
# narration:3
方阵站好了。教官站在前面。他说了一句话。
-> scene3_prompt

=== scene3_prompt ===
# narration:3
{ s1_choice == "A" && s2_choice == "A":
  "有没有人自荐？""……你上次挺积极的。"
  你觉得这是你的机会
- else:
  { s1_choice == "A" && s2_choice == "C":
    "有没有人自荐？"
    你觉得他可能在等你
  - else:
    { s2_choice == "A":
      "有没有人自荐？""……刚才唱歌的那个。"
      教官认出你了
    - else:
      "有没有人自荐？"
      沉默。你心跳加速。
    }
  }
}
-> DONE

=== s3_hotspot_inst3 ===
~ click_inst3 = click_inst3 + 1
{
  - click_inst3 == 1:
        # bubble:3:42%:15%
        # sfx:ding
        "有没有人自荐？"然后扫了一眼方阵
  - else:
        # bubble:3:42%:17%
        # sfx:ding
        你和他的眼神碰了一下。就一秒。你心跳加速了
}
-> DONE

=== s3_hotspot_self3 ===
~ click_self3 = click_self3 + 1
{
  - click_self3 == 1:
        # bubble:3:46%:42%
        # sfx:ding
        你的手在裤缝边动了一下
        -> DONE
  - else:
        -> s3_choices
}

=== s3_hotspot_room3 ===
~ click_room3 = click_room3 + 1
{
  - click_room3 == 1:
        # bubble:3:28%:44%
        # sfx:ding
        他站得挺直的。你心想他走得比你好
  - else:
        # bubble:3:28%:46%
        # sfx:ding
        他看起来挺紧张的
}
-> DONE

=== s3_choices ===
# clear_timers
# hide_explore_hint
# choices:3
* [举手自荐] -> s3_choice_A
* [……算了] -> s3_choice_B

=== s3_choice_A ===
~ bold = bold + 2
~ s3_choice = "A"
# sfx:thud
# clear_timers
# hide_explore_hint
-> s3_after_A

=== s3_after_A ===
# narration_seq:3
你举了手。教官看了你一眼。"行。走两步。"
-> establish_rhythm

=== establish_rhythm ===
# establish:scene3
# establish_title:自荐
.
-> handoff_rhythm

=== handoff_rhythm ===
# handoff:rhythm
-> DONE

=== s3_choice_B ===
~ quiet = quiet + 1
~ s3_choice = "B"
# sfx:thud
# clear_timers
# hide_explore_hint
-> s3_after_B

=== s3_after_B ===
# narration_seq:3
教官："没人？那就随便点一个。"他看了看名单。
-> s3_after_B_2

=== s3_after_B_2 ===
# narration_seq:3
他点了另一个人。那个人愣了一下，走出来了。
-> s3_after_B_3

=== s3_after_B_3 ===
# narration_seq:3
你松了一口气。然后你看到他走得很差。你心想：如果是我，至少不会这样。但你没有站出来。
-> s3_after_B_4

=== s3_after_B_4 ===
# narration_seq:3
卧谈会，室友聊"如果是我我就上了"。你没说话。你在想：你到底是不敢，还是不想。
-> handoff_ending

=== s3_timeout ===
~ quiet = quiet + 2
~ s3_choice = "C"
# sfx:thud
# clear_timers
# hide_explore_hint
-> s3_after_B

=== handoff_ending ===
# handoff:ending
-> DONE
