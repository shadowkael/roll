import { createGame, INTERACTION_RADIUS } from './simulation.mjs';
import { LOCATIONS, CHARACTERS, DAYS, EVENTS } from './content.mjs';
import { createWorldRenderer, findPath, isWalkable } from './world.mjs';
import { createSceneRenderer } from './cinematic.mjs';
import { getScenePlan } from './scene-content.mjs';
import { createAudio } from './audio.mjs';

const $ = (selector) => document.querySelector(selector);
const escape = (value = '') => String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const time = (minute) => `${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(Math.floor(minute % 60)).padStart(2, '0')}`;
const dates = ['一', '二', '三', '四', '五'];
const stageNames = ['还未熟悉', '记住了一点', '开始认识', '有了具体的样子'];
const portraits = { li: '0% 0%', chen: '100% 0%', roommate: '0% 100%', instructor: '100% 100%' };
const SAVE_KEY = 'nage-shui.campus.v1';
const SETTINGS_KEY = 'nage-shui.settings.v1';
const icons = {
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 11h18m-13 4h2m4 0h2"/>',
  book: '<path d="M12 5c-3-2-6-2-9-1v15c3-1 6-1 9 1 3-2 6-2 9-1V4c-3-1-6-1-9 1v15M6 8h3m-3 4h3m6-4h3m-3 4h3"/>',
  'sound-off': '<path d="M11 4 6 8H3v8h3l5 4zm5 5 5 6m0-6-5 6"/>',
  sound: '<path d="M11 4 6 8H3v8h3l5 4zm5 4a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>',
  settings: '<path d="m10 3-1 3-3 1-2-1-2 4 2 2v3l-1 2 3 3 3-1 3 1 1 2h4l1-3 3-1 1-3-2-2v-3l1-2-3-3-3 1-3-1z" transform="translate(1 -1) scale(.92)"/><circle cx="12" cy="12" r="3"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/>',
  moon: '<path d="M19 15A8 8 0 0 1 9 5a8 8 0 1 0 10 10Z"/>',
  'arrow-right': '<path d="M4 12h15m-5-5 5 5-5 5"/>',
  footsteps: '<ellipse cx="8" cy="8" rx="2.5" ry="5" transform="rotate(-20 8 8)"/><ellipse cx="16" cy="14" rx="2.5" ry="5" transform="rotate(20 16 14)"/>',
  locate: '<circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3"/>',
  map: '<path d="m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2Zm6-2v16m6-14v16"/>',
  talk: '<path d="M21 11a8 8 0 0 1-9 8H7l-5 3 2-6a8 8 0 1 1 17-5Z"/><path d="M8 11h1m3 0h1m3 0h1"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>',
};
const icon = (name) => `<svg class="icon" aria-hidden="true" viewBox="0 0 24 24">${icons[name] || icons.book}</svg>`;
function paintIcons(root = document) { root.querySelectorAll('[data-icon]').forEach((el) => { el.innerHTML = icon(el.dataset.icon); }); }

let saved = null, storageAvailable = true;
try { saved = localStorage.getItem(SAVE_KEY); } catch { storageAvailable = false; }
let game = createGame(saved);
let settings = { sound: true, music: true, musicVolume: .35, speed: 1, reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches };
try {
  const stored = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
  settings = { ...settings, sound: typeof stored.sound === 'boolean' ? stored.sound : true,
    music: typeof stored.music === 'boolean' ? stored.music : stored.sound !== false,
    musicVolume: Number.isFinite(stored.musicVolume) ? Math.max(0, Math.min(1, stored.musicVolume)) : .35,
    speed: [1, 2, 4].includes(stored.speed) ? stored.speed : 1,
    reducedMotion: typeof stored.reducedMotion === 'boolean' ? stored.reducedMotion : settings.reducedMotion };
} catch { /* Keep defaults if storage is not available. */ }

let titleVisible = true, overlay = null, journalTab = 'people', scheduleDay = game.state.day;
let route = [], destination = null, pendingInteraction = null, hoverId = null;
let seenNotifications = new Set(), toastUntil = 0, uiSignature = '', dialogueSignature = '';
let seenMemories = game.state.memories.length, lastSavedAt = 0, lastFrame = performance.now();
let rhythm = null, lastFootstep = 0, audioStarted = false;
let encounter = null, sceneRenderer = null;
const keys = new Set();
const canvas = $('#campus');
const world = createWorldRenderer(canvas);
const audio = createAudio();
audio.configure({ sound: settings.sound, music: settings.music, volume: settings.musicVolume });
paintIcons();
renderTitle();
updateUI(true);
requestAnimationFrame(frame);


function save() {
  try { localStorage.setItem(SAVE_KEY, game.serialize()); saved = game.serialize(); storageAvailable = true; }
  catch { if (storageAvailable) toast('浏览器暂时无法保存。请保持这个页面打开，继续这一段生活。'); storageAvailable = false; }
}
function saveSettings() { try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch { /* Settings remain usable in memory. */ } }
function paused() { return titleVisible || Boolean(overlay) || Boolean(game.state.dialogue) || Boolean(rhythm) || game.state.ending || document.hidden; }
function toast(text) { const el = $('#notification'); el.textContent = text; el.classList.add('visible'); toastUntil = performance.now() + 6000; }
function nameOf(id) { return game.state.relationships[id]?.knownName ? CHARACTERS[id]?.name : CHARACTERS[id]?.unknownName || '九月'; }
function portrait(id, customClass = '') {
  if (!portraits[id]) return '';
  const clarity = game.state.relationships[id]?.clarity || 0;
  return `<div class="portrait ${customClass}" role="img" aria-label="${escape(nameOf(id))}，${stageNames[clarity]}" data-clarity="${clarity}" style="background-position:${portraits[id]}"><span class="portrait-haze"></span></div>`;
}
function memoryEntry(memory) { return `<article class="memory-entry"><time>09 / 0${memory.day} &nbsp; ${time(memory.minute)}</time><h3>${escape(memory.title)}</h3><p>${escape(memory.text)}</p></article>`; }

