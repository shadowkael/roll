/**
 * Ink 标签与文本处理器
 */
import { inkRuntime, parseTag } from './ink-runtime.js';
import { S, saveProgress } from './state.js';
import { clearTimers, addTimer } from './engine.js';
import { NarSeq } from './narration.js';
import { SFX } from './sfx.js';
import {
  showBubble, showChoices, showExploreHint, hideExploreHint,
  switchScene, showEstablishingShot,
} from './ui.js';
import { initScene2 } from './scenes/scene2.js';
import { bindScene1Hotspots } from './scenes/scene1-ink.js';
import { mountSceneArt } from './scene-compositor.js';

let scene1Timeout = null;
let scene1HotspotsBound = false;
let pendingTimeoutKnot = 's1_timeout';

export async function startGame() {
  SFX.init();
  if (!inkRuntime.loaded) await inkRuntime.load();
  else inkRuntime.reset();
  await advanceInk();
}

export async function processInkStep(step) {
  for (const tag of step.tags) {
    const stop = await handleTag(tag, step);
    if (stop) return;
  }
  if (step.choices?.length) {
    await waitForChoice(step.choices);
  }
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
      if (args[0] === 'scene1') {
        switchScene('scene1', async () => {
          await mountSceneArt('scene1');
          if (!scene1HotspotsBound) {
            bindScene1Hotspots(onScene1Hotspot);
            scene1HotspotsBound = true;
          }
        });
      }
      return false;
    case 'explore_hint':
      showExploreHint(Number(args[0]) || 15);
      return false;
    case 'timeout_knot':
      pendingTimeoutKnot = args.join(':') || 's1_timeout';
      return false;
    case 'timeout':
      if (scene1Timeout) clearTimeout(scene1Timeout);
      scene1Timeout = setTimeout(() => {
        const chosen = S.s1Choice || inkRuntime.getVar('s1_choice');
        if (!chosen) {
          hideExploreHint();
          inkRuntime.jump(pendingTimeoutKnot);
          advanceInk();
        }
      }, Number(args[0]) || 45000);
      return false;
    case 'narration':
      if (text) {
        await narrationPromise(Number(args[0]) || 1, text);
      }
      return false;
    case 'narration_seq':
      if (text) {
        await narrationPromise(Number(args[0]) || 1, text);
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
      if (scene1Timeout) { clearTimeout(scene1Timeout); scene1Timeout = null; }
      return false;
    case 'hide_explore_hint':
      hideExploreHint();
      return false;
    case 'handoff':
      if (args[0] === 'scene2') {
        inkRuntime.syncFromInk();
        switchScene('scene2', () => initScene2());
        saveProgress();
        return true;
      }
      return false;
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
  if (tags.some(t => t.startsWith('scene:scene1')) || active?.id === 'scene1') {
    await narrationPromise(1, text);
  }
}

function waitForChoice(options) {
  const sceneId = 1;
  return new Promise(resolve => {
    showChoices(sceneId, options, idx => {
      inkRuntime.choose(idx);
      advanceInk().then(resolve);
    });
  });
}

async function onScene1Hotspot(knot) {
  inkRuntime.jump(knot);
  await advanceInk();
}
