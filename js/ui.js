import { ES_IMAGES, ES_IMAGES_LEGACY } from './images.js';
import { addTimer } from './engine.js';
import { SFX } from './sfx.js';

let _exploreInterval = null;

export function showScreen(id) {
  document.querySelectorAll('.scene').forEach(s => {
    s.classList.remove('active');
    s.style.opacity = 0;
  });
  const el = document.getElementById(id);
  el.classList.add('active');
  setTimeout(() => { el.style.opacity = 1; }, 20);
}

export function switchScene(id, cb) {
  SFX.transition();
  const cur = document.querySelector('.scene.active');
  if (cur) {
    cur.style.opacity = 0;
    addTimer(() => {
      cur.classList.remove('active');
      showScreen(id);
      if (cb) cb();
    }, 600);
  } else {
    showScreen(id);
    if (cb) cb();
  }
}

export function showEstablishingShot(imageKey, title, duration, callback) {
  const es = document.getElementById('establishing-shot');
  const img = document.getElementById('es-img');
  const ttl = document.getElementById('es-title');
  const primary = ES_IMAGES[imageKey] || '';
  const fallback = ES_IMAGES_LEGACY[imageKey] || '';
  img.onerror = () => {
    if (fallback && !img.src.endsWith(fallback.split('/').pop())) {
      img.src = fallback;
    }
  };
  img.src = primary;
  ttl.textContent = title || '';
  requestAnimationFrame(() => es.classList.add('show'));
  addTimer(() => {
    es.classList.remove('show');
    addTimer(() => { if (callback) callback(); }, 1000);
  }, duration || 3000);
}

export function showBubble(sceneId, text, x, y) {
  SFX.ding();
  const b = document.getElementById('bubble' + sceneId);
  b.textContent = text;
  b.style.left = Math.min(Math.max(x || '50%', '10%'), '75%');
  b.style.top = y || '30%';
  b.classList.add('show');
  addTimer(() => b.classList.remove('show'), 2800);
}

export function showChoices(sceneId, options, onPick) {
  hideExploreHint();
  const c = document.getElementById('choices' + sceneId);
  c.innerHTML = '';
  options.forEach((opt, i) => {
    const btn = document.createElement('button');
    btn.textContent = opt;
    btn.onmouseenter = () => SFX.ding();
    btn.onclick = () => {
      SFX.thud();
      c.classList.remove('show');
      addTimer(() => { c.innerHTML = ''; }, 400);
      onPick(i);
    };
    c.appendChild(btn);
  });
  addTimer(() => c.classList.add('show'), 300);
}

export function showExploreHint(seconds) {
  hideExploreHint();
  const hint = document.getElementById('explore-hint');
  const cd = hint.querySelector('.hint-countdown');
  let remaining = seconds;
  cd.textContent = remaining + 's';
  hint.classList.add('show');
  hint.classList.remove('fade-out');
  _exploreInterval = setInterval(() => {
    remaining--;
    if (remaining <= 0) hideExploreHint();
    else cd.textContent = remaining + 's';
  }, 1000);
}

export function hideExploreHint() {
  if (_exploreInterval) {
    clearInterval(_exploreInterval);
    _exploreInterval = null;
  }
  const hint = document.getElementById('explore-hint');
  hint.classList.remove('show');
  hint.classList.add('fade-out');
}

export function addLine(container, text, cls, delay) {
  const p = document.createElement('p');
  p.className = cls;
  p.textContent = text;
  container.appendChild(p);
  addTimer(() => p.classList.add('show'), delay);
}
