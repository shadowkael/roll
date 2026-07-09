// Roll · 军训篇 · Ink 主剧本
// 编译: npm run ink:build

// --- 全局变量（与 js/state.js 同步）---
VAR bold = 0
VAR support = 0
VAR quiet = 0
VAR bond_classmate = false
VAR s1_choice = ""
VAR click_sun = 0
VAR click_instructor = 0
VAR click_classmate_head = 0
VAR click_classmate_body = 0
VAR click_ground = 0
VAR click_self = 0
VAR click_bggroup = 0

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
-> handoff_scene2

=== handoff_scene2 ===
# handoff:scene2
-> DONE

// 后续章节 knot 在 stories/military_ch2.ink 等文件扩展
