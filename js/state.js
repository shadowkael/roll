/** 全局游戏状态 */
export const S = {
  tags: { bold: 0, support: 0, quiet: 0 },
  s1Choice: null,
  s2Choice: null,
  s3Choice: null,
  rhythmResult: null,
  clickCounts: {},
  bonds: {},
  timers: [],
};

const STORAGE_KEY = 'roll_military_trial_v1';

export function saveProgress() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      tags: S.tags,
      s1Choice: S.s1Choice,
      s2Choice: S.s2Choice,
      s3Choice: S.s3Choice,
      rhythmResult: S.rhythmResult,
    }));
  } catch (_) { /* ignore quota / private mode */ }
}

export function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (_) {
    return null;
  }
}

export function clearProgress() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (_) { /* ignore */ }
}

export function resetState() {
  S.tags = { bold: 0, support: 0, quiet: 0 };
  S.s1Choice = null;
  S.s2Choice = null;
  S.s3Choice = null;
  S.rhythmResult = null;
  S.clickCounts = {};
}
