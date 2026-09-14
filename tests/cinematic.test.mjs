import test from 'node:test';
import assert from 'node:assert/strict';
import { createSceneRenderer } from '../src/cinematic.mjs';
import { SCENE_GESTURES, SCENE_PROPS } from '../src/scene-content.mjs';

function harness(initialWidth = 1200, initialHeight = 760) {
  let bounds = { width: initialWidth, height: initialHeight };
  const calls = [];
  const gradient = { addColorStop() {} };
  const ctx = new Proxy({ createLinearGradient: () => gradient, createRadialGradient: () => gradient }, {
    get: (target, key) => target[key] ?? ((...args) => calls.push([key, ...args])),
    set: (target, key, value) => { target[key] = value; return true; },
  });
  const canvas = { getContext: () => ctx, getBoundingClientRect: () => bounds, ownerDocument: {} };
  return { renderer: createSceneRenderer(canvas), calls, canvas, resize: (width, height) => { bounds = { width, height }; } };
}
const state = { relationships: { li: { clarity: 0 }, chen: { clarity: 2 }, roommate: { clarity: 3 }, instructor: { clarity: 3 } } };
const plan = { id: 'test', locationId: 'shade', prop: 'bottle', cast: ['li'], beats: [{ focus: 'person', gesture: 'offer' }] };

test('all planned gestures, props and environments produce finite drawing commands and usable hotspots', () => {
  const { renderer, calls } = harness();
  for (const locationId of ['dorm', 'library', 'canteen', 'field', 'shade', 'gate']) {
    for (const [index, prop] of SCENE_PROPS.entries()) {
      calls.length = 0;
      renderer.draw({ plan: { ...plan, id: `${locationId}-${prop}`, locationId, prop, beats: [{ focus: index % 2 ? 'detail' : 'person', gesture: SCENE_GESTURES[index % SCENE_GESTURES.length] }] }, state, elapsed: 4, beatElapsed: 2, actionProgress: 0.5 });
      assert.ok(calls.length > 100, `${prop} is rendered with a full articulated person and environment`);
      for (const command of calls) for (const value of command.slice(1)) if (typeof value === 'number') assert.ok(Number.isFinite(value), `non-finite ${command[0]} coordinate`);
      const hotspot = renderer.getHotspot();
      assert.ok(hotspot.x >= 42 && hotspot.x <= 1158);
      assert.ok(hotspot.y >= 55 && hotspot.y <= 760 * 0.59);
    }
  }
});

test('mobile layout leaves the interaction target above the subtitle region after resize', () => {
  const env = harness(); env.resize(360, 740); env.renderer.resize();
  for (const actor of [undefined, 'player', 'chen']) {
    env.renderer.draw({ plan: { ...plan, cast: ['li', 'chen', 'roommate'], beats: [{ focus: 'detail', gesture: 'reach', actor, prop: 'receipt' }] }, state, elapsed: 3, beatElapsed: 1, actionProgress: 1 });
    const hotspot = env.renderer.getHotspot();
    assert.ok(hotspot.x >= 42 && hotspot.x <= 318);
    assert.ok(hotspot.y > 55 && hotspot.y <= 740 * 0.59);
  }
  assert.equal(env.canvas.width, 360);
  assert.equal(env.canvas.height, 740);
});

test('paused scene clocks freeze camera and gestures instead of drifting on repeated draws', () => {
  const { renderer, calls } = harness();
  const args = { plan, state, elapsed: 2, beatElapsed: 1.5, actionProgress: 0.2 };
  renderer.draw(args); calls.length = 0; renderer.draw(args);
  const frame = JSON.stringify(calls); calls.length = 0; renderer.draw(args);
  assert.equal(JSON.stringify(calls), frame);
});