function renderTitle() {
  document.body.classList.toggle('title-visible', titleVisible);
  if (!titleVisible) { $('#title-root').innerHTML = ''; return; }
  const canContinue = saved !== null;
  $('#title-root').innerHTML = `<section class="title-screen" aria-label="那个谁 · 军训篇扉页"><img class="cover-art" src="/art/campus-cover.png" alt="九月的校园，暖色屋顶、操场与银杏树"><div class="cover-wash"></div><div class="cover-content"><div class="eyebrow">一段正在发生的大学生活</div><h1>那个谁</h1><p class="cover-subtitle">九月，我们还不认识。</p><p class="cover-description">从一声没听清的名字，到一个熟悉的身影。<br>走进校园，慢慢认识那些与你擦肩的人。</p><div class="cover-actions"><button class="primary-button" data-action="${canContinue ? 'continue' : 'start'}">${canContinue ? '继续这段生活' : '走进九月'}${icon('arrow-right')}</button>${canContinue ? '<button class="text-button" data-action="new-confirm">重新开始</button>' : ''}</div><p class="cover-save-note">${canContinue ? `上次停在九月${dates[game.state.day - 1]}日 · ${time(game.state.minute)}` : '无需登录 · 进度保存在这台设备'}</p></div><div class="cover-foot"><span>一个人，一座校园，一些慢慢清晰的面孔。</span><span>耳机能让九月离你更近一点。</span></div><div class="cover-chapter-stamp"><span>01</span>军训篇</div></section>`;
}

function begin(fresh = false) {
  if (fresh) { game = createGame(); seenNotifications = new Set(); seenMemories = 0; scheduleDay = 1; uiSignature = ''; dialogueSignature = ''; }
  titleVisible = false; overlay = null; rhythm = null; route = []; destination = null; pendingInteraction = null;
  dialogueSignature = '';
  resetEncounter(); renderTitle(); renderOverlay(); audioStarted = true; audio.resume();
  if (matchMedia('(max-width:650px)').matches) world.focus(game.state.player.x, game.state.player.y);
  else world.focus(48, 46);
  if (game.state.dialogue?.nodeId === 'selection' && game.state.dialogue.stage === 'reaction' && game.state.flags.selectionChoice === 'lead' && !game.state.memories.some((m) => m.id === 'march-practice')) startPractice();
  lastFrame = performance.now(); save(); updateUI(true); canvas.focus({ preventScroll: true });
  if (!game.state.dialogue && (fresh || !game.state.memories.length)) toast('点击地面走一走。靠近人时，按 E 或轻触「聊一聊」。日程里有今天的安排。');
}

