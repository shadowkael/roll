import { initOrientation } from './orientation.js';
import { registerNarrationStopper } from './engine.js';
import { NarSeq } from './narration.js';
import { SFX } from './sfx.js';
import { startGame } from './ink-game.js';

registerNarrationStopper(() => NarSeq.stop());

function bindUI() {
  document.getElementById('start-btn').addEventListener('click', () => startGame());
  document.getElementById('sound-toggle').addEventListener('click', () => SFX.toggle());
}

initOrientation();
bindUI();
