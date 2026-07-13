/**
 * Scene3 热区 → Ink knot
 */
const HOTSPOT_KNOTS = {
  inst3: 's3_hotspot_inst3',
  self3: 's3_hotspot_self3',
  room3: 's3_hotspot_room3',
};

export function bindScene3Hotspots(onHotspot) {
  const cv = document.querySelector('#scene3 .scene-canvas');
  if (!cv || cv._inkBound) return;
  cv._inkBound = true;

  cv.onclick = async function (e) {
    e.stopPropagation();
    if (window.__rollProcessingInk) return;
    const el = e.target.closest('[data-el]');
    if (!el) return;
    const knot = HOTSPOT_KNOTS[el.dataset.el];
    if (!knot) return;
    window.__rollProcessingInk = true;
    try {
      await onHotspot(knot);
    } finally {
      window.__rollProcessingInk = false;
    }
  };
}
