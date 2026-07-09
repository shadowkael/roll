import { S, saveProgress } from '../state.js';
import { clearTimers, addTimer } from '../engine.js';
import { NarSeq } from '../narration.js';
import { SFX } from '../sfx.js';
import {
  showBubble, showChoices, showExploreHint, hideExploreHint,
  switchScene, showEstablishingShot,
} from '../ui.js';
import { initScene2 } from './scene2.js';

export function startOpening() {
  SFX.init();
  SFX.opening();
  switchScene('opening-screen', () => {
    const el = document.getElementById('opening-screen');
    el.innerHTML = '';
    const lines = [
      '九月的操场',
      '太阳很大',
      '你第一次穿这身迷彩服 有点大',
      '帽子压住了眉毛',
      '你不认识任何人',
    ];
    NarSeq.start(lines.map(l => ({ sceneId: 'opening', text: l })), () => {
      switchScene('transition-screen', () => showTransition1());
    });
  });
}

function showTransition1() {
  const el = document.getElementById('transition-screen');
  el.innerHTML = '';
  const lines = ['站军姿', '十五分钟', '不能动'];
  NarSeq.start(lines.map(l => ({ sceneId: 'transition', text: l })), () => {
    showEstablishingShot('opening', '九月 · 操场', 3000, () => {
      document.getElementById('transition-screen').innerHTML = '';
      switchScene('scene1', () => initScene1());
    });
  });
}

export function initScene1() {
  SFX.scene1Ambient();
  S.clickCounts = { sun: 0, instructor: 0, classmateHead: 0, classmateBody: 0, ground: 0, self: 0, bggroup: 0 };
  showExploreHint(15);
  addTimer(() => {
    NarSeq.start([{ sceneId: 1, text: '阳光从右边打过来。教官背着手在前面走。你旁边那个人晃了有一会儿了。' }]);
  }, 1000);
  setupScene1Clicks();
}

function setupScene1Clicks() {
  const cv = document.querySelector('#scene1 .scene-canvas');
  cv.onclick = function (e) {
    e.stopPropagation();
    const el = e.target.closest('[data-el]');
    if (!el) return;
    const name = el.dataset.el;
    const part = e.target.dataset.part;

    if (name === 'sun') {
      S.clickCounts.sun++;
      const c = S.clickCounts.sun;
      if (c === 1) showBubble(1, '好晒……', '65%', '10%');
      else if (c === 2) showBubble(1, '你感觉脖子上的汗已经流到后背了', '55%', '12%');
      else if (c >= 3) showBubble(1, '太阳没理你', '60%', '8%');
    } else if (name === 'instructor') {
      S.clickCounts.instructor++;
      const c = S.clickCounts.instructor;
      if (c === 1) showBubble(1, '你不敢靠近。学长说了，别和教官对视', '15%', '28%');
      else if (c === 2) showBubble(1, '他好像在盯别的排', '18%', '25%');
      else if (c >= 3) showBubble(1, '你缩了缩脖子', '15%', '30%');
    } else if (name === 'classmate') {
      if (part === 'head') {
        S.clickCounts.classmateHead++;
        const c = S.clickCounts.classmateHead;
        if (c === 1) {
          showBubble(1, '他的帽檐歪了。你想帮他扶正，但你的手悬在半空又缩回去了', '52%', '38%');
        } else if (c >= 2) {
          showChoices(1, ['报告教官！', '再观察一下'], (idx) => {
            if (idx === 0) scene1ChoiceA();
          });
        }
      } else if (part === 'body') {
        S.clickCounts.classmateBody++;
        const c = S.clickCounts.classmateBody;
        if (c === 1) showBubble(1, '他晃得更厉害了。像个不倒翁，但快倒的那种', '55%', '45%');
        else if (c >= 2) {
          showChoices(1, ['撑他一把', '算了'], (idx) => {
            if (idx === 0) scene1ChoiceB();
          });
        }
      } else {
        S.clickCounts.classmateBody++;
        if (S.clickCounts.classmateBody === 1) showBubble(1, '他晃得更厉害了', '55%', '45%');
      }
    } else if (name === 'ground') {
      S.clickCounts.ground++;
      const c = S.clickCounts.ground;
      if (c === 1) showBubble(1, '地上有只蚂蚁在爬。它不在乎什么军训', '40%', '70%');
      else if (c === 2) showBubble(1, '你盯着蚂蚁看了一会儿。突然觉得它比你自由', '35%', '68%');
      else if (c >= 3) {
        showChoices(1, ['往旁边挪半步'], () => scene1ChoiceC());
      }
    } else if (name === 'self') {
      S.clickCounts.self++;
      const c = S.clickCounts.self;
      if (c === 1) showBubble(1, '你的腿已经麻了。15分钟像150分钟', '35%', '42%');
      else if (c === 2) showBubble(1, '你感觉自己也在晃，但你是装的那种', '33%', '44%');
      else if (c >= 3) showBubble(1, '你看了看自己的脚。它们稳稳地钉在地上', '36%', '46%');
    } else if (name === 'bggroup') {
      S.clickCounts.bggroup++;
      const c = S.clickCounts.bggroup;
      if (c === 1) showBubble(1, '他们也在站。有个人的姿势比你好多了', '78%', '38%');
      else showBubble(1, '没人注意到这边。大家都在撑', '78%', '38%');
    }
  };
  addTimer(() => {
    if (!S.s1Choice) {
      hideExploreHint();
      scene1ChoiceC(true);
    }
  }, 45000);
}

function scene1ChoiceA() {
  S.s1Choice = 'A';
  S.tags.bold += 2;
  saveProgress();
  clearTimers();
  SFX.thud();
  NarSeq.start([
    { sceneId: 1, text: '教官转身看向你。全排的人头转向你。你喊了声"报告"。声音比你预想的大。' },
    { sceneId: 1, text: '室友小声说"你真喊了啊"' },
  ], () => showTransition1to2());
}

function scene1ChoiceB() {
  S.s1Choice = 'B';
  S.tags.support += 2;
  saveProgress();
  clearTimers();
  SFX.thud();
  NarSeq.start([
    { sceneId: 1, text: '你的手搭上了他的胳膊。你的姿势歪了。他没看你。但他站稳了。' },
    { sceneId: 1, text: '同学看了你一眼，嘴唇动了动，没说出话' },
  ], () => showTransition1to2());
}

function scene1ChoiceC(isTimeout) {
  S.s1Choice = 'C';
  S.tags.quiet += 2;
  saveProgress();
  clearTimers();
  SFX.thud();
  if (isTimeout) {
    NarSeq.start([
      { sceneId: 1, text: '同学自己站稳了。但后来他又晃了一次，倒了。你听到了救护车的声音。' },
    ], () => showTransition1to2());
  } else {
    NarSeq.start([
      { sceneId: 1, text: '你的脚位移了半步。你和同学之间的距离变了。你没碰到他。你也没走远。' },
      { sceneId: 1, text: '你的影子和他的影子重叠了一点' },
    ], () => showTransition1to2());
  }
}

function showTransition1to2() {
  switchScene('transition-screen', () => {
    const el = document.getElementById('transition-screen');
    el.innerHTML = '';
    const lines = ['二十分钟后。', '解散哨响了。'];
    NarSeq.start(lines.map(l => ({ sceneId: 'transition', text: l })), () => {
      showEstablishingShot('scene1', '拉歌', 3000, () => {
        switchScene('scene2', () => initScene2());
      });
    });
  });
}
