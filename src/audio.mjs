/** Original eight-bar campus score and a gesture-unlocked Web Audio sound engine. */
const clamp = (number, min, max) => Math.min(max, Math.max(min, number));
const finite = (number, fallback) => typeof number === 'number' && Number.isFinite(number) ? number : fallback;
const midiFrequency = (note) => 440 * 2 ** ((note - 69) / 12);
const MODES = new Set(['campus', 'encounter', 'practice', 'ending', 'title']);

// Each melody entry is [beat within bar, MIDI pitch, length in beats, velocity].
// These phrases were composed for this game; there is no sampled or quoted song.
export const AUDIO_SCORES = Object.freeze({
  day: {
    title: '九月的小路', bpm: 76, bars: 8, beatsPerBar: 4,
    chords: [[48, 55, 59, 64], [45, 52, 55, 60], [41, 53, 57, 64], [43, 50, 57, 62], [40, 52, 55, 59], [45, 52, 59, 64], [50, 57, 60, 64], [43, 55, 59, 62]],
    melody: [
      [[.5, 64, .75, .64], [1.5, 67, .5, .55], [2.5, 69, 1, .62]],
      [[0, 72, 1.5, .63], [2, 71, .5, .49], [3, 67, .75, .53]],
      [[.5, 69, 1.25, .58], [2.5, 67, .5, .5], [3.25, 64, .5, .44]],
      [[0, 62, 1, .54], [1.5, 64, .5, .47], [2.5, 67, 1.25, .59]],
      [[.5, 71, .75, .57], [1.5, 74, .5, .5], [2.5, 72, 1.25, .62]],
      [[0, 69, 1.5, .6], [2, 67, .5, .47], [3, 64, .75, .5]],
      [[.5, 65, .75, .55], [1.5, 69, .5, .5], [2.5, 67, 1, .58]],
      [[0, 62, 1, .52], [1.5, 64, .75, .48], [3, 67, .75, .45]],
    ],
  },
  night: {
    title: '灯亮起来以后', bpm: 60, bars: 8, beatsPerBar: 4,
    chords: [[45, 52, 59, 60], [41, 53, 57, 64], [48, 55, 59, 64], [43, 50, 57, 62], [45, 52, 55, 60], [40, 52, 55, 59], [41, 53, 57, 60], [43, 55, 57, 62]],
    melody: [
      [[.5, 64, 1.5, .48], [2.75, 60, .9, .42]],
      [[.25, 62, 1.25, .44], [2.5, 64, 1, .48]],
      [[.5, 67, 1.5, .5], [2.75, 64, 1, .43]],
      [[0, 62, 2, .44]],
      [[.75, 60, 1.25, .44], [2.5, 64, .8, .46]],
      [[.5, 59, 1.5, .4], [2.75, 62, .75, .43]],
      [[0, 60, 1.5, .46], [2.5, 57, 1, .39]],
      [[.5, 59, 1.25, .4], [2.5, 62, 1, .42]],
    ],
  },
});

export function normalizeAudioSettings(value = {}, previous = { sound: true, music: true, volume: .65 }) {
  return {
    sound: typeof value.sound === 'boolean' ? value.sound : previous.sound,
    music: typeof value.music === 'boolean' ? value.music : previous.music,
    volume: typeof value.volume === 'number' && Number.isFinite(value.volume) ? clamp(value.volume, 0, 1) : previous.volume,
  };
}

