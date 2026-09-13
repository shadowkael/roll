import { LOCATIONS, CHARACTERS, DAYS, EVENTS, ROUTINES, SCHEDULE_BOUNDARIES, EPISODES, EVENT_EPISODES, AMBIENT_LINES } from './content.mjs';

export const SAVE_VERSION = 1;
export const INTERACTION_RADIUS = 13;
const MINUTE_START = 420;
const MINUTE_END = 1320;
const MAX_DAY = 5;
const point = (id) => LOCATIONS.find((location) => location.id === id);
const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
const finite = (value, fallback) => typeof value === 'number' && Number.isFinite(value) ? value : fallback;
const copy = (value) => JSON.parse(JSON.stringify(value));
const record = (value) => value && typeof value === 'object' && !Array.isArray(value) ? value : {};

function freshState() {
  return {
    version: SAVE_VERSION, day: 1, minute: 920, player: { x: 20, y: 27 },
    relationships: Object.fromEntries(Object.keys(CHARACTERS).map((id) => [id, { clarity: 0, trust: 0, knownName: false, memories: [] }])),
    visited: {}, eventStatus: {}, flags: {}, memories: [], dialogue: null,
    notifications: [{ id: 'welcome', text: '九月一日，15:20。先走走吧。16:00 校门领取军训服，明早 09:00 操场集合。' }],
    ending: false, pendingAdvance: 0,
  };
}

/** Safe offline save restoration. Unknown/newer saves fall back to a new chapter. */
function restore(saved) {
  const fresh = freshState();
  if (!saved) return fresh;
  let parsed;
  try { parsed = typeof saved === 'string' ? JSON.parse(saved) : saved; } catch { return fresh; }
  const source = record(parsed);
  if (source.version !== SAVE_VERSION) return fresh;
  const state = { ...fresh };
  state.day = clamp(Math.floor(finite(source.day, 1)), 1, MAX_DAY);
  state.minute = clamp(finite(source.minute, 920), MINUTE_START, MINUTE_END);
  state.player = { x: clamp(finite(source.player?.x, 20), 3, 97), y: clamp(finite(source.player?.y, 27), 3, 97) };
  state.ending = source.ending === true;
  state.flags = Object.fromEntries(Object.entries(record(source.flags)).filter(([key, value]) => key.length < 100 && ['string', 'boolean', 'number'].includes(typeof value)));
  state.visited = Object.fromEntries(Object.entries(record(source.visited)).filter(([key, value]) => typeof value === 'number' && Number.isFinite(value) && LOCATIONS.some((location) => location.id === key)));
  state.eventStatus = Object.fromEntries(Object.entries(record(source.eventStatus)).filter(([id, status]) => EVENTS.some((event) => event.id === id) && ['available', 'active', 'complete', 'missed'].includes(status)));
  state.memories = Array.isArray(source.memories) ? source.memories.filter((memory) => memory && typeof memory.id === 'string' && typeof memory.text === 'string').slice(-100).map((memory) => ({ id: memory.id.slice(0, 100), day: clamp(Math.floor(finite(memory.day, 1)), 1, 5), minute: clamp(finite(memory.minute, 920), 420, 1320), title: typeof memory.title === 'string' ? memory.title.slice(0, 200) : '记住的片段', text: memory.text.slice(0, 2000), characterId: CHARACTERS[memory.characterId] ? memory.characterId : null })) : [];
  state.memories = state.memories.filter((memory, index, list) => list.findIndex((other) => other.id === memory.id) === index);
  for (const id of Object.keys(CHARACTERS)) {
    const value = record(source.relationships?.[id]);
    state.relationships[id] = {
      clarity: clamp(Math.floor(finite(value.clarity, 0)), 0, 3), trust: clamp(finite(value.trust, 0), -10, 20),
      knownName: value.knownName === true,
      memories: Array.isArray(value.memories) ? [...new Set(value.memories.filter((memory) => typeof memory === 'string' && (EPISODES[memory] || EVENTS.some((event) => `event-${event.id}` === memory))))] : [],
    };
  }
  state.notifications = Array.isArray(source.notifications) ? source.notifications.filter((notification) => typeof notification?.id === 'string' && typeof notification?.text === 'string').slice(-5) : [];
  const dialogue = record(source.dialogue);
  const validEpisode = dialogue.source === 'episode' && EPISODES[dialogue.nodeId];
  const validEvent = dialogue.source === 'event' && EVENT_EPISODES[dialogue.nodeId];
  const validGeneric = ['ambient', 'object'].includes(dialogue.source) && typeof dialogue.nodeId === 'string';
  if ((validEpisode || validEvent || validGeneric) && ['choice', 'reaction'].includes(dialogue.stage) && Array.isArray(dialogue.lines) && dialogue.lines.every((line) => typeof line === 'string') && Array.isArray(dialogue.choices) && dialogue.choices.length <= 4 && dialogue.choices.every((choice) => typeof choice?.text === 'string')) {
    state.dialogue = copy(dialogue);
    state.pendingAdvance = clamp(finite(source.pendingAdvance, 0), 0, 180);
  } else {
    for (const [id, status] of Object.entries(state.eventStatus)) if (status === 'active') delete state.eventStatus[id];
  }
  return state;
}

