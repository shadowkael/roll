import { S, clearProgress } from './state.js';
import { addTimer } from './engine.js';
import { SFX } from './sfx.js';
import { switchScene, addLine } from './ui.js';

export function showEnding() {
  SFX.stopAllAmbient();
  switchScene('ending', () => {
    SFX.endingAmbient();
    const el = document.getElementById('ending');
    el.innerHTML = '';
    el.scrollTop = 0;
    let delay = 500;

    const comboRegret = getComboRegret();
    if (comboRegret) {
      addLine(el, comboRegret, 'regret-line', delay);
      delay += 3000;
    }

    addLine(el, getS1Regret(), 'regret-line', delay);
    delay += 3000;

    const genRegrets = [
      '军训结束那天，你和教官合了影。你站在后排。照片里你笑得不太自然——但你确实在笑',
      '你后来翻过军训的照片。你记得那天很热。但你不记得谁站在你旁边',
    ];
    addLine(el, genRegrets[Math.floor(Math.random() * genRegrets.length)], 'regret-line', delay);
    delay += 3500;

    const div = document.createElement('p');
    div.textContent = '— — —';
    div.className = 'regret-line';
    div.style.color = 'var(--dimmer)';
    el.appendChild(div);
    addTimer(() => div.classList.add('show'), delay);
    delay += 2000;

    getReveals().forEach(r => {
      addLine(el, r, 'reveal', delay);
      delay += 3000;
    });

    delay += 1000;
    addLine(el, '你终于看清了自己。', 'reveal', delay);
    delay += 3500;

    const t1 = document.createElement('p');
    t1.className = 'end-title';
    t1.textContent = '那个谁';
    el.appendChild(t1);
    addTimer(() => t1.classList.add('show'), delay);
    delay += 800;

    const t2 = document.createElement('p');
    t2.className = 'end-sub';
    t2.textContent = '军 训 篇 · 完';
    el.appendChild(t2);
    addTimer(() => t2.classList.add('show'), delay);
    delay += 800;

    const btn = document.createElement('button');
    btn.className = 'restart-btn';
    btn.textContent = '再 玩 一 次';
    btn.onclick = () => {
      SFX.stopAllAmbient();
      clearProgress();
      location.reload();
    };
    el.appendChild(btn);
    addTimer(() => btn.classList.add('show'), delay);
  });
}

function getComboRegret() {
  const s1 = S.s1Choice;
  const s2 = S.s2Choice;
  const s3 = S.s3Choice;
  const map = {
    AAC: '你一直站在最前面。后来你累了，但你不好意思退',
    AAF: '你出了两次头，第三次没接住。有人说你"虎头蛇尾"',
    CAC: '你在最后一刻站出来了。但没人知道你之前去了哪里',
    CCC: '三天，你什么都没说。后来你想了想，你觉得那是你最安静的三天',
    BCF: '你扶过一次人。但后来很多次你都没伸手。你在想哪次更像你',
    ACA: '你站出来了，又安静了，又站出来了。别人看不懂你，你自己也看不懂',
  };
  const s3Key = s3 === 'A'
    ? (S.rhythmResult === 'pass' ? 'C' : 'F')
    : (s3 === 'B' ? 'C' : 'C');
  const lookup = (s1 || 'C') + (s2 || 'C') + s3Key;
  return map[lookup] || null;
}

function getS1Regret() {
  const map = {
    A: '你报告了教官。同学后来好了。但他看你的眼神变了——他不知道是该感谢你，还是觉得你多事',
    B: '你撑了他一把。他没说什么。但你发现你的迷彩服肩膀那块湿了——不知道是汗还是什么',
    C: '你挪了半步。什么也没发生。但那天晚上你想：如果我没挪那半步呢',
  };
  return map[S.s1Choice] || map.C;
}

function getReveals() {
  const r = [];
  if (S.s1Choice === 'A' || S.s1Choice === 'B') {
    r.push('你后来知道他叫李明。帽子上的那个"李"字，你当时差一点就读出来了。');
  } else {
    r.push('你没看清摇晃同学的脸');
  }
  if (S.s2Choice === 'A') {
    r.push('他后来告诉你，那天拉歌他紧张得手心全是汗。但你站起来的那一刻，他觉得松了一口气。');
  }
  if (S.s2Choice !== 'C') {
    r.push('他叫张磊。后来你们在一个食堂吃饭，他说"那天我想站出来来着"。你笑了笑，没说话。');
  }
  r.push('教官姓王。你后来在操场上遇到过他好几次。每次他都会微微点头。');
  r.push('你室友叫……你想了很久。最后你想起来了。你记得他打呼噜的声音比记得他的脸清楚。');
  return r;
}
