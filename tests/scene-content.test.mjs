import test from 'node:test';
import assert from 'node:assert/strict';
import { getScenePlan, SCENE_PROPS, SCENE_GESTURES, SCENE_FOCUSES } from '../src/scene-content.mjs';
import { CHARACTERS, EVENTS, EPISODES, EVENT_EPISODES, LOCATIONS } from '../src/content.mjs';
import { createGame } from '../src/simulation.mjs';

const stories = [...Object.entries(EPISODES).map(([nodeId, data]) => ({ nodeId, data, source: 'episode' })), ...Object.entries(EVENT_EPISODES).map(([nodeId, data]) => ({ nodeId, data, source: 'event' }))];
const unknownState = { day: 1, minute: 920, player: { x: 20, y: 27 }, relationships: Object.fromEntries(Object.keys(CHARACTERS).map((id) => [id, { clarity: 0, knownName: false }])), flags: {} };
function dialogueFor(story, selected) {
  return { source: story.source, nodeId: story.nodeId, speakerId: story.data.speakerId, title: story.data.title, lines: selected === undefined ? story.data.lines : story.data.choices[selected].reaction, stage: selected === undefined ? 'choice' : 'reaction', ...(selected === undefined ? {} : { selected }) };
}
function assertContract(plan, dialogue) {
  assert.equal(typeof plan.id, 'string');
  assert.ok(LOCATIONS.some((location) => location.id === plan.locationId));
  assert.equal(typeof plan.ambience, 'string');
  assert.ok(plan.ambience.length > 0);
  assert.equal(plan.title, dialogue.title);
  assert.ok(SCENE_PROPS.includes(plan.prop), plan.prop);
  assert.equal(new Set(plan.cast).size, plan.cast.length);
  assert.ok(plan.cast.every((id) => Object.hasOwn(CHARACTERS, id)));
  assert.equal(plan.cast[0], dialogue.speakerId);
  assert.deepEqual(plan.beats.map((beat) => beat.text), dialogue.lines, 'Text and line order are unchanged');
  for (const beat of plan.beats) {
    assert.ok(SCENE_GESTURES.includes(beat.gesture), beat.gesture);
    assert.ok(SCENE_FOCUSES.includes(beat.focus), beat.focus);
    assert.ok(SCENE_PROPS.includes(beat.prop), beat.prop);
    assert.ok(beat.actionLabel === undefined || typeof beat.actionLabel === 'string');
    assert.ok(beat.actor === undefined || beat.actor === 'player' || Object.hasOwn(CHARACTERS, beat.actor));
    assert.ok(beat.propOwner === undefined || beat.propOwner === 'player' || Object.hasOwn(CHARACTERS, beat.propOwner));
    assert.ok(!('choices' in beat), 'Narrative choices stay owned by the dialogue controller');
  }
  assert.ok(!('actionLabel' in plan.beats.at(-1)), 'The last shot hands control to existing choices');
  assert.deepEqual(JSON.parse(JSON.stringify(plan)), plan, 'Plan consists only of serializable data');
}
function metadataOnly(plan) {
  return JSON.stringify({ ...plan, beats: plan.beats.map(({ text, ...rest }) => rest) });
}
function deepFreeze(value) {
  if (value && typeof value === 'object') {
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
  }
  return value;
}

test('the authored chapter contains the expected 17 scenes', () => {
  assert.equal(stories.length, 17);
  assert.equal(stories.reduce((count, story) => count + story.data.choices.length, 0), 50);
});

for (const story of stories) {
  test(`${story.nodeId}: choice shots preserve every source line and hide unknown names from added metadata`, () => {
    const dialogue = dialogueFor(story);
    const plan = getScenePlan(dialogue, unknownState);
    assertContract(plan, dialogue);
    assert.ok(plan.beats.some((beat) => beat.actionLabel), 'The scene offers at least one optional observation');
    for (const person of Object.values(CHARACTERS)) assert.ok(!metadataOnly(plan).includes(person.name), `Added metadata must not disclose ${person.name}`);
    for (const beat of plan.beats) if (beat.actionLabel) {
      assert.doesNotMatch(beat.actionLabel, /捡起|扶正|压平|关上窗|折进|报告教官|自荐|举手报名/, 'Observation must not execute an unchosen branch');
    }
    if (story.source === 'event') assert.equal(plan.locationId, EVENTS.find((event) => event.id === story.nodeId).locationId);
  });
  for (let selected = 0; selected < story.data.choices.length; selected += 1) {
    test(`${story.nodeId}: reaction branch ${selected} resumes with matching shots`, () => {
      const dialogue = dialogueFor(story, selected);
      const plan = getScenePlan(JSON.parse(JSON.stringify(dialogue)), unknownState);
      assertContract(plan, dialogue);
      assert.ok(plan.id.endsWith(`:reaction:${selected}`));
      if (story.source === 'event') assert.equal(plan.locationId, EVENTS.find((event) => event.id === story.nodeId).locationId);
    });
  }
}

