/**
 * Scene2 热区 → Ink knot
 */
const HOTSPOT_KNOTS = {
  leader: 's2_hotspot_leader',
  tallguy: 's2_hotspot_tallguy',
  enemy: 's2_hotspot_enemy',
  self2: 's2_hotspot_self2',
  roommate2: 's2_hotspot_roommate2',
};

export function bindScene2Hotspots(onHotspot) {
  const cv = document.querySelector('#scene2 .scene-canvas');
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
