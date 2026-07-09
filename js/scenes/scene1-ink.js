/**
 * Scene1 热区 → Ink knot
 */
const HOTSPOT_KNOTS = {
  sun: 's1_hotspot_sun',
  instructor: 's1_hotspot_instructor',
  ground: 's1_hotspot_ground',
  self: 's1_hotspot_self',
  bggroup: 's1_hotspot_bggroup',
};

export function bindScene1Hotspots(onHotspot) {
  const cv = document.querySelector('#scene1 .scene-canvas');
  if (!cv || cv._inkBound) return;
  cv._inkBound = true;

  cv.onclick = async function (e) {
    e.stopPropagation();
    if (window.__rollProcessingInk) return;

    const el = e.target.closest('[data-el]');
    if (!el) return;

    const name = el.dataset.el;
    const partEl = e.target.closest('[data-part]');
    const part = partEl?.dataset.part;
    let knot = null;

    if (name === 'classmate') {
      knot = part === 'head'
        ? 's1_hotspot_classmate_head'
        : 's1_hotspot_classmate_body';
    } else {
      knot = HOTSPOT_KNOTS[name];
    }

    if (!knot) return;

    window.__rollProcessingInk = true;
    try {
      await onHotspot(knot);
    } finally {
      window.__rollProcessingInk = false;
    }
  };
}
