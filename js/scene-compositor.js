/**
 * 场景美术合成：BG 底图 + SK 叠层；资产缺失时保留 CSS 线框
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

  canvas.querySelectorAll('.scene-layer').forEach(el => el.remove());

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
    applyLayerStyle(img, layer);
    if (layer.animation === 'sway') img.classList.add('layer-sway');
    canvas.insertBefore(img, canvas.firstChild);
    layerCount++;
  }

  const artMode = hasBg || layerCount > 0;
  canvas.classList.toggle('art-mode', artMode);
  return artMode;
}

function applyLayerStyle(el, layer) {
  el.style.position = 'absolute';
  el.style.zIndex = layer.z ?? 1;
  el.style.pointerEvents = 'none';
  el.style.height = 'auto';
  if (layer.top != null) el.style.top = layer.top;
  if (layer.left != null) el.style.left = layer.left;
  if (layer.right != null) el.style.right = layer.right;
  if (layer.bottom != null) el.style.bottom = layer.bottom;
  if (layer.width != null) el.style.width = layer.width;
  if (layer.opacity != null) el.style.opacity = layer.opacity;
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