function showOverlay(which) {
  keys.clear(); overlay = which; scheduleDay = game.state.day; route = []; destination = null; pendingInteraction = null;
  if (which === 'journal') seenMemories = game.state.memories.length;
  renderOverlay(); updateUI(true); save();
}
function closeOverlay() { overlay = null; renderOverlay(); updateUI(true); lastFrame = performance.now(); canvas.focus({ preventScroll: true }); }
function wrapPanel(title, eyebrow, content, className = '', description = '') {
  return `<div class="overlay-shade" data-backdrop="true"><section class="paper-panel ${className}" role="dialog" aria-modal="true" aria-label="${escape(title)}"><button class="panel-close" data-action="close" aria-label="关闭">×</button><p class="panel-eyebrow">${eyebrow}</p><h2>${title}</h2>${description ? `<p class="panel-description">${description}</p>` : ''}${content}</section></div>`;
}
function renderOverlay() {
  const root = $('#overlay-root');
  if (game.state.ending && !titleVisible && !overlay) { renderEnding(); return; }
  if (!overlay) { root.innerHTML = ''; return; }
  if (overlay === 'schedule') {
    const events = EVENTS.filter((event) => event.day === scheduleDay);
    const statuses = { upcoming: '还未开始', available: '正在集合', active: '正在参与', complete: '已经历', missed: '已散场' };
    const content = `<div class="schedule-day-tabs" aria-label="查看日期">${DAYS.map((day) => `<button class="${day.day === scheduleDay ? 'active' : ''}" data-action="schedule-day" data-day="${day.day}" aria-label="九月${day.day}日">0${day.day}</button>`).join('')}</div><p class="schedule-date">九月${dates[scheduleDay - 1]}日 · ${escape(DAYS[scheduleDay - 1].title)}</p><ol class="schedule-list">${events.map((event) => { const status = game.state.eventStatus[event.id] || 'upcoming'; const location = LOCATIONS.find((l) => l.id === event.locationId); return `<li class="schedule-item ${status === 'available' ? 'active' : ''}"><time class="schedule-time">${time(event.start)}</time><div><strong>${escape(event.title)}</strong><p>${escape(event.description)}</p><span class="event-state">${statuses[status] || '还未开始'} · 至 ${time(event.end)}</span><p><button class="go-link" data-action="go" data-place="${location.id}">前往${escape(location.name)} ${icon('arrow-right')}</button></p></div></li>`; }).join('')}</ol><p class="panel-footnote">训练之间，可以自由安排去处。<br>清早的跑道、午后的图书馆、饭点的食堂，会遇到不同的人。<br>19:00 后可回宿舍休息，醒来就是明天。</p>`;
    root.innerHTML = wrapPanel('这几天的安排', 'CAMPUS DIARY / 九月', content, '', '生活有一些约定，也留了一些空白。');
  } else if (overlay === 'places') {
    root.innerHTML = wrapPanel('今天，去哪里', 'A LITTLE WALK / 校园', `<div class="place-list">${LOCATIONS.map((location, i) => `<button class="place-choice" data-action="go" data-place="${location.id}"><span class="place-number">0${i + 1}</span><span><strong>${escape(location.name)}</strong><small>${escape(location.description)}</small></span><span>${icon('arrow-right')}</span></button>`).join('')}</div><p class="panel-footnote">选好去处后，会沿着小路走过去。也可以随时用方向键改变主意。</p>`);
  } else if (overlay === 'journal') {
    const memories = game.getMemories();
    const content = `<div class="journal-tabs"><button class="${journalTab === 'people' ? 'active' : ''}" data-action="journal-tab" data-tab="people">遇见的人</button><button class="${journalTab === 'memories' ? 'active' : ''}" data-action="journal-tab" data-tab="memories">留下的片段 · ${memories.length}</button></div>${journalTab === 'people' ? `<div class="people-grid">${Object.keys(CHARACTERS).map((id) => { const rel = game.state.relationships[id]; return `<article class="person-card">${portrait(id)}<h3>${escape(nameOf(id))}</h3><p>${rel.clarity ? escape(CHARACTERS[id].description) : '还没来得及好好认识。'}</p><div class="person-clue">${rel.clarity ? escape(CHARACTERS[id].habits[Math.min(rel.clarity - 1, 2)]) : '在校园里，慢慢遇见。'}</div></article>`; }).join('')}</div><p class="panel-footnote">名字来自一次介绍，熟悉来自许多次相遇。<br>知道一个人的更多侧面，不一定意味着永远意见相同。</p>` : memories.length ? `<div class="memory-list">${[...memories].reverse().map(memoryEntry).join('')}</div>` : '<p class="journal-empty">纸页还是空的。<br>去走走吧，总有些什么会留下来。</p>'}`;
    root.innerHTML = wrapPanel('慢慢认出你', 'THINGS TO REMEMBER / 记忆手册', content, 'journal-panel');
  } else if (overlay === 'settings') {
    root.innerHTML = wrapPanel('让时间停一会儿', 'TAKE YOUR TIME / 暂停', `<div class="settings-row"><div>九月的背景音乐<p>轻钢琴与拨弦，随白天、夜晚和相遇变化。</p></div><button data-action="music">${settings.music ? '音乐已开启' : '音乐已关闭'}</button></div><div class="settings-row music-volume-row"><label for="music-volume">音乐音量 <output id="music-volume-label">${Math.round(settings.musicVolume * 100)}%</output></label><input id="music-volume" type="range" min="0" max="100" value="${Math.round(settings.musicVolume * 100)}"></div><div class="settings-row"><div>身边的声音<p>脚步、纸页轻响和训练节拍。</p></div><button data-action="effects">${settings.sound ? '音效已开启' : '音效已关闭'}</button></div><div class="settings-row"><div>时间流速<p>标准：现实 1 秒，校园 2 分钟。<br>对话、菜单和离线时，校园时间暂停。</p></div><select id="speed-select" aria-label="时间流速"><option value="1" ${settings.speed === 1 ? 'selected' : ''}>标准</option><option value="2" ${settings.speed === 2 ? 'selected' : ''}>快一些 · 2 倍</option><option value="4" ${settings.speed === 4 ? 'selected' : ''}>很快 · 4 倍</option></select></div><div class="settings-row"><div>安静的画面<p>减少环境摆动与过渡动画。</p></div><button data-action="motion">${settings.reducedMotion ? '已减少动态' : '轻微动态'}</button></div><div class="help-keys"><span><kbd>WASD / 方向键</kbd> 行走</span><span><kbd>E / 空格</kbd> 就近互动</span><span><kbd>鼠标滚轮</kbd> 缩放地图</span><span><kbd>Esc</kbd> 暂停 / 返回</span></div><div class="settings-actions"><button class="primary-button" data-action="close">继续生活 ${icon('arrow-right')}</button><button class="text-button" data-action="home">保存并返回扉页</button><button class="danger-button" data-action="new-confirm">重新开始</button></div><p class="save-status">${storageAvailable ? '进度会自动保存在这台设备，无需登录。' : '此浏览器暂时无法保存。当前页面仍可继续游玩。'}</p>`);
  } else if (overlay === 'new-confirm') {
    root.innerHTML = wrapPanel('再走进一次九月', 'A NEW BEGINNING / 重新开始', '<p class="panel-description">将从入学日开始新的经历。这台设备上当前这一局的进度会被替换。</p><div class="confirm-actions"><button class="primary-button" data-action="start">开始新的一局</button><button class="text-button" data-action="close">留在这一段生活里</button></div>');
  }
  root.querySelector('.panel-close')?.focus({ preventScroll: true });
}

function resetEncounter() {
  encounter = null;
  sceneRenderer = null;
  document.body.classList.remove('has-encounter');
  $('#dialogue-root').innerHTML = '';
}

function sceneChoicesReady() {
  return encounter && encounter.beatIndex === encounter.plan.beats.length - 1 && !encounter.action;
}