export function createGame(saved = null) {
  const state = restore(saved);

  function notify(id, text) {
    if (state.notifications.some((notification) => notification.id === id)) return;
    state.notifications.push({ id, text });
    state.notifications = state.notifications.slice(-5);
  }

  function remember(id, title, text, characterId = null) {
    if (state.memories.some((memory) => memory.id === id)) return false;
    state.memories.push({ id, day: state.day, minute: Math.floor(state.minute), title, text, characterId });
    return true;
  }

  function finishChapter() {
    if (state.ending) return;
    state.dialogue = null;
    state.pendingAdvance = 0;
    state.ending = true;
    if (!state.memories.length) remember('quiet-days', '你走过的校园', '几天过去，你慢慢认得了校园里的路。有些人还没来得及说上话，故事也留下了再见的余地。');
    notify('chapter-end', '军训篇结束了。留下来的，是这一局真实发生过的相遇。');
  }

  function syncEvents() {
    for (const event of EVENTS) {
      const status = state.eventStatus[event.id];
      if (status === 'complete' || status === 'missed') continue;
      if (event.day < state.day || (event.day === state.day && state.minute >= event.end)) {
        if (status === 'active' && state.dialogue?.source === 'event') continue;
        state.eventStatus[event.id] = 'missed';
        const after = event.id === 'arrival' ? '回宿舍可以领备用训练服，明天照常集合。' : event.id === 'closing' ? '结营已经散场。还可以找人道别，今晚回宿舍留下回忆。' : '错过了这次集合，可以继续自由活动，下一次安排照常进行。';
        notify(`missed-${event.id}`, `${event.title}已结束。${after}`);
        if (event.id === 'closing') state.flags.graduated = true;
      } else if (event.day === state.day && state.minute >= event.start && status !== 'active') {
        state.eventStatus[event.id] = 'available';
        notify(`start-${event.id}`, `${event.title}开始了 · ${point(event.locationId).name}。可以前往参加。`);
      } else if (event.day === state.day && state.minute >= event.start - 20 && state.minute < event.start) {
        notify(`soon-${event.id}`, `${event.title}还有 ${Math.ceil(event.start - state.minute)} 分钟，在${point(event.locationId).name}。`);
      }
    }
    if (state.minute >= MINUTE_END) {
      if (state.day === MAX_DAY && !state.dialogue) finishChapter();
      else notify(`bedtime-${state.day}`, '22:00，校园安静下来了。回宿舍休息，明天 07:00 再出门。');
    }
  }

  function advance(minutes) {
    if (state.dialogue || state.ending || !Number.isFinite(minutes) || minutes <= 0) return false;
    state.minute = Math.min(MINUTE_END, state.minute + minutes);
    syncEvents();
    return true;
  }

  function setPlayer(x, y) {
    if (state.dialogue || state.ending || !Number.isFinite(x) || !Number.isFinite(y)) return false;
    state.player.x = clamp(x, 3, 97);
    state.player.y = clamp(y, 3, 97);
    for (const location of LOCATIONS) {
      if (Math.hypot(location.x - state.player.x, location.y - state.player.y) <= INTERACTION_RADIUS && state.visited[location.id] !== state.day) state.visited[location.id] = state.day;
    }
    return true;
  }

  function getNPCs() {
    const activeEvent = EVENTS.find((event) => event.day === state.day && state.minute >= event.start && state.minute < event.end);
    const block = clamp(SCHEDULE_BOUNDARIES.findLastIndex((minute) => state.minute >= minute), 0, 7);
    const offsets = { li: [-4, 2], chen: [4, 0], roommate: [1, 5], instructor: [-2, -5] };
    return Object.keys(CHARACTERS).map((id) => {
      let [locationId, activity] = ROUTINES[id][block];
      if (state.day === 1 && state.minute < 960 && id === 'roommate') [locationId, activity] = ['dorm', '给新床铺套上床单'];
      if (state.day === 1 && state.minute < 960 && id === 'li') [locationId, activity] = ['field', '试戴刚领到的帽子'];
      if (activeEvent && (activeEvent.id !== 'arrival' || id === 'roommate')) {
        locationId = activeEvent.locationId;
        activity = activeEvent.title === '站军姿' && id === 'li' && state.eventStatus.standing === 'complete' ? '训练间隙坐着喝水' : `参加${activeEvent.title}`;
      }
      // Chen keeps a predictable late-afternoon library window after the singing event.
      if (state.day === 1 && id === 'chen' && state.minute < 1050) [locationId, activity] = ['library', '用小票给书夹上书签'];
      const location = point(locationId);
      return { id, locationId, x: location.x + offsets[id][0], y: location.y + offsets[id][1], activity };
    });
  }

  function getSchedule() {
    return EVENTS.filter((event) => event.day === state.day).map((event) => ({ ...event, status: state.eventStatus[event.id] || 'upcoming' }));
  }

  function nextEpisode(id, locationId) {
    const relationship = state.relationships[id];
    const has = (episode) => relationship.memories.includes(`${id}-${episode}`);
    const initial = id === 'li' ? ['field', 'shade'] : id === 'chen' ? ['library'] : id === 'roommate' ? ['dorm'] : ['field', 'shade'];
    const gathering = EVENTS.find((event) => event.day === state.day && state.minute >= event.start && state.minute < event.end && event.locationId === locationId && (event.id !== 'arrival' || id === 'roommate'));
    if (gathering) return null;
    if (!has('first') && initial.includes(locationId)) return `${id}-first`;
    if (state.day < 2 || !has('first')) return null;
    const firstMemory = state.memories.find((memory) => memory.id === `${id}-first`);
    if (firstMemory && state.day <= firstMemory.day) return null;
    if (!has('name')) {
      const canName = id === 'li' ? locationId === 'shade' : id === 'chen' ? locationId === 'library' : id === 'roommate' ? locationId === 'canteen' : locationId === 'shade';
      if (canName) return `${id}-name`;
    }
    if (state.day < 3 || !has('name') || has('understand')) return null;
    const nameMemory = state.memories.find((memory) => memory.id === `${id}-name`);
    if (nameMemory && state.day <= nameMemory.day) return null;
    const canUnderstand = id === 'li' ? locationId === 'field' && state.minute >= 1050 && state.minute < 1140 : id === 'chen' ? locationId === 'shade' && state.minute >= 1140 : id === 'roommate' ? locationId === 'dorm' && state.minute >= 1140 : locationId === 'shade' && state.day >= 4;
    return canUnderstand ? `${id}-understand` : null;
  }

  function getAvailableInteractions() {
    if (state.ending) return [];
    const interactions = [];
    for (const event of getSchedule()) if (event.status === 'available') {
      const location = point(event.locationId);
      interactions.push({ id: `event:${event.id}`, kind: 'event', label: `参加 · ${event.title}`, x: location.x, y: location.y + 8, description: event.description, eventId: event.id });
    }
    for (const npc of getNPCs()) {
      const relation = state.relationships[npc.id];
      const episode = nextEpisode(npc.id, npc.locationId);
      interactions.push({ id: `npc:${npc.id}`, kind: 'npc', label: relation.knownName ? CHARACTERS[npc.id].name : CHARACTERS[npc.id].unknownName, x: npc.x, y: npc.y, description: episode ? EPISODES[episode].title : npc.activity, fresh: Boolean(episode), characterId: npc.id });
    }
    for (const location of LOCATIONS) {
      interactions.push({ id: `object:${location.id}`, kind: 'object', label: location.id === 'dorm' && state.day === 5 && state.flags.graduated ? '整理军训回忆' : location.id === 'dorm' && state.minute >= 1140 ? '回宿舍休息' : location.id === 'dorm' && state.eventStatus.arrival === 'missed' && !state.flags.uniform ? '领取备用训练服' : `看看${location.name}`, x: location.x + 7, y: location.y + 4, description: location.description, locationId: location.id });
    }
    return interactions.map((interaction) => ({ ...interaction, distance: Math.hypot(interaction.x - state.player.x, interaction.y - state.player.y) }));
  }

  function openEpisode(episodeId, source = 'episode', late = false) {
    const episode = source === 'event' ? EVENT_EPISODES[episodeId] : EPISODES[episodeId];
    if (!episode) return false;
    let lines = [...episode.lines];
    if (late) lines.unshift('你来得晚了一些。教官听完说明，让你从队尾归队；眼前的事还在继续。');
    if (episodeId === 'li-name' && state.flags.standingHelp) lines.unshift(state.flags.standingHelp === 'observe' ? '“你是不是站我旁边的那个？”那顶歪帽子先认出了你。' : '“之前训练那次，谢谢。”那顶歪帽子先认出了你。');
    if (episodeId === 'li-understand' && state.flags.liBreakfast) lines.unshift('“今天吃了早饭。”李屿先给你看了空空的面包袋。');
    if (episodeId === 'chen-understand' && state.flags.singingChoice === 'support') lines.unshift('“拉歌那天，你听到我打拍子了，对吧？”');
    if (episodeId === 'selection' && state.flags.singingChoice === 'lead') lines.unshift('教官记得拉歌时先起头的你，但只点了点头，仍把选择留给整个方阵。');
    state.dialogue = { source, nodeId: episodeId, speakerId: episode.speakerId, title: episode.title, lines, choices: episode.choices.map(({ text, hint }) => ({ text, ...(hint ? { hint } : {}) })), stage: 'choice', late };
    if (source === 'event') state.eventStatus[episodeId] = 'active';
    return true;
  }

  function openObject(locationId) {
    const location = point(locationId);
    if (!location) return false;
    const lines = [location.description];
    let action = 'close';
    let choices = [{ text: '继续走走。' }];
    if (locationId === 'dorm') {
      if (state.eventStatus.arrival === 'missed' && !state.flags.uniform) {
        lines.push('门卫留了一套备用军训服。尺码不太合适，但明天照常可以去集合。');
        action = 'uniform';
        choices = [{ text: '领好衣服，记下明天的时间。' }];
      } else if (state.day === 5 && state.flags.graduated) {
        lines.push('军训服挂在窗边。你可以合上这一章，看看这些天留下了什么。');
        action = 'ending';
        choices = [{ text: '收好这些天的回忆。' }, { text: '还想出去走走。' }];
      } else if (state.minute >= 1140) {
        lines.push('把今天留在门外。睡一觉，再睁开眼就是明早 07:00。');
        action = 'sleep';
        choices = [{ text: '休息到明早。' }, { text: '再走走。' }];
      } else lines.push('现在还早。收拾一会儿东西，再去校园里走走。19:00 后可以回来休息。');
    } else if (locationId === 'library') lines.push('公告栏写着：军训期间，只开放一楼公共阅览区。午后常有人坐在靠窗的位置。');
    else if (locationId === 'field') lines.push('跑道没有锁门。清早和傍晚，常常能碰到同样的人。');
    else if (locationId === 'canteen') lines.push('菜单上的字有一半被水汽遮住了。午饭时，座位比菜更难决定。');
    else if (locationId === 'shade') lines.push('你在这里停了一会儿。午后适合歇脚，晚上能听到远处有人放音乐。');
    else lines.push(`今天是九月${state.day}日。${getSchedule()[0]?.description || '校园有自己的节奏。'}`);
    state.dialogue = { source: 'object', nodeId: locationId, speakerId: null, title: location.name, lines, choices, stage: 'choice', action };
    return true;
  }

  function interact(id) {
    if (state.dialogue || state.ending || typeof id !== 'string') return false;
    const interaction = getAvailableInteractions().find((candidate) => candidate.id === id);
    if (!interaction) return false;
    if (interaction.distance > INTERACTION_RADIUS) {
      notify(`closer-${id}`, `再走近一点，就能${interaction.kind === 'npc' ? '和这个人说话' : interaction.kind === 'event' ? '参加这次活动' : '看看这里'}。`);
      return false;
    }
    if (interaction.kind === 'event') {
      const event = EVENTS.find((candidate) => candidate.id === interaction.eventId);
      return openEpisode(event.id, 'event', state.minute > event.start + 20);
    }
    if (interaction.kind === 'object') return openObject(interaction.locationId);
    const npc = getNPCs().find((candidate) => candidate.id === interaction.characterId);
    const gathering = EVENTS.find((event) => event.day === state.day && state.minute >= event.start && state.minute < event.end && event.locationId === npc.locationId && (event.id !== 'arrival' || npc.id === 'roommate') && state.eventStatus[event.id] === 'available');
    if (gathering) return openEpisode(gathering.id, 'event', state.minute > gathering.start + 20);
    const episode = nextEpisode(npc.id, npc.locationId);
    if (episode) return openEpisode(episode);
    const relationship = state.relationships[npc.id];
    const lines = relationship.clarity === 3 ? [...AMBIENT_LINES[npc.id]] : [`${relationship.knownName ? CHARACTERS[npc.id].name : CHARACTERS[npc.id].unknownName}正在${npc.activity}。`, relationship.clarity ? '你们打了个招呼。眼下各有正在做的事，下次换个时间再聊。' : '先点点头。以后会有合适的时机，慢慢认识。'];
    if (npc.id === 'instructor' && state.flags.instructorFeedback) lines.push('王教官看见你，把刚要喊出口的提醒压低了一些。你们没有完全同意彼此的话，但那句话被听进去了。');
    else if (relationship.trust >= 4 && relationship.knownName) lines.push(npc.id === 'li' ? '“等我收拾一下。今天想往哪边走？”' : npc.id === 'chen' ? '“这个位置先给你留着。你忙你的。”' : npc.id === 'roommate' ? '“我给你留了盏灯，回来不用摸黑。”' : '“来了？站这边，阴凉一点。”');
    state.dialogue = { source: 'ambient', nodeId: npc.id, speakerId: npc.id, title: '路上碰见', lines, choices: [{ text: '一会儿见。' }], stage: 'reaction' };
    return true;
  }

  function closeDialogue() {
    const dialogue = state.dialogue;
    if (!dialogue) return false;
    if (dialogue.source === 'event') {
      state.eventStatus[dialogue.nodeId] = dialogue.stage === 'reaction' ? 'complete' : 'available';
    }
    const elapsed = state.pendingAdvance;
    state.pendingAdvance = 0;
    state.dialogue = null;
    if (dialogue.finishAction === 'ending') finishChapter();
    else if (dialogue.finishAction === 'sleep') sleep(true);
    else if (elapsed) advance(elapsed);
    else syncEvents();
    return true;
  }

  function choose(index) {
    const dialogue = state.dialogue;
    if (!dialogue || !Number.isInteger(index) || !dialogue.choices[index]) return false;
    if (dialogue.stage === 'reaction') return closeDialogue();
    if (dialogue.source === 'object') {
      if (index === 1 || dialogue.action === 'close') return closeDialogue();
      if (dialogue.action === 'uniform') {
        state.flags.uniform = true;
        remember('backup-uniform', '迟到的军训服', '你从宿舍领到了备用军训服。错过迎新，也没有错过接下来开始的日子。');
        dialogue.lines = ['训练服领好了。明天的集合，仍然等着你。'];
      } else if (dialogue.action === 'sleep') {
        dialogue.lines = ['你把鞋放到床边，窗外的声音慢慢远了。', '下一次睁眼，校园又是新的一天。'];
        dialogue.finishAction = 'sleep';
      } else if (dialogue.action === 'ending') {
        dialogue.lines = ['你把训练服叠好。帽檐还是有点歪，衣服却已经不那么陌生了。', '这一页里，有你真正遇见过的人。'];
        dialogue.finishAction = 'ending';
      }
      dialogue.stage = 'reaction';
      dialogue.choices = [{ text: '继续' }];
      return true;
    }
    const episode = dialogue.source === 'event' ? EVENT_EPISODES[dialogue.nodeId] : EPISODES[dialogue.nodeId];
    const selected = episode?.choices[index];
    if (!selected) return false;
    const memoryId = dialogue.source === 'event' ? `event-${dialogue.nodeId}` : dialogue.nodeId;
    const characterId = selected.characterId || (dialogue.source === 'episode' ? episode.speakerId : null);
    const isNew = remember(memoryId, episode.title, selected.memory, characterId);
    if (isNew) {
      if (characterId) {
        const relationship = state.relationships[characterId];
        if (!relationship.memories.includes(memoryId)) relationship.memories.push(memoryId);
        const before = relationship.clarity;
        // Three distinct personal encounters expose the three steps; main events can reveal only the first.
        const personalCount = relationship.memories.filter((id) => EPISODES[id]).length;
        relationship.clarity = Math.max(before, Math.min(3, personalCount), selected.clarity || 0);
        relationship.trust = clamp(relationship.trust + (selected.trust || 0), -10, 20);
        if (selected.knownName) relationship.knownName = true;
        if (relationship.clarity > before) notify(`clear-${memoryId}`, `${relationship.knownName ? CHARACTERS[characterId].name : CHARACTERS[characterId].unknownName}的样子，在这次相遇后清晰了一点。`);
      }
      Object.assign(state.flags, selected.flags || {});
    }
    dialogue.lines = [...selected.reaction];
    dialogue.choices = [{ text: '继续' }];
    dialogue.stage = 'reaction';
    dialogue.selected = index;
    if (dialogue.source === 'event') {
      const event = EVENTS.find((candidate) => candidate.id === dialogue.nodeId);
      state.pendingAdvance = Math.max(0, event.end - state.minute);
    } else state.pendingAdvance = 0;
    return true;
  }

  function recordPractice({ hits = 0, total = 8, skipped = false } = {}) {
    if (state.dialogue?.source !== 'event' || state.dialogue?.nodeId !== 'selection' || state.dialogue?.stage !== 'reaction' || state.flags.selectionChoice !== 'lead' || state.memories.some((memory) => memory.id === 'march-practice')) return false;
    const count = clamp(Math.floor(finite(total, 8)), 1, 32);
    const skip = skipped === true;
    const landed = skip ? 0 : clamp(Math.floor(finite(hits, 0)), 0, count);
    state.flags.practiceHits = landed;
    state.flags.practiceTotal = count;
    state.flags.practiceSkipped = skip;
    const text = skip ? '领队练习时，你选择先看一遍动作。把节奏记住，也是一种开始。' : landed >= 5 ? `领队练习时，你接上了 ${landed}/${count} 拍。脚步慢慢稳下来，也开始听见身后的节奏。` : `领队练习时，你接上了 ${landed}/${count} 拍。有几步没踩准，教官让你放慢一点，再跟上队伍。`;
    remember('march-practice', '脚步与节拍', text);
    const reaction = skip ? ['你先看着队伍走了一遍，没有急着跟上。', '“看明白了，下次再试。”教官给你留在队列里的位置。'] : landed >= 5 ? ['脚步与拍子慢慢合上了。你听见身后的人也跟着稳下来。', '“这个节奏，记住就好。明天还要听着大家一起走。”'] : ['有几步没踩准，你停了一下，又接回队列的节奏。', '“先放慢，不用一次就走好。”旁边有人小声给你数起拍子。'];
    state.dialogue.lines = [...reaction, '回到队列时，室友用鞋尖轻轻碰了碰你的鞋。接下来，你们还会一起练习。'];
    return true;
  }

  function waitUntilNext() {
    if (state.dialogue || state.ending || state.minute >= MINUTE_END) return false;
    const boundaries = [...SCHEDULE_BOUNDARIES, ...EVENTS.filter((event) => event.day === state.day).flatMap((event) => [event.start - 20, event.start, event.end])];
    const next = boundaries.filter((minute) => minute > state.minute + 0.01).sort((a, b) => a - b)[0] || MINUTE_END;
    const elapsed = Math.min(30, next - state.minute);
    advance(elapsed);
    notify(`wait-${state.day}-${Math.floor(state.minute)}`, `稍等了一会儿。现在 ${String(Math.floor(state.minute / 60)).padStart(2, '0')}:${String(Math.floor(state.minute % 60)).padStart(2, '0')}，留意身边的人和今日安排。`);
    return true;
  }

  function sleep(fromDialogue = false) {
    if (state.dialogue || state.ending) return false;
    const dorm = point('dorm');
    if (!fromDialogue && Math.hypot(state.player.x - dorm.x, state.player.y - dorm.y) > INTERACTION_RADIUS + 8) {
      notify('sleep-distance', '回到宿舍附近，再休息吧。');
      return false;
    }
    if (state.day === MAX_DAY && state.flags.graduated) { finishChapter(); return true; }
    if (state.minute < 1140) { notify(`sleep-early-${state.day}`, '现在还早。19:00 后可以回宿舍休息。'); return false; }
    if (state.day === MAX_DAY) { finishChapter(); return true; }
    // Account for missed windows before moving the calendar; no offline time is added.
    state.minute = MINUTE_END;
    syncEvents();
    state.day += 1;
    state.minute = MINUTE_START;
    state.player = { x: dorm.x, y: dorm.y + 5 };
    state.visited.dorm = state.day;
    notify(`morning-${state.day}`, `九月${state.day}日，07:00。${DAYS[state.day - 1].title}。${getSchedule()[0]?.description || ''}`);
    syncEvents();
    return true;
  }

  syncEvents();
  return { state, advance, setPlayer, getNPCs, getSchedule, getAvailableInteractions, interact, choose, dismissDialogue: closeDialogue, waitUntilNext, sleep, recordPractice, getMemories: () => copy(state.memories), serialize: () => JSON.stringify(state) };
}
