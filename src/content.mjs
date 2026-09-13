/** Narrative data for 那个谁. Dates are September 1–5, minutes are campus time. */
export const LOCATIONS = [
  { id: 'dorm', name: '宿舍', description: '窗台还空着。走廊里是行李箱的轮子声。', x: 20, y: 22 },
  { id: 'library', name: '图书馆', description: '公共阅览区已经开放。新书页和空调的气味。', x: 68, y: 20 },
  { id: 'canteen', name: '食堂', description: '第一食堂。还没有人知道哪一个窗口最好吃。', x: 75, y: 55 },
  { id: 'field', name: '操场', description: '跑道围住一大片九月的阳光。哨声从这里传开。', x: 27, y: 68 },
  { id: 'shade', name: '树荫', description: '长椅只晒到一半。拧开水杯，能听见远处练习的口令。', x: 45, y: 50 },
  { id: 'gate', name: '校门', description: '迎新横幅被风翻起。进来的路，也可以慢慢走熟。', x: 18, y: 88 },
];

export const CHARACTERS = {
  li: { id: 'li', name: '李屿', unknownName: '歪帽檐同学', description: '总把帽檐往下压。跑步时，却不看脚下。', color: '#759280', portrait: null, habits: ['清早常去跑道', '训练后到树荫歇脚', '傍晚仍会回来慢跑'] },
  chen: { id: 'chen', name: '陈可', unknownName: '抱书的同学', description: '用旧收据作书签，页角压得很平。', color: '#bd9475', portrait: null, habits: ['午后喜欢图书馆', '午饭吃得有点晚', '晚上有时在树荫听歌'] },
  roommate: { id: 'roommate', name: '周舟', unknownName: '新室友', description: '认路时很笃定，停下后又悄悄看手机。', color: '#9a91af', portrait: null, habits: ['早晨在宿舍整理东西', '饭点常在食堂', '熄灯前回宿舍'] },
  instructor: { id: 'instructor', name: '王教官', unknownName: '教官', description: '哨绳缠在手指上，水壶上贴着一张手写纸条。', color: '#768574', portrait: null, habits: ['上午在操场整队', '午后在树荫整理名单', '晚间沿操场检查'] },
};

export const DAYS = [
  { day: 1, title: '初来乍到', subtitle: '先把这里，走成自己的校园。' },
  { day: 2, title: '九月的太阳', subtitle: '队列里，站着许多还不认识的人。' },
  { day: 3, title: '声音汇在一起', subtitle: '有的人擅长大声，有的人擅长接住停顿。' },
  { day: 4, title: '向前一步', subtitle: '站在哪里，都可以有自己的理由。' },
  { day: 5, title: '解散以后', subtitle: '那个谁，渐渐有了具体的样子。' },
];

export const EVENTS = [
  { id: 'arrival', day: 1, start: 960, end: 1050, title: '领取军训服', locationId: 'gate', description: '迎新处 16:00 发放军训服。晚到可在宿舍领取备用套装。' },
  { id: 'standing', day: 2, start: 540, end: 690, title: '站军姿', locationId: 'field', description: '09:00 操场集合。带好水，穿上昨天领到的训练服。' },
  { id: 'singing', day: 3, start: 960, end: 1080, title: '拉歌', locationId: 'field', description: '16:00 两个方阵在操场碰面。声音里也有认识人的机会。' },
  { id: 'selection', day: 4, start: 540, end: 660, title: '领队选拔', locationId: 'field', description: '09:00 练习行进与领队。自荐、协助、留在队列都可以。' },
  { id: 'closing', day: 5, start: 990, end: 1110, title: '结营集合', locationId: 'field', description: '16:30 最后一次整队。散场后还留有道别的时间。' },
];