test('the first personal encounters show the object before disclosing a name', () => {
  for (const id of Object.keys(CHARACTERS)) {
    const story = stories.find((story) => story.nodeId === `${id}-first`);
    const plan = getScenePlan(dialogueFor(story), unknownState);
    assert.ok(!JSON.stringify(plan).includes(CHARACTERS[id].name));
  }
});

test('a name remains in its original introduction beat and is not added to earlier shots', () => {
  for (const id of Object.keys(CHARACTERS)) {
    const story = stories.find((story) => story.nodeId === `${id}-name`);
    const plan = getScenePlan(dialogueFor(story), unknownState);
    const namedAt = story.data.lines.findIndex((text) => text.includes(CHARACTERS[id].name));
    assert.ok(namedAt >= 1);
    for (const beat of plan.beats.slice(0, namedAt)) assert.ok(!JSON.stringify(beat).includes(CHARACTERS[id].name));
    assert.equal(plan.beats[namedAt].text, story.data.lines[namedAt]);
  }
});

test('player position keeps flexible first meetings at the actual field or shade location', () => {
  for (const nodeId of ['li-first', 'instructor-first']) {
    const story = stories.find((item) => item.nodeId === nodeId);
    const shadePlan = getScenePlan(dialogueFor(story), { player: { x: 45, y: 50 } });
    const fieldPlan = getScenePlan(dialogueFor(story), { player: { x: 27, y: 68 } });
    assert.equal(shadePlan.locationId, 'shade');
    assert.equal(fieldPlan.locationId, 'field');
  }
});

test('calendar scenes always retain their scheduled stage even with a stale player position', () => {
  for (const story of stories.filter((story) => story.source === 'event')) {
    const event = EVENTS.find((event) => event.id === story.nodeId);
    const plan = getScenePlan(dialogueFor(story), { day: 1, minute: 1200, player: { x: 68, y: 20 } });
    assert.equal(plan.locationId, event.locationId);
    assert.equal(plan.cast[0], story.data.speakerId);
  }
});

test('the actual choice changes prop and gesture instead of playing the same generic response', () => {
  const story = stories.find((item) => item.nodeId === 'chen-first');
  const pickedUp = getScenePlan(dialogueFor(story, 0), unknownState);
  const map = getScenePlan(dialogueFor(story, 1), unknownState);
  const window = getScenePlan(dialogueFor(story, 2), unknownState);
  assert.equal(pickedUp.beats[0].prop, 'receipt');
  assert.equal(pickedUp.beats[0].gesture, 'offer');
  assert.equal(map.beats[0].prop, 'map');
  assert.equal(window.beats[0].prop, 'book');
  assert.equal(window.beats[0].gesture, 'idle');
  assert.notDeepEqual(pickedUp.beats, map.beats);
});

test('dynamic prior-experience lines stay ahead of the authored scene without shifting its detail shots', () => {
  const story = stories.find((item) => item.nodeId === 'li-name');
  const dialogue = dialogueFor(story);
  dialogue.lines = ['“之前训练那次，谢谢。”那顶歪帽子先认出了你。', ...dialogue.lines];
  const plan = getScenePlan(dialogue, unknownState);
  assertContract(plan, dialogue);
  assert.equal(plan.beats[0].gesture, 'wave');
  assert.equal(plan.beats[0].prop, 'cap');
  assert.equal(plan.beats[1].prop, 'bench');
  assert.equal(plan.beats.at(-1).prop, 'bottle');
});

test('a late event entry stages the arrival before the original action', () => {
  const story = stories.find((item) => item.nodeId === 'standing');
  const dialogue = dialogueFor(story);
  dialogue.lines = ['你来得晚了一些。教官听完说明，让你从队尾归队；眼前的事还在继续。', ...dialogue.lines];
  const plan = getScenePlan(dialogue, unknownState);
  assertContract(plan, dialogue);
  assert.equal(plan.beats[0].gesture, 'step');
  assert.equal(plan.beats[0].focus, 'wide');
  assert.equal(plan.beats.at(-1).gesture, 'sway');
});

test('restored practice responses distinguish a missed step, a steady step and observing without trying', () => {
  for (const [hits, skipped, gesture] of [[7, false, 'step'], [2, false, 'sway'], [0, true, 'listen']]) {
    const game = createGame();
    for (let day = 1; day < 4; day += 1) {
      game.advance(1140 - game.state.minute);
      game.setPlayer(20, 22);
      game.sleep();
    }
    game.advance(540 - game.state.minute);
    const target = game.getAvailableInteractions().find((item) => item.id === 'event:selection');
    game.setPlayer(target.x, target.y);
    game.interact(target.id);
    game.choose(0);
    game.recordPractice({ hits, total: 8, skipped });
    const restored = createGame(game.serialize());
    const plan = getScenePlan(restored.state.dialogue, restored.state);
    assertContract(plan, restored.state.dialogue);
    assert.equal(plan.beats[0].gesture, gesture);
    assert.equal(plan.beats.at(-1).prop, 'shoes');
    if (skipped) assert.match(plan.beats[0].actionLabel, /先看清/);
  }
});

