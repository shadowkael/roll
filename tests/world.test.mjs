import test from 'node:test';
import assert from 'node:assert/strict';
import { WORLD_BOUNDS, isWalkable, findPath, createWorldRenderer } from '../src/world.mjs';
import { LOCATIONS, CHARACTERS } from '../src/content.mjs';
import { createGame } from '../src/simulation.mjs';

function assertSafeRoute(start, end) {
  const route = findPath(start, end);
  assert.ok(route.length, `a route exists from ${JSON.stringify(start)} to ${JSON.stringify(end)}`);
  assert.deepEqual(route.at(-1), end, 'route reaches the exact target');
  assert.notDeepEqual(route[0], start, 'route excludes the starting point');
  for (const target of route) {
    const length = Math.hypot(target.x - start.x, target.y - start.y);
    for (let i = 0; i <= Math.ceil(length * 20); i++) {
      const fraction = i / Math.max(1, Math.ceil(length * 20));
      const x = start.x + (target.x - start.x) * fraction, y = start.y + (target.y - start.y) * fraction;
      assert.ok(isWalkable(x, y), `segment enters obstacle at ${x},${y}`);
    }
    start = target;
  }
  return route;
}

test('the spawn can reach every chapter location and every pair of campus landmarks', () => {
  const spawn = createGame().state.player;
  for (const target of LOCATIONS) {
    assertSafeRoute(spawn, { x: target.x, y: target.y });
    for (const destination of LOCATIONS) if (destination.id !== target.id) assertSafeRoute({ x: target.x, y: target.y }, { x: destination.x, y: destination.y });
  }
});

test('all scheduled NPC placements are walkable and reachable on all five days', () => {
  const game = createGame();
  for (const day of [1, 2, 3, 4, 5]) {
    game.state.day = day;
    for (let minute = 420; minute <= 1320; minute += 30) {
      game.state.minute = minute;
      for (const npc of game.getNPCs()) {
        assert.ok(isWalkable(npc.x, npc.y), `${CHARACTERS[npc.id].name} is inside an obstacle on day ${day} at ${minute}`);
        assertSafeRoute(game.state.player, { x: npc.x, y: npc.y });
      }
    }
  }
});

test('building footprints, water and campus bounds reject clicks', () => {
  for (const point of [{ x: 18, y: 12 }, { x: 72, y: 9 }, { x: 84, y: 42 }, { x: 83, y: 80.5 }, { x: 2, y: 10 }, { x: 98, y: 10 }, { x: 20, y: NaN }]) {
    assert.equal(isWalkable(point.x, point.y), false);
    assert.deepEqual(findPath({ x: 20, y: 27 }, point), []);
  }
  assert.equal(isWalkable(WORLD_BOUNDS.minX, WORLD_BOUNDS.minY), true);
  assert.equal(isWalkable(27, 68), true, 'the training field remains freely walkable');
});

test('routes detour around each building and the pond without cutting corners', () => {
  for (const [start, end] of [
    [{ x: 5, y: 12 }, { x: 34, y: 12 }],
    [{ x: 56, y: 10 }, { x: 90, y: 10 }],
    [{ x: 68, y: 42 }, { x: 97, y: 42 }],
    [{ x: 67, y: 80 }, { x: 97, y: 80 }],
    [{ x: 28.9, y: 17 }, { x: 27, y: 18.9 }],
    [{ x: 83.9, y: 15 }, { x: 82, y: 16.9 }],
  ]) assert.ok(assertSafeRoute(start, end).length >= 2, 'an obstructed route must bend around the obstacle');
});

test('fractional positions, exact endpoints and identical points are handled', () => {
  assertSafeRoute({ x: 20.35, y: 27.19 }, { x: 91.65, y: 93.72 });
  assert.deepEqual(findPath({ x: 20, y: 27 }, { x: 20, y: 27 }), []);
  assert.deepEqual(findPath(null, { x: 20, y: 27 }), []);
});

test('renderer coordinates stay invertible after pan, zoom and resize', () => {
  // A lightweight context substitute checks the public projection contract without duplicating drawing logic.
  const gradient = { addColorStop() {} };
  const context = new Proxy({ measureText: (text) => ({ width: text.length * 10 }), createLinearGradient: () => gradient, createRadialGradient: () => gradient }, { get: (target, key) => target[key] ?? (() => {}) });
  let rectangle = { width: 1000, height: 650 };
  const canvas = { getContext: () => context, getBoundingClientRect: () => rectangle, ownerDocument: { createElement: () => ({ getContext: () => context }) } };
  const renderer = createWorldRenderer(canvas);
  for (const change of [() => {}, () => renderer.pan(173, -84), () => renderer.zoomBy(1.4), () => renderer.focus(20, 27), () => { rectangle = { width: 430, height: 760 }; renderer.resize(); }]) {
    change();
    for (const point of LOCATIONS) {
      const screen = renderer.toScreen(point.x, point.y), roundtrip = renderer.toWorld(screen.x, screen.y);
      assert.ok(Math.abs(point.x - roundtrip.x) < 1e-8);
      assert.ok(Math.abs(point.y - roundtrip.y) < 1e-8);
    }
  }
  const npc = { id: 'li', x: 23, y: 70 };
  const npcScreen = renderer.toScreen(npc.x, npc.y);
  assert.equal(renderer.hitTest(npcScreen.x, npcScreen.y - 10, [npc], LOCATIONS)?.id, 'li');
  const before = renderer.toScreen(20, 27), tenUnits = renderer.toScreen(30, 27);
  assert.ok(Math.hypot(tenUnits.x - before.x, tenUnits.y - before.y) >= 58, 'crossing to mobile retains an explorable scale rather than shrinking the entire world');
  assert.ok(Math.abs(before.x - rectangle.width / 2) < 1e-8, 'crossing to mobile centers the player');
});
