import test from 'node:test';
import assert from 'node:assert/strict';
import { AUDIO_SCORES, arrangementForScene, createMusicTransport, createAudio, normalizeAudioSettings } from '../src/audio.mjs';

// Score and transport tests exercise actual production data/timing, independently of browser audio support.
test('day and night scores contain eight distinct bars with room for melody and acoustic accompaniment', () => {
  for (const [name, score] of Object.entries(AUDIO_SCORES)) {
    assert.equal(score.bars, 8, name);
    assert.equal(score.melody.length, 8, name);
    assert.equal(score.chords.length, 8, name);
    assert.ok(new Set(score.melody.map(JSON.stringify)).size >= 6, `${name} must develop beyond a single repeated figure`);
    assert.ok(new Set(score.chords.map(JSON.stringify)).size >= 5);
    const arrangement = arrangementForScene({ minute: name === 'day' ? 900 : 1200 });
    assert.equal(arrangement.beats, 32);
    assert.deepEqual([...new Set(arrangement.events.map(event => event.instrument))].sort(), ['air', 'piano', 'pluck']);
    assert.ok(arrangement.events.every(event => event.beat >= 0 && event.beat < 32 && event.length > 0 && event.midi >= 36 && event.midi <= 84 && event.velocity > 0 && event.velocity <= 1));
    assert.ok(arrangement.events.every((event, index, list) => !index || event.beat >= list[index - 1].beat));
  }
  assert.ok(AUDIO_SCORES.night.bpm < AUDIO_SCORES.day.bpm);
});

test('encounters and the library thin the arrangement; practice and title contain no background notes', () => {
  const campus = arrangementForScene({ mode: 'campus', minute: 900 });
  const encounter = arrangementForScene({ mode: 'encounter', minute: 900 });
  const library = arrangementForScene({ mode: 'campus', minute: 900, locationId: 'library' });
  assert.ok(encounter.events.length < campus.events.length);
  assert.ok(encounter.gain < library.gain && library.gain < campus.gain);
  assert.equal(arrangementForScene({ mode: 'campus', minute: 1139 }).title, AUDIO_SCORES.day.title);
  assert.equal(arrangementForScene({ mode: 'campus', minute: 1140 }).title, AUDIO_SCORES.night.title);
  assert.equal(arrangementForScene({ mode: 'ending', minute: 1000 }).title, AUDIO_SCORES.night.title);
  for (const mode of ['practice', 'title']) {
    const arrangement = arrangementForScene({ mode, minute: 900 });
    assert.equal(arrangement.gain, 0);
    assert.deepEqual(arrangement.events, []);
  }
});

test('music volume is finite and bounded while sound effects and music remain independent preferences', () => {
  assert.deepEqual(normalizeAudioSettings(), { sound: true, music: true, volume: .65 });
  assert.deepEqual(normalizeAudioSettings({ music: false }), { sound: true, music: false, volume: .65 });
  assert.equal(normalizeAudioSettings({ volume: -3 }).volume, 0);
  assert.equal(normalizeAudioSettings({ volume: 9 }).volume, 1);
  assert.equal(normalizeAudioSettings({ volume: NaN }).volume, .65);
  assert.equal(normalizeAudioSettings({ volume: Infinity }).volume, .65);
  assert.equal(normalizeAudioSettings({ sound: false }).music, true);
});

test('look-ahead scheduling emits each score note once across the loop boundary', () => {
  const arrangement = arrangementForScene({ minute: 900 });
  const transport = createMusicTransport();
  transport.start(0, arrangement);
  const duration = arrangement.beats * 60 / arrangement.bpm;
  const notes = [];
  for (let now = 0; now < duration * 2; now += .075) notes.push(...transport.poll(now));
  const firstLoop = notes.filter(note => note.cycle === 0);
  assert.equal(firstLoop.length, arrangement.events.length);
  assert.equal(new Set(firstLoop.map(note => `${note.at}/${note.midi}/${note.instrument}`)).size, firstLoop.length);
  assert.ok(notes.some(note => note.cycle === 1));
  assert.ok(notes.every(note => Number.isFinite(note.at) && note.seconds > 0));
});

test('a delayed scheduler drops old notes and suspend/resume starts with an empty queue', () => {
  const arrangement = arrangementForScene({ minute: 900 });
  const transport = createMusicTransport();
  transport.start(0, arrangement);
  transport.poll(0);
  const afterDelay = transport.poll(600);
  assert.ok(afterDelay.length < 10, 'Returning from inactivity must not replay hundreds of notes');
  assert.ok(afterDelay.every(note => note.at >= 600 && note.at < 600.2));
  transport.stop();
  assert.equal(transport.active, false);
  assert.deepEqual(transport.poll(900), []);
  transport.start(1000, arrangement);
  const resumed = transport.poll(1000);
  assert.ok(resumed.length > 0);
  assert.ok(resumed.every(note => note.at >= 1000 && note.cycle === 0));
});

test('changing scenes preserves musical position without scheduling elapsed notes', () => {
  const transport = createMusicTransport();
  transport.start(0, arrangementForScene({ minute: 900 }));
  transport.poll(0);
  transport.replace(8, arrangementForScene({ mode: 'encounter', minute: 900 }));
  const next = transport.poll(8);
  assert.ok(next.every(note => note.at >= 8));
  transport.replace(9, arrangementForScene({ mode: 'practice', minute: 900 }));
  assert.deepEqual(transport.poll(9), []);
});