// These fixed time blocks drive both movement schedules and the next-change hint.
export const SCHEDULE_BOUNDARIES = [420, 540, 690, 810, 930, 1050, 1140, 1230, 1320];
export const ROUTINES = {
  li: [
    ['field', '沿跑道慢跑'], ['field', '练习站姿'], ['shade', '坐在树荫里喝水'], ['dorm', '午休'],
    ['shade', '把帽子晾在膝上'], ['field', '沿外圈慢跑'], ['canteen', '吃一份迟来的晚饭'], ['dorm', '清洗训练服'],
  ],
  chen: [
    ['canteen', '边吃早饭边看通知'], ['library', '在公共区读书'], ['canteen', '找靠窗的空位'], ['library', '翻一本很厚的书'],
    ['library', '抄下借阅信息'], ['canteen', '排队买汤'], ['shade', '听远处传来的声音'], ['dorm', '夹好明天要看的书页'],
  ],
  roommate: [
    ['dorm', '对着清单整理东西'], ['gate', '确认集合路线'], ['canteen', '端着餐盘找座位'], ['dorm', '晾洗好的衣服'],
    ['canteen', '研究饮料柜'], ['canteen', '纠结今天吃什么'], ['dorm', '坐在门口给家里打电话'], ['dorm', '把拖鞋排得整整齐齐'],
  ],
  instructor: [
    ['field', '检查场地'], ['field', '领队练习'], ['shade', '整理训练名单'], ['shade', '检查请假条'],
    ['field', '调整方阵标线'], ['shade', '收拾训练器材'], ['field', '沿跑道慢慢走'], ['gate', '确认明日的安排'],
  ],
};

