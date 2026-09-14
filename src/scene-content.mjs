/**
 * Shot plans for 那个谁. This module describes presentation only: it never commits
 * a choice, changes a relationship, or advances the campus clock.
 */
import { CHARACTERS, LOCATIONS, EVENTS, EPISODES, EVENT_EPISODES } from './content.mjs';

export const SCENE_GESTURES = Object.freeze(['idle', 'wave', 'offer', 'reach', 'nod', 'listen', 'step', 'clap', 'sway', 'fold', 'point', 'write']);
export const SCENE_FOCUSES = Object.freeze(['wide', 'person', 'detail']);
export const SCENE_PROPS = Object.freeze(['none', 'hanger', 'suitcase', 'cap', 'cap-buckle', 'receipt', 'book', 'map', 'tray', 'phone', 'bottle', 'bottle-note', 'whistle', 'notebook', 'earphones', 'water-bucket', 'uniform', 'shoes', 'bench', 'watch']);

const own = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
const isCharacter = (id) => typeof id === 'string' && own(CHARACTERS, id);
const isLocation = (id) => LOCATIONS.some((location) => location.id === id);
const isRecord = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const shot = (focus, gesture = 'idle', prop = 'none', actionLabel) => ({ focus, gesture, prop, ...(actionLabel ? { actionLabel } : {}) });
const W = (gesture = 'idle', prop = 'none', label) => shot('wide', gesture, prop, label);
const P = (gesture = 'listen', prop = 'none', label) => shot('person', gesture, prop, label);
const D = (gesture = 'idle', prop = 'none', label) => shot('detail', gesture, prop, label);
const A = (descriptor, actor, propOwner) => ({ ...descriptor, actor, ...(propOwner ? { propOwner } : {}) });