// A deliberately small device boundary: verify unlocked/paused state, not synthesis internals.
function audioDevice() {
  const counters = { created: 0, started: 0, stopped: 0, disconnected: 0, closed: 0, timers: new Set() };
  const param = () => ({ value: 0, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {}, cancelScheduledValues() {}, setTargetAtTime() {} });
  const node = () => ({ gain: param(), frequency: param(), detune: param(), pan: param(), Q: param(), threshold: param(), knee: param(), ratio: param(), attack: param(), release: param(), connect() {}, disconnect() { counters.disconnected += 1; }, setPeriodicWave() {}, start() { counters.started += 1; }, stop() { counters.stopped += 1; }, onended: null });
  class Context {
    constructor() { counters.created += 1; this.currentTime = 0; this.state = 'suspended'; this.sampleRate = 1000; this.destination = node(); }
    createGain() { return node(); }
    createDynamicsCompressor() { return node(); }
    createConvolver() { return node(); }
    createBiquadFilter() { return node(); }
    createStereoPanner() { return node(); }
    createOscillator() { return node(); }
    createBufferSource() { return node(); }
    createPeriodicWave() { return {}; }
    createBuffer(channels, length) { const data = Array.from({ length: channels }, () => new Float32Array(length)); return { getChannelData: channel => data[channel] }; }
    async resume() { this.state = 'running'; }
    async suspend() { this.state = 'suspended'; }
    async close() { this.state = 'closed'; counters.closed += 1; }
  }
  return { counters, options: { AudioContext: Context, setInterval: callback => { counters.timers.add(callback); return callback; }, clearInterval: callback => counters.timers.delete(callback) } };
}

test('configuration, scene changes and effects never allocate or unlock audio before a user gesture', async () => {
  const { options, counters } = audioDevice();
  const audio = createAudio(options);
  audio.configure({ sound: true, music: true });
  audio.setScene({ mode: 'campus', minute: 900 });
  audio.step(); audio.click(); audio.cue('recognition');
  assert.equal(counters.created, 0);
  assert.equal(counters.started, 0);
  assert.equal(counters.timers.size, 0);
  assert.equal(await audio.init(), true);
  assert.equal(counters.created, 1);
  assert.equal(counters.timers.size, 1);
  assert.ok(counters.started > 0);
  await audio.dispose();
});

test('music mute keeps effects available, practice silences music, and suspension releases the scheduler', async () => {
  const { options, counters } = audioDevice();
  const audio = createAudio(options);
  audio.setScene({ mode: 'campus', minute: 900 });
  await audio.init();
  audio.configure({ music: false });
  assert.equal(counters.timers.size, 0);
  const beforeClick = counters.started;
  audio.click();
  assert.ok(counters.started > beforeClick, 'Music mute must preserve sound effects');
  audio.configure({ music: true });
  assert.equal(counters.timers.size, 1);
  audio.setScene({ mode: 'practice', minute: 900 });
  assert.equal(counters.timers.size, 0);
  const beforeBeat = counters.started;
  audio.note(470, .07, .16);
  assert.ok(counters.started > beforeBeat, 'Practice beats must still sound');
  await audio.suspend();
  const pausedCount = counters.started;
  audio.setScene({ mode: 'campus', minute: 900 });
  audio.click();
  assert.equal(counters.started, pausedCount);
  assert.equal(counters.timers.size, 0);
  await audio.resume();
  assert.equal(counters.timers.size, 1);
  await audio.resume();
  assert.equal(counters.timers.size, 1, 'Repeated user gestures must not create duplicate timers');
  await audio.dispose();
  assert.equal(counters.closed, 1);
  assert.equal(counters.timers.size, 0);
  assert.ok(counters.disconnected > 0);
  assert.equal(await audio.resume(), false);
});

test('Node or browsers without AudioContext safely ignore every audio operation', async () => {
  const audio = createAudio({ AudioContext: null });
  audio.configure({ sound: true, music: true, volume: 1 });
  audio.setScene({ mode: 'campus', minute: 900 });
  assert.equal(await audio.init(), false);
  audio.note(); audio.step(); audio.click(); audio.cue('recognition');
  await audio.suspend();
  assert.equal(await audio.resume(), false);
  await audio.dispose();
});

test('returning while a previous suspension is unresolved does not restart a silent context or duplicate its queue', async () => {
  const { options, counters } = audioDevice();
  let finishSuspension;
  class DelayedContext extends options.AudioContext {
    suspend() { return new Promise(resolve => { finishSuspension = () => { this.state = 'suspended'; resolve(); }; }); }
  }
  const audio = createAudio({ ...options, AudioContext: DelayedContext });
  audio.setScene({ mode: 'campus', minute: 900 });
  await audio.init();
  const stopping = audio.suspend();
  const returning = audio.resume();
  assert.equal(counters.timers.size, 0, 'Wait for the earlier suspension before resuming');
  finishSuspension();
  await stopping;
  assert.equal(await returning, true);
  assert.equal(counters.timers.size, 1);
  await audio.dispose();
});

test('scene prop and gesture cues use the actual encounter keys, obeying independent effects mute', async () => {
  const { options, counters } = audioDevice();
  const audio = createAudio(options);
  audio.configure({ music: false });
  audio.setScene({ mode: 'encounter', minute: 900 });
  await audio.init();
  for (const name of ['receipt', 'book', 'map', 'notebook', 'hanger', 'bottle', 'tray', 'step', 'clap']) {
    const before = counters.started;
    audio.cue(name);
    assert.ok(counters.started > before, `${name} must have an audible material cue`);
  }
  const beforeSilent = counters.started;
  audio.cue('unknown-prop');
  assert.equal(counters.started, beforeSilent);
  audio.configure({ sound: false });
  audio.cue('clap');
  assert.equal(counters.started, beforeSilent);
  await audio.dispose();
});
