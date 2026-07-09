import { addTimer } from './engine.js';

/** 打字机旁白 + 点击跳过 */
export const NarSeq = {
  queue: [],
  running: false,
  typingTimer: null,
  skipRequested: false,
  onComplete: null,

  start(items, onComplete) {
    this.queue = items.slice();
    this.onComplete = onComplete;
    this.running = true;
    this._processNext();
  },

  stop() {
    if (this.typingTimer) {
      clearInterval(this.typingTimer);
      this.typingTimer = null;
    }
    this.running = false;
    this.queue = [];
  },

  _processNext() {
    if (!this.running || this.queue.length === 0) {
      this.running = false;
      if (this.onComplete) {
        const cb = this.onComplete;
        this.onComplete = null;
        cb();
      }
      return;
    }
    const { sceneId, text } = this.queue.shift();
    let n;

    if (sceneId === 'opening') {
      const el = document.getElementById('opening-screen');
      n = document.createElement('p');
      el.appendChild(n);
      this._typewrite(n, text, () => addTimer(() => this._processNext(), 1000), true);
    } else if (sceneId === 'transition') {
      const el = document.getElementById('transition-screen');
      n = document.createElement('p');
      el.appendChild(n);
      this._typewrite(n, text, () => addTimer(() => this._processNext(), 1000), true);
    } else {
      n = document.getElementById('nar' + sceneId);
      if (!n) {
        this._processNext();
        return;
      }
      this._typewrite(n, text, () => addTimer(() => this._processNext(), 1000), false);
    }
  },

  _typewrite(el, text, onDone) {
    el.textContent = '';
    el.classList.add('show');
    this.skipRequested = false;
    let i = 0;
    const self = this;

    const clickHandler = (e) => {
      if (e.target.closest('.choices') || e.target.closest('#sound-toggle') || e.target.closest('#rhythm-game')) return;
      self.skipRequested = true;
    };

    setTimeout(() => document.addEventListener('click', clickHandler), 100);

    const cleanup = () => {
      if (this.typingTimer) {
        clearInterval(this.typingTimer);
        this.typingTimer = null;
      }
      document.removeEventListener('click', clickHandler);
    };

    this.typingTimer = setInterval(() => {
      if (this.skipRequested || i >= text.length) {
        cleanup();
        el.textContent = text;
        onDone();
      } else {
        el.textContent += text[i];
        i++;
      }
    }, 60);
  },
};