function renderDialogue() {
  const dialogue = game.state.dialogue;
  document.body.classList.toggle('has-dialogue', Boolean(dialogue) || Boolean(rhythm));
  if (!dialogue || titleVisible) {
    if (encounter || $('#dialogue-root').children.length) resetEncounter();
    dialogueSignature = '';
    return;
  }
  const signature = JSON.stringify(dialogue);
  if (!encounter || signature !== dialogueSignature) {
    const oldScene = encounter;
    const plan = getScenePlan(dialogue, game.state);
    encounter = { plan, beatIndex: 0, elapsed: oldScene?.elapsed || 0, beatElapsed: 0, action: null, history: false };
    dialogueSignature = signature;
    if (!$('#encounter-canvas')) {
      $('#dialogue-root').innerHTML = `<div class="encounter-wrap"><canvas id="encounter-canvas" aria-hidden="true"></canvas><div class="encounter-vignette"></div><header class="encounter-heading"><div><span class="encounter-eyebrow">九月的一个瞬间</span><h2 id="encounter-title"></h2><p id="encounter-place"></p></div><button class="encounter-exit" data-action="dismiss-dialogue" aria-label="结束交谈，回到校园">回到校园 <span>×</span></button></header><button class="scene-hotspot" data-action="scene-observe" hidden><span class="hotspot-ring"></span><span class="hotspot-label"></span></button><div id="scene-dialogue-slot"></div></div>`;
      sceneRenderer = createSceneRenderer($('#encounter-canvas'));
    }
    document.body.classList.add('has-encounter');
    const location = LOCATIONS.find((item) => item.id === plan.locationId);
    $('#encounter-title').textContent = dialogue.title;
    $('#encounter-place').textContent = `${location?.name || '校园'} · ${time(game.state.minute)}  /  时间停在这一刻`;
    renderSceneBeat();
  }
  if (rhythm) renderRhythm();
}

function renderSceneBeat() {
  if (!encounter || !game.state.dialogue) return;
  if (rhythm) { renderRhythm(); return; }
  const { plan, beatIndex, history } = encounter;
  const beat = plan.beats[beatIndex];
  const dialogue = game.state.dialogue;
  const id = dialogue.speakerId;
  const last = sceneChoicesReady();
  const speaker = id ? nameOf(id) : '你';
  const nextLabel = beatIndex === 0 ? '走近一点' : '听下去';
  const controls = last
    ? `<div class="scene-choices">${dialogue.choices.map((choice, i) => `<button class="scene-choice" data-action="choose" data-choice="${i}"><span class="scene-choice-number">${dialogue.stage === 'reaction' ? '↗' : `0${i + 1}`}</span><span>${escape(choice.text)}${choice.hint ? `<small>${escape(choice.hint)}</small>` : ''}</span>${icon('arrow-right')}</button>`).join('')}</div>`
    : `<button class="scene-next" data-action="scene-next">${nextLabel}${icon('arrow-right')}<kbd>空格</kbd></button>`;
  $('#scene-dialogue-slot').innerHTML = `<section class="scene-dialogue" role="dialog" aria-label="${escape(dialogue.title)}"><div class="scene-caption-meta"><span class="scene-speaker">${escape(speaker)}</span><span class="scene-stage-label">${id ? stageNames[game.state.relationships[id]?.clarity || 0] : escape(plan.ambience)}</span><span class="scene-beats" aria-label="第 ${beatIndex + 1} 幕，共 ${plan.beats.length} 幕">${plan.beats.map((_, i) => `<i class="${i === beatIndex ? 'current' : i < beatIndex ? 'seen' : ''}"></i>`).join('')}</span></div><p class="scene-caption" aria-live="polite">${escape(beat.text)}</p>${controls}<div class="scene-reading-tools"><button data-action="scene-history" aria-expanded="${history}">${history ? '收起' : '回看这段对话'}</button>${!last ? `<button data-action="scene-skip">${dialogue.stage === 'reaction' ? '看完这一幕' : '直接回应'} <span>↗</span></button>` : '<span>按自己的节奏，不用赶时间。</span>'}</div>${history ? `<div class="scene-transcript">${dialogue.lines.map((line) => `<p>${escape(line)}</p>`).join('')}</div>` : ''}</section>`;
  const hotspot = $('.scene-hotspot');
  hotspot.hidden = !beat.actionLabel || last || Boolean(encounter.action);
  hotspot.querySelector('.hotspot-label').textContent = beat.actionLabel || '';
  hotspot.setAttribute('aria-label', beat.actionLabel || '观察身边的细节');
}

function nextSceneBeat(skip = false) {
  if (!encounter || overlay || rhythm || titleVisible || encounter.action) return;
  const next = skip ? encounter.plan.beats.length - 1 : encounter.beatIndex + 1;
  if (next >= encounter.plan.beats.length) return;
  encounter.beatIndex = next;
  encounter.beatElapsed = 0;
  encounter.history = false;
  audio.cue(encounter.plan.beats[next].gesture);
  renderSceneBeat();
}

function observeScene() {
  if (!encounter || overlay || rhythm || encounter.action || sceneChoicesReady()) return;
  if (settings.reducedMotion) { nextSceneBeat(); return; }
  encounter.action = { elapsed: 0 };
  $('.scene-hotspot').hidden = true;
  audio.cue(encounter.plan.beats[encounter.beatIndex].prop || encounter.plan.prop);
}