// Each episode is a unique remembered encounter. Repeating it never raises clarity.
export const EPISODES = {
  'li-first': {
    speakerId: 'li', title: '帽檐有一点歪',
    lines: ['那个人正试着把帽子调小。扣带已经收到最短了。', '“是不是只有我的头装不满这顶帽子？”说完，那个人先笑了一下。'],
    choices: [
      { text: '把多出来的扣带折进去试试。', reaction: ['扣带终于不再戳着后脑。', '“有用。谢谢。”那个人又扶了扶帽檐，这次没有躲开你的视线。'], trust: 1, memory: '你记住了一个总在扶帽檐的人，也一起解决了一个很小的问题。' },
      { text: '我的衣服也像借来的。', reaction: ['你们各自拽了拽不合身的衣角。', '“那就当我们还有很大的成长空间。”你们笑了一会儿。'], trust: 1, memory: '你们站在跑道边，拿不合身的训练服开了同一个玩笑。' },
      { text: '点点头，陪着站一会儿。', reaction: ['风替你们接上了没说完的话。那个人低头把帽子戴好。', '“我每天早上都来跑一圈。这里人少。”'], trust: 0, memory: '你没有急着接话。对方告诉你，清早的跑道很安静。' },
    ],
  },
  'li-name': {
    speakerId: 'li', title: '树荫下的一小块空位',
    lines: ['那顶歪帽子先于人招了招手。长椅上给你让出一点位置。', '“我叫李屿，岛屿的屿。之前站队的时候，一直没顾上说。”', '李屿把水杯盖拧了两次才拧上。“今天又忘记吃早饭。我老觉得以前校队的底子还在。”'],
    choices: [
      { text: '下次去食堂的时候，可以一起。', reaction: ['“七点一刻？要是我又跑过头了，你不用等。”', '李屿把时间记在了手机里。闹钟名字叫：先吃饭。'], trust: 2, knownName: true, flags: { liBreakfast: true }, memory: '树荫下，你知道了李屿的名字。你们约好跑步之前先吃早饭。' },
      { text: '以前练什么？', reaction: ['“一千五。高中跑的。大学嘛……还没想好。”', '那双一直盯着跑道的眼睛，这次看向了树外。'], trust: 1, knownName: true, memory: '李屿说起高中练过的一千五百米。到了大学，要不要继续还没有答案。' },
      { text: '身体不舒服时，停下来也没关系。', reaction: ['李屿先想反驳，又把话咽了回去。', '“嗯。我好像不太会这个。”帽檐终于没有压得那么低。'], trust: 0, knownName: true, memory: '你没有顺着李屿逞强的话说下去。李屿承认，自己不太会停下来。' },
    ],
  },
  'li-understand': {
    speakerId: 'li', title: '没有计时的这一圈',
    lines: ['傍晚的跑道，李屿站在起点，却没有按下手表。', '“以前大家记得我，都是因为我跑得快。”', '“来这里以后，别人一说‘那个体育生’，我就忍不住再多跑一圈。可我其实还想去看看摄影社。”'],
    choices: [
      { text: '这圈我们走吧。你想拍什么？', reaction: ['李屿把手表收进口袋，跟上你的步子。', '“先拍这棵树。每天经过，它的影子居然都不一样。”', '你第一次发现，李屿也会在跑道上走得很慢。'], trust: 2, knownName: true, flags: { liWalk: true }, memory: '你和李屿走完了没有计时的一圈。比起跑得快，李屿也想学着看得仔细。' },
      { text: '你不必一直证明这个。', reaction: ['“说起来容易。”李屿停了停，“不过，听见别人这么说，也还不错。”', '这次没有继续加练。你们在起点坐到路灯亮起来。'], trust: 1, knownName: true, memory: '李屿没有立刻放下对成绩的在意，但那天傍晚，终于少跑了一圈。' },
      { text: '我可能不太懂，但愿意听你讲。', reaction: ['“不懂也没关系。”', '李屿从第一次跑比赛讲起，也讲到那个没去成的摄影展。路灯亮了，话还没讲完。'], trust: 1, knownName: true, memory: '李屿讲了比赛，也讲了摄影。你认识的这个人，开始有了跑道以外的部分。' },
    ],
  },
  'chen-first': {
    speakerId: 'chen', title: '书页里的小票',
    lines: ['图书馆的桌角，一张小票被风吹落。抱书的人伸手没够到。', '书摊在《大学物理》那一页，里面却夹着一张手绘的校园地图。'],
    choices: [
      { text: '捡起来，压在书边。', reaction: ['“谢谢。它是书签，也是我今天吃过午饭的证据。”', '你注意到小票上画了一只睡着的猫。'], trust: 1, memory: '你替抱书的同学捡起书签。那是一张画着睡猫的食堂小票。' },
      { text: '这张地图是你画的吗？', reaction: ['“官方地图没有标哪边有树荫。”', '对方把地图推近一点。图书馆到食堂，画着一条歪歪的捷径。'], trust: 1, memory: '抱书的同学画了一张私人校园地图，标的都是阴凉和可以停下来的地方。' },
      { text: '把窗户关小一些。', reaction: ['翻动的书页停了下来。', '对方抬头，说了一声很轻的“谢谢”，把另一张椅子拉开了。'], trust: 0, memory: '你把窗户关小了一点。那一下午，书页终于不再自己往后翻。' },
    ],
  },
  'chen-name': {
    speakerId: 'chen', title: '不是每一页都看懂了',
    lines: ['你又在那张桌子旁看见抱书的同学。今天的书，一页都没翻。', '“又见面了。我叫陈可，可以的可。”', '“家里人都觉得我肯定能适应。其实我来图书馆，是因为这里不用马上和谁熟起来。”'],
    choices: [
      { text: '我们可以各看各的。', reaction: ['陈可把对面的椅子清出来。', '你们安静坐了一会儿。中间有人笑了一声，是陈可在地图上画错了食堂。'], trust: 2, knownName: true, flags: { chenQuiet: true }, memory: '陈可说，来图书馆有时只是想安静一下。你们约定，各看各的也算一起。' },
      { text: '我也还没走熟这座校园。', reaction: ['“那我可以给你看这一版。”', '陈可展开的地图上，终于多了一条通往操场的路。'], trust: 1, knownName: true, memory: '你们交换了不熟悉校园的小事。陈可的地图上，多了一条通往操场的路。' },
      { text: '那我不打扰了，下次见。', reaction: ['“不是赶你走的意思。”陈可停了一下，“不过谢谢你问也没问，就理解了。”', '离开时，你听见了一句清楚的“下次见”。'], trust: 1, knownName: true, memory: '你尊重了陈可想安静待着的时间。分别时，那句“下次见”很清楚。' },
    ],
  },
  'chen-understand': {
    speakerId: 'chen', title: '藏在书后的声音',
    lines: ['树荫下，陈可摘掉了一边耳机。里面传出一段鼓点。', '“拉歌那天，我其实很想试试。可是别人都说，读书厉害的人肯定不会这些。”', '陈可翻开笔记本。最后几页写的全是歌词和舞台草图。'],
    choices: [
      { text: '愿意唱一点给我听吗？不想也没关系。', reaction: ['陈可想了一会儿，低低唱了自己写的两句。', '没有起哄，也没有评分。唱完，陈可先笑了起来。'], trust: 2, knownName: true, flags: { chenSang: true }, memory: '长椅边，陈可唱了写在笔记本最后的两句。那本书后面，还藏着一个小舞台。' },
      { text: '原来你的地图还缺一个排练室。', reaction: ['“对。而且要隔音好一点。”', '你们在地图空白处画了一颗星。位置还不知道，但已经给它留好了。'], trust: 2, knownName: true, memory: '你们在陈可的私人地图上，为还没找到的排练室留了一颗星。' },
      { text: '不用马上让所有人都知道。', reaction: ['“嗯。我先让一个人知道了。”', '陈可合上本子，肩膀比刚才松了一点。'], trust: 1, knownName: true, memory: '陈可没有立刻走上舞台，只先把那几页歌词给你看了。' },
    ],
  },
  'roommate-first': {
    speakerId: 'roommate', title: '先认一下床位',
    lines: ['宿舍门敞着。一个人抱着晾衣架，在两张床之间犹豫。', '“这边是不是你的？我刚刚把门牌看反了，差点去隔壁住。”'],
    choices: [
      { text: '没事，我们再看一遍名单。', reaction: ['你们把名单贴到门后，终于对上了所有床号。', '晾衣架靠在一起，叮叮当当地响。'], trust: 1, memory: '入学那天，你和新室友一起核对床号。晾衣架的声音比自我介绍先到。' },
      { text: '我刚才也差点走错。', reaction: ['“太好了……不是，我是说，原来不止我。”', '那个人把包放下，空房间像是忽然小了一点。'], trust: 1, memory: '你们发现彼此都走错过门。新宿舍里，第一场笑发生得很自然。' },
      { text: '先把东西放下吧。', reaction: ['“对，我一路都没舍得放下。”', '包落地时，对方长长呼了一口气。'], trust: 0, memory: '你提醒新室友先把行李放下。有些紧绷，是从肩膀开始松开的。' },
    ],
  },
  'roommate-name': {
    speakerId: 'roommate', title: '食堂里的方向感',
    lines: ['食堂里，你认出了宿舍的那件外套。对方端着餐盘转了第二圈。', '“我叫周舟，小舟的舟。刚说好帮大家占座，结果我先迷了路。”'],
    choices: [
      { text: '这边有位子，先坐下。', reaction: ['周舟把手机里的“食堂攻略”关了。', '“那我们先把这一家吃明白。”桌上的餐盘挨近了一点。'], trust: 2, knownName: true, flags: { roommateSeat: true }, memory: '食堂转了两圈后，你和周舟坐在了一起。你们决定先把这一个窗口吃明白。' },
      { text: '你不需要什么都替大家安排好。', reaction: ['“我以为新室友之间，总要有人主动一点。”', '周舟有一点不好意思，但终于坐了下来。'], trust: 0, knownName: true, memory: '周舟说，想替大家安排，是怕宿舍一直那么生疏。你听懂了那份用力。' },
      { text: '我们给宿舍发个位置就好。', reaction: ['周舟拍了桌号，发进只有四个人的群。', '“终于有一条不是学校通知的消息了。”'], trust: 1, knownName: true, memory: '你们给宿舍群发了食堂桌号。四个人的小群，第一次有了生活里的消息。' },
    ],
  },
  'roommate-understand': {
    speakerId: 'roommate', title: '电话挂断以后',
    lines: ['晚上回宿舍，周舟刚挂断电话。刚才说的全是“挺好的”“都认识了”。', '门开着，周舟却在门口坐了很久。', '“我跟家里说得太热闹了。现在每次打电话，都得再想点热闹的。”'],
    choices: [
      { text: '今天其实也可以没什么新鲜事。', reaction: ['周舟把手机屏幕按黑。', '“那明天我就说，晚饭有点咸。”', '你们讨论起哪一道菜最咸。这段聊天很普通，也很长。'], trust: 2, knownName: true, flags: { roommateHome: true }, memory: '周舟承认，不是每天都像电话里那么热闹。你们聊了一晚上很普通的事。' },
      { text: '要出去买点夜宵吗？', reaction: ['“走。别发群里，就我们慢慢走过去。”', '这一次，周舟没有提前研究路线。'], trust: 1, knownName: true, memory: '挂断给家里的电话后，周舟和你出去慢慢走了一段路。没有提前做攻略。' },
      { text: '在旁边坐一会儿。', reaction: ['你坐下，周舟往旁边挪了一点。', '过了很久，周舟说：“现在这样，也挺好的。”'], trust: 1, knownName: true, memory: '那晚你没有替周舟想办法，只在宿舍门口一起坐了一会儿。' },
    ],
  },
  'instructor-first': {
    speakerId: 'instructor', title: '哨声以外',
    lines: ['教官把操场边的一个水杯挪进阴影里，才注意到你。', '“东西别晒着。人也一样，真不舒服就报告。”'],
    choices: [
      { text: '我记住了。', reaction: ['教官点点头，低头确认明天的气温。', '你第一次在口令之外，听清了这个人的声音。'], trust: 1, memory: '教官先把水杯挪进阴影里，再提醒你：真不舒服，就报告。' },
      { text: '迟到了应该怎么办？', reaction: ['“到了先来找我，说明情况，再归队。别怕一句报告，把自己藏一天。”', '教官在通知单上补了一行。'], trust: 0, memory: '你问了迟到怎么办。教官说，到了说明情况就好，不用把自己藏起来。' },
      { text: '需要帮忙搬水吗？', reaction: ['“拿空的就行，满的我来。”', '你们把水桶搬到树边。哨绳碰在桶壁上，声音很轻。'], trust: 1, memory: '你和教官一起搬了水桶。满的那只，教官留给了自己。' },
    ],
  },
  'instructor-name': {
    speakerId: 'instructor', title: '水壶上的纸条',
    lines: ['教官的水壶上贴着“少喝冰的”，字写得一大一小。', '“我女儿写的。大的字还是照着描的。”教官见你看见，自己先解释了。', '“我姓王。班里那个‘王教官’的名单，有时候写得比我自己的名字还多。”'],
    choices: [
      { text: '你一直留着它。', reaction: ['“本来快掉了，又贴了层胶带。”', '王教官把水壶转到里侧，像收好一件很轻的东西。'], trust: 1, knownName: true, memory: '你知道了王教官水壶上的纸条是谁写的。那不是提醒，是一件舍不得丢的小东西。' },
      { text: '她知道你在这里带军训吗？', reaction: ['“知道。她问我，这么大的学生也要排队接水吗。”', '王教官笑了一下。那张严肃的面孔突然有了不同的线条。'], trust: 1, knownName: true, memory: '王教官说，女儿想知道大学生要不要排队接水。那天你听到了口令以外的笑声。' },
      { text: '把掉下来的纸角压平。', reaction: ['“谢谢，还能再撑一阵。”', '王教官接过水壶，手指在胶带边缘按了一下。'], trust: 0, knownName: true, memory: '你替王教官压平了水壶上的纸角。那张手写纸条，又被好好留了下来。' },
    ],
  },
  'instructor-understand': {
    speakerId: 'instructor', title: '最后一排的脚步',
    lines: ['王教官在树荫下改名单。最末一排旁边，多写着几个小小的提醒。', '“有人脚跟磨破了，有人一紧张就顺拐。只从最前面看，容易以为后面也一样。”', '“我年轻的时候，也是跟不上的那个。后来才知道，口令大，不一定就带得好。”'],
    choices: [
      { text: '原来你也会跟不上。', reaction: ['“会。现在有时候也会。”', '王教官把名单合上，没有再用一句道理把话收住。'], trust: 1, knownName: true, memory: '王教官说自己也曾是跟不上的人。你开始明白，为什么总要走到队列最后面。' },
      { text: '明天我们提醒后排一起放慢一点。', reaction: ['“好，但先听听他们需要什么。”', '王教官把笔递给你。名单旁边又添了一行。'], trust: 2, knownName: true, memory: '你和王教官一起记下了后排需要的提醒。照顾整个方阵，要先听见每个人。' },
      { text: '有时候你的声音还是会让人害怕。', reaction: ['王教官看了你一会儿，没有反驳。', '“那我也得记一笔。”名单最下面，添了两个字：语气。'], trust: -1, knownName: true, flags: { instructorFeedback: true }, memory: '你说出了对口令的害怕。王教官没有马上反驳，而是在自己的提醒里写下“语气”。' },
    ],
  },
};