/** Scene arrangement is pure data so story modes and musical timing can be tested without audio hardware. */
export function arrangementForScene({ mode = 'campus', minute = 920, locationId = '' } = {}) {
  mode = MODES.has(mode) ? mode : 'campus';
  const night = finite(minute, 920) >= 1140 || finite(minute, 920) < 420;
  const mood = night || mode === 'ending' ? 'night' : 'day';
  const score = AUDIO_SCORES[mood];
  const quiet = mode === 'encounter' || locationId === 'library';
  const silent = mode === 'practice' || mode === 'title';
  const events = [];
  for (let bar = 0; bar < score.bars; bar += 1) {
    const beat = bar * score.beatsPerBar;
    const chord = score.chords[bar];
    score.melody[bar].forEach(([offset, midi, length, velocity], index) => {
      if (quiet && index % 2 === 1) return;
      events.push({ beat: beat + offset, midi, length, velocity: velocity * (quiet ? .8 : 1), instrument: 'piano', pan: -.12 });
    });
    // A low root and open voicings leave space around the single melody.
    events.push({ beat, midi: chord[0], length: 2.8, velocity: night ? .32 : .38, instrument: 'piano', pan: -.2 });
    for (const midi of chord.slice(1)) events.push({ beat: beat + .06, midi, length: 4.3, velocity: quiet ? .11 : .15, instrument: 'air', pan: .08 });
    const plucks = quiet ? [[2.25, chord[2]]] : night ? [[1.5, chord[1]], [3, chord[3]]] : [[.75, chord[1]], [2, chord[2]], [3.25, chord[3]]];
    for (const [offset, midi] of plucks) events.push({ beat: beat + offset, midi, length: .9, velocity: night ? .23 : .29, instrument: 'pluck', pan: .28 });
  }
  events.sort((a, b) => a.beat - b.beat || a.midi - b.midi);
  return {
    key: `${mode}/${mood}/${quiet ? 'quiet' : 'open'}`,
    title: score.title, bpm: score.bpm, beats: score.bars * score.beatsPerBar,
    gain: silent ? 0 : mode === 'encounter' ? .38 : mode === 'ending' ? .64 : locationId === 'library' ? .64 : night ? .74 : 1,
    events: silent ? [] : events,
  };
}

/** A bounded look-ahead transport. A late scheduler skips elapsed notes instead of replaying a backlog. */
export function createMusicTransport({ lookAhead = .2, lead = .035 } = {}) {
  let arrangement = null, origin = 0, cursor = 0, active = false;
  function start(now, next) {
    arrangement = next; origin = now + lead; cursor = origin; active = true;
  }
  function replace(now, next) {
    if (!active || !arrangement) return start(now, next);
    const beat = Math.max(0, (now - origin) * arrangement.bpm / 60);
    origin = now - beat * 60 / next.bpm;
    arrangement = next; cursor = now + lead;
  }
  function poll(now) {
    if (!active || !arrangement?.events.length || !Number.isFinite(now)) return [];
    const until = now + lookAhead;
    const from = Math.max(cursor, now); // Never enqueue notes with timestamps in the past.
    if (until <= from) return [];
    const secondsPerBeat = 60 / arrangement.bpm;
    const loop = arrangement.beats * secondsPerBeat;
    const notes = [];
    const firstCycle = Math.max(0, Math.floor((from - origin) / loop));
    const lastCycle = Math.max(firstCycle, Math.floor((until - origin) / loop));
    for (let cycle = firstCycle; cycle <= lastCycle; cycle += 1) {
      for (const event of arrangement.events) {
        const at = origin + cycle * loop + event.beat * secondsPerBeat;
        if (at >= from - 1e-9 && at < until - 1e-9) notes.push({ ...event, at, seconds: event.length * secondsPerBeat, cycle });
      }
    }
    cursor = until;
    return notes;
  }
  return { start, replace, poll, stop: () => { active = false; arrangement = null; }, get active() { return active; } };
}

