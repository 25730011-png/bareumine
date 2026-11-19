/* 바름이네 — 데이터 저장 (localStorage) */
const Store = (() => {
  const BASE = 'bareumine:v1';
  let KEY = BASE;   // 로그인하면 사람마다 따로: bareumine:v1:<id>

  const defaults = () => ({
    onboarded: false,
    char: null,               // 고르기 전 null → sooki | sukdol
    plan: 'free',             // free | plus
    settings: { tilt: true, face: false, voice: true, limit: 20, close: 10, sit: 60 },
    days: {},                 // 'YYYY-MM-DD' -> { down, close, longest, night, hours[24] }
    visits: [],               // { t, room }
    sinceRest: 0,             // 마지막 쉼 이후 고개 숙인 초
    closeSinceRest: 0,        // 마지막 쉼 이후 화면 가까이 횟수
    sitSinceRest: 0           // 마지막 쉼 이후 쉬지 않고 쓴 초
  });

  let state;
  function load() {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || 'null');
      const d = defaults();
      state = saved ? { ...d, ...saved, settings: { ...d.settings, ...(saved.settings || {}) } } : d;
    } catch (e) { state = defaults(); }
  }
  load();
  /* 로그인한 사람의 기록으로 바꾸기 */
  function useUser(id) { KEY = id ? `${BASE}:${id}` : BASE; load(); }

  let timer = null;
  function save(now) {
    const write = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} };
    if (now) { clearTimeout(timer); write(); return; }
    clearTimeout(timer); timer = setTimeout(write, 800);
  }

  const pad = n => String(n).padStart(2, '0');
  const dayKey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  function today() {
    const k = dayKey();
    if (!state.days[k]) state.days[k] = { down: 0, close: 0, longest: 0, night: 0, hours: Array(24).fill(0) };
    return state.days[k];
  }
  function day(k) { return state.days[k] || { down: 0, close: 0, longest: 0, night: 0, hours: Array(24).fill(0) }; }

  function addVisit(room) {
    state.visits.push({ t: Date.now(), room });
    if (state.visits.length > 500) state.visits = state.visits.slice(-500);
    state.sinceRest = 0;
    state.closeSinceRest = 0;
    state.sitSinceRest = 0;
    save(true);
  }
  function visitsToday(room) {
    const k = dayKey();
    return state.visits.filter(v => dayKey(new Date(v.t)) === k && (!room || v.room === room)).length;
  }

  function reset() {
    const keep = { onboarded: state.onboarded, char: state.char, settings: state.settings };
    state = { ...defaults(), ...keep };
    save(true);
  }

  /* 시연용 샘플 기록: 지난 7일 + 오늘 */
  function fillSample() {
    const now = new Date();
    const rooms = ['living', 'living', 'living', 'window', 'window', 'yard', 'bed'];
    const perDay = [1, 2, 1, 3, 2, 2, 1];
    state.visits = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now); d.setDate(now.getDate() - i);
      const k = dayKey(d);
      const hours = Array(24).fill(0);
      [9, 10, 11, 13, 14, 15, 16, 17, 21, 22, 23].forEach(h => { hours[h] = Math.round((4 + Math.random() * 10) * 60); });
      hours[15] = 22 * 60; hours[14] = 16 * 60;
      state.days[k] = {
        down: hours.reduce((a, b) => a + b, 0), close: 8 + Math.round(Math.random() * 8),
        longest: (60 + Math.round(Math.random() * 40)) * 60, night: Math.round(Math.random() * 30) * 60, hours
      };
      const n = i === 0 ? 0 : perDay[(d.getDay() + 6) % 7];   // 오늘 방문은 비워 둠 (무료 1번 시연용)
      for (let j = 0; j < n; j++) {
        const t = new Date(d); t.setHours(10 + j * 4, 12 + j * 7, 0, 0);
        if (t > now) t.setTime(now.getTime() - (j + 1) * 3600e3);
        state.visits.push({ t: t.getTime(), room: rooms[Math.floor(Math.random() * rooms.length)] });
      }
    }
    save(true);
  }

  return { get state() { return state; }, save, useUser, today, day, dayKey, addVisit, visitsToday, reset, fillSample };
})();