function updateEncounter(dt) {
  if (!encounter || !sceneRenderer || titleVisible) return;
  const advancing = !overlay && !document.hidden;
  if (advancing) {
    encounter.elapsed += dt;
    encounter.beatElapsed += dt;
    if (encounter.action) {
      encounter.action.elapsed += dt;
      if (encounter.action.elapsed >= .9) { encounter.action = null; nextSceneBeat(); }
    }
  }
  let plan = encounter.plan;
  if (rhythm) plan = { ...plan, beats: plan.beats.map((beat) => ({ ...beat, focus: 'wide', gesture: 'step' })) };
  sceneRenderer.draw({ plan, beatIndex: encounter.beatIndex, state: game.state, elapsed: encounter.elapsed, beatElapsed: encounter.beatElapsed, actionProgress: encounter.action ? Math.min(1, encounter.action.elapsed / .9) : 0, reducedMotion: settings.reducedMotion });
  const hotspot = $('.scene-hotspot');
  if (hotspot && !hotspot.hidden) {
    const anchor = sceneRenderer.getHotspot();
    if (anchor) { hotspot.style.left = `${anchor.x}px`; hotspot.style.top = `${anchor.y}px`; }
  }
}

function renderEnding() {
  const memories = game.getMemories();
  const personal = memories.filter((memory) => memory.characterId);
  const selections = [];
  for (const id of Object.keys(CHARACTERS)) { const list = personal.filter((memory) => memory.characterId === id); if (list.length) selections.push(list.at(-1)); }
  if (!selections.length) selections.push(...memories.slice(-3));
  $('#overlay-root').innerHTML = `<div class="overlay-shade"><section class="paper-panel ending-panel" role="dialog" aria-modal="true" aria-label="军训篇的回忆"><div class="ending-eyebrow">九月的风，还在继续</div><h2>后来，你记住了谁。</h2><p class="ending-intro">哨声停了。迷彩服挂在窗边。<br>校园还是那座校园，有些身影却已经不同。</p><div class="ending-people">${Object.keys(CHARACTERS).map((id) => `<div class="ending-person">${portrait(id)}<h3>${escape(nameOf(id))}</h3></div>`).join('')}</div><div class="ending-memories">${selections.map(memoryEntry).join('')}</div><p class="ending-caption">有些名字还没问出口。<br>有些人，已经从「那个谁」变成了你认识的人。</p><div class="ending-actions"><button class="primary-button" data-action="journal">翻翻所有片段 ${icon('book')}</button><button class="text-button" data-action="download">保存这页回忆</button><button class="text-button" data-action="home">回到扉页</button></div><p class="save-status">军训篇 · 完<br>大学还很长，下一个故事尚待展开。</p></section></div>`;
}

function choose(index) {
  if (!sceneChoicesReady() || overlay || rhythm || titleVisible) return;
  const dialogue = game.state.dialogue;
  const previousClarity = game.state.relationships[dialogue?.speakerId]?.clarity || 0;
  const practice = dialogue?.source === 'event' && dialogue.nodeId === 'selection' && dialogue.stage === 'choice' && index === 0 && !game.state.memories.some((memory) => memory.id === 'march-practice');
  game.choose(index); audio.click(); save();
  if ((game.state.relationships[dialogue?.speakerId]?.clarity || 0) > previousClarity) audio.cue('recognition');
  if (practice) startPractice();
  updateUI(true);

}
function renderRhythm() {
  if (!rhythm) return;
  const el = $('#scene-dialogue-slot');
  if (!el) return;
  $('.scene-hotspot').hidden = true;
  if (!$('#practice-panel')) el.innerHTML = `<div class="dialogue-wrap"><section class="dialogue-box dialogue-no-portrait practice-box" id="practice-panel" role="dialog" aria-label="领队节拍练习"><div class="dialogue-body"><span class="dialogue-tag">领队练习 · 听见身后的脚步</span><div class="speaker-line"><span class="speaker-name">一步，一起。</span><span class="speaker-context">校园时间已暂停</span></div><p class="practice-instruction">光点经过中线时，按空格或轻触「迈一步」。走错也没关系。</p><div class="practice-track"><div class="practice-center"></div><div id="practice-dot"></div><span>左</span><span>右</span></div><div class="practice-bottom"><span id="practice-feedback">先听两拍，再一起迈步。</span><span id="practice-count">0 / 8</span></div><div class="practice-actions"><button class="primary-button" data-action="practice-tap">迈一步 <kbd>空格</kbd></button><button class="text-button" data-action="practice-skip">按自己的节奏继续</button></div></div></section></div>`;
  $('#practice-feedback').textContent = rhythm.feedback;
}
function startPractice() { rhythm = { elapsed: -1600, total: 8, hits: new Set(), beat: -1, feedback: '先听两拍，再一起迈步。' }; dialogueSignature = ''; }
function tapPractice() {
  if (!rhythm) return;
  if (overlay || document.hidden) return;
  const elapsed = rhythm.elapsed;
  const target = Math.round(elapsed / 850);
  if (target >= 0 && target < rhythm.total && Math.abs(elapsed - target * 850) < 210 && !rhythm.hits.has(target)) {
    rhythm.hits.add(target); rhythm.feedback = '听见了，这一步合在了一起。'; audio.note(530, .13, .22);
  } else { rhythm.feedback = '没关系，听下一拍。'; audio.note(240, .06, .08); }
  $('#practice-feedback').textContent = rhythm.feedback;
}
function finishPractice(skipped = false) {
  if (!rhythm) return;
  const result = { hits: rhythm.hits.size, total: rhythm.total, skipped };
  game.recordPractice?.(result); rhythm = null; dialogueSignature = ''; if ($('#scene-dialogue-slot')) $('#scene-dialogue-slot').innerHTML = ''; save(); updateUI(true);
}