export const EVENT_EPISODES = {
  arrival: {
    speakerId: 'roommate', title: '把军训服抱在怀里',
    lines: ['迎新处剩着几摞训练服。旁边的人把一套递过来：“先看裤长，裤腰还能调。”', '通知贴在纸箱上：明早九点，操场集合。校园生活忽然有了一个确切的时间。'],
    choices: [
      { text: '帮忙按尺码再理一遍。', reaction: ['你们把小号放到前面。后面来的人，终于不用翻整摞衣服。', '那位新室友把最后一套抱起来：“明天见。”'], characterId: 'roommate', trust: 1, clarity: 1, flags: { uniform: true }, memory: '你在迎新处帮忙整理军训服。明早九点，成了大学生活里的第一个约定。' },
      { text: '领好衣服，记下集合时间。', reaction: ['你把衣服抱在怀里，有一点晒热的棉布气味。', '明早九点，操场。你把这几个字记了下来。'], flags: { uniform: true }, memory: '领到训练服时，你记下了明早九点的集合。衣服还不合身，日子已经开始了。' },
    ],
  },
  standing: {
    speakerId: 'li', title: '九月的太阳',
    lines: ['站军姿。风停了，时间像落在肩膀上。', '旁边那顶歪帽子越来越低。那个人说了句“没事”，脚步却晃了一下。'],
    choices: [
      { text: '报告教官，旁边的同学不舒服。', reaction: ['“先到树荫下。”教官马上走过来，让队列空出一条路。', '休息哨响后，那个人隔着水杯对你点了点头。'], characterId: 'li', trust: 1, clarity: 1, flags: { standingHelp: 'report' }, memory: '站军姿时，你报告了旁边同学的不适。后来，那顶歪帽子在树荫里向你点了点头。' },
      { text: '轻声问：要不要一起报告休息？', reaction: ['“嗯，帮我说一下。”那个人终于不再硬撑。', '你们报了告，慢慢走到树荫里。离开队列并没有想象中那么难。'], characterId: 'li', trust: 2, clarity: 1, flags: { standingHelp: 'ask' }, memory: '你先问了对方需不需要帮助，再一起报告休息。你们共享了树荫里的那几分钟。' },
      { text: '让开一点位置，留意对方的状态。', reaction: ['你让出半步。教官巡视到这里，及时让那个人去休息。', '你们还没说上话，但你记住了那个人总把帽檐压低的动作。'], characterId: 'li', trust: 0, clarity: 1, flags: { standingHelp: 'observe' }, memory: '队列里你让出了半步。歪帽檐的同学去树荫休息，那小小的动作留在了记忆里。' },
    ],
  },
  singing: {
    speakerId: 'chen', title: '下一句，从谁开始',
    lines: ['两个方阵围坐在跑道边。对面喊完一轮，这边的第一句迟迟没起。', '抱书的同学今天没带书，只把手指放在膝上，悄悄打着拍子。', '周围有人问：“谁来起个头？”'],
    choices: [
      { text: '先起第一句，让大家一起接。', reaction: ['你的声音刚出来，身后就接上了第二个、第三个声音。', '旁边的手指终于不再只敲膝盖。你们听见彼此都唱错了一个字，然后一起笑了。'], characterId: 'chen', trust: 1, clarity: 1, flags: { singingChoice: 'lead' }, memory: '拉歌时，你起了第一句。越来越多的声音接上来，唱错的那个字也被笑声接住。' },
      { text: '轻轻跟着那个拍子，等对方准备好。', reaction: ['你先用手掌回应那个拍子。抱书的同学看见了，试着唱出很轻的一句。', '接着，整排都接了上来。最初是谁起的头，反而不重要了。'], characterId: 'chen', trust: 2, clarity: 1, flags: { singingChoice: 'support' }, memory: '你跟上了膝盖上轻轻的拍子。那句很小声的起头，最后被整个方阵接住。' },
      { text: '先听着，给唱完的人鼓掌。', reaction: ['终于有人起了头。你没有唱，认真听完，把掌声留在最后。', '抱书的同学小声说：“其实我刚才也想试试。”你听见了。'], characterId: 'chen', trust: 0, clarity: 1, flags: { singingChoice: 'listen' }, memory: '你安静听完了拉歌。掌声之后，抱书的同学说了一句“其实我也想试试”。' },
    ],
  },
  selection: {
    speakerId: 'instructor', title: '向前一步，也有很多种',
    lines: ['教官让方阵散开半步。“最后一天要有人带队。愿意试的，可以出来。”', '有人低头看鞋，有人在偷偷练摆臂。', '“不一定要走最前面。后排的节奏、提醒和收尾，都要有人照看。”'],
    choices: [
      { text: '自荐，试着走一段。', reaction: ['你走出队列。前几步太用力，后来慢慢听见了身后的脚步。', '教官说：“先练着，明天一起走。前面的人也要等后面。”', '回队时，室友用鞋尖轻轻碰了碰你的鞋。'], characterId: 'instructor', trust: 1, clarity: 1, flags: { selectionChoice: 'lead' }, memory: '领队练习时，你走到了前面。学到的第一件事，是听见身后的脚步。' },
      { text: '问室友想不想试，我帮着打拍子。', reaction: ['你先问了室友，没有直接把人推上去。对方想了想，点头。', '你站在侧面打拍子。练习结束，你们把错过的那一拍又比划了一遍。'], characterId: 'roommate', trust: 1, clarity: 1, flags: { selectionChoice: 'support' }, memory: '你先问过室友的意愿，再陪着练习。你们一起把错过的那一拍找了回来。' },
      { text: '留在后排，帮忙看齐队列。', reaction: ['你站到后面，才发现不同的人踩着不同的节奏。', '你把提醒说得近一点、慢一点。队伍再走起来时，后排也跟上了。'], characterId: 'instructor', trust: 1, clarity: 1, flags: { selectionChoice: 'back' }, memory: '你留在后排，把提醒说得近一点、慢一点。后来那一段路，大家终于走在了一起。' },
    ],
  },
  closing: {
    speakerId: 'instructor', title: '最后一声解散',
    lines: ['方阵走过主席台，回到第一天集合的地方。树影已经偏向另一边。', '“军训结束了。”教官把哨子收进口袋，“接下来，自己把日子过好。”', '没有人立刻散开。原来不知道名字的人，正朝不同的方向挥手。'],
    choices: [
      { text: '帮着把水桶和椅子收好。', reaction: ['最后一张椅子叠上去，操场重新空出来。', '今晚还很长。你可以找人道别，也可以回宿舍，把这些天留下来。'], flags: { closingChoice: 'help', graduated: true }, memory: '结营后，你留下来收好了最后一张椅子。空下来的操场，像是重新还给了校园。' },
      { text: '在散场的人群里慢慢走一圈。', reaction: ['你听见几句“明天食堂见”，也听见有人在交换名字。', '今晚还留给你。也许有个人，有一句话，你想再去听听。'], flags: { closingChoice: 'walk', graduated: true }, memory: '最后一声解散以后，你在人群里慢慢走了一圈。“明天见”，开始有了具体的对象。' },
      { text: '在原地多站一会儿。', reaction: ['太阳还是第一天那样晒，但你已经知道哪一片树荫最凉。', '你可以再走走，也可以回宿舍，合上军训篇的这一页。'], flags: { closingChoice: 'stay', graduated: true }, memory: '结营后，你在原地多站了一会儿。太阳没变，校园里却有了一些你熟悉的地方。' },
    ],
  },
};

export const AMBIENT_LINES = {
  li: ['帽檐还是有点歪。对方抬手示意，继续刚才没走完的那一圈。', '“今天先跑这些。下次再见。”'],
  chen: ['书页之间露出那张画着地图的小票。对方给你让了点位置。', '“有新路线再告诉你。”'],
  roommate: ['门口的鞋又换了一个方向。你们互相点点头。', '“一会儿见。”'],
  instructor: ['教官看了一眼时间，把哨绳绕在手指上。', '“自由活动，注意休息。”'],
};