// An observational label never promises the player's still-unselected response.
// Gestures before a choice depict only actions that the dialogue already states.
const SCENES = {
  'li-first': {
    locationId: 'field', nearby: ['field', 'shade'], prop: 'cap', cast: ['li'],
    choice: [D('idle', 'cap-buckle', '看看收到底的帽扣'), P('nod', 'cap')],
    reaction: [
      [A(D('fold', 'cap-buckle', '看看折进帽带的扣子'), 'player', 'player'), P('nod', 'cap')],
      [A(D('reach', 'uniform', '看看过长的衣角'), 'player', 'player'), P('nod', 'uniform')],
      [W('listen', 'cap', '听一会儿树叶声'), P('nod', 'cap')],
    ],
  },
  'li-name': {
    locationId: 'shade', prop: 'bottle', cast: ['li'],
    choice: [W('wave', 'bench', '看看长椅留下的空位'), P('listen', 'cap'), D('idle', 'bottle')],
    reaction: [
      [P('nod', 'bottle', '听清约好的时间'), D('write', 'phone')],
      [P('listen', 'bottle', '再听一会儿'), W('listen', 'bench')],
      [P('listen', 'bottle', '留意没说出口的半句话'), P('nod', 'cap')],
    ],
  },
  'li-understand': {
    locationId: 'field', prop: 'watch', cast: ['li'],
    choice: [W('idle', 'watch', '看看没有按下的计时键'), P('listen', 'watch'), P('listen', 'cap')],
    reaction: [
      [D('reach', 'watch', '看看收进口袋的手表'), W('point', 'none', '看看跑道旁的树影'), W('step', 'none')],
      [P('listen', 'watch', '让这句话慢一点落下'), W('listen', 'bench')],
      [P('nod', 'watch', '听完没讲完的话'), W('listen', 'none')],
    ],
  },
  'chen-first': {
    locationId: 'library', prop: 'receipt', cast: ['chen'],
    choice: [W('idle', 'receipt', '看看被风翻起的小票'), D('idle', 'map')],
    reaction: [
      [A(D('offer', 'receipt', '看看当作书签的小票'), 'player', 'player'), D('point', 'receipt')],
      [P('listen', 'map', '看看地图上的树荫'), D('offer', 'map')],
      [D('idle', 'book', '看看停下来的书页'), W('offer', 'book')],
    ],
  },
  'chen-name': {
    locationId: 'library', prop: 'book', cast: ['chen'],
    choice: [W('idle', 'book', '看看停在同一页的书'), P('listen', 'receipt'), P('listen', 'book')],
    reaction: [
      [W('offer', 'book', '看看腾出的椅子'), D('point', 'map')],
      [P('offer', 'map', '看看摊开的新地图'), D('point', 'map')],
      [P('listen', 'book', '听清那句停顿'), W('wave', 'book')],
    ],
  },
  'chen-understand': {
    locationId: 'shade', prop: 'notebook', cast: ['chen'],
    choice: [W('listen', 'earphones', '听一听耳机漏出的鼓点'), P('listen', 'earphones'), D('idle', 'notebook')],
    reaction: [
      [P('listen', 'notebook', '把这两句听完'), P('nod', 'notebook')],
      [P('nod', 'map', '看看地图留白的地方'), D('write', 'map')],
      [P('listen', 'notebook', '留一点安静给这句话'), D('fold', 'notebook')],
    ],
  },
  'roommate-first': {
    locationId: 'dorm', prop: 'hanger', cast: ['roommate'],
    choice: [W('idle', 'hanger', '听听碰在一起的衣架'), P('listen', 'suitcase')],
    reaction: [
      [A(D('point', 'notebook', '看看对上了的床号'), 'player', 'player'), D('sway', 'hanger')],
      [P('nod', 'suitcase', '留意放松下来的肩膀'), W('reach', 'suitcase')],
      [P('nod', 'suitcase', '看看一直提着的行李'), D('reach', 'suitcase')],
    ],
  },
  'roommate-name': {
    locationId: 'canteen', prop: 'tray', cast: ['roommate'],
    choice: [W('idle', 'tray', '看看绕了两圈的餐盘'), P('listen', 'tray')],
    reaction: [
      [D('reach', 'phone', '看看收起来的食堂攻略'), D('offer', 'tray')],
      [P('listen', 'tray', '听完这句解释'), W('nod', 'tray')],
      [D('write', 'phone', '看看刚发出的桌号'), P('nod', 'tray')],
    ],
  },
  'roommate-understand': {
    locationId: 'dorm', prop: 'phone', cast: ['roommate'],
    choice: [D('idle', 'phone', '看看已经结束的通话'), W('listen', 'shoes', '听一会儿走廊里的声音'), P('listen', 'phone')],
    reaction: [
      [D('reach', 'phone', '看看暗下来的屏幕'), P('nod', 'none', '把那句普通的话听完'), W('listen', 'none')],
      [P('nod', 'shoes', '听清这次不赶时间的约定'), W('step', 'shoes')],
      [W('listen', 'shoes', '看看身旁留出的那点位置'), P('listen', 'phone')],
    ],
  },
  'instructor-first': {
    locationId: 'field', nearby: ['field', 'shade'], prop: 'bottle', cast: ['instructor'],
    choice: [W('reach', 'bottle', '看看落进阴影的水杯'), P('listen', 'bottle')],
    reaction: [
      [P('nod', 'bottle', '听听口令之外的语气'), P('listen', 'whistle')],
      [P('listen', 'notebook', '把归队的说明听清'), D('write', 'notebook')],
      [P('offer', 'water-bucket', '看看留下的那只满桶'), A(D('reach', 'water-bucket'), 'player', 'player')],
    ],
  },
  'instructor-name': {
    locationId: 'shade', prop: 'bottle-note', cast: ['instructor'],
    choice: [D('idle', 'bottle-note', '看看一大一小的手写字'), P('listen', 'bottle-note'), P('nod', 'bottle')],
    reaction: [
      [D('point', 'bottle-note', '看看纸边多贴的一层胶带'), P('reach', 'bottle')],
      [P('listen', 'bottle-note', '听完这个接水的小问题'), P('nod', 'bottle')],
      [P('nod', 'bottle-note', '看看被留住的纸角'), D('reach', 'bottle-note')],
    ],
  },
  'instructor-understand': {
    locationId: 'shade', prop: 'notebook', cast: ['instructor'],
    choice: [D('write', 'notebook', '看看名单旁的小字'), P('listen', 'shoes'), P('listen', 'notebook')],
    reaction: [
      [P('nod', 'notebook', '让这句回答停一会儿'), D('fold', 'notebook')],
      [P('offer', 'notebook', '看看递来的笔和名单'), A(D('write', 'notebook'), 'player', 'player')],
      [P('listen', 'notebook', '留意回应前的停顿'), D('write', 'notebook')],
    ],
  },
  arrival: {
    locationId: 'gate', prop: 'uniform', cast: ['roommate'],
    choice: [W('offer', 'uniform', '看看纸箱里没拆完的衣服'), D('idle', 'notebook')],
    reaction: [
      [A(D('fold', 'uniform', '看看重新理齐的尺码'), 'player', 'player'), P('offer', 'uniform')],
      [A(D('reach', 'uniform', '看看还带着折痕的衣角'), 'player', 'player'), P('nod', 'notebook')],
    ],
  },
  standing: {
    locationId: 'field', prop: 'cap', cast: ['li', 'instructor', 'roommate'],
    choice: [W('idle', 'shoes', '留意停在队列边的影子'), P('sway', 'cap')],
    reaction: [
      [A(W('wave', 'whistle', '看看队列留出的通道'), 'instructor'), P('nod', 'bottle')],
      [P('nod', 'bottle', '听清对方答应的那一声'), W('step', 'cap')],
      [A(W('step', 'shoes', '看看让出的半步'), 'player'), P('nod', 'cap')],
    ],
  },
  singing: {
    locationId: 'field', prop: 'none', cast: ['chen', 'roommate', 'li', 'instructor'],
    choice: [W('listen', 'none', '听一听停下来的起哄声'), D('idle', 'none', '留意膝盖上轻轻的拍子'), P('listen', 'none')],
    reaction: [
      [A(W('wave', 'none', '听听接上来的第二个声音'), 'player'), P('clap', 'none')],
      [A(D('clap', 'none', '看看相互接上的拍子'), 'player'), W('clap', 'none')],
      [A(W('clap', 'none', '把掌声留到歌唱完'), 'player'), P('listen', 'none')],
    ],
  },
  selection: {
    locationId: 'field', prop: 'shoes', cast: ['instructor', 'roommate', 'li', 'chen'],
    choice: [W('idle', 'shoes', '看看方阵散开的半步'), D('idle', 'shoes', '留意有人偷偷练的摆臂'), P('listen', 'whistle')],
    reaction: [
      [A(W('step', 'shoes', '听听跟在身后的脚步'), 'player'), P('nod', 'whistle', '把这一句提醒听完'), A(D('step', 'shoes'), 'roommate')],
      [A(P('nod', 'shoes', '等对方把意愿说清楚'), 'roommate'), A(W('clap', 'shoes'), 'player')],
      [A(W('step', 'shoes', '看看最后一排的节奏'), 'player'), A(W('point', 'shoes'), 'player')],
    ],
  },
  closing: {
    locationId: 'field', prop: 'whistle', cast: ['instructor', 'roommate', 'li', 'chen'],
    choice: [W('step', 'none', '看看偏向另一边的树影'), D('reach', 'whistle', '看看收进口袋的哨子'), W('wave', 'none')],
    reaction: [
      [A(D('fold', 'bench', '看看最后收好的椅子'), 'player'), W('listen', 'water-bucket')],
      [W('wave', 'none', '听听人群里的明天见'), W('listen', 'none')],
      [W('listen', 'none', '看看那片已经走熟的树荫'), W('idle', 'none')],
    ],
  },
};