function nearestInteraction() {
  return game.getAvailableInteractions().filter((item) => item.distance <= INTERACTION_RADIUS).sort((a, b) => {
    const rank = (x) => x.kind === 'event' ? 0 : x.kind === 'npc' && x.fresh ? 1 : x.id === 'object:dorm' && (game.state.minute >= 1140 || game.state.flags.graduated) ? 2 : x.kind === 'npc' ? 3 : 4;
    return rank(a) - rank(b) || a.distance - b.distance;
  })[0];
}
function interact(id = null) {
  const target = id || nearestInteraction()?.id;
  if (!target) return;
  route = []; destination = null; pendingInteraction = null; keys.clear();
  if (game.interact(target)) { audio.click(); save(); updateUI(true); }
}
function walkTo(x, y, label = '', interactionId = null) {
  if (game.state.ending || game.state.dialogue) return;
  const result = findPath(game.state.player, { x, y });
  if (!result?.length) { if (Math.hypot(game.state.player.x - x, game.state.player.y - y) < INTERACTION_RADIUS && interactionId) interact(interactionId); else toast('那里暂时走不过去，试试旁边的小路。'); return; }
  route = result; destination = { x: result.at(-1).x, y: result.at(-1).y, label: label || '随便走走' }; pendingInteraction = interactionId;
}
function move(dt) {
  if (paused()) return false;
  let dx = 0, dy = 0;
  if (keys.has('arrowup') || keys.has('w')) { dx--; dy--; }
  if (keys.has('arrowdown') || keys.has('s')) { dx++; dy++; }
  if (keys.has('arrowleft') || keys.has('a')) { dx--; dy++; }
  if (keys.has('arrowright') || keys.has('d')) { dx++; dy--; }
  let moving = false;
  const speed = 8.5 * dt;
  if (dx || dy) {
    route = []; destination = null; pendingInteraction = null;
    const length = Math.hypot(dx, dy); dx = dx / length * speed; dy = dy / length * speed;
    const { x, y } = game.state.player;
    if (isWalkable(x + dx, y + dy)) { game.setPlayer(x + dx, y + dy); moving = true; }
    else if (isWalkable(x + dx, y)) { game.setPlayer(x + dx, y); moving = true; }
    else if (isWalkable(x, y + dy)) { game.setPlayer(x, y + dy); moving = true; }
  } else if (route.length) {
    const target = route[0], { x, y } = game.state.player;
    const distance = Math.hypot(target.x - x, target.y - y);
    if (distance <= speed) { game.setPlayer(target.x, target.y); route.shift(); }
    else game.setPlayer(x + (target.x - x) / distance * speed, y + (target.y - y) / distance * speed);
    moving = true;
    if (!route.length) {
      destination = null;
      if (pendingInteraction) { const targetId = pendingInteraction; pendingInteraction = null; const item = game.getAvailableInteractions().find((candidate) => candidate.id === targetId); if (item && item.distance <= INTERACTION_RADIUS) interact(targetId); else toast('人已经去别处了。换个时间，或沿着日程再找找。'); }
    }
  }
  return moving;
}

function updateUI(force = false) {
  const state = game.state;
  document.body.classList.toggle('reduced-motion', settings.reducedMotion);
  const nearest = nearestInteraction();
  const signature = `${state.day}/${Math.floor(state.minute)}/${paused()}/${nearest?.id}/${state.memories.length}/${state.ending}`;
  if (force || signature !== uiSignature) {
    uiSignature = signature;
    $('#date-label').textContent = `九月${dates[state.day - 1]}日`;
    $('#day-label').textContent = DAYS[state.day - 1].title;
    $('#time-label').textContent = time(state.minute);
    $('#clock-caption').textContent = paused() ? '此刻，校园时间暂停' : state.minute >= 1320 ? '夜深了，回宿舍休息吧' : '校园的时间，正在慢慢向前';
    $('#weather-icon').innerHTML = icon(state.minute >= 1140 ? 'moon' : 'sun');
    document.body.classList.toggle('paused', paused());
    $('#memory-dot').hidden = state.memories.length <= seenMemories;
    $('#sound-icon').innerHTML = icon(settings.sound || settings.music ? 'sound' : 'sound-off');
    $('[data-action="sound"]').setAttribute('aria-label', settings.sound || settings.music ? '关闭声音' : '开启声音');
    const next = game.getSchedule().find((event) => event.status === 'active' || event.status === 'available' || event.status === 'upcoming');
    $('#next-event-label').textContent = next ? `${time(next.start)} · ${next.title}` : state.minute >= 1140 ? '回宿舍，收好今天的日子' : '课余时间，去熟悉的地方走走';
    const button = $('#interact-button'); button.disabled = !nearest;
    button.querySelector('span:nth-child(2)').textContent = nearest ? (nearest.kind === 'npc' ? `和${nearest.label}聊聊` : nearest.label) : '走近一点，认识一下';
    if (state.ending && !titleVisible && !overlay) { save(); renderEnding(); }
  }
  const closestLocation = [...LOCATIONS].sort((a, b) => Math.hypot(a.x - state.player.x, a.y - state.player.y) - Math.hypot(b.x - state.player.x, b.y - state.player.y))[0];
  $('#location-label').textContent = `${closestLocation.name}附近`;
  $('#map-coordinate').textContent = `SEPTEMBER / 0${state.day}`;
  $('#navigation-hint').hidden = !destination || paused();
  if (destination) $('#navigation-hint>span:nth-child(2)').textContent = `正走向${destination.label}`;
  if (!titleVisible) {
    const unseen = state.notifications.filter((notification) => !seenNotifications.has(notification.id));
    if (unseen.length) { state.notifications.forEach((notification) => seenNotifications.add(notification.id)); toast(unseen.at(-1).text); }
  }
  renderDialogue();
}

