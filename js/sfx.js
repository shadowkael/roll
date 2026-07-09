/**
 * Web Audio API 合成音效（无外部音频文件）
 */
export const SFX = {
  ctx: null,
  muted: false,
  ambientNodes: [],
  masterGain: null,

  init() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.35;
    this.masterGain.connect(this.ctx.destination);
  },

  toggle() {
    this.init();
    this.muted = !this.muted;
    const btn = document.getElementById('sound-toggle');
    btn.querySelector('span').className = this.muted ? 'icon-off' : 'icon-on';
    btn.classList.toggle('muted', this.muted);
    if (this.muted) this.stopAllAmbient();
    else this._restoreAmbientForCurrentScene();
  },

  _now() { return this.ctx ? this.ctx.currentTime : 0; },

  _tone(freq, type, attack, decay, vol, dest) {
    if (this.muted || !this.ctx) return;
    const t = this._now();
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol || 0.3, t + (attack || 0.01));
    g.gain.exponentialRampToValueAtTime(0.001, t + (decay || 0.3));
    osc.connect(g);
    g.connect(dest || this.masterGain);
    osc.start(t);
    osc.stop(t + (decay || 0.3) + 0.05);
  },

  _noise(duration, filterFreq, filterType, vol, dest) {
    if (this.muted || !this.ctx) return;
    const t = this._now();
    const sr = this.ctx.sampleRate;
    const len = sr * duration;
    const buf = this.ctx.createBuffer(1, len, sr);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const filt = this.ctx.createBiquadFilter();
    filt.type = filterType || 'lowpass';
    filt.frequency.setValueAtTime(filterFreq || 800, t);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol || 0.08, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + duration);
    src.connect(filt);
    filt.connect(g);
    g.connect(dest || this.masterGain);
    src.start(t);
    src.stop(t + duration + 0.05);
  },

  ding() {
    this.init();
    if (this.muted) return;
    this._tone(1100, 'sine', 0.005, 0.18, 0.12);
    this._tone(1650, 'sine', 0.005, 0.12, 0.06);
  },

  thud() {
    this.init();
    if (this.muted) return;
    this._tone(110, 'sine', 0.01, 0.5, 0.25);
    this._tone(80, 'triangle', 0.005, 0.35, 0.15);
    this._noise(0.08, 200, 'lowpass', 0.06);
  },

  transition() {
    this.init();
    if (this.muted) return;
    const t = this._now();
    const sr = this.ctx.sampleRate;
    const dur = 0.6;
    const len = sr * dur;
    const buf = this.ctx.createBuffer(1, len, sr);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const filt = this.ctx.createBiquadFilter();
    filt.type = 'lowpass';
    filt.frequency.value = 250;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.015, t + 0.15);
    g.gain.linearRampToValueAtTime(0, t + dur);
    src.connect(filt);
    filt.connect(g);
    g.connect(this.masterGain);
    src.start(t);
    src.stop(t + dur + 0.05);
  },

  opening() { this.init(); if (!this.muted) this._startAmbient('opening'); },
  scene1Ambient() { this.init(); this.stopAllAmbient(); if (!this.muted) this._startAmbient('scene1'); },
  scene2Ambient() { this.init(); this.stopAllAmbient(); if (!this.muted) this._startAmbient('scene2'); },
  scene3Ambient() { this.init(); this.stopAllAmbient(); if (!this.muted) this._startAmbient('scene3'); },
  endingAmbient() { this.init(); this.stopAllAmbient(); if (!this.muted) this._startAmbient('ending'); },

  rhythmPerfect() {
    this.init();
    if (this.muted) return;
    this._tone(1320, 'sine', 0.005, 0.2, 0.18);
    this._tone(1760, 'sine', 0.01, 0.15, 0.1);
    this._tone(880, 'triangle', 0.005, 0.12, 0.08);
  },

  rhythmGood() {
    this.init();
    if (this.muted) return;
    this._tone(880, 'sine', 0.005, 0.18, 0.14);
    this._tone(660, 'triangle', 0.008, 0.12, 0.07);
  },

  rhythmMiss() {
    this.init();
    if (this.muted) return;
    this._tone(180, 'sawtooth', 0.01, 0.25, 0.1);
    this._noise(0.12, 300, 'lowpass', 0.06);
  },

  rhythmTick() {
    this.init();
    if (this.muted) return;
    this._tone(600, 'square', 0.002, 0.04, 0.04);
  },

  rhythmPass() {
    this.init();
    if (this.muted) return;
    const t = this._now();
    [523, 659, 784, 1047].forEach((f, i) => {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = f;
      g.gain.setValueAtTime(0, t + i * 0.12);
      g.gain.linearRampToValueAtTime(0.12, t + i * 0.12 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.12 + 0.4);
      osc.connect(g);
      g.connect(this.masterGain);
      osc.start(t + i * 0.12);
      osc.stop(t + i * 0.12 + 0.5);
    });
  },

  rhythmFail() {
    this.init();
    if (this.muted) return;
    this._tone(220, 'sine', 0.02, 0.8, 0.12);
    this._tone(185, 'sine', 0.05, 1.0, 0.08);
  },

  _startAmbient() { /* BGM disabled — interactive SFX only */ },

  stopAllAmbient() {
    this.ambientNodes.forEach(n => { try { n.stop(); } catch (_) { /* ignore */ } });
    this.ambientNodes = [];
  },

  _restoreAmbientForCurrentScene() { /* BGM disabled */ },
};
