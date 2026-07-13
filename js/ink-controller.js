/**
 * Ink 标签与文本处理器（开场 / Scene1–3 同一管线）
 */
import { inkRuntime, parseTag } from './ink-runtime.js';
import { S, saveProgress } from './state.js';
import { clearTimers } from './engine.js';
import { NarSeq } from './narration.js';
import { SFX } from './sfx.js';
import {
  showBubble, showChoices, showExploreHint, hideExploreHint,
  switchScene, showEstablishingShot,
} from './ui.js';
import { bindScene1Hotspots } from './scenes/scene1-ink.js';
import { bindScene2Hotspots } from './scenes/scene2-ink.js';
import { bindScene3Hotspots } from './scenes/scene3-ink.js';
import { mountSceneArt } from './scene-compositor.js';
import { startRhythmGame } from './rhythm-game.js';
import { showEnding } from './results.js';

let exploreTimeout = null;
let pendingTimeoutKnot = 's1_timeout';
const hotspotsBound = { scene1: false, scene2: false, scene3: false };

export async function startGame() {
  SFX.init();
  if (!inkRuntime.loaded) await inkRuntime.load();
  else inkRuntime.reset();
  await advanceInk();
}

export async function advanceInk() {
  const story = inkRuntime.story;
  if (!story) return;

  while (story.canContinue) {
    const text = story.Continue().trim();
    const tags = [...story.currentTags];
    const stop = await handleInkLine(text, tags);
    if (stop) return;
  }

  if (story.currentChoices.length > 0) {
    await waitForChoice(story.currentChoices.map(c => c.text));
    return;
  }
  inkRuntime.syncFromInk();
}

async function handleInkLine(text, tags) {
  for (const tag of tags) {
    const stop = await handleTag(tag, { texts: text ? [text] : [], tags, choices: null });
    if (stop) return true;
  }
  if (text && text !== '.' && !tags.some(t => t.startsWith('bubble:'))
      && !tags.some(t => t.startsWith('narration'))) {
    await showNarrationLine(text, tags);
  }
  return false;
}

function switchSceneAsync(id, cb) {
  return new Promise(resolve => {
    switchScene(id, () => {
      if (cb) cb();
      resolve();
    });
  });
}

function activeChoiceSceneId() {
  const id = document.querySelector('.scene.active')?.id;
  if (id === 'scene2') return 2;
  if (id === 'scene3') return 3;
  return 1;
}

function narrationSceneId(tags = []) {
  const sceneTag = tags.find(t => t.startsWith('scene:'));
  if (sceneTag === 'scene:scene2') return 2;
  if (sceneTag === 'scene:scene3') return 3;
  if (sceneTag === 'scene:scene1') return 1;
  const active = document.querySelector('.scene.active')?.id;
  if (active === 'scene2') return 2;
  if (active === 'scene3') return 3;
  if (active === 'scene1') return 1;
  return 1;
}

function hasSceneChoice(sceneNum) {
  if (sceneNum === 2) return !!(S.s2Choice || inkRuntime.getVar('s2_choice'));
  if (sceneNum === 3) return !!(S.s3Choice || inkRuntime.getVar('s3_choice'));
  return !!(S.s1Choice || inkRuntime.getVar('s1_choice'));
}

async function enterScene(sceneId) {
  await switchSceneAsync(sceneId, async () => {
    await mountSceneArt(sceneId);
    if (sceneId === 'scene1' && !hotspotsBound.scene1) {
      bindScene1Hotspots(onInkHotspot);
      hotspotsBound.scene1 = true;
    }
    if (sceneId === 'scene2' && !hotspotsBound.scene2) {
      bindScene2Hotspots(onInkHotspot);
      hotspotsBound.scene2 = true;
    }
    if (sceneId === 'scene3' && !hotspotsBound.scene3) {
      bindScene3Hotspots(onInkHotspot);
      hotspotsBound.scene3 = true;
    }
  });
}