function frame(now) {
  try {
    const dt = Math.min((now - lastFrame) / 1000, .1); lastFrame = now;
    const moving = move(dt);
    if (!paused()) game.advance(dt * 2 * settings.speed);
    if (moving && now - lastFootstep > 360) { lastFootstep = now; audio.step(); }
    if (moving && matchMedia('(max-width:600px)').matches) { const screen = world.toScreen(game.state.player.x, game.state.player.y); if (screen.x < 75 || screen.x > canvas.clientWidth - 75 || screen.y < 140 || screen.y > canvas.clientHeight - 140) world.focus(game.state.player.x, game.state.player.y); }
    if (rhythm) {
      if (!overlay && !document.hidden && !titleVisible) rhythm.elapsed += dt * 1000;
      const delta = rhythm.elapsed;
      const beat = Math.floor(delta / 850);
      if (beat >= 0 && beat < 8 && rhythm.beat !== beat) { rhythm.beat = beat; audio.note(beat % 2 ? 350 : 470, .07, .16); }
      if (delta > 850 * 7 + 600) finishPractice(false);
      else {
        const phase = ((delta + 425) % 850 + 850) % 850 / 850;
        const dot = $('#practice-dot'); if (dot) dot.style.left = `${phase * 100}%`;
        const count = $('#practice-count'); if (count) count.textContent = `${Math.max(0, Math.min(8, beat + 1))} / 8`;
      }
    }
    world.draw({ state: game.state, npcs: game.getNPCs(), characters: CHARACTERS, locations: LOCATIONS, route, elapsed: settings.reducedMotion ? 0 : now / 1000, hoverId, moving });
    updateUI();
    updateEncounter(dt);
    audio.setScene({ mode: titleVisible ? 'title' : rhythm ? 'practice' : stateMode(), minute: game.state.minute, locationId: encounter?.plan.locationId });
    if (toastUntil && now > toastUntil) { $('#notification').classList.remove('visible'); toastUntil = 0; }
    if (!titleVisible && now - lastSavedAt > 2500) { lastSavedAt = now; save(); }
    requestAnimationFrame(frame);
  } catch (error) { showError(error); }
}

function stateMode() { return game.state.ending ? 'ending' : game.state.dialogue ? 'encounter' : 'campus'; }

function downloadMemories() {
  const lines = ['那个谁 · 九月，我们还不认识', '军训篇的回忆', '', ...game.getMemories().flatMap((memory) => [`九月${dates[memory.day - 1]}日 ${time(memory.minute)} · ${memory.title}`, memory.text, '']), '有些人，已经从「那个谁」变成了你认识的人。'];
  const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob), link = document.createElement('a'); link.href = url; link.download = '那个谁-九月的回忆.txt'; document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function showError(error) {
  console.error(error); save();
  $('#fatal-error').hidden = false;
  $('#fatal-error').innerHTML = '<h1>校园暂时停了一下。</h1><p>已经发生的经历会尽力保留在这台设备上。刷新页面，可以从上次停下的地方继续。</p><button class="primary-button" onclick="location.reload()">重新打开</button>';
}