test('reduced motion makes breathing, leaves and gestures deterministic regardless of elapsed time', () => {
  const { renderer, calls } = harness();
  const args = { plan, state, reducedMotion: true, actionProgress: 0.5 };
  renderer.draw({ ...args, elapsed: 1, beatElapsed: 1 }); calls.length = 0;
  renderer.draw({ ...args, elapsed: 5, beatElapsed: 3 }); const frame = JSON.stringify(calls); calls.length = 0;
  renderer.draw({ ...args, elapsed: 25, beatElapsed: 13 });
  assert.equal(JSON.stringify(calls), frame);
});

test('progressive facial detail and observed actions change the actual vector drawing', () => {
  const { renderer, calls } = harness();
  renderer.draw({ plan, state, elapsed: 1, beatElapsed: 1, reducedMotion: true });
  const strangerFrame = JSON.stringify(calls); calls.length = 0;
  renderer.draw({ plan, state: { relationships: { li: { clarity: 3 } } }, elapsed: 1, beatElapsed: 1, reducedMotion: true });
  assert.notEqual(JSON.stringify(calls), strangerFrame, 'clarity changes visible face details'); calls.length = 0;
  renderer.draw({ plan: { ...plan, beats: [{ focus: 'person', gesture: 'wave' }] }, state, elapsed: 1, beatElapsed: 1, reducedMotion: true });
  assert.notEqual(JSON.stringify(calls), strangerFrame, 'wave changes the articulated pose');
});

test('new facial features fade in over time instead of appearing in the first changed frame', () => {
  const { renderer, calls } = harness();
  const base = { plan, beatElapsed: 2, actionProgress: 0 };
  renderer.draw({ ...base, state, elapsed: 0 }); calls.length = 0;
  const understood = { relationships: { li: { clarity: 3 } } };
  renderer.draw({ ...base, state: understood, elapsed: 0.1 });
  const isEye = (command) => command[0] === 'ellipse' && Math.abs(command[1]) === 10 && command[2] === -9 && command[3] === 1.8;
  assert.equal(calls.some(isEye), false, 'eyes do not pop in on the first frame after a clarity update');
  for (let frame = 2; frame <= 15; frame++) renderer.draw({ ...base, state: understood, elapsed: frame / 10 });
  calls.length = 0; renderer.draw({ ...base, state: understood, elapsed: 1.6 });
  assert.equal(calls.some(isEye), true, 'eyes become visible after the 1.25 second transition');
});

test('person shots preserve space above the head while detail shots center the enlarged object', () => {
  for (const [width, height] of [[1280, 720], [360, 740]]) {
    const { renderer, calls } = harness(width, height);
    renderer.draw({ plan: { ...plan, locationId: 'field', beats: [{ focus: 'person', gesture: 'idle' }] }, state, reducedMotion: true });
    const translations = calls.filter((command) => command[0] === 'translate');
    const scales = calls.filter((command) => command[0] === 'scale');
    const pivotY = translations[0][2], floor = translations[2][2], bodySize = scales[1][1], zoom = scales[0][1];
    const headTop = pivotY + (floor - 359 * bodySize - pivotY) * zoom;
    assert.ok(zoom >= 1.5, 'person shot is meaningfully closer than the full-body establishing shot');
    assert.ok(headTop >= 100 && headTop < height * 0.24, `head clears the title instead of clipping: ${headTop}`);
    for (const prop of ['bottle', 'phone', 'receipt', 'map', 'uniform']) {
      calls.length = 0;
      renderer.draw({ plan: { ...plan, prop, beats: [{ focus: 'detail', gesture: 'offer' }] }, state, reducedMotion: true });
      const detailZoom = calls.find((command) => command[0] === 'scale')[1];
      assert.ok(detailZoom > zoom, 'the object insert shot is closer than the person shot');
      const point = renderer.getHotspot();
      assert.ok(Math.abs(point.x - width * 0.5) < 1, `${prop} remains horizontally centered`);
      assert.ok(Math.abs(point.y - height * 0.44) < 1, `${prop} remains above the captions`);
    }
  }
});
