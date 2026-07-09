import { S, saveProgress } from './state.js';
import { addTimer } from './engine.js';
import { NarSeq } from './narration.js';
import { SFX } from './sfx.js';
import { showEnding } from './results.js';

let rhythmState = {
  notes: [],
  current: 0,
  score: 0,
  combo: 0,
  perfect: 0,
  good: 0,
  miss: 0,
  running: false,
  noteTimes: [],
  startTime: 0,
};

export function startRhythmGame() {
  SFX.stopAllAmbient();
  const rg = document.getElementById('rhythm-game');
  rg.classList.add('active');
  rhythmState = {
    notes: [],
    current: 0,
    score: 0,
    combo: 0,
    perfect: 0,
    good: 0,
    miss: 0,
    running: true,
    noteTimes: [],
    startTime: 0,
  };
  const interval = 850;
  const track = document.getElementById('rhythm-track');
  track.querySelectorAll('.rhythm-note').forEach(n => n.remove());
  for (let i = 0; i < 16; i++) rhythmState.noteTimes.push(i * interval + 2000);
  rhythmState.startTime = performance.now();
  rhythmState.noteTimes.forEach((t, i) => {
    addTimer(() => {
      if (!rhythmState.running) return;
      SFX.rhythmTick();
      const note = document.createElement('div');
      note.className = 'rhythm-note';
      note.style.right = '-20px';
      note.dataset.idx = i;
      track.appendChild(note);
      rhythmState.notes.push({ el: note, spawnTime: performance.now(), hit: false, idx: i });
      const hitX = track.offsetWidth * 0.18;
      const startX = track.offsetWidth;
      const duration = 1200;
      const startMs = performance.now();
      function moveNote() {
        if (!rhythmState.running || rhythmState.notes[i].hit) return;
        const elapsed = performance.now() - startMs;
        const progress = Math.min(elapsed / duration, 1);
        const x = startX + (hitX - startX) * progress;
        note.style.right = 'auto';
        note.style.left = x + 'px';
        if (progress < 1) requestAnimationFrame(moveNote);
        else if (!rhythmState.notes[i].hit) handleMiss(i);
      }
      requestAnimationFrame(moveNote);
    }, t);
  });
  addTimer(() => {
    if (rhythmState.running) endRhythmGame();
  }, rhythmState.noteTimes[15] + 2000);
  document.getElementById('rhythm-tap').onclick = handleTap;
  updateRhythmUI();
}

function handleTap() {
  if (!rhythmState.running) return;
  let best = null;
  let bestDist = Infinity;
  rhythmState.notes.forEach((n, i) => {
    if (n.hit) return;
    const el = n.el;
    const track = document.getElementById('rhythm-track');
    const hitZone = track.offsetWidth * 0.18 + 20;
    const noteLeft = parseFloat(el.style.left) || track.offsetWidth;
    const dist = Math.abs(noteLeft - hitZone);
    if (dist < bestDist) {
      bestDist = dist;
      best = i;
    }
  });
  if (best === null) return;
  const track = document.getElementById('rhythm-track');
  const hitZone = track.offsetWidth * 0.18 + 20;
  const noteLeft = parseFloat(rhythmState.notes[best].el.style.left) || track.offsetWidth;
  const diff = Math.abs(noteLeft - hitZone);
  rhythmState.notes[best].hit = true;
  rhythmState.notes[best].el.classList.add('hit');
  if (diff < 35) {
    rhythmState.perfect++;
    rhythmState.score++;
    rhythmState.combo++;
    showJudge('Perfect', 'perfect');
    SFX.rhythmPerfect();
  } else if (diff < 70) {
    rhythmState.good++;
    rhythmState.score++;
    rhythmState.combo++;
    showJudge('Good', 'good');
    SFX.rhythmGood();
  } else {
    handleMiss(best);
    return;
  }
  updateRhythmUI();
}

function handleMiss(i) {
  if (rhythmState.notes[i].hit) return;
  rhythmState.notes[i].hit = true;
  rhythmState.notes[i].el.classList.add('hit');
  rhythmState.miss++;
  rhythmState.combo = 0;
  showJudge('Miss', 'miss');
  SFX.rhythmMiss();
  updateRhythmUI();
}

function showJudge(text, cls) {
  const j = document.getElementById('rhythm-judge');
  j.textContent = text;
  j.className = 'rhythm-judgement show ' + cls;
  addTimer(() => j.classList.remove('show'), 500);
}

function updateRhythmUI() {
  document.getElementById('rhythm-score-num').textContent = rhythmState.score;
  document.getElementById('rhythm-combo').textContent = rhythmState.combo;
  const total = rhythmState.perfect + rhythmState.good + rhythmState.miss;
  document.getElementById('rhythm-bar').style.width = (total / 16 * 100) + '%';
}

function endRhythmGame() {
  rhythmState.running = false;
  const passed = rhythmState.perfect + rhythmState.good >= 12;
  S.rhythmResult = passed ? 'pass' : 'fail';
  saveProgress();
  document.getElementById('rhythm-game').classList.remove('active');
  if (passed) SFX.rhythmPass();
  else SFX.rhythmFail();
  addTimer(() => {
    if (passed) rhythmPassNarrative();
    else rhythmFailNarrative();
  }, 800);
}

function rhythmPassNarrative() {
  NarSeq.start([
    { sceneId: 3, text: '"就你了。走在最前面。"' },
    { sceneId: 3, text: '室友小声说了什么。你听不清。教官："明天早上六点半，操场加练。"' },
    { sceneId: 3, text: '那天晚上你练了很久的正步。在宿舍走廊。\n室友说"你别练了，脚步声太大"。你没停。' },
  ], () => showEnding());
}

function rhythmFailNarrative() {
  const extra = S.s2Choice === 'A'
    ? '\n排长走过来拍你肩膀："你歌唱得不错。"'
    : '\n没人走过来。你站在方阵里。';
  NarSeq.start([
    { sceneId: 3, text: '教官看了看你，又看了看另一个人。\n"你。走在前面。"' },
    { sceneId: 3, text: '你站在方阵里。前面那个人走得确实比你好。' + extra },
    { sceneId: 3, text: '那天晚上你没去食堂。你在操场上走了一圈。没有正步，就是走。\n你在想：你是不是不适合出头。' },
  ], () => showEnding());
}
