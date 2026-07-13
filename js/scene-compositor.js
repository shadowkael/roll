/**
 * 场景美术合成：BG 底图 + SK 叠层 + JSON 热区；资产缺失时保留 CSS 线框
 */

const _loaded = new Map();

function assetUrl(path) {
  return new URL(path, document.baseURI || window.location.href).href;
}

export function probeImage(src) {
  if (_loaded.has(src)) return Promise.resolve(_loaded.get(src));
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => { _loaded.set(src, true); resolve(true); };
    img.onerror = () => { _loaded.set(src, false); resolve(false); };
    img.src = assetUrl(src);
  });
}

export async function mountSceneArt(sceneId) {
  const canvas = document.querySelector(`#${sceneId} .scene-canvas`);
  if (!canvas) return false;

  let cfg;
  try {
    const res = await fetch(`assets/hotspots/${sceneId}.json`);
    if (!res.ok) return false;
    cfg = await res.json();
  } catch {
    return false;
  }

  canvas.querySelectorAll('.scene-layer, .scene-hotspot').forEach(el => el.remove());

  let hasBg = false;
  if (cfg.base) {
    hasBg = await probeImage(cfg.base);
    if (hasBg) {
      canvas.style.backgroundImage = `url(${cfg.base})`;
      canvas.style.backgroundSize = 'cover';
      canvas.style.backgroundPosition = 'center center';
    }
  }

  let layerCount = 0;
  for (const layer of cfg.layers || []) {
    if (!layer.src || !(await probeImage(layer.src))) continue;
    const img = document.createElement('img');
    img.className = `scene-layer scene-layer-${layer.id}`;
    img.src = layer.src;
    img.alt = '';
    img.draggable = false;
    applyBoxStyle(img, layer);
    if (layer.animation === 'sway') img.classList.add('layer-sway');
    canvas.insertBefore(img, canvas.firstChild);
    layerCount++;
  }

  const artMode = hasBg || layerCount > 0;
  canvas.classList.toggle('art-mode', artMode);
  if (artMode) {
    applyHotspots(canvas, cfg.hotspots);
    if (new URLSearchParams(location.search).has('debugHotspots')) {
      canvas.classList.add('debug-hotspots');
    }
  }
  return artMode;
}

function applyBoxStyle(el, box) {
  el.style.position = 'absolute';
  el.style.zIndex = String(box.z ?? 1);
  el.style.pointerEvents = 'none';
  el.style.height = 'auto';
  el.style.top = box.top != null ? box.top : '';
  el.style.left = box.left != null ? box.left : '';
  el.style.right = box.right != null ? box.right : '';
  el.style.bottom = box.bottom != null ? box.bottom : '';
  if (box.width != null) el.style.width = box.width;
  if (box.height != null) el.style.height = box.height;
  if (box.opacity != null) el.style.opacity = String(box.opacity);
}

/** Invisible hit targets from hotspots JSON — source of truth in art mode. */
function applyHotspots(canvas, hotspots) {
  canvas.querySelectorAll('[data-el]:not(.scene-hotspot)').forEach(el => {
    el.style.pointerEvents = 'none';
  });

  for (const hs of hotspots || []) {
    if (!hs.el) continue;
    const box = document.createElement('div');
    box.className = 'scene-hotspot clickable';
    box.dataset.el = hs.el;
    if (hs.part) box.dataset.part = hs.part;
    box.setAttribute('aria-hidden', 'true');
    applyBoxStyle(box, { ...hs, z: hs.z ?? 30 });
    box.style.pointerEvents = 'auto';
    box.style.height = hs.height || 'auto';
    canvas.appendChild(box);
  }
}

export async function getAssetStatus() {
  try {
    const res = await fetch('assets/asset-manifest.json');
    if (!res.ok) return [];
    const data = await res.json();
    const out = [];
    for (const item of data.assets || []) {
      out.push({ ...item, exists: await probeImage(item.file) });
    }
    return out;
  } catch {
    return [];
  }
}
