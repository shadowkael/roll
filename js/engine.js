import { S } from './state.js';

let stopNarration = () => {};

export function registerNarrationStopper(fn) {
  stopNarration = fn;
}

export function addTimer(fn, ms) {
  const t = setTimeout(fn, ms);
  S.timers.push(t);
  return t;
}

export function clearTimers() {
  S.timers.forEach(t => clearTimeout(t));
  S.timers = [];
  stopNarration();
}