/** No context is allocated until init/resume is called by a user gesture. All other methods remain locked. */
export function createAudio({ AudioContext: Context = globalThis.AudioContext || globalThis.webkitAudioContext, setInterval: every = globalThis.setInterval, clearInterval: cancel = globalThis.clearInterval } = {}) {
  let context = null, master = null, musicBus = null, musicVolume = null, sfxBus = null;
  let pianoWave = null, pluckWave = null, hammer = null, texture = null;
  let settings = normalizeAudioSettings(), scene = { mode: 'title', minute: 920, locationId: '' };
  let arrangement = arrangementForScene(scene), timer = null, running = false, disposed = false, generation = 0, suspension = null;
  const transport = createMusicTransport();
  const voices = new Set(), graph = new Set();
  const track = (node) => { graph.add(node); return node; };
  const active = () => !disposed && running && context?.state === 'running';
  const wantsMusic = () => settings.music && settings.volume > 0 && arrangement.gain > 0;

  function automate(parameter, value, seconds = .18) {
    if (!context || !parameter) return;
    const now = context.currentTime;
    parameter.cancelScheduledValues(now);
    parameter.setTargetAtTime(value, now, seconds);
  }
  function makeWave(power, softness) {
    const real = new Float32Array(24), imag = new Float32Array(24);
    for (let harmonic = 1; harmonic < imag.length; harmonic += 1) imag[harmonic] = (harmonic % 2 ? 1 : softness) / harmonic ** power;
    return context.createPeriodicWave(real, imag, { disableNormalization: false });
  }
  function createGraph() {
    master = track(context.createGain()); master.gain.value = .85;
    const limiter = track(context.createDynamicsCompressor());
    limiter.threshold.value = -12; limiter.knee.value = 18; limiter.ratio.value = 3; limiter.attack.value = .012; limiter.release.value = .24;
    master.connect(limiter); limiter.connect(context.destination);
    musicBus = track(context.createGain());
    musicVolume = track(context.createGain()); musicVolume.gain.value = 0;
    const dry = track(context.createGain()); dry.gain.value = .82;
    const wet = track(context.createGain()); wet.gain.value = .22;
    const reverb = track(context.createConvolver());
    const impulse = context.createBuffer(2, Math.ceil(context.sampleRate * 1.45), context.sampleRate);
    let seed = 9383;
    for (let channel = 0; channel < 2; channel += 1) {
      const data = impulse.getChannelData(channel);
      let filtered = 0;
      for (let index = 0; index < data.length; index += 1) {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        filtered = filtered * .55 + ((seed / 4294967296) * 2 - 1) * .45;
        const envelope = (1 - index / data.length) ** 3;
        data[index] = filtered * envelope * (index < context.sampleRate * .018 ? 0 : 1);
      }
    }
    reverb.buffer = impulse;
    musicBus.connect(dry); dry.connect(musicVolume);
    musicBus.connect(reverb); reverb.connect(wet); wet.connect(musicVolume);
    musicVolume.connect(master);
    sfxBus = track(context.createGain()); sfxBus.gain.value = .18; sfxBus.connect(master);
    pianoWave = makeWave(1.75, .72); pluckWave = makeWave(1.35, .38);
    hammer = context.createBuffer(1, Math.ceil(context.sampleRate * .026), context.sampleRate);
    const data = hammer.getChannelData(0);
    for (let index = 0; index < data.length; index += 1) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      data[index] = ((seed / 4294967296) * 2 - 1) * (1 - index / data.length) ** 5;
    }
    texture = context.createBuffer(1, Math.ceil(context.sampleRate * .3), context.sampleRate);
    const surface = texture.getChannelData(0);
    for (let index = 0; index < surface.length; index += 1) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      surface[index] = (seed / 4294967296) * 2 - 1;
    }
  }

  function makeVoice({ at, duration, peak, bus, category, frequency, instrument = 'effect', kind = 'sine', pan = 0 }) {
    if (!active() || voices.size >= 72) return;
    const envelope = context.createGain(), filter = context.createBiquadFilter();
    const panner = context.createStereoPanner(); panner.pan.value = pan;
    const nodes = [envelope, filter, panner], sources = [];
    const isAir = instrument === 'air';
    const release = isAir ? .9 : instrument === 'piano' ? .8 : .14;
    const end = at + duration + release;
    filter.type = 'lowpass'; filter.Q.value = .35;
    filter.frequency.setValueAtTime(isAir ? 900 : instrument === 'piano' ? 3900 : 2400, at);
    filter.frequency.exponentialRampToValueAtTime(isAir ? 680 : instrument === 'piano' ? 1050 : 520, at + Math.min(duration, .65));
    envelope.gain.setValueAtTime(.0001, at);
    if (isAir) {
      envelope.gain.linearRampToValueAtTime(peak, at + Math.min(.9, duration * .3));
      envelope.gain.linearRampToValueAtTime(peak * .8, at + duration);
      envelope.gain.exponentialRampToValueAtTime(.0001, end);
    } else {
      envelope.gain.linearRampToValueAtTime(peak, at + .009);
      envelope.gain.exponentialRampToValueAtTime(Math.max(.00012, peak * .2), at + Math.min(.42, duration * .6));
      envelope.gain.exponentialRampToValueAtTime(.0001, end);
    }
    filter.connect(envelope); envelope.connect(panner); panner.connect(bus);
    const voice = { category, sources, nodes, at, stopped: false };
    let remaining = 0;
    function finished() {
      remaining -= 1;
      if (remaining > 0) return;
      voices.delete(voice);
      for (const node of nodes) { try { node.disconnect(); } catch { /* Already detached during dispose. */ } }
      for (const source of sources) { source.onended = null; try { source.disconnect(); } catch { /* Already detached. */ } }
    }
    function oscillator(detune = 0, relative = 1) {
      const source = context.createOscillator(); source.frequency.value = frequency; source.detune.value = detune;
      if (instrument === 'piano') source.setPeriodicWave(pianoWave);
      else if (instrument === 'pluck') source.setPeriodicWave(pluckWave);
      else source.type = isAir ? 'sine' : kind;
      const level = context.createGain(); level.gain.value = relative; nodes.push(level);
      source.connect(level); level.connect(filter); sources.push(source); remaining += 1;
      source.onended = finished; source.start(at); source.stop(end + .015);
    }
    if (isAir) { oscillator(-3.3, .5); oscillator(3.3, .5); }
    else oscillator(0, 1);
    if (instrument === 'piano' && frequency > 150) {
      const source = context.createBufferSource(), level = context.createGain();
      source.buffer = hammer; level.gain.value = .12;
      source.connect(level); level.connect(filter); nodes.push(level); sources.push(source); remaining += 1;
      source.onended = finished; source.start(at); source.stop(at + .03);
    }
    voices.add(voice);
  }
  function stopVoices(category = null, futureOnly = false) {
    if (!context) return;
    for (const voice of [...voices]) {
      if (category && voice.category !== category) continue;
      if (futureOnly && voice.at <= context.currentTime) continue;
      if (voice.stopped) continue;
      voice.stopped = true;
      for (const source of voice.sources) { try { source.stop(context.currentTime); } catch { /* A finished voice is already silent. */ } }
      // Disconnect now, including future scheduled notes, instead of waiting for suspended onended callbacks.
      for (const node of voice.nodes) { try { node.disconnect(); } catch { /* Already detached. */ } }
      for (const source of voice.sources) { source.onended = null; try { source.disconnect(); } catch { /* Already detached. */ } }
      voices.delete(voice);
    }
  }
  function schedule() {
    if (!active() || !wantsMusic()) return;
    for (const event of transport.poll(context.currentTime)) {
      makeVoice({ at: event.at, duration: Math.min(event.seconds, 5.2), peak: event.velocity * (event.instrument === 'air' ? .095 : event.instrument === 'pluck' ? .12 : .2), bus: musicBus, category: 'music', frequency: midiFrequency(event.midi), instrument: event.instrument, pan: event.pan });
    }
  }
  function stopTimer() { if (timer !== null) { cancel(timer); timer = null; } transport.stop(); }
  function refreshMusic(replace = false) {
    if (!context) return;
    const gain = wantsMusic() ? settings.volume * arrangement.gain * .62 : 0;
    automate(musicVolume.gain, gain, arrangement.gain === 0 ? .012 : .22);
    if (!active() || !wantsMusic()) { stopTimer(); stopVoices('music'); return; }
    // Existing notes ring out across scene changes; only the short future queue is replaced.
    if (replace) { stopVoices('music', true); transport.replace(context.currentTime, arrangement); }
    else if (!transport.active) transport.start(context.currentTime, arrangement);
    if (timer === null) timer = every(schedule, 75);
    schedule();
  }
  function configure(next = {}) {
    const soundBefore = settings.sound;
    settings = normalizeAudioSettings(next, settings);
    if (soundBefore && !settings.sound) stopVoices('effect');
    refreshMusic();
  }
  function setScene(next = {}) {
    scene = { ...scene, ...next };
    const mode = MODES.has(scene.mode) ? scene.mode : 'campus';
    const night = finite(scene.minute, 920) >= 1140 || finite(scene.minute, 920) < 420;
    const key = `${mode}/${night || mode === 'ending' ? 'night' : 'day'}/${mode === 'encounter' || scene.locationId === 'library' ? 'quiet' : 'open'}`;
    if (key === arrangement.key) return;
    const changed = arrangementForScene(scene);
    const replace = changed.key !== arrangement.key;
    arrangement = changed;
    if (replace) refreshMusic(true);
  }
  async function resume() {
    if (disposed || !Context) return false;
    const ticket = ++generation;
    try {
      if (!context) { context = new Context({ latencyHint: 'interactive' }); createGraph(); }
      if (suspension) await suspension;
      if (disposed || ticket !== generation) return false;
      if (context.state === 'closed') return false;
      if (context.state !== 'running') await context.resume();
      if (disposed || ticket !== generation || context.state !== 'running') return false;
      running = true; refreshMusic(); return true;
    } catch { running = false; stopTimer(); return false; }
  }
  function suspend() {
    generation += 1; running = false; stopTimer(); stopVoices();
    if (!context || context.state === 'closed') return;
    musicVolume.gain.cancelScheduledValues(context.currentTime); musicVolume.gain.value = 0;
    const pending = context.suspend().catch(() => {});
    suspension = pending;
    pending.finally(() => { if (suspension === pending) suspension = null; });
    return pending;
  }
  function note(frequency = 550, length = .08, volume = .11, kind = 'sine') {
    if (!settings.sound || !active() || scene.mode === 'title') return;
    const level = clamp(finite(volume, .11), 0, 1);
    if (level <= 0) return;
    makeVoice({ at: context.currentTime + .003, duration: clamp(finite(length, .08), .025, 2.5), peak: level, bus: sfxBus, category: 'effect', frequency: clamp(finite(frequency, 550), 35, 5000), kind: ['sine', 'triangle', 'square', 'sawtooth'].includes(kind) ? kind : 'sine' });
  }
  function surfaceSound({ delay = 0, length = .13, volume = .12, frequency = 1500, q = .6 } = {}) {
    if (!settings.sound || !active() || scene.mode === 'title' || voices.size >= 72) return;
    const at = context.currentTime + .004 + delay, end = at + length;
    const source = context.createBufferSource(), filter = context.createBiquadFilter(), envelope = context.createGain();
    source.buffer = texture; filter.type = 'bandpass'; filter.frequency.value = frequency; filter.Q.value = q;
    envelope.gain.setValueAtTime(.0001, at);
    envelope.gain.linearRampToValueAtTime(volume, at + Math.min(.02, length * .2));
    envelope.gain.exponentialRampToValueAtTime(.0001, end);
    source.connect(filter); filter.connect(envelope); envelope.connect(sfxBus);
    const voice = { category: 'effect', at, sources: [source], nodes: [filter, envelope], stopped: false };
    voices.add(voice);
    source.onended = () => {
      voices.delete(voice); source.onended = null;
      for (const node of [source, filter, envelope]) { try { node.disconnect(); } catch { /* Already stopped. */ } }
    };
    source.start(at); source.stop(end + .01);
  }
  function cue(name) {
    if (!settings.sound || !active() || scene.mode === 'title') return;
    // Small scene sounds use filtered material textures, not musical fanfares on every line.
    if (['paper', 'receipt', 'book', 'map', 'notebook', 'bottle-note'].includes(name)) {
      surfaceSound({ length: .17, volume: .11, frequency: 1850, q: .45 }); return;
    }
    if (name === 'write') { surfaceSound({ length: .1, volume: .065, frequency: 2250, q: .8 }); return; }
    if (['uniform', 'fold', 'cap'].includes(name)) { surfaceSound({ length: .19, volume: .095, frequency: 700, q: .45 }); return; }
    if (['step', 'shoes'].includes(name)) { note(92, .04, .075, 'triangle'); surfaceSound({ length: .055, volume: .055, frequency: 460 }); return; }
    if (name === 'clap') { surfaceSound({ length: .052, volume: .2, frequency: 1350, q: .45 }); surfaceSound({ delay: .018, length: .085, volume: .1, frequency: 2100, q: .45 }); return; }
    const contact = ['bottle', 'tray', 'cup', 'water-bucket'].includes(name) ? [1047, 1568, 2217] : ['hanger', 'cap-buckle'].includes(name) ? [410, 735] : null;
    if (contact) {
      contact.forEach((frequency, index) => makeVoice({ at: context.currentTime + .005 + index * .008, duration: .055 + index * .025, peak: .1 / (index + 1), bus: sfxBus, category: 'effect', frequency, kind: 'sine', pan: .05 }));
      return;
    }
    const notes = { recognition: [64, 67, 72], memory: [67, 72], morning: [60, 64, 67], evening: [64, 60], event: [67, 62], complete: [60, 64, 67, 72] }[name];
    if (!notes) return;
    notes.forEach((midi, index) => makeVoice({ at: context.currentTime + .02 + index * .13, duration: .48, peak: .09, bus: sfxBus, category: 'effect', frequency: midiFrequency(midi), instrument: 'piano', pan: 0 }));
  }
  async function dispose() {
    if (disposed) return;
    disposed = true; generation += 1; running = false; stopTimer(); stopVoices();
    for (const node of graph) { try { node.disconnect(); } catch { /* Already detached. */ } }
    graph.clear();
    if (context && context.state !== 'closed') { try { await context.close(); } catch { /* Browsers may already have closed the page context. */ } }
    context = null; hammer = null; texture = null; pianoWave = null; pluckWave = null;
  }
  return { init: resume, configure, setScene, note, step: () => note(92, .04, .075, 'triangle'), click: () => note(660, .07, .15), cue, suspend, resume, dispose };
}