const LOCATION_PROPS = { dorm: 'hanger', library: 'book', canteen: 'tray', field: 'shoes', shade: 'bench', gate: 'uniform' };
const LOCATION_AMBIENCE = {
  dorm: ['走廊里传来行李箱轮子的声音。', '走廊的声音放轻了，门缝里留着灯。'],
  library: ['风从半开的窗进来，书页轻轻动了一下。', '阅览区的灯亮着，翻页声隔着几张桌子。'],
  canteen: ['餐盘轻轻相碰，窗口里冒着热气。', '晚饭的人渐渐少了，水汽还留在窗口。'],
  field: ['跑道晒得发亮，哨声和脚步声隔着一段距离。', '路灯沿着跑道亮起来，脚步落得清楚。'],
  shade: ['叶影落在长椅上，水杯盖轻轻碰了一声。', '长椅边有一点晚风，远处的声音近了些。'],
  gate: ['迎新横幅翻起一角，纸箱边有人慢慢排队。', '校门口的灯亮着，风把横幅翻起一角。'],
};

function nearestLocation(state) {
  const x = state?.player?.x;
  const y = state?.player?.y;
  if (!Number.isFinite(x) || !Number.isFinite(y)) return 'field';
  return [...LOCATIONS].sort((a, b) => Math.hypot(a.x - x, a.y - y) - Math.hypot(b.x - x, b.y - y))[0].id;
}

function genericShot(text, index, count, prop, reaction) {
  const focus = count === 1 ? 'person' : index === 0 ? 'wide' : index === count - 1 ? 'person' : 'detail';
  let gesture = 'listen';
  if (reaction && /叠好|合上|收好/.test(text)) gesture = 'fold';
  else if (/挥手|招手|下次见|一会儿见/.test(text)) gesture = 'wave';
  else if (/点点头|点了点头/.test(text)) gesture = 'nod';
  return shot(focus, gesture, prop, index < count - 1 ? '留意眼前这一小会儿' : undefined);
}

function contextShot(text, index, count, prop) {
  if (/来得晚|归队/.test(text)) return A(W('step', 'shoes', '看看队尾留出的空位'), 'player');
  if (/吃了早饭|面包袋/.test(text)) return D('offer', 'none', '看看已经空了的早餐袋');
  if (/打拍子|起头/.test(text)) return P('nod', 'none', '留意认出彼此的那个停顿');
  if (/谢谢|站我旁边/.test(text)) return P('wave', 'cap', '看看认出你时抬起的帽檐');
  return genericShot(text, index, count, prop, false);
}

