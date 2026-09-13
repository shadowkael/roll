import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, INTERACTION_RADIUS, SAVE_VERSION } from '../src/simulation.mjs';
import { CHARACTERS, EVENTS, LOCATIONS, EPISODES, EVENT_EPISODES } from '../src/content.mjs';

function approach(game, id) {
  const target = game.getAvailableInteractions().find((interaction) => interaction.id === id);
  assert.ok(target, `Interaction ${id} should exist at day ${game.state.day}, minute ${game.state.minute}`);
  game.setPlayer(target.x, target.y);
  assert.equal(game.interact(id), true);
  return game.state.dialogue;
}
function talk(game, characterId, choice = 0, expectedEpisode = null) {
  const dialogue = approach(game, `npc:${characterId}`);
  if (expectedEpisode) assert.equal(dialogue.nodeId, expectedEpisode);
  assert.equal(game.choose(choice), true);
  if (game.state.dialogue) game.choose(0);
}
function at(game, minute) {
  assert.ok(minute >= game.state.minute, `Cannot move clock back from ${game.state.minute} to ${minute}`);
  game.advance(minute - game.state.minute);
}
function tomorrow(game) {
  if (game.state.minute < 1140) at(game, 1140);
  game.setPlayer(20, 22);
  assert.equal(game.sleep(), true);
}
function participate(game, id, choice = 0) {
  const event = EVENTS.find((event) => event.id === id);
  assert.equal(event.day, game.state.day);
  at(game, event.start);
  approach(game, `event:${id}`);
  game.choose(choice);
  game.choose(0);
  assert.equal(game.state.eventStatus[id], 'complete');
  assert.equal(game.state.minute, event.end);
}
function meetEveryone(game) {
  talk(game, 'roommate', 0, 'roommate-first');
  talk(game, 'chen', 0, 'chen-first');
  talk(game, 'li', 0, 'li-first');
  talk(game, 'instructor', 0, 'instructor-first');
}

 test('new chapter begins on arrival afternoon with an anonymous player and unknown faces', () => {
  const game = createGame();
  assert.equal(game.state.day, 1);
  assert.equal(game.state.minute, 920);
  assert.equal(game.state.dialogue, null);
  assert.equal(game.state.ending, false);
  assert.ok(Object.values(game.state.relationships).every((relationship) => relationship.clarity === 0 && !relationship.knownName));
  assert.equal('name' in game.state.player, false);
  assert.equal(game.getSchedule()[0].id, 'arrival');
 });

 test('dialogue pauses the clock, movement and waiting until its reaction is closed', () => {
  const game = createGame();
  approach(game, 'npc:roommate');
  const before = structuredClone(game.state.player);
  assert.equal(game.advance(500), false);
  assert.equal(game.waitUntilNext(), false);
  assert.equal(game.sleep(), false);
  assert.equal(game.setPlayer(80, 80), false);
  assert.deepEqual(game.state.player, before);
  assert.equal(game.state.minute, 920);
  game.choose(0);
  assert.equal(game.advance(500), false);
  assert.equal(game.state.dialogue.stage, 'reaction');
  game.choose(0);
  assert.equal(game.state.minute, 920);
 });

 test('canceling a choice causes no relationship changes or fabricated memory', () => {
  const game = createGame();
  approach(game, 'npc:roommate');
  game.dismissDialogue();
  assert.equal(game.state.relationships.roommate.clarity, 0);
  assert.equal(game.state.memories.length, 0);
  assert.equal(game.state.minute, 920);
 });

 test('distance is enforced for all interactions, including events', () => {
  const game = createGame();
  game.setPlayer(95, 5);
  assert.equal(game.interact('npc:li'), false);
  assert.equal(game.interact('object:dorm'), false);
  at(game, 960);
  assert.equal(game.interact('event:arrival'), false);
  assert.equal(game.state.dialogue, null);
  const entry = game.getAvailableInteractions().find((interaction) => interaction.id === 'event:arrival');
  assert.ok(entry.distance > INTERACTION_RADIUS);
 });

 test('calendar opens automatically at its start and closes with a recoverable missed status', () => {
  const game = createGame();
  at(game, 940);
  assert.ok(game.state.notifications.some((notification) => notification.id === 'soon-arrival'));
  at(game, 960);
  assert.equal(game.state.eventStatus.arrival, 'available');
  assert.ok(game.getAvailableInteractions().some((interaction) => interaction.id === 'event:arrival'));
  at(game, 1050);
  assert.equal(game.state.eventStatus.arrival, 'missed');
  assert.ok(!game.getAvailableInteractions().some((interaction) => interaction.id === 'event:arrival'));
  approach(game, 'object:dorm');
  assert.equal(game.state.dialogue.action, 'uniform');
  game.choose(0);
  game.choose(0);
  assert.equal(game.state.flags.uniform, true);
 });

 test('late arrival gets different introduction and completes within the current event', () => {
  const game = createGame();
  tomorrow(game);
  at(game, 620);
  approach(game, 'event:standing');
  assert.equal(game.state.dialogue.late, true);
  assert.match(game.state.dialogue.lines[0], /来得晚/);
  game.choose(2);
  game.dismissDialogue();
  assert.equal(game.state.minute, 690);
  assert.equal(game.state.eventStatus.standing, 'complete');
  assert.equal(game.state.relationships.li.clarity, 1);
  assert.equal(game.state.relationships.li.trust, 0);
 });

 test('NPC locations change with clock and gather automatically for training', () => {
  const game = createGame();
  assert.equal(game.getNPCs().find((npc) => npc.id === 'chen').locationId, 'library');
  tomorrow(game);
  assert.equal(game.getNPCs().find((npc) => npc.id === 'li').locationId, 'field');
  assert.equal(game.getNPCs().find((npc) => npc.id === 'roommate').locationId, 'dorm');
  at(game, 540);
  assert.ok(game.getNPCs().every((npc) => npc.locationId === 'field'));
  at(game, 690);
  assert.equal(game.getNPCs().find((npc) => npc.id === 'li').locationId, 'shade');
  assert.equal(game.getNPCs().find((npc) => npc.id === 'chen').locationId, 'canteen');
  at(game, 810);
  assert.equal(game.getNPCs().find((npc) => npc.id === 'chen').locationId, 'library');
 });

 test('repeat conversation and location clicks do not farm clarity or trust', () => {
  const game = createGame();
  talk(game, 'roommate');
  const relationship = structuredClone(game.state.relationships.roommate);
  for (let count = 0; count < 8; count += 1) talk(game, 'roommate');
  assert.deepEqual(game.state.relationships.roommate, relationship);
  assert.equal(game.state.memories.length, 1);
  approach(game, 'object:dorm');
  game.choose(0);
  assert.deepEqual(game.state.relationships.roommate, relationship);
 });

 test('names and clarity follow distinct encounters across days', () => {
  const game = createGame();
  talk(game, 'li', 0, 'li-first');
  assert.equal(game.state.relationships.li.clarity, 1);
  assert.equal(game.state.relationships.li.knownName, false);
  at(game, 980);
  talk(game, 'li');
  assert.equal(game.state.relationships.li.clarity, 1);
  tomorrow(game);
  at(game, 690);
  talk(game, 'li', 2, 'li-name');
  assert.equal(game.state.relationships.li.clarity, 2);
  assert.equal(game.state.relationships.li.knownName, true);
  at(game, 1050);
  talk(game, 'li');
  assert.equal(game.state.relationships.li.clarity, 2, 'Understanding waits until a later day');
  tomorrow(game);
  at(game, 1080);
  talk(game, 'li', 0, 'li-understand');
  assert.equal(game.state.relationships.li.clarity, 3);
  assert.equal(game.state.flags.liWalk, true);
 });

 test('a disagreement can deepen understanding without increasing trust', () => {
  const game = createGame();
  talk(game, 'instructor', 1, 'instructor-first');
  tomorrow(game);
  at(game, 690);
  talk(game, 'instructor', 2, 'instructor-name');
  tomorrow(game);
  tomorrow(game);
  at(game, 690);
  const before = game.state.relationships.instructor.trust;
  talk(game, 'instructor', 2, 'instructor-understand');
  assert.equal(game.state.relationships.instructor.clarity, 3);
  assert.equal(game.state.relationships.instructor.trust, before - 1);
  assert.match(game.state.memories.at(-1).text, /语气/);
  approach(game, 'npc:instructor');
  assert.ok(game.state.dialogue.lines.some((line) => line.includes('压低了一些')));
  game.dismissDialogue();
  assert.equal(game.state.relationships.instructor.clarity, 3);
 });

 test('save restores a pending choice and reading time never advances offline', () => {
  const game = createGame();
  approach(game, 'npc:roommate');
  const restored = createGame(game.serialize());
  assert.equal(restored.state.minute, 920);
  assert.equal(restored.state.dialogue.nodeId, 'roommate-first');
  restored.choose(1);
  restored.choose(0);
  assert.equal(restored.state.relationships.roommate.clarity, 1);
  assert.equal(restored.state.memories.length, 1);
 });

 test('save restores a selected reaction without applying its effect twice', () => {
  const game = createGame();
  approach(game, 'npc:roommate');
  game.choose(0);
  const snapshot = game.serialize();
  const restored = createGame(snapshot);
  restored.choose(0);
  assert.equal(restored.state.relationships.roommate.clarity, 1);
  assert.equal(restored.state.relationships.roommate.trust, 1);
  assert.equal(restored.state.memories.length, 1);
  assert.equal(restored.state.minute, 920);
  talk(restored, 'roommate');
  assert.equal(restored.state.memories.length, 1);
 });

 test('a saved event reaction finalizes only once, even after repeated restores', () => {
  let game = createGame();
  at(game, 960);
  approach(game, 'event:arrival');
  game.choose(0);
  game = createGame(game.serialize());
  assert.equal(game.state.eventStatus.arrival, 'active');
  game.choose(0);
  const memoryCount = game.state.memories.length;
  assert.equal(game.state.eventStatus.arrival, 'complete');
  game = createGame(game.serialize());
  assert.equal(game.interact('event:arrival'), false);
  assert.equal(game.state.memories.length, memoryCount);
 });

 test('invalid save inputs are handled safely and finite bounds survive restoration', () => {
  for (const input of ['{bad', 'null', '[]', { version: 99 }, { version: 0 }]) {
    const game = createGame(input);
    assert.equal(game.state.day, 1);
    assert.equal(game.state.minute, 920);
  }
  const game = createGame({ version: SAVE_VERSION, day: 100, minute: NaN, player: { x: Infinity, y: -1000 }, relationships: { li: { clarity: 100, trust: -Infinity, memories: ['bad'] } }, dialogue: { lines: 'malformed' } });
  assert.equal(game.state.day, 5);
  assert.ok(Number.isFinite(game.state.minute));
  assert.deepEqual(game.state.player, { x: 20, y: 3 });
  assert.equal(game.state.relationships.li.clarity, 3);
  assert.equal(game.state.relationships.li.trust, 0);
  assert.equal(game.state.dialogue, null);
 });

 test('corrupted dialogue clears a stuck active event on restore', () => {
  const game = createGame({ version: SAVE_VERSION, day: 2, minute: 600, eventStatus: { standing: 'active' }, dialogue: { bad: true } });
  assert.equal(game.state.dialogue, null);
  assert.equal(game.state.eventStatus.standing, 'available');
 });

 test('wait stays within half an hour and stops at an upcoming schedule boundary', () => {
  const game = createGame();
  game.waitUntilNext();
  assert.equal(game.state.minute, 930, 'NPC schedule changes at 15:30');
  game.waitUntilNext();
  assert.equal(game.state.minute, 940, '20 minute event notice is preserved');
  game.waitUntilNext();
  assert.equal(game.state.minute, 960, 'Event start is preserved');
  game.waitUntilNext();
  assert.equal(game.state.minute, 990, 'Even long windows advance at most 30 minutes');
 });

 test('sleep requires evening and the dorm, then explicitly starts the next morning', () => {
  const game = createGame();
  assert.equal(game.sleep(), false);
  at(game, 1140);
  game.setPlayer(90, 90);
  assert.equal(game.sleep(), false);
  game.setPlayer(20, 22);
  assert.equal(game.sleep(), true);
  assert.equal(game.state.day, 2);
  assert.equal(game.state.minute, 420);
  assert.deepEqual(game.state.player, { x: 20, y: 27 });
 });

 test('22:00 stops at the same day and cannot silently simulate an offline night', () => {
  const game = createGame();
  game.advance(100_000);
  assert.equal(game.state.minute, 1320);
  assert.equal(game.state.day, 1);
  assert.equal(game.state.ending, false);
  assert.equal(game.waitUntilNext(), false);
 });

 test('skipping every main event still reaches the fifth day ending with no false relationship', () => {
  const game = createGame();
  for (let day = 1; day < 5; day += 1) tomorrow(game);
  game.advance(100_000);
  assert.equal(game.state.ending, true);
  assert.ok(EVENTS.every((event) => game.state.eventStatus[event.id] === 'missed'));
  assert.ok(Object.values(game.state.relationships).every((relationship) => relationship.clarity === 0));
  assert.equal(game.state.memories.length, 1);
  assert.equal(game.state.memories[0].id, 'quiet-days');
  assert.equal(game.advance(10), false);
 });

 test('complete military chapter supports all four understanding arcs and actual choice memories', () => {
  const game = createGame();
  meetEveryone(game);
  participate(game, 'arrival', 0);
  tomorrow(game);
  participate(game, 'standing', 1);
  talk(game, 'li', 0, 'li-name');
  talk(game, 'instructor', 0, 'instructor-name');
  talk(game, 'roommate', 0, 'roommate-name');
  at(game, 810);
  talk(game, 'chen', 0, 'chen-name');
  tomorrow(game);
  participate(game, 'singing', 1);
  talk(game, 'li', 0, 'li-understand');
  at(game, 1140);
  talk(game, 'chen', 0, 'chen-understand');
  talk(game, 'roommate', 0, 'roommate-understand');
  tomorrow(game);
  participate(game, 'selection', 2);
  at(game, 690);
  talk(game, 'instructor', 1, 'instructor-understand');
  tomorrow(game);
  participate(game, 'closing', 1);
  assert.equal(game.state.ending, false, 'The last evening is available for farewells');
  assert.equal(game.state.minute, 1110, 'Closing ends at 18:30');
  assert.equal(game.getAvailableInteractions().find((interaction) => interaction.id === 'object:dorm').label, '整理军训回忆');
  approach(game, 'object:dorm');
  assert.equal(game.state.dialogue.action, 'ending', 'The memory action is available before 19:00');
  game.choose(0);
  game.choose(0);
  assert.equal(game.state.ending, true);
  assert.ok(Object.values(game.state.relationships).every((relationship) => relationship.clarity === 3 && relationship.knownName));
  assert.ok(EVENTS.every((event) => game.state.eventStatus[event.id] === 'complete'));
  assert.equal(game.getMemories().length, 17);
  assert.match(game.getMemories().find((memory) => memory.id === 'li-understand').text, /没有计时/);
  assert.ok(!game.getMemories().some((memory) => memory.id === 'quiet-days'));
 });

 test('returned memories are copies and serializing preserves original state', () => {
  const game = createGame();
  talk(game, 'roommate');
  const memories = game.getMemories();
  memories[0].text = 'tampered';
  assert.notEqual(game.state.memories[0].text, 'tampered');
  assert.deepEqual(createGame(game.serialize()).state.relationships, game.state.relationships);
 });

 test('content references and every authored choice resolve to a specific reaction and memory', () => {
  assert.equal(Object.keys(EPISODES).length, 12);
  for (const [id, episode] of Object.entries({ ...EPISODES, ...EVENT_EPISODES })) {
    assert.ok(CHARACTERS[episode.speakerId], id);
    assert.ok(episode.lines.length >= 2, id);
    for (const choice of episode.choices) {
      assert.ok(choice.text && choice.reaction.length >= 2 && choice.memory, `${id}: ${choice.text}`);
    }
  }
  for (const event of EVENTS) {
    assert.ok(LOCATIONS.some((location) => location.id === event.locationId));
    assert.ok(EVENT_EPISODES[event.id]);
  }
 });

 test('contacting an assembled NPC enters the calendar event before unrelated first encounters', () => {
  const game = createGame();
  tomorrow(game);
  at(game, 540);
  const li = game.getAvailableInteractions().find((interaction) => interaction.id === 'npc:li');
  assert.equal(li.fresh, false);
  const dialogue = approach(game, 'npc:li');
  assert.equal(dialogue.source, 'event');
  assert.equal(dialogue.nodeId, 'standing');
  game.choose(0);
  game.choose(0);
  assert.equal(game.state.eventStatus.standing, 'complete');
  assert.equal(game.state.relationships.li.memories.includes('li-first'), false);
  const after = approach(game, 'npc:li');
  assert.equal(after.nodeId, 'li-first');
 });