async function handleTag(tag, step) {
  const { key, args } = parseTag(tag);
  const text = step.texts[0] || '';

  switch (key) {
    case 'flow':
      if (args[0] === 'opening') {
        await switchSceneAsync('opening-screen', () => {
          document.getElementById('opening-screen').innerHTML = '';
        });
      } else if (args[0] === 'transition') {
        await switchSceneAsync('transition-screen', () => {
          document.getElementById('transition-screen').innerHTML = '';
        });
      }
      return false;
    case 'sfx':
      if (args[0] === 'ding') SFX.ding();
      else if (args[0] === 'thud') SFX.thud();
      else if (args[0] === 'opening') SFX.opening();
      else if (args[0] === 'scene1_ambient') SFX.scene1Ambient();
      else if (args[0] === 'scene2_ambient') SFX.scene2Ambient();
      else if (args[0] === 'scene3_ambient') SFX.scene3Ambient();
      return false;
    case 'establish':
      return await new Promise(resolve => {
        const titleTag = step.tags.find(t => t.startsWith('establish_title:'));
        const title = titleTag ? titleTag.split(':').slice(1).join(':') : '';
        showEstablishingShot(args[0], title, 3000, () => {
          advanceInk().then(() => resolve(true));
        });
      });
    case 'scene':
      if (args[0] === 'scene1' || args[0] === 'scene2' || args[0] === 'scene3') {
        await enterScene(args[0]);
      }
      return false;
    case 'explore_hint':
      showExploreHint(Number(args[0]) || 15);
      return false;
    case 'timeout_knot':
      pendingTimeoutKnot = args.join(':') || 's1_timeout';
      return false;
    case 'timeout': {
      if (exploreTimeout) clearTimeout(exploreTimeout);
      const ms = Number(args[0]) || 45000;
      const knot = pendingTimeoutKnot;
      exploreTimeout = setTimeout(() => {
        const sceneNum = activeChoiceSceneId();
        if (!hasSceneChoice(sceneNum)) {
          hideExploreHint();
          inkRuntime.jump(knot);
          advanceInk();
        }
      }, ms);
      return false;
    }
    case 'narration':
      if (text) {
        await narrationPromise(Number(args[0]) || narrationSceneId(step.tags), text);
      }
      return false;
    case 'narration_seq':
      if (text) {
        await narrationPromise(Number(args[0]) || narrationSceneId(step.tags), text);
        await advanceInk();
        return true;
      }
      return false;
    case 'bubble':
      if (text) showBubble(Number(args[0]), text, args[1], args[2]);
      return false;
    case 'choices':
      return false;
    case 'clear_timers':
      clearTimers();
      if (exploreTimeout) { clearTimeout(exploreTimeout); exploreTimeout = null; }
      return false;
    case 'hide_explore_hint':
      hideExploreHint();
      return false;
    case 'handoff':
      inkRuntime.syncFromInk();
      saveProgress();
      if (args[0] === 'rhythm') {
        startRhythmGame();
        return true;
      }
      if (args[0] === 'ending') {
        showEnding();
        return true;
      }
      // legacy: scene2 handoff no longer used
      return true;
    default:
      return false;
  }
}

function narrationPromise(sceneId, text) {
  return new Promise(resolve => {
    NarSeq.start([{ sceneId, text }], resolve);
  });
}

async function showNarrationLine(text, tags) {
  if (tags.some(t => t.startsWith('flow:transition'))) {
    await narrationPromise('transition', text);
    return;
  }
  const active = document.querySelector('.scene.active');
  if (active?.id === 'opening-screen') {
    await narrationPromise('opening', text);
    return;
  }
  if (active?.id === 'transition-screen') {
    await narrationPromise('transition', text);
    return;
  }
  await narrationPromise(narrationSceneId(tags), text);
}

function waitForChoice(options) {
  const sceneId = activeChoiceSceneId();
  return new Promise(resolve => {
    showChoices(sceneId, options, idx => {
      inkRuntime.choose(idx);
      advanceInk().then(resolve);
    });
  });
}

async function onInkHotspot(knot) {
  inkRuntime.jump(knot);
  await advanceInk();
}