function objectShot(dialogue, text, index, count, prop) {
  const reaction = dialogue.stage === 'reaction';
  if (reaction && dialogue.action === 'ending') return index === 0 ? A(D('fold', 'uniform', '看看叠好的训练服'), 'player', 'player') : W('listen', 'uniform');
  if (reaction && dialogue.action === 'sleep') return index === 0 ? A(D('reach', 'shoes', '看看床边摆好的鞋'), 'player', 'player') : W('idle', 'none');
  if (dialogue.action === 'uniform') return index === 0 && count > 1 ? W('idle', 'uniform', '看看窗边的备用训练服') : P(reaction ? 'offer' : 'listen', 'uniform');
  if (dialogue.action === 'ending') return index === 0 ? W('idle', 'uniform', '看看窗边晾着的训练服') : D('idle', 'uniform');
  return genericShot(text, index, count, prop, reaction);
}

/**
 * The plan is a fresh, JSON-serializable object, safe to rebuild on every render
 * or after a save resumes on a reaction page. Input dialogue lines are preserved.
 */
export function getScenePlan(dialogue, state = {}) {
  const current = isRecord(dialogue) ? dialogue : {};
  const world = isRecord(state) ? state : {};
  const nodeId = typeof current.nodeId === 'string' ? current.nodeId : 'unknown';
  const source = typeof current.source === 'string' ? current.source : 'ambient';
  const reaction = current.stage === 'reaction';
  const stage = reaction ? 'reaction' : 'choice';
  const selected = Number.isInteger(current.selected) && current.selected >= 0 ? current.selected : -1;
  const config = own(SCENES, nodeId) && ['episode', 'event'].includes(source) ? SCENES[nodeId] : null;
  const authored = source === 'event' && own(EVENT_EPISODES, nodeId) ? EVENT_EPISODES[nodeId] : source === 'episode' && own(EPISODES, nodeId) ? EPISODES[nodeId] : null;
  const event = source === 'event' ? EVENTS.find((item) => item.id === nodeId) : null;
  const nearby = nearestLocation(world);
  const locationId = event?.locationId || (source === 'object' && isLocation(nodeId) ? nodeId : config?.nearby?.includes(nearby) ? nearby : config?.locationId || nearby);
  const prop = config?.prop || LOCATION_PROPS[locationId];
  const speakerId = isCharacter(current.speakerId) ? current.speakerId : isCharacter(authored?.speakerId) ? authored.speakerId : null;
  const cast = [...new Set([speakerId, ...(config?.cast || [])].filter(isCharacter))];
  const lines = Array.isArray(current.lines) ? current.lines.filter((line) => typeof line === 'string') : [];
  const authoredLines = reaction ? authored?.choices[selected]?.reaction : authored?.lines;
  const descriptors = reaction ? config?.reaction[selected] : config?.choice;
  const flags = isRecord(world.flags) ? world.flags : {};
  const practice = nodeId === 'selection' && reaction && selected === 0 && typeof flags.practiceSkipped === 'boolean' && Number.isFinite(flags.practiceHits);
  const beats = lines.map((text, index) => {
    const authoredIndex = authoredLines?.indexOf(text) ?? -1;
    let descriptor;
    if (source === 'object') descriptor = objectShot(current, text, index, lines.length, prop);
    else if (practice) {
      if (index === 0) descriptor = A(W(flags.practiceSkipped ? 'listen' : flags.practiceHits >= 5 ? 'step' : 'sway', 'shoes', flags.practiceSkipped ? '先看清队列里的脚步' : '听听这一次实际走出的拍子'), 'player');
      else descriptor = index === lines.length - 1 ? A(D('step', 'shoes'), 'roommate') : P('nod', 'whistle', '把这句提醒听完');
    } else if (authoredIndex >= 0 && descriptors?.[authoredIndex]) descriptor = descriptors[authoredIndex];
    else if (authoredIndex < 0 && !reaction && config) descriptor = contextShot(text, index, lines.length, prop);
    else descriptor = genericShot(text, index, lines.length, prop, reaction);
    const beat = { text, ...descriptor };
    // The final frame belongs to the existing narrative choices/Continue button.
    if (index === lines.length - 1) delete beat.actionLabel;
    return beat;
  });
  return {
    id: `${source}:${nodeId}:${stage}:${selected}`,
    locationId,
    ambience: LOCATION_AMBIENCE[locationId][Number.isFinite(world.minute) && world.minute >= 1140 ? 1 : 0],
    title: typeof current.title === 'string' ? current.title : authored?.title || '校园里的片刻',
    prop,
    cast,
    beats,
  };
}