test('all environment objects have place-specific scenery with no invented NPC cast', () => {
  for (const location of LOCATIONS) {
    const dialogue = { source: 'object', nodeId: location.id, speakerId: null, title: location.name, stage: 'choice', action: 'close', lines: [location.description, '你在这里停留了一会儿。'] };
    const plan = getScenePlan(dialogue, unknownState);
    assert.equal(plan.locationId, location.id);
    assert.deepEqual(plan.cast, []);
    assert.equal(plan.beats.length, 2);
    assert.ok(SCENE_PROPS.includes(plan.prop));
    assert.ok(!('actionLabel' in plan.beats.at(-1)));
  }
});

test('the end-of-chapter object folds the uniform only after the player chooses to finish', () => {
  const base = { source: 'object', nodeId: 'dorm', speakerId: null, title: '宿舍', action: 'ending', lines: ['军训服挂在窗边。', '这一页里有你遇见的人。'] };
  const before = getScenePlan({ ...base, stage: 'choice' }, unknownState);
  const after = getScenePlan({ ...base, stage: 'reaction' }, unknownState);
  assert.equal(before.beats[0].gesture, 'idle');
  assert.equal(after.beats[0].gesture, 'fold');
  assert.equal(after.beats[0].prop, 'uniform');
  assert.deepEqual(before.cast, []);
  assert.deepEqual(after.cast, []);
});

test('ambient encounters follow the current place and keep their valid speaker first', () => {
  for (const location of LOCATIONS) for (const character of Object.values(CHARACTERS)) {
    const dialogue = { source: 'ambient', nodeId: character.id, speakerId: character.id, title: '路上碰见', stage: 'reaction', lines: [`${character.unknownName}点点头。`, '一会儿见。'] };
    const plan = getScenePlan(dialogue, { player: location, minute: 1200 });
    assertContract(plan, dialogue);
    assert.equal(plan.locationId, location.id);
    assert.deepEqual(plan.cast, [character.id]);
    assert.ok(!metadataOnly(plan).includes(character.name));
  }
});

test('lighting ambience responds to time without changing text or relationships', () => {
  const story = stories.find((item) => item.nodeId === 'li-understand');
  const dialogue = dialogueFor(story);
  const afternoon = getScenePlan(dialogue, { ...unknownState, minute: 1080 });
  const evening = getScenePlan(dialogue, { ...unknownState, minute: 1140 });
  assert.notEqual(afternoon.ambience, evening.ambience);
  assert.deepEqual(afternoon.beats, evening.beats);
});

test('planning is deterministic, accepts frozen save data and never mutates dialogue or game state', () => {
  const story = stories.find((item) => item.nodeId === 'roommate-first');
  const dialogue = deepFreeze(structuredClone(dialogueFor(story, 0)));
  const state = deepFreeze(structuredClone(unknownState));
  const before = JSON.stringify({ dialogue, state });
  const plan = getScenePlan(dialogue, state);
  assert.equal(JSON.stringify({ dialogue, state }), before);
  const copy = getScenePlan(dialogue, state);
  assert.deepEqual(plan, copy);
  plan.cast.push('chen');
  plan.beats[0].prop = 'none';
  assert.deepEqual(getScenePlan(dialogue, state), copy, 'Returned arrays are not shared with scene templates');
});

test('missing or malformed resumed data gives a serializable fallback rather than crashing', () => {
  for (const dialogue of [null, undefined, false, [], {}, { source: 'episode', nodeId: 'constructor', lines: ['还在这里。'], selected: 999 }, { source: 'event', nodeId: 'selection', stage: 'reaction', selected: -3, lines: ['走回队列。'] }, { source: 'ambient', nodeId: 'li', speakerId: 'constructor', lines: [null, 3, '仍有脚步声。'] }]) {
    const plan = getScenePlan(dialogue, { player: { x: NaN, y: Infinity }, flags: null });
    assert.ok(LOCATIONS.some((location) => location.id === plan.locationId));
    assert.ok(SCENE_PROPS.includes(plan.prop));
    assert.ok(plan.beats.every((beat) => typeof beat.text === 'string' && SCENE_GESTURES.includes(beat.gesture)));
    assert.ok(!plan.cast.includes('constructor'));
    assert.deepEqual(JSON.parse(JSON.stringify(plan)), plan);
  }
});


test('selected player actions and other speaking characters keep their own hands and gestures', () => {
  const paper = stories.find((story) => story.nodeId === 'chen-first');
  const before = getScenePlan(dialogueFor(paper), unknownState);
  const after = getScenePlan(dialogueFor(paper, 0), unknownState);
  assert.equal(before.beats[0].actor, undefined, 'Observing the paper does not reach as the player');
  assert.equal(after.beats[0].actor, 'player');
  assert.equal(after.beats[0].propOwner, 'player');
  const standing = stories.find((story) => story.nodeId === 'standing');
  assert.equal(getScenePlan(dialogueFor(standing, 0), unknownState).beats[0].actor, 'instructor');
  const selection = stories.find((story) => story.nodeId === 'selection');
  const marching = getScenePlan(dialogueFor(selection, 0), unknownState);
  assert.equal(marching.beats[0].actor, 'player');
  assert.equal(marching.beats.at(-1).actor, 'roommate');
});