function selfNominate() {
  const game = createGame();
  tomorrow(game);
  tomorrow(game);
  tomorrow(game);
  at(game, 540);
  approach(game, 'event:selection');
  game.choose(0);
  return game;
}

 test('practice records once, persists scalar results and keeps the world paused', () => {
  let game = selfNominate();
  const clock = game.state.minute;
  assert.equal(game.recordPractice({ hits: 7, total: 8, skipped: false }), true);
  assert.equal(game.state.flags.practiceHits, 7);
  assert.equal(game.state.flags.practiceTotal, 8);
  assert.equal(game.state.flags.practiceSkipped, false);
  assert.equal(game.state.minute, clock);
  assert.match(game.state.dialogue.lines[0], /慢慢合上/);
  assert.equal(game.recordPractice({ hits: 1, total: 8, skipped: false }), false);
  game = createGame(game.serialize());
  assert.equal(game.state.flags.practiceHits, 7);
  assert.equal(game.state.flags.practiceTotal, 8);
  assert.equal(game.state.flags.practiceSkipped, false);
  assert.equal(game.recordPractice({ hits: 8, total: 8, skipped: false }), false);
  assert.equal(game.state.memories.filter((memory) => memory.id === 'march-practice').length, 1);
  game.choose(0);
  assert.equal(game.state.eventStatus.selection, 'complete');
  assert.equal(game.state.minute, 660);
 });

 test('low practice score has a specific response and still completes selection', () => {
  const game = selfNominate();
  const before = structuredClone(game.state.relationships);
  game.recordPractice({ hits: 2, total: 8, skipped: false });
  assert.match(game.state.dialogue.lines[0], /没踩准/);
  assert.match(game.state.memories.at(-1).text, /2\/8/);
  assert.deepEqual(game.state.relationships, before, 'Timing accuracy does not gate a relationship');
  game.choose(0);
  assert.equal(game.state.eventStatus.selection, 'complete');
 });

 test('skipped practice explicitly records no fabricated hits and remains a valid path', () => {
  const game = selfNominate();
  game.recordPractice({ hits: 8, total: 8, skipped: true });
  assert.equal(game.state.flags.practiceHits, 0);
  assert.equal(game.state.flags.practiceSkipped, true);
  assert.match(game.state.dialogue.lines[0], /先看着/);
  assert.match(game.state.memories.at(-1).text, /先看一遍/);
  assert.doesNotMatch(game.state.memories.at(-1).text, /8\/8/);
  game.choose(0);
  assert.equal(game.state.eventStatus.selection, 'complete');
 });

 test('practice cannot be submitted from an unrelated scene or another selection choice', () => {
  const game = createGame();
  assert.equal(game.recordPractice({ hits: 8, total: 8 }), false);
  tomorrow(game);
  tomorrow(game);
  tomorrow(game);
  at(game, 540);
  approach(game, 'event:selection');
  assert.equal(game.recordPractice({ hits: 8, total: 8 }), false);
  game.choose(2);
  assert.equal(game.recordPractice({ hits: 8, total: 8 }), false);
  assert.ok(!game.state.memories.some((memory) => memory.id === 'march-practice'));
 });
