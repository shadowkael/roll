import { S, saveProgress } from '../state.js';
import { clearTimers, addTimer } from '../engine.js';
import { NarSeq } from '../narration.js';
import { SFX } from '../sfx.js';
import { showBubble, showChoices, showEstablishingShot } from '../ui.js';
import { startRhythmGame } from '../rhythm-game.js';
import { showEnding } from '../results.js';

export function initScene3() {
  SFX.scene3Ambient();
  S.clickCounts = { inst3: 0, self3: 0, room3: 0 };
  let instrLine = '"有没有人自荐？"';
  let moodLine = '沉默。你心跳加速。';
  if (S.s1Choice === 'A' && S.s2Choice === 'A') {
    instrLine += '"……你上次挺积极的。"';
    moodLine = '你觉得这是你的机会';
  } else if (S.s1Choice === 'A' && S.s2Choice === 'C') {
    moodLine = '你觉得他可能在等你';
  } else if (S.s2Choice === 'A') {
    instrLine += '"……刚才唱歌的那个。"';
    moodLine = '教官认出你了';
  }
  NarSeq.start([
    { sceneId: 3, text: '方阵站好了。教官站在前面。他说了一句话。' },
    { sceneId: 3, text: instrLine + '\n' + moodLine },
  ]);
  addTimer(() => setupScene3Clicks(), 6000);
  addTimer(() => { if (!S.s3Choice) scene3ChoiceTimeout(); }, 40000);
}

function setupScene3Clicks() {
  const cv = document.querySelector('#scene3 .scene-canvas');
  if (cv._bound) return;
  cv._bound = true;
  cv.onclick = function (e) {
    const el = e.target.closest('[data-el]');
    if (!el) return;
    const name = el.dataset.el;
    if (name === 'inst3') {
      S.clickCounts.inst3++;
      if (S.clickCounts.inst3 === 1) showBubble(3, '"有没有人自荐？"然后扫了一眼方阵', '42%', '15%');
      else showBubble(3, '你和他的眼神碰了一下。就一秒。你心跳加速了', '42%', '17%');
    } else if (name === 'self3') {
      S.clickCounts.self3++;
      if (S.clickCounts.self3 === 1) {
        showBubble(3, '你的手在裤缝边动了一下', '46%', '42%');
      } else {
        showChoices(3, ['举手自荐', '……算了'], (idx) => {
          if (idx === 0) scene3ChoiceA();
          else scene3ChoiceB();
        });
      }
    } else if (name === 'room3') {
      S.clickCounts.room3++;
      if (S.clickCounts.room3 === 1) showBubble(3, '他站得挺直的。你心想他走得比你好', '28%', '44%');
      else showBubble(3, '他看起来挺紧张的', '28%', '46%');
    }
  };
}

function scene3ChoiceA() {
  S.s3Choice = 'A';
  S.tags.bold += 2;
  saveProgress();
  clearTimers();
  SFX.thud();
  NarSeq.start([
    { sceneId: 3, text: '你举了手。教官看了你一眼。"行。走两步。"' },
  ], () => {
    showEstablishingShot('scene3', '自荐', 3000, () => startRhythmGame());
  });
}

function scene3ChoiceB() {
  S.s3Choice = 'B';
  S.tags.quiet += 1;
  saveProgress();
  clearTimers();
  SFX.thud();
  NarSeq.start([
    { sceneId: 3, text: '教官："没人？那就随便点一个。"他看了看名单。' },
    { sceneId: 3, text: '他点了另一个人。那个人愣了一下，走出来了。' },
    { sceneId: 3, text: '你松了一口气。然后你看到他走得很差。\n你心想：如果是我，至少不会这样。但你没有站出来。' },
    { sceneId: 3, text: '卧谈会，室友聊"如果是我我就上了"。\n你没说话。你在想：你到底是不敢，还是不想。' },
  ], () => showEnding());
}

function scene3ChoiceTimeout() {
  S.s3Choice = 'C';
  S.tags.quiet += 2;
  saveProgress();
  scene3ChoiceB();
}
