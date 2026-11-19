/* 바름이네 — 화면 흐름 */
(() => {
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const st = () => Store.state;

  /* ---------- 캐릭터 ---------- */
  const CHAR = {
    sooki: { name: '숙이', voc: '숙이야', card: 'sooki_card', done: 'sooki_done' },
    sukdol: { name: '숙돌이', voc: '숙돌아', card: 'sukdol_card', done: 'sukdol_stretch' }
  };
  const ch = () => CHAR[st().char] || CHAR.sooki;
  const IMG = n => `assets/img/${n}.webp`;

  function applyName() {
    $$('[data-name]').forEach(e => e.textContent = ch().name);
    $$('[data-name-voc]').forEach(e => e.textContent = ch().voc);
    $('#me-img').src = IMG(ch().card);
    $$('.pick-card').forEach(c => c.classList.toggle('on', c.dataset.char === st().char));
  }

  /* ---------- 쉼 루틴 ---------- */
  const ROOMS = {
    living: { label: '거실 · 목 쉼', short: '거실', what: '목 쉼', done: '목이 한결 가볍지?' },
    window: { label: '창가 · 눈 쉼', short: '창가', what: '눈 쉼', done: '눈이 한결 편하지?' },
    yard:   { label: '마당 · 몸 쉼', short: '마당', what: '몸 쉼' },
    bed:    { label: '침실 · 잠 쉼', short: '침실', what: '잠 쉼' }
  };
  function routine(room) {
    const sd = st().char === 'sukdol';
    if (room === 'window') return [
      { name: '먼 곳 바라보기', sec: 20, img: 'bareum_wave', say: '창밖 먼 곳을 바라봐. 6미터쯤 떨어진 곳이면 좋아.' },
      { name: '눈 감고 쉬기', sec: 20, img: 'bareum_full', say: '눈을 살짝 감고 천천히 숨 쉬어. 눈이 쉬는 시간이야.' },
      { name: '눈 굴리기', sec: 20, img: 'bareum_wave', mirror: true, say: '눈을 위, 아래, 왼쪽, 오른쪽으로 천천히 굴려 봐.' }
    ];
    return [
      { name: '턱 당기기', sec: 60, img: sd ? 'sukdol_chin' : 'sooki_living', say: '턱을 뒤로 쏙 당겨. 뒷목이 길어지는 느낌이면 충분해.' },
      { name: '옆목 늘리기', sec: 60, img: sd ? 'sukdol_neck' : 'sooki_living', sides: true,
        say: ['고개를 천천히 오른쪽으로 기울여. 왼쪽 목이 당기면 충분해.', '이번엔 왼쪽으로 기울여. 오른쪽 목이 당기면 충분해.'] },
      { name: '가슴 펴기', sec: 60, img: sd ? 'sukdol_chest' : 'sooki_living', say: '손을 등 뒤로 모으고 가슴을 활짝 펴. 숨을 크게 들이마셔.' }
    ];
  }

  /* ---------- 화면 전환 ---------- */
  const TABS = { home: 's-home', record: 's-record', diary: 's-diary', me: 's-me' };
  let screen = null, prevScreen = 's-home';
  function show(id) {
    if (screen && screen !== id && screen !== 's-plan') prevScreen = screen;
    screen = id;
    $$('.screen').forEach(s => s.classList.toggle('on', s.id === id));
    const tabbed = Object.values(TABS).includes(id);
    $('#tabbar').classList.toggle('show', tabbed);
    $$('#tabbar button').forEach(b => b.classList.toggle('on', TABS[b.dataset.tab] === id));
    if (id === 's-home') renderHome();
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
  function startOnboard() { ob = 0; renderOb(); }
  function renderOb() {
    $$('.ob-step').forEach(s => s.classList.toggle('on', +s.dataset.step === ob));
    $$('#ob-dots i').forEach((d, i) => d.classList.toggle('on', i === ob));
  }
  $$('[data-ob-next]').forEach(b => b.onclick = () => { ob = Math.min(3, ob + 1); renderOb(); });
  $$('.pick-card').forEach(c => c.onclick = () => { st().char = c.dataset.char; Store.save(); applyName(); });
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
    if (m < 60) return `${m}분`;
    return `${Math.floor(m / 60)}시간 ${m % 60}분`;
  }
  function renderHome() {
    const d = new Date();
    $('#home-date').textContent = `${d.getMonth() + 1}월 ${d.getDate()}일 ${DAYS[d.getDay()]}요일`;
    const t = Store.today();
    $('#st-down').textContent = fmtDur(t.down);
    $('#st-close').textContent = `${t.close}번`;
    $('#st-long').textContent = fmtDur(t.longest);
    $('#st-night').textContent = fmtDur(t.night);
    const plus = st().plan === 'plus';
    $$('.room').forEach(r => r.classList.toggle('locked', !plus && r.dataset.room !== 'living'));
    renderInviteCard();
  }
  function renderInviteCard() {
    const s = st(), lim = s.settings.limit * 60;
    const card = $('#home-invite');
    const ready = s.sinceRest >= lim * 0.5;
    card.classList.toggle('alert', ready);
    $('#home-invite-text').innerHTML = s.closeSinceRest >= s.settings.close
      ? '화면이랑 너무 가까워.<br />창가에서 눈 쉬고 갈래?'
      : ready ? `고개를 ${fmtDur(s.sinceRest)} 숙였어.<br />거실에서 목 풀고 갈래?`
      : '거실에서 3분만<br />목 풀고 갈래?';
  }
  $('#home-invite').onclick = () => {
    const s = st();
    tryEnter(s.closeSinceRest >= s.settings.close ? 'window' : 'living');
  };
  $$('.room').forEach(r => r.onclick = () => tryEnter(r.dataset.room));

  function tryEnter(room) {
    const plus = st().plan === 'plus';
    if (room === 'yard' || room === 'bed') {
      if (!plus) return openLock(room);
      return toast(`${ROOMS[room].short}은 지금 꾸미는 중이야. 곧 열릴게!`);
    }
    if (room === 'window' && !plus) return openLock(room);
    if (room === 'living' && !plus && Store.visitsToday('living') >= 1) return openLock('limit');
    startRest(room);
  }

  /* ---------- 잠금 시트 ---------- */
  function openLock(kind) {
    if (kind === 'limit') {
      $('#lock-title').textContent = '오늘 무료 쉼은 다 썼어';
      $('#lock-desc').textContent = '무료는 거실 목 쉼 하루 1번이야. 플러스면 언제든 와도 돼.';
    } else {
      $('#lock-title').textContent = `${ROOMS[kind].short}은 플러스에서 열려`;
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
    R.room = room; R.steps = routine(room); R.i = 0; R.elapsed = 0;
    R.total = R.steps.reduce((a, s) => a + s.sec, 0);
    $('#rest-room').textContent = ROOMS[room].label;
    show('s-rest');
    loadStep(true);
    play(true);
  }
  function setImg(name, mirror) {
    const a = $('#rest-img-a'), b = $('#rest-img-b');
    const [cur, nxt] = R.front === 'a' ? [a, b] : [b, a];
    if (cur.dataset.src === name && cur.classList.contains('mirror') === !!mirror) return;
    nxt.src = IMG(name); nxt.dataset.src = name;
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
    const now = Sound.toggle(b.dataset.sound);
    $$('.sound').forEach(x => x.classList.toggle('on', x.dataset.sound === now));
  });

  function finishRest() {
    play(false); Sound.stop(); $$('.sound').forEach(x => x.classList.remove('on'));
    Store.addVisit(R.room);
    const n = Store.visitsToday();
    $('#done-count').textContent = `오늘 ${n}번째 쉼이야`;
    $('#done-sub').textContent = ROOMS[R.room].done;
    $('#done-img').src = IMG(R.room === 'window' ? 'bareum_wave' : ch().done);
    show('s-done');
    Sound.chime();
    setTimeout(() => Sound.say(`잘했어, ${ch().voc}! ${ROOMS[R.room].done}`), 500);
  }
  $('#done-more').onclick = () => { show('s-home'); toast('어느 방으로 갈래?'); };
  $('#done-exit').onclick = () => show('s-home');

  /* ---------- 쉼 기록 ---------- */
  const ROOM_SHORT = { living: '거실', window: '창가', yard: '마당', bed: '침실' };
  function renderRecord() {
    const t = Store.today(), max = Math.max(60, ...t.hours);
    const peak = t.hours.indexOf(Math.max(...t.hours));
    $('#rec-hours').innerHTML = t.hours.map((v, h) =>
      `<i class="${v > 0 && h === peak ? 'hi' : ''}" style="height:${Math.max(3, (v / max) * 100)}%" title="${h}시 ${Math.round(v / 60)}분"></i>`).join('');
    const list = st().visits.slice(-8).reverse();
    $('#rec-list').innerHTML = list.length ? list.map(v => {
      const d = new Date(v.t);
      return `<li><span class="dot">${ROOM_SHORT[v.room][0]}</span>${ROOM_SHORT[v.room]} · ${ROOMS[v.room].what}<small>${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}</small></li>`;
    }).join('') : '<li class="empty">아직 놀러 온 적이 없어</li>';
    renderTilt();
  }
  function renderTilt() {
    const a = Sensors.angle(), lv = Sensors.level();
    $('#rec-mode').textContent = Sensors.demo.on ? '시연 모드' : '센서';
    $('#tilt-angle').textContent = a == null ? '--°' : `${a}°`;
    $('#tilt-phone').style.transform = `rotate(${a == null ? 0 : -(90 - a)}deg)`;
    const L = { none: '휴대폰을 들어 볼래?', rest: '책상에 내려놨네', down: '고개를 많이 숙였어', mid: '살짝 숙였어', good: '바른 자세야!' };
    $('#tilt-label').textContent = L[lv];
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
  $('#wk-prev').onclick = () => { wk -= 1; renderDiary(); };
  $('#wk-next').onclick = () => { if (wk < 0) { wk += 1; renderDiary(); } };

  /* ---------- 내 정보 ---------- */
  function renderMe() {
    const s = st().settings;
    $('#set-tilt').checked = s.tilt; $('#set-face').checked = s.face && Sensors.face.running; $('#set-voice').checked = s.voice;
    $('#set-limit').value = String(s.limit); $('#set-close').value = String(s.close);
    $('#me-plan').textContent = st().plan === 'plus' ? '플러스 · 방 4개 모두' : '무료 · 거실 목 쉼';
    $('#demo-on').checked = Sensors.demo.on;
  }
  $('#me-change').onclick = () => { st().char = st().char === 'sooki' ? 'sukdol' : 'sooki'; Store.save(); applyName(); toast(`이제 ${ch().name}로 놀러 와!`); };
  $('#set-tilt').onchange = e => { st().settings.tilt = e.target.checked; Store.save(); if (e.target.checked) Sensors.requestPermission(); };
  $('#set-voice').onchange = e => { st().settings.voice = e.target.checked; Store.save(); };
  $('#set-limit').onchange = e => { st().settings.limit = +e.target.value; Store.save(); };
  $('#set-close').onchange = e => { st().settings.close = +e.target.value; Store.save(); };
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
  $('#me-logout').onclick = () => show('s-login');

  /* ---------- 요금제 ---------- */
  function renderPlan() {
    const plus = st().plan === 'plus';
    $('#plan-free-now').textContent = plus ? '' : '지금 이용 중이야';
    $('#plan-plus').textContent = plus ? '플러스 이용 중이야 · 무료로 돌아가기' : '플러스로 놀러 갈게';
  }
  $('#plan-plus').onclick = () => {
    const plus = st().plan === 'plus';
    st().plan = plus ? 'free' : 'plus'; Store.save(true);
    renderPlan();
    toast(plus ? '무료로 돌아왔어' : '시연용이라 바로 플러스가 됐어! 방 4개 다 열렸어');
    if (!plus) setTimeout(() => show('s-home'), 900);
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
      if (screen === 's-home') { renderHome(); }
      if (screen === 's-record') renderTilt();
      if (s.settings.tilt && s.sinceRest >= s.settings.limit * 60) invite('living');
    }
    if (type === 'close') {
      if (screen === 's-home') renderHome();
      if (s.closeSinceRest >= s.settings.close) invite('window');
    }
  });

  /* ---------- 시작 ---------- */
  applyName();
  if (typeof DeviceOrientationEvent === 'undefined' || typeof DeviceOrientationEvent.requestPermission !== 'function') Sensors.requestPermission();
  show(st().onboarded ? 's-home' : 's-login');

  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
})();
