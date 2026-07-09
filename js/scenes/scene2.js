import { S, saveProgress } from '../state.js';
import { clearTimers, addTimer } from '../engine.js';
import { NarSeq } from '../narration.js';
import { SFX } from '../sfx.js';
import {
  showBubble, showChoices, showExploreHint,
  switchScene, showEstablishingShot,
} from '../ui.js';
import { initScene3 } from './scene3.js';

export function initScene2() {
  SFX.scene2Ambient();
  S.clickCounts = { leader: 0, tallguy: 0, enemy: 0, self2: 0, roommate2: 0 };
  showExploreHint(15);
  NarSeq.start([
    { sceneId: 2, text: '你们排坐成一排。对面也是。拉歌。' },
    { sceneId: 2, text: '对面排起哄："来一个！来一个！"' },
    { sceneId: 2, text: '"一二三四五，我们等得好辛苦！""一二三四六，你们快点凑一凑！"全场笑了。' },
  ]);
  addTimer(() => setupScene2Clicks(), 8000);
  addTimer(() => {
    NarSeq.start([
      { sceneId: 2, text: '对面排唱了一段。声音很大。整齐。"团结就是力量——"唱完了。他们看着你们。' },
    ], () => {
      showChoices(2, ['站起来领唱', '跟大家一起吼', '不出声'], (idx) => {
        if (idx === 0) scene2ChoiceA();
        else if (idx === 1) scene2ChoiceB();
        else scene2ChoiceC();
      });
    });
  }, 25000);
}

function setupScene2Clicks() {
  const cv = document.querySelector('#scene2 .scene-canvas');
  if (cv._bound) return;
  cv._bound = true;
  cv.onclick = function (e) {
    const el = e.target.closest('[data-el]');
    if (!el) return;
    const name = el.dataset.el;
    if (name === 'leader') {
      S.clickCounts.leader++;
      const c = S.clickCounts.leader;
      if (c === 1) showBubble(2, '他脸红了。他是被大家推出来的', '20%', '42%');
      else if (c === 2) showBubble(2, '他小声问旁边的人"唱什么来着"', '22%', '44%');
      else showBubble(2, '他突然转头看你——"你会唱什么？"', '20%', '40%');
    } else if (name === 'tallguy') {
      S.clickCounts.tallguy++;
      const c = S.clickCounts.tallguy;
      if (c === 1) showBubble(2, '他在偷偷练动作。假装在打拍子，其实在练指挥', '70%', '40%');
      else if (c === 2) showBubble(2, '他注意到你在看他，假装什么都没发生', '68%', '42%');
      else showBubble(2, '他突然小声说"要不我来？"然后又缩回去了', '72%', '38%');
    } else if (name === 'enemy') {
      S.clickCounts.enemy++;
      const c = S.clickCounts.enemy;
      if (c === 1) showBubble(2, '他们站成一排，气势很足。有个人做了个鬼脸', '42%', '14%');
      else if (c <= 3) showBubble(2, '"一二三四五，我们等得好辛苦！"', '40%', '12%');
      else showBubble(2, '对面排安静了。他们在等你们的回应。', '42%', '14%');
    } else if (name === 'self2') {
      showBubble(2, '你累得不想动。但你知道得选一个', '42%', '55%');
    } else if (name === 'roommate2') {
      S.clickCounts.roommate2++;
      if (S.clickCounts.roommate2 === 1) showBubble(2, '他在那边和别人聊天。没注意到你这边', '72%', '58%');
      else showBubble(2, '他回头看了你一眼，做了个"加油"的口型', '72%', '58%');
    }
  };
}

function scene2ChoiceA() {
  S.s2Choice = 'A';
  S.tags.bold += 2;
  saveProgress();
  clearTimers();
  SFX.thud();
  NarSeq.start([
    { sceneId: 2, text: '你站了起来。你方同学先愣了一秒。然后有人开始跟。' },
    { sceneId: 2, text: '对面排有人收了笑脸。排长看你的眼神变了。' },
    { sceneId: 2, text: '拉歌结束后，你发现自己的手心是湿的' },
  ], () => showTransition2to3());
}

function scene2ChoiceB() {
  S.s2Choice = 'B';
  S.tags.support += 2;
  saveProgress();
  clearTimers();
  SFX.thud();
  NarSeq.start([
    { sceneId: 2, text: '几十个人的声音混在一起。你听不出自己，但你能感觉到震动。' },
    { sceneId: 2, text: '排长终于找到调了，声音大了起来。' },
    { sceneId: 2, text: '那一刻你觉得你们排像个人了' },
  ], () => showTransition2to3());
}

function scene2ChoiceC() {
  S.s2Choice = 'C';
  S.tags.quiet += 2;
  saveProgress();
  clearTimers();
  SFX.thud();
  NarSeq.start([
    { sceneId: 2, text: '你旁边的同学也没唱。他看了你一眼。你们排的声音明显弱了一截。' },
    { sceneId: 2, text: '对面排大笑："他们不行！"' },
    { sceneId: 2, text: '你告诉自己这不是你的性格。但你不确定' },
  ], () => showTransition2to3());
}

function showTransition2to3() {
  switchScene('transition-screen', () => {
    const el = document.getElementById('transition-screen');
    el.innerHTML = '';
    const lines = ['教官拍了拍手。', '"集合。"'];
    NarSeq.start(lines.map(l => ({ sceneId: 'transition', text: l })), () => {
      showEstablishingShot('scene2', '阅兵领队选拔', 3000, () => {
        switchScene('scene3', () => initScene3());
      });
    });
  });
}
