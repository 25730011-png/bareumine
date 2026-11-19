/* 바름이네 — 화면 흐름 */
(() => {
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const st = () => Store.state;

  /* ---------- 캐릭터 ---------- */
  const CHAR = {
    sooki: { key: 'sooki', name: '숙이', voc: '숙이야', card: 'sooki_card' },
    sukdol: { key: 'sukdol', name: '숙돌이', voc: '숙돌아', card: 'sukdol_card' },
    none: { key: 'sooki', name: '친구', voc: '친구야', card: 'sooki_card' }   // 아직 안 골랐을 때
  };
  const ch = () => CHAR[st().char] || CHAR.none;
  const IMG = n => `pages/assets/img/${n}.webp`;

  /* 플러스인지 */
  const isPlus = () => st().plan === 'plus';

  /* 아직 안 만든 이미지 → 빈 자리로 둠. 이미지가 생기면 pages/assets/img에 넣고 여기서 지우면 돼 */
  const MISSING = {
    sukdol_phone: '숙돌이 · 휴대폰 보며 고개 숙인 모습',
    sooki_phone: '숙이 · 휴대폰 보며 고개 숙인 모습',
    sooki_home: '바름이가 숙이에게 물어보는 장면',
    sukdol_twist: '숙돌이 · 허리 좌우 돌리기', sukdol_march: '숙돌이 · 제자리 걷기',
    sooki_twist: '숙이 · 허리 좌우 돌리기', sooki_march: '숙이 · 제자리 걷기',
    sukdol_home: '바름이가 숙돌이에게 물어보는 장면'
  };
  /* 동작 영상 (있으면 이미지 대신 재생). 예: sukdol_neck: 'pages/assets/video/sukdol_neck.mp4' */
  const VIDEOS = {};

  /* 아직 없는 이미지 대신 잠깐 보여 줄 바름이 사진 */
  const FALLBACK = {
    sooki_home: 'bareum_ask', sukdol_home: 'bareum_ask',
    sooki_stretch: 'bareum_thumb', sukdol_stretch: 'bareum_thumb',
    sooki_phone: 'bareum_sign', sukdol_phone: 'bareum_sign',   // 첫 만남 설명 칸
    sooki_neck: 'bareum_calm', sukdol_neck: 'bareum_calm'
  };

  /* img에 이미지를 넣거나, 없으면 같은 자리에 빈 칸을 보여 줌 */
  function setPic(img, name) {
    let ph = img.nextElementSibling;
    if (!ph || !ph.classList.contains('ph-auto')) {
      ph = document.createElement('div');
      ph.className = 'ph ph-auto ' + img.className;
      img.after(ph);
    }
    if (MISSING[name] && FALLBACK[name]) name = FALLBACK[name];
    const miss = MISSING[name];
    img.hidden = !!miss; ph.hidden = !miss;
    if (miss) { img.removeAttribute('src'); ph.textContent = miss; ph.className = 'ph ph-auto ' + img.className; }
    else { img.src = IMG(name); img.classList.toggle('fit', name.startsWith('bareum_')); img.classList.toggle('cutout', /^(sooki|sukdol)_/.test(name) && !/_card$|_home$/.test(name)); }
  }

  function applyName() {
    $$('[data-name]').forEach(e => e.textContent = ch().name);
    $$('[data-name-voc]').forEach(e => e.textContent = ch().voc);
    $('#me-img').src = IMG(ch().card);
    const k = ch().key;
    const slot = { rest: 'neck', phone: 'phone', home: 'home' };
    $$('[data-char-img]').forEach(e => setPic(e, `${k}_${slot[e.dataset.charImg]}`));
    $$('.pick-card').forEach(c => c.classList.toggle('on', c.dataset.char === st().char));
  }

  /* ---------- 쉼 루틴 ---------- */
  const ROOMS = {
    living: { label: '거실 · 목 쉼', short: '거실', what: '목 쉼', done: '목이 한결 가볍지?' },
    window: { label: '창가 · 눈 쉼', short: '창가', what: '눈 쉼', done: '눈이 한결 편하지?' },
    yard:   { label: '마당 · 몸 쉼', short: '마당', what: '몸 쉼', done: '몸이 한결 개운하지?' },
    bed:    { label: '침실 · 잠 쉼', short: '침실', what: '잠 쉼' }
  };
  function routine(room) {
    const k = ch().key;
    if (room === 'yard') return [
      { name: '일어나서 기지개', sec: 30, img: `${k}_stretch`, say: '자리에서 일어나서 두 팔을 머리 위로 쭉 뻗어. 등이 쫙 펴지게!' },
      { name: '허리 좌우 돌리기', sec: 30, img: `${k}_twist`, say: '두 손을 허리에 올리고 상체를 천천히 왼쪽, 오른쪽으로 돌려 봐.' },
      { name: '제자리 걷기', sec: 30, img: `${k}_march`, say: '제자리에서 무릎을 살짝 올리며 걸어. 굳은 몸이 풀릴 거야.' }
    ];
    if (room === 'window') return [
      { name: '먼 곳 바라보기', sec: 20, img: 'bareum_sign', say: '창밖 먼 곳을 바라봐. 6미터쯤 떨어진 곳이면 좋아.' },
      { name: '눈 감고 쉬기', sec: 20, img: 'bareum_calm', say: '눈을 살짝 감고 천천히 숨 쉬어. 눈이 쉬는 시간이야.' },
      { name: '눈 굴리기', sec: 20, img: 'bareum_hi', say: '눈을 위, 아래, 왼쪽, 오른쪽으로 천천히 굴려 봐.' }
    ];
    return [
      { name: '턱 당기기', sec: 60, img: `${k}_chin`, say: '턱을 뒤로 쏙 당겨. 뒷목이 길어지는 느낌이면 충분해.' },
      { name: '옆목 늘리기', sec: 60, img: `${k}_neck`, sides: true,
        say: ['고개를 천천히 오른쪽으로 기울여. 왼쪽 목이 당기면 충분해.', '이번엔 왼쪽으로 기울여. 오른쪽 목이 당기면 충분해.'] },
      { name: '가슴 펴기', sec: 60, img: `${k}_chest`, say: '손을 등 뒤로 모으고 가슴을 활짝 펴. 숨을 크게 들이마셔.' }
    ];
  }

  /* ---------- 화면 전환 ---------- */
  const TABS = { home: 's-home', record: 's-record', diary: 's-diary', me: 's-me' };
  let screen = null, prevScreen = 's-home';
  function show(id) {
    if (screen && screen !== id && screen !== 's-plan' && screen !== 's-guide') prevScreen = screen;
    screen = id;
    $$('.screen').forEach(s => s.classList.toggle('on', s.id === id));
    const tabbed = Object.values(TABS).includes(id);
    $('#tabbar').classList.toggle('show', tabbed);
    $('#appbar').classList.toggle('show', tabbed);
    $('#appbar').classList.remove('scrolled');
    $('#appbar-plan').textContent = isPlus() ? '플러스' : '무료';
    $('#appbar-plan').classList.toggle('plus', isPlus());
    $$('#tabbar button').forEach(b => b.classList.toggle('on', TABS[b.dataset.tab] === id));
    if (id === 's-home') { renderHome(); hidePeek(); }
    if (id === 's-record') renderRecord();
    if (id === 's-diary') renderDiary();
    if (id === 's-me') renderMe();
    if (id === 's-plan') renderPlan();
    const sc = $('#' + id + ' .scroll'); if (sc) sc.scrollTop = 0;
  }
  $$('#tabbar button').forEach(b => b.onclick = () => show(TABS[b.dataset.tab]));

  function toast(msg) {
    const t = $('#toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('show'), 2200);
  }

  document.addEventListener('click', e => {
    const g = e.target.closest('[data-go]'); if (!g) return;
    const to = g.dataset.go;
    if (to === 'start') show(st().onboarded ? 's-home' : (startOnboard(), 's-onboard'));
    if (to === 'onboard') { startOnboard(); show('s-onboard'); }
    if (to === 'guide') show('s-guide');
    if (to === 'browse') {   // 가입 없이 둘러보기: 샘플 기록을 채워서 바로 홈으로
      Auth.guest(); Store.useUser('guest'); applyName();
      if (!st().onboarded) { st().onboarded = true; Store.save(true); }
      if (!st().visits.length) Store.fillSample();
      show('s-home');
      toast('둘러보기 중이야 · 샘플 기록이 들어 있어');
    }
    if (to === 'plan') { closeLock(); show('s-plan'); }
    if (to === 'back') show(prevScreen || 's-home');
  });

  /* iOS: 첫 터치 때 센서 권한 + 오디오 열기 */
  document.addEventListener('click', () => {
    if (st().onboarded && st().settings.tilt) Sensors.requestPermission();
    try { Sound.unlock(); } catch (e) {}
  }, { once: true, capture: true });

  /* ---------- 온보딩 ---------- */
  let ob = 0;
  function startOnboard() { ob = 0; renderOb(); applyName(); }
  function renderOb() {
    $$('.ob-step').forEach(s => s.classList.toggle('on', +s.dataset.step === ob));
    $$('#ob-dots i').forEach((d, i) => d.classList.toggle('on', i === ob));
  }
  $$('[data-ob-next]').forEach(b => b.onclick = () => { ob = Math.min(3, ob + 1); renderOb(); });
  $$('.pick-card').forEach(c => c.onclick = () => { st().char = c.dataset.char; Store.save(); applyName(); });
  $('#ob-pick').onclick = () => {
    if (!CHAR[st().char] || st().char === 'none') { toast('둘 중에 하나 골라 줘!'); return; }
    ob = 2; renderOb();
    Sound.say(`반가워, ${ch().voc}! 지칠 땐 우리 집에 와.`);
  };
  $('#ob-skip').onclick = finishOnboard;
  $('#ob-perm').onclick = async () => {
    const r = await Sensors.requestPermission();
    if (r === 'denied') toast('권한은 내 정보에서 다시 켤 수 있어');
    finishOnboard();
  };
  function finishOnboard() {
    st().onboarded = true; Store.save(true);
    show('s-home');
    setTimeout(() => Sound.say(`어서 와, ${ch().voc}! 쉬어 갈 때가 되면 내가 부를게.`), 400);
  }

  /* ---------- 홈 ---------- */
  const DAYS = ['일', '월', '화', '수', '목', '금', '토'];
  function fmtDur(sec) {
    const m = Math.floor(sec / 60);
    if (sec > 0 && sec < 60) return `${sec}초`;
    if (m < 60) return `${m}분`;
    return `${Math.floor(m / 60)}시간 ${m % 60}분`;
  }
  function renderHome() {
    const d = new Date();
    $('#home-date').textContent = `${d.getMonth() + 1}월 ${d.getDate()}일 ${DAYS[d.getDay()]}요일`;
    const plus = isPlus();
    $$('.room').forEach(r => r.classList.toggle('locked', !plus && PAID.includes(r.dataset.room)));
    renderCall();
  }
  /* 홈: 오늘의 습관 + 아래 바름이 초대 카드 */
  function renderCall() {
    const s = st(), t = Store.today();
    $('#hs-down').textContent = fmtDur(t.down);
    $('#hs-close').textContent = `${t.close}번`;
    $('#hs-long').textContent = fmtDur(t.longest);
    $('#hs-night').textContent = fmtDur(t.night);
    const due = dueRoom(), lim = s.settings.limit * 60, left = Math.max(0, lim - s.sinceRest);
    $('#home-call').classList.toggle('alert', !!due);
    $('#home-call-state').textContent = due ? `${ROOMS[due].what} 할 시간` : '바름이가 살펴보는 중';
    $('#home-call-text').textContent = due === 'living' ? `고개를 ${fmtDur(s.sinceRest)} 숙였어. 거실로 놀러 와!`
      : due === 'yard' ? `${fmtDur(s.sitSinceRest)} 쉬지 않고 썼어. 마당으로 놀러 와!`
      : due === 'window' ? '화면이 너무 가까웠어. 창가로 놀러 와!'
      : `다음 쉼까지 ${fmtDur(left)} 남았어`;
    $('#home-call-fill').style.width = `${due ? 100 : Math.min(100, s.sinceRest / lim * 100)}%`;
    $$('.room').forEach(r => r.classList.toggle('call', r.dataset.room === due));
  }
  function renderStats() {
    const t = Store.today();
    $('#st-down').textContent = fmtDur(t.down);
    $('#st-close').textContent = `${t.close}번`;
    $('#st-long').textContent = fmtDur(t.longest);
    $('#st-night').textContent = fmtDur(t.night);
  }
  /* 홈 상단: 바름이가 지금 뭘 보고 있는지 + 초대까지 얼마나 남았는지 */
  function renderWatch() {
    const s = st(), lim = s.settings.limit * 60, lv = s.settings.tilt ? Sensors.level() : 'off';
    const eye = s.closeSinceRest >= s.settings.close;
    const ready = eye || s.sinceRest >= lim;
    const pct = eye ? 100 : Math.min(100, (s.sinceRest / lim) * 100);
    const left = Math.max(0, lim - s.sinceRest);
    const w = $('#watch');
    w.classList.toggle('ready', ready);
    w.classList.toggle('warn', !ready && (lv === 'down' || lv === 'mid'));
    $('#watch-fill').style.width = `${pct}%`;
    let state = '바름이가 살펴보는 중', msg;
    if (eye) { state = '눈 쉴 시간'; msg = `화면이랑 ${s.closeSinceRest}번 너무 가까웠어. 창가에서 1분만 눈 쉬자!`; }
    else if (ready) { state = '목 쉴 시간'; msg = `고개를 ${fmtDur(s.sinceRest)} 숙였어. 거실에서 3분만 목 풀자!`; }
    else msg = {
      off: '자세 살펴보기가 꺼져 있어. 내 정보에서 켤 수 있어.',
      none: '휴대폰을 손에 들면 자세를 살펴볼게.',
      rest: '휴대폰을 내려놨구나. 그동안 목도 쉬는 중!',
      good: '바른 자세 좋아! 이대로만 하자.',
      mid: '고개가 살짝 숙여졌어. 휴대폰을 눈높이로 올려 볼래?',
      down: '고개를 많이 숙였어! 이대로 계속되면 초대장 보낼게.'
    }[lv];
    $('#watch-state').textContent = state;
    $('#watch-msg').textContent = msg;
    $('#watch-label').textContent = ready ? '초대장 준비 완료!' : `목 쉼 초대까지 ${fmtDur(left)}`;
    $('#home-invite').textContent = ready ? '지금 놀러 가기' : '바로 쉬러 가기';
  }
  /* 지금 가장 쉬어야 하는 방: 목 > 몸 > 눈 */
  function dueRoom() {
    const s = st();
    if (s.sinceRest >= s.settings.limit * 60) return 'living';
    if ((s.sitSinceRest || 0) >= s.settings.sit * 60) return 'yard';
    if (s.closeSinceRest >= s.settings.close) return 'window';
    return null;
  }
  $('#home-invite').onclick = () => tryEnter(dueRoom() || 'living');
  /* 방 미리보기: 마우스를 올리거나(컴퓨터) 한 번 누르면(휴대폰) 그 방 그림 + 바름이 한마디 */
  const PEEK = {
    living: '거실에서 3분만<br />목 풀고 갈래?',
    window: '창가에서 1분만<br />눈 쉬고 갈래?',
    yard: '마당에서 몸 좀<br />풀고 갈래?',
    bed: '침실에서 잘 준비<br />같이 할래?'
  };
  /* 집 사진 속 방 위치 (%: 왼쪽, 위, 너비, 높이) */
  const SPOT = { bed: [23, 24, 29, 29], window: [49.5, 22, 24, 25], living: [23, 47.5, 29, 29], yard: [47, 56, 36, 36] };
  let peekRoom = null;
  const canHover = matchMedia('(hover: hover)').matches;
  function showPeek(room) {
    peekRoom = room;
    const r = SPOT[room], sp = $('#peek-spot');   // 집 사진에서 그 방만 밝게
    Object.assign(sp.style, { left: r[0] + '%', top: r[1] + '%', width: r[2] + '%', height: r[3] + '%' });
    $('#peek-text').innerHTML = PEEK[room];
    $('#peek-why').textContent = {
      living: '휴대폰을 눕혀 들고 고개를 오래 숙이면 불러',
      window: '화면에 얼굴을 너무 가까이 대면 불러',
      yard: '쉬지 않고 오래 쓰면 불러',
      bed: '자정 넘어서 쓰고 있으면 불러'
    }[room];
    const locked = !isPlus() && PAID.includes(room);
    $('#peek-go').textContent = locked ? '플러스로 열기' : '놀러 가기';
    $('#peek').hidden = false; $('#peek-bar').hidden = false;
    $$('.room').forEach(r => r.classList.toggle('peeking', r.dataset.room === room));
  }
  function hidePeek() { peekRoom = null; $('#peek').hidden = true; $('#peek-bar').hidden = true; $$('.room').forEach(r => r.classList.remove('peeking')); }
  $$('.room').forEach(r => {
    r.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') showPeek(r.dataset.room); });
    r.onclick = () => {
      if (canHover || peekRoom === r.dataset.room) { hidePeek(); tryEnter(r.dataset.room); }
      else showPeek(r.dataset.room);   // 휴대폰: 첫 탭은 미리보기, 한 번 더 누르면 입장
    };
  });
  /* 마우스가 집과 아래 말풍선 밖으로 나가면 닫기 */
  const peekZone = e => e.relatedTarget && (e.relatedTarget.closest('.home-f .house') || e.relatedTarget.closest('#peek-bar'));
  ['.home-f .house', '#peek-bar'].forEach(sel => $(sel).addEventListener('pointerleave', e => { if (e.pointerType === 'mouse' && !peekZone(e)) hidePeek(); }));
  $('#peek-go').onclick = e => { e.stopPropagation(); const r = peekRoom; hidePeek(); tryEnter(r); };
  $('#peek').onclick = e => { if (e.target.id === 'peek' || e.target.id === 'peek-spot') hidePeek(); };
  $('#home-call').onclick = () => $('#home-invite').onclick();

  /* 홈에서 방을 누르면 그 방 쪽으로 쑥 들어가는 연출 */
  function zoomInto(room) {
    const img = $('.home-f .house > img'), r = SPOT[room];
    img.style.transformOrigin = `${r[0] + r[2] / 2}% ${r[1] + r[3] / 2}%`;
    img.classList.add('zoom-in');
    $('.home-f .house').classList.add('entering');
    // 확대 중간에 선명한 방 그림이 화면 가득 스르륵 나타남
    const ov = $('#room-enter'), oi = $('#room-enter-img');
    oi.src = IMG(`room_${room}_bg`); ov.hidden = false; ov.classList.remove('show');
    setTimeout(() => ov.classList.add('show'), 220);
    setTimeout(() => {
      startRest(room);
      img.classList.remove('zoom-in'); $('.home-f .house').classList.remove('entering');
    }, 700);
    setTimeout(() => { ov.classList.remove('show'); setTimeout(() => { ov.hidden = true; }, 350); }, 760);
  }

  /* 무료: 거실 / 플러스: 창가·마당·침실 */
  const PAID = ['window', 'yard', 'bed'];

  /* 받침에 따라 은/는 */
  const eun = w => { const c = w.charCodeAt(w.length - 1) - 0xac00; return w + (c >= 0 && c % 28 ? '은' : '는'); };

  function tryEnter(room) {
    const plus = isPlus();
    if (!plus && PAID.includes(room)) return openLock(room);   // 창가·침실은 플러스
    if (room === 'bed') return toast(`${eun(ROOMS[room].short)} 지금 꾸미는 중이야. 곧 열릴게!`);
    if (screen === 's-home') return zoomInto(room);
    startRest(room);   // 거실·마당은 무료로 무제한
  }

  /* ---------- 잠금 시트 ---------- */
  function openLock(kind) {
    if (kind === 'sound') {
      $('#lock-title').textContent = '숲·파도 소리는 플러스에서 들려';
      $('#lock-desc').textContent = '무료는 빗소리를 들을 수 있어. 플러스면 배경 소리를 골라 쓸 수 있어.';
    } else if (kind === 'history') {
      $('#lock-title').textContent = '지난 주 일기는 플러스에서 열려';
      $('#lock-desc').textContent = '무료는 이번 주 일기를 볼 수 있어. 플러스면 지난 기록을 다 볼 수 있어.';
    } else {
      $('#lock-title').textContent = `${eun(ROOMS[kind].short)} 플러스에서 열려`;
      $('#lock-desc').textContent = `${ROOMS[kind].what}까지 하고 싶으면 플러스로 놀러 와.`;
    }
    $('#lock').hidden = false;
  }
  function closeLock() { $('#lock').hidden = true; }
  $('#lock-close').onclick = closeLock;
  $('#lock').onclick = e => { if (e.target.id === 'lock') closeLock(); };

  /* ---------- 초대장 ---------- */
  let inviteRoom = 'living', snoozeUntil = 0;
  function invite(room, force) {
    if (!force && (Date.now() < snoozeUntil || screen === 's-rest' || !$('#invite').hidden || !$('#lock').hidden || !st().onboarded)) return;
    if (!['s-home', 's-record', 's-diary', 's-me'].includes(screen) && !force) return;
    snoozeUntil = Date.now() + (st().settings.limit <= 1 ? 60e3 : 10 * 60e3);
    inviteRoom = room;
    const s = st();
    $('#invite-text').innerHTML = room === 'window'
      ? '화면이랑 너무 가까워.<br />창가에서 1분만 눈 쉬자.'
      : room === 'yard' ? `${fmtDur(s.sitSinceRest || 0)} 넘게 쉬지 않고 썼어.<br />마당에서 몸 좀 풀자.`
      : `고개를 ${fmtDur(Math.max(s.sinceRest, 60))} 넘게 숙였어.<br />거실에서 3분만 목 풀자.`;
    closeLock();
    $('#invite').hidden = false;
    if (navigator.vibrate) navigator.vibrate([120, 80, 120]);
    Sound.say(`${ch().voc}, 잠깐 쉬자! ` + $('#invite-text').textContent);
  }
  $('#invite-go').onclick = () => { $('#invite').hidden = true; tryEnter(inviteRoom); };
  $('#invite-later').onclick = () => {
    $('#invite').hidden = true; Sound.hush();
    toast('알겠어, 조금 있다 다시 부를게');
  };

  /* ---------- 쉼 플레이어 ---------- */
  const R = { room: 'living', steps: [], i: 0, left: 0, total: 0, elapsed: 0, playing: false, timer: null, side: 0, front: 'a' };
  function startRest(room) {
    const plus = isPlus();
    $$('.sound').forEach(b => b.classList.toggle('locked', !plus && b.dataset.sound !== 'rain'));
    R.room = room; R.steps = routine(room); R.i = 0; R.elapsed = 0;
    R.total = R.steps.reduce((a, s) => a + s.sec, 0);
    $('#rest-room').textContent = ROOMS[room].label;
    $('#rest-bg').src = IMG(`room_${room}_bg`);   // 방 배경 (그 위에 캐릭터)
    show('s-rest');
    loadStep(true);
    play(true);
  }
  function setImg(name, mirror) {
    const a = $('#rest-img-a'), b = $('#rest-img-b'), ph = $('#rest-ph'), v = $('#rest-vid');
    if (VIDEOS[name]) {
      a.classList.add('hide'); b.classList.add('hide'); ph.hidden = true;
      if (!v.src.endsWith(VIDEOS[name])) v.src = VIDEOS[name];
      v.classList.toggle('mirror', !!mirror); v.hidden = false; v.play().catch(() => {});
      return;
    }
    v.hidden = true; v.pause();
    if (MISSING[name]) {
      a.classList.add('hide'); b.classList.add('hide'); a.dataset.src = b.dataset.src = '';
      ph.hidden = false; ph.textContent = MISSING[name] + (mirror ? ' (반대쪽)' : '');
      return;
    }
    ph.hidden = true;
    const [cur, nxt] = R.front === 'a' ? [a, b] : [b, a];
    if (cur.dataset.src === name && cur.classList.contains('mirror') === !!mirror) return;
    nxt.src = IMG(name); nxt.dataset.src = name;
    nxt.classList.toggle('fit', name.startsWith('bareum_'));
    nxt.classList.toggle('cutout', /^(sooki|sukdol)_/.test(name));   // 투명 배경 캐릭터는 방 배경 위에 서 있게
    nxt.classList.toggle('mirror', !!mirror);
    nxt.classList.remove('hide'); cur.classList.add('hide');
    R.front = R.front === 'a' ? 'b' : 'a';
  }
  function loadStep(first) {
    const s = R.steps[R.i];
    R.left = s.sec; R.side = 0;
    $('#rest-step').textContent = `${R.i + 1}/${R.steps.length}`;
    $('#rest-name').textContent = s.name;
    if (first) { ['a', 'b'].forEach(k => { const im = $('#rest-img-' + k); im.dataset.src = ''; im.classList.add('hide'); }); }
    setImg(s.img, s.mirror);
    applySide();
    const line = Array.isArray(s.say) ? s.say[0] : s.say;
    $('#rest-guide').textContent = line;
    R.elapsed = R.steps.slice(0, R.i).reduce((a, x) => a + x.sec, 0);
    renderTime();
    if (R.playing || first) Sound.say(`${s.name}. ${line}`);
  }
  function applySide() {
    const s = R.steps[R.i], tag = $('#rest-side');
    tag.classList.toggle('show', !!s.sides);
    if (!s.sides) return;
    tag.textContent = R.side ? '왼쪽으로' : '오른쪽으로';
    setImg(s.img, R.side === 1);
  }
  function renderTime() {
    const done = R.elapsed + (R.steps[R.i].sec - R.left);
    const left = R.total - done;
    $('#rest-time').textContent = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;
    $('#rest-bar').style.width = `${(done / R.total) * 100}%`;
  }
  function play(on) {
    R.playing = on;
    $('#rest-play-ic').setAttribute('href', on ? '#i-pause' : '#i-play');
    $('#rest-play').setAttribute('aria-label', on ? '일시정지' : '다시 시작');
    clearInterval(R.timer);
    if (on) R.timer = setInterval(stepTick, 1000); else Sound.hush();
  }
  function stepTick() {
    R.left -= 1;
    const s = R.steps[R.i];
    if (s.sides) {
      const half = Math.floor(s.sec / 2);
      const side = s.sec - R.left >= half ? 1 : 0;
      if (side !== R.side) {
        R.side = side; applySide();
        $('#rest-guide').textContent = s.say[side]; Sound.say(s.say[side]);
      }
    }
    if (R.left === 3) Sound.say('셋, 둘, 하나');
    if (R.left <= 0) {
      if (R.i < R.steps.length - 1) { R.i += 1; loadStep(); }
      else { finishRest(); return; }
    }
    renderTime();
  }
  $('#rest-play').onclick = () => play(!R.playing);
  $('#rest-next').onclick = () => { if (R.i < R.steps.length - 1) { R.i += 1; loadStep(); } else finishRest(); };
  $('#rest-prev').onclick = () => { if (R.i > 0) R.i -= 1; loadStep(); };
  const leaveRest = () => { play(false); Sound.stop(); $$('.sound').forEach(x => x.classList.remove('on')); show('s-home'); };
  $('#rest-back').onclick = leaveRest;
  $('#rest-close').onclick = leaveRest;
  $$('.sound').forEach(b => b.onclick = () => {
    if (b.dataset.sound !== 'rain' && !isPlus()) { openLock('sound'); return; }
    const now = Sound.toggle(b.dataset.sound);
    $$('.sound').forEach(x => x.classList.toggle('on', x.dataset.sound === now));
  });

  function finishRest() {
    play(false); Sound.stop(); $$('.sound').forEach(x => x.classList.remove('on'));
    Store.addVisit(R.room);
    const n = Store.visitsToday();
    $('#done-count').textContent = `오늘 ${n}번째 쉼이야`;
    $('#done-sub').textContent = ROOMS[R.room].done;
    setPic($('#done-img'), R.room === 'living' ? `${ch().key}_stretch` : 'bareum_thumb');
    $('#done-next').textContent = `일기에 도장 찍었어 · 다음 초대는 고개 숙임 ${fmtDur(st().settings.limit * 60)} 뒤`;
    show('s-done');
    Sound.chime();
    setTimeout(() => Sound.say(`잘했어, ${ch().voc}! ${ROOMS[R.room].done}`), 500);
  }
  $('#done-more').onclick = () => { show('s-home'); toast('또 부를게! 그동안 자세 살펴볼게'); };
  $('#done-exit').onclick = () => show('s-diary');

  /* ---------- 쉼 기록 ---------- */
  const ROOM_SHORT = { living: '거실', window: '창가', yard: '마당', bed: '침실' };
  function renderRecord() {
    const t = Store.today(), max = Math.max(60, ...t.hours);
    const peak = t.hours.indexOf(Math.max(...t.hours));
    $('#rec-hours').innerHTML = t.hours.map((v, h) =>
      `<i class="${v > 0 && h === peak ? 'hi' : ''}" style="height:${Math.max(3, (v / max) * 100)}%" title="${h}시 ${Math.round(v / 60)}분"></i>`).join('');
    const list = st().visits.slice(-8).reverse();
    renderStats(); renderWatch();
    $('#rec-list').innerHTML = list.length ? list.map(v => {
      const d = new Date(v.t);
      return `<li><span class="dot">${ROOM_SHORT[v.room][0]}</span>${ROOM_SHORT[v.room]} · ${ROOMS[v.room].what}<small>${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}</small></li>`;
    }).join('') : '<li class="empty">아직 놀러 온 적이 없어</li>';
  }
  /* ---------- 바름이 일기 ---------- */
  let wk = 0;
  const WEEK_NAMES = ['첫째', '둘째', '셋째', '넷째', '다섯째'];
  function weekStart(off) {
    const d = new Date(); d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7) + off * 7);
    return d;
  }
  function hourText(h) {
    if (h === 0) return '밤 12시'; if (h < 6) return `새벽 ${h}시`; if (h < 12) return `오전 ${h}시`;
    if (h === 12) return '낮 12시'; return `${h < 18 ? '오후' : '저녁'} ${h - 12}시`;
  }
  function renderDiary() {
    const start = weekStart(wk), end = new Date(start); end.setDate(start.getDate() + 7);
    const mid = new Date(start); mid.setDate(start.getDate() + 3);
    $('#wk-label').textContent = `${mid.getMonth() + 1}월 ${WEEK_NAMES[Math.floor((mid.getDate() - 1) / 7)]} 주`;
    $('#wk-next').disabled = wk >= 0; $('#wk-next').style.opacity = wk >= 0 ? .3 : 1;
    const vs = st().visits.filter(v => v.t >= start && v.t < end);
    $('#wk-total').textContent = wk === 0 ? `이번 주에 ${vs.length}번 놀러 왔어!` : `이 주에는 ${vs.length}번 놀러 왔어`;
    const per = Array(7).fill(0); vs.forEach(v => per[(new Date(v.t).getDay() + 6) % 7]++);
    const mx = Math.max(1, ...per);
    $('#wk-bars').innerHTML = per.map((n, i) =>
      `<div class="${n === mx && n > 0 ? 'top' : ''}"><em>${n}</em><i style="height:${(n / mx) * 100}px"></i>${'월화수목금토일'[i]}</div>`).join('');
    const rc = { living: 0, window: 0, yard: 0, bed: 0 }; vs.forEach(v => rc[v.room]++);
    $('#wk-rooms').innerHTML = Object.keys(rc).map(k => `<div><b>${rc[k]}</b><small>${ROOM_SHORT[k]}</small></div>`).join('');

    // 한 줄 요약: 이 주 시간대별 고개 숙임에서 가장 많은 시간대
    const hours = Array(24).fill(0); let downSum = 0;
    for (let i = 0; i < 7; i++) {
      const d = new Date(start); d.setDate(start.getDate() + i);
      const day = Store.day(Store.dayKey(d)); day.hours.forEach((v, h) => hours[h] += v); downSum += day.down;
    }
    const peak = hours.indexOf(Math.max(...hours));
    let msg;
    if (downSum < 300) msg = '아직 기록이 적어. 며칠만 같이 지내 보자!';
    else {
      msg = `${hourText(peak)}쯤 고개를 가장 많이 숙여. 그때 내가 먼저 부를게.`;
      const top = Object.entries(rc).sort((a, b) => b[1] - a[1])[0];
      if (vs.length && top[1]) msg += ` ${ROOM_SHORT[top[0]]}에 제일 자주 왔어.`;
    }
    $('#wk-summary').textContent = msg;
  }
  $('#wk-prev').onclick = () => { if (!isPlus()) { openLock('history'); return; } wk -= 1; renderDiary(); };
  $('#wk-next').onclick = () => { if (wk < 0) { wk += 1; renderDiary(); } };

  /* ---------- 내 정보 ---------- */
  function renderMe() {
    const u = Auth.current();
    $('#me-email').textContent = !u || u.guest ? '둘러보기 중 (가입 안 함)' : u.email;
    $('#me-logout').textContent = !u || u.guest ? '가입하기' : '로그아웃';
    const s = st().settings;
    $('#set-tilt').checked = s.tilt; $('#set-face').checked = s.face && Sensors.face.running; $('#set-voice').checked = s.voice;
    $('#set-limit').value = String(s.limit); $('#set-close').value = String(s.close); $('#set-sit').value = String(s.sit);
    $('#me-plan').textContent = isPlus() ? '플러스 · 방 4개 모두' : '무료 · 거실 목 쉼';
    $('#demo-on').checked = Sensors.demo.on;
  }
  $('#me-change').onclick = () => { st().char = st().char === 'sukdol' ? 'sooki' : 'sukdol'; Store.save(); applyName(); toast(`이제 ${ch().name}로 놀러 와!`); };
  $('#set-tilt').onchange = e => { st().settings.tilt = e.target.checked; Store.save(); if (e.target.checked) Sensors.requestPermission(); };
  $('#set-voice').onchange = e => { st().settings.voice = e.target.checked; Store.save(); };
  $('#set-limit').onchange = e => { st().settings.limit = +e.target.value; Store.save(); };
  $('#set-close').onchange = e => { st().settings.close = +e.target.value; Store.save(); };
  $('#set-sit').onchange = e => { st().settings.sit = +e.target.value; Store.save(); };
  $('#demo-yard').onclick = () => { st().sitSinceRest = Math.max(st().sitSinceRest || 0, st().settings.sit * 60); invite('yard', true); };
  $('#set-face').onchange = async e => {
    if (e.target.checked) {
      toast('얼굴 감지 준비 중…');
      const ok = await Sensors.startFace();
      st().settings.face = ok; Store.save();
      e.target.checked = ok;
      toast(ok ? '화면 거리 감지를 켰어' : Sensors.face.err);
    } else { Sensors.stopFace(); st().settings.face = false; Store.save(); }
  };
  $('#demo-on').onchange = e => { Sensors.demo.on = e.target.checked; };
  $('#demo-angle').oninput = e => { Sensors.demo.angle = +e.target.value; $('#demo-angle-label').textContent = `각도 ${e.target.value}°`; };
  $('#demo-neck').onclick = () => { st().sinceRest = Math.max(st().sinceRest, st().settings.limit * 60); invite('living', true); };
  $('#demo-eye').onclick = () => { for (let i = 0; i < 3; i++) Sensors.fakeClose(); st().closeSinceRest = Math.max(st().closeSinceRest, st().settings.close); invite('window', true); };
  $('#demo-fill').onclick = () => { Store.fillSample(); toast('일주일치 샘플 기록을 채웠어'); };
  $('#demo-reset').onclick = () => { Store.reset(); renderMe(); toast('기록을 지웠어'); };
  $('#me-logout').onclick = async () => {
    const u = Auth.current();
    if (!u || u.guest) { await Auth.signOut(); show('s-login'); openAuth('signup'); return; }   // 둘러보기 → 가입
    await Auth.signOut(); Sensors.stopFace(); Store.useUser(null); applyName();
    show('s-login'); toast('로그아웃했어. 또 놀러 와!');
  };

  /* ---------- 로그인 / 가입 ---------- */
  let authTab = 'login';
  function openAuth(tab) {
    authTab = tab; $('#auth').hidden = false; $('#auth-err').textContent = '';
    $$('[data-tab-auth]').forEach(b => b.classList.toggle('on', b.dataset.tabAuth === tab));
    $('#auth-pw2-wrap').hidden = tab !== 'signup';
    $('#auth-forgot').hidden = tab !== 'login';
    $('#auth-submit').textContent = tab === 'signup' ? '가입하고 바름이 만나기' : '로그인';
    $('#auth-pw').autocomplete = tab === 'signup' ? 'new-password' : 'current-password';
    $('#auth-mode').textContent = Auth.mode === 'firebase' ? '' : '지금은 시연용 계정이라 이 기기에서만 로그인돼.';
    setTimeout(() => $('#auth-email').focus(), 50);
  }
  $$('[data-auth]').forEach(b => b.onclick = () => openAuth(b.dataset.auth));
  $$('[data-tab-auth]').forEach(b => b.onclick = () => openAuth(b.dataset.tabAuth));
  $('#auth-close').onclick = () => { $('#auth').hidden = true; };
  $('#auth').onclick = e => { if (e.target.id === 'auth') $('#auth').hidden = true; };
  $('#auth-forgot').onclick = async () => {
    try { toast(await Auth.resetPassword($('#auth-email').value)); }
    catch (e) { $('#auth-err').textContent = e.message; }
  };
  $('#auth-form').onsubmit = async e => {
    e.preventDefault();
    const email = $('#auth-email').value, pw = $('#auth-pw').value;
    $('#auth-err').textContent = '';
    if (authTab === 'signup' && pw !== $('#auth-pw2').value) { $('#auth-err').textContent = '비밀번호 확인이 달라'; return; }
    const btn = $('#auth-submit'); btn.disabled = true;
    try {
      const u = authTab === 'signup' ? await Auth.signUp(email, pw) : await Auth.signIn(email, pw);
      afterLogin(u, authTab === 'signup');
    } catch (err) { $('#auth-err').textContent = err.message; }
    btn.disabled = false;
  };
  function afterLogin(u, isNew) {
    $('#auth').hidden = true; $('#auth-pw').value = ''; $('#auth-pw2').value = '';
    Store.useUser(u.id); applyName();
    if (isNew || !st().onboarded) { startOnboard(); show('s-onboard'); }
    else { show('s-home'); toast('다시 왔구나, 반가워!'); }
  }

  /* ---------- 요금제 ---------- */
  function renderPlan() {
    const paid = isPlus();
    $('#plan-free-now').textContent = paid ? '' : '지금 이용 중이야';
    $('#plan-plus').textContent = paid ? '플러스 이용 중이야 · 무료로 돌아가기' : '플러스로 놀러 갈게';
  }
  $('#plan-plus').onclick = () => {
    const paid = st().plan === 'plus';
    st().plan = paid ? 'free' : 'plus';
    Store.save(true);
    renderPlan();
    toast(paid ? '무료로 돌아왔어' : '시연용이라 바로 플러스가 됐어! 창가·마당·침실이 열렸어');
    if (!paid) setTimeout(() => show('s-home'), 900);
  };
  $('#plan-office').onclick = () => toast('회사 담당자에게 보낼 소개 링크를 준비 중이야');

  /* ---------- 감지 → 화면 반영 / 초대 ---------- */
  Sensors.on((type, data) => {
    const s = st();
    if (type === 'tick') {
      const chip = $('#live-chip'), txt = $('#live-text');
      const lv = data.level;
      chip.classList.toggle('ok', lv === 'good' || lv === 'rest');
      chip.classList.toggle('warn', lv === 'down' || lv === 'mid');
      txt.textContent = { none: s.settings.tilt ? '센서 대기 중' : '감지 꺼짐', rest: '내려놓음', good: '바른 자세', mid: '살짝 숙임', down: '고개 숙임' }[lv];
      if (screen === 's-home') renderCall();
      if (screen === 's-record') { renderStats(); renderWatch(); }
      if (s.settings.tilt && s.sinceRest >= s.settings.limit * 60) invite('living');
      if ((s.sitSinceRest || 0) >= s.settings.sit * 60) invite('yard');
    }
    if (type === 'close') {
      if (screen === 's-home') renderCall();
      if (s.closeSinceRest >= s.settings.close) invite('window');
    }
  });

  /* 상단 바 로고 → 홈(바름이네 탭) 맨 위로 */
  $('#appbar-home').onclick = () => { show('s-home'); };

  /* 스크롤하면 상단 바에 그림자 */
  $$('.screen.tabbed .scroll').forEach(sc => sc.addEventListener('scroll', () => {
    $('#appbar').classList.toggle('scrolled', sc.scrollTop > 4);
  }, { passive: true }));

  /* ---------- 접기/펴기 (상태 기억) ---------- */
  const FOLD_KEY = 'bareumine:fold';
  let folds = {};
  try { folds = JSON.parse(localStorage.getItem(FOLD_KEY) || '{}'); } catch (e) {}
  $$('details.fold').forEach(d => {
    const k = d.dataset.fold;
    if (k in folds) d.open = folds[k];
    d.addEventListener('toggle', () => {
      folds[k] = d.open;
      try { localStorage.setItem(FOLD_KEY, JSON.stringify(folds)); } catch (e) {}
    });
  });

  /* ---------- 시작 ---------- */
  applyName();
  if (typeof DeviceOrientationEvent === 'undefined' || typeof DeviceOrientationEvent.requestPermission !== 'function') Sensors.requestPermission();
  // 로그인 상태면 그 사람 기록으로, 아니면 로그인 화면
  const me = Auth.current();
  if (me) { Store.useUser(me.id); applyName(); show(st().onboarded ? 's-home' : 's-onboard'); if (!st().onboarded) startOnboard(); }
  else show('s-login');

  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    // 예전에 설치된 오프라인 캐시 정리 (지금은 서비스워커를 쓰지 않음)
    navigator.serviceWorker.getRegistrations().then(rs => rs.forEach(r => r.unregister())).catch(() => {});
  }
})();