document.addEventListener('click', (event) => {
  const button = event.target.closest('[data-action]');
  if (!button) { if (event.target.matches('[data-backdrop]')) closeOverlay(); return; }
  event.preventDefault(); const action = button.dataset.action;
  if (['schedule', 'journal', 'places', 'settings'].includes(action)) { if (!titleVisible) showOverlay(action); return; }
  switch (action) {
    case 'start': begin(true); break;
    case 'continue': begin(false); break;
    case 'home': save(); keys.clear(); route = []; overlay = null; rhythm = null; titleVisible = true; resetEncounter(); renderOverlay(); renderTitle(); break;
    case 'close': closeOverlay(); break;
    case 'new-confirm': showOverlay('new-confirm'); break;
    case 'scene-next': nextSceneBeat(); break;
    case 'scene-skip': nextSceneBeat(true); break;
    case 'scene-observe': observeScene(); break;
    case 'scene-history': if (encounter) { encounter.history = !encounter.history; renderSceneBeat(); } break;
    case 'choose': choose(Number(button.dataset.choice)); break;
    case 'dismiss-dialogue': if (rhythm) finishPractice(true); game.dismissDialogue(); save(); updateUI(true); break;
    case 'schedule-day': scheduleDay = Number(button.dataset.day); renderOverlay(); break;
    case 'journal-tab': journalTab = button.dataset.tab; renderOverlay(); break;
    case 'go': { const location = LOCATIONS.find((item) => item.id === button.dataset.place); closeOverlay(); if (location) { walkTo(location.x, location.y, location.name); world.focus(game.state.player.x, game.state.player.y); } break; }
    case 'interact': if (!paused()) interact(); break;
    case 'wait': if (!paused()) { game.waitUntilNext(); save(); updateUI(true); } break;
    case 'sound': { const enabled = !(settings.sound || settings.music); settings.sound = enabled; settings.music = enabled; applySoundSettings(); break; }
    case 'music': settings.music = !settings.music; applySoundSettings(); break;
    case 'effects': settings.sound = !settings.sound; applySoundSettings(); break;
    case 'motion': settings.reducedMotion = !settings.reducedMotion; saveSettings(); renderOverlay(); break;
    case 'zoom-in': world.zoomBy(1.22); break;
    case 'zoom-out': world.zoomBy(1 / 1.22); break;
    case 'recenter': world.focus(game.state.player.x, game.state.player.y); break;
    case 'cancel-walk': route = []; destination = null; pendingInteraction = null; break;
    case 'practice-tap': tapPractice(); break;
    case 'practice-skip': finishPractice(true); break;
    case 'download': downloadMemories(); break;
  }
});
function applySoundSettings() {
  audio.configure({ sound: settings.sound, music: settings.music, volume: settings.musicVolume });
  audioStarted = true; audio.resume(); saveSettings();
  if (overlay === 'settings') renderOverlay();
  updateUI(true);
}
document.addEventListener('input', (event) => { if (event.target.id === 'music-volume') { settings.musicVolume = Number(event.target.value) / 100; audio.configure({ sound: settings.sound, music: settings.music, volume: settings.musicVolume }); saveSettings(); $('#music-volume-label').textContent = `${event.target.value}%`; } });
document.addEventListener('change', (event) => { if (event.target.id === 'speed-select') { settings.speed = Number(event.target.value); saveSettings(); } });
document.addEventListener('keydown', (event) => {
  const key = event.key.toLowerCase();
  if (key === 'escape') { event.preventDefault(); if (overlay) closeOverlay(); else if (rhythm) finishPractice(true); else if (game.state.dialogue) { game.dismissDialogue(); save(); updateUI(true); } else if (!titleVisible) showOverlay('settings'); return; }
  // Focused buttons keep their native keyboard activation; scene shortcuts apply to the stage.
  if ((key === ' ' || key === 'enter') && event.target.closest('button')) return;
  if (key === 'tab' && (overlay || game.state.ending && !titleVisible)) {
    const panel = $('#overlay-root [role="dialog"]');
    const elements = panel?.querySelectorAll('button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),a[href]');
    if (elements?.length) { const first = elements[0], last = elements[elements.length - 1]; if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); } else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); } }
  }
  if (event.target.matches('input,select,textarea')) return;
  if (['arrowup','arrowdown','arrowleft','arrowright','w','a','s','d',' '].includes(key)) event.preventDefault();
  if (rhythm && (key === ' ' || key === 'enter')) { if (!event.repeat) tapPractice(); return; }
  if (game.state.dialogue && !overlay && !titleVisible) {
    if (!event.repeat && /^[1-4]$/.test(key) && sceneChoicesReady()) choose(Number(key) - 1);
    else if (!event.repeat && (key === ' ' || key === 'enter')) { event.preventDefault(); if (!sceneChoicesReady()) nextSceneBeat(); else if (game.state.dialogue.choices.length === 1) choose(0); }
    return;
  }
  if (paused()) return;
  if (key === 'e' || key === ' ') { if (!event.repeat) interact(); return; }
  keys.add(key);
});
document.addEventListener('keyup', (event) => keys.delete(event.key.toLowerCase()));
window.addEventListener('blur', () => { keys.clear(); });
document.addEventListener('visibilitychange', () => { keys.clear(); lastFrame = performance.now(); if (document.hidden) { save(); audio.suspend(); } else if (audioStarted) audio.resume(); });
window.addEventListener('pagehide', save);
window.addEventListener('resize', () => { world.resize(); sceneRenderer?.resize(); });

let pointer = null;
canvas.addEventListener('pointerdown', (event) => {
  if (paused()) return;
  pointer = { id: event.pointerId, startX: event.clientX, startY: event.clientY, x: event.clientX, y: event.clientY, dragged: false };
  canvas.setPointerCapture(event.pointerId); canvas.focus({ preventScroll: true });
});
canvas.addEventListener('pointermove', (event) => {
  const rect = canvas.getBoundingClientRect();
  if (pointer && pointer.id === event.pointerId) {
    if (Math.hypot(event.clientX - pointer.startX, event.clientY - pointer.startY) > 6) pointer.dragged = true;
    if (pointer.dragged) world.pan(event.clientX - pointer.x, event.clientY - pointer.y);
    pointer.x = event.clientX; pointer.y = event.clientY;
  } else {
    const target = world.hitTest(event.clientX - rect.left, event.clientY - rect.top, game.getNPCs(), LOCATIONS);
    hoverId = target?.id || null;
    canvas.style.cursor = target ? 'pointer' : 'crosshair';
  }
});
canvas.addEventListener('pointerup', (event) => {
  if (!pointer || pointer.id !== event.pointerId) return;
  const dragged = pointer.dragged; pointer = null;
  if (paused() || dragged) return;
  const rect = canvas.getBoundingClientRect(), x = event.clientX - rect.left, y = event.clientY - rect.top;
  const target = world.hitTest(x, y, game.getNPCs(), LOCATIONS);
  if (target?.kind === 'npc') {
    const item = game.getAvailableInteractions().find((candidate) => candidate.id === `npc:${target.id}`);
    if (item?.distance <= INTERACTION_RADIUS) interact(item.id); else walkTo(target.x, target.y, nameOf(target.id), `npc:${target.id}`);
  } else if (target?.kind === 'location') {
    const localEvent = game.getAvailableInteractions().find((item) => item.kind === 'event' && EVENTS.find((e) => `event:${e.id}` === item.id)?.locationId === target.id);
    const id = localEvent?.id || `object:${target.id}`;
    const item = game.getAvailableInteractions().find((candidate) => candidate.id === id);
    if (item?.distance <= INTERACTION_RADIUS) interact(id); else walkTo(item?.x ?? target.x, item?.y ?? target.y, LOCATIONS.find((l) => l.id === target.id)?.name || '', id);
  } else { const point = world.toWorld(x, y); walkTo(point.x, point.y); }
});
canvas.addEventListener('pointercancel', () => { pointer = null; });
canvas.addEventListener('wheel', (event) => { event.preventDefault(); if (!paused()) world.zoomBy(event.deltaY < 0 ? 1.08 : 1 / 1.08); }, { passive: false });
