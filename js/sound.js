/* 바름이네 — 배경 소리 (파일 없이 Web Audio로 생성) + 바름이 목소리 */
const Sound = (() => {
  let ctx = null, current = null, nodes = [];

  function ac() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function noiseBuffer(c, type) {
    const len = c.sampleRate * 4, buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      if (type === 'brown') { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; }
      else d[i] = w;
    }
    return buf;
  }

  function src(c, type) {
    const s = c.createBufferSource();
    s.buffer = noiseBuffer(c, type); s.loop = true; s.start();
    nodes.push(s); return s;
  }

  function build(kind) {
    const c = ac();
    const master = c.createGain(); master.gain.value = 0; master.connect(c.destination);
    master.gain.linearRampToValueAtTime(kind === 'wave' ? 0.5 : 0.35, c.currentTime + 1.2);
    nodes.push(master);

    if (kind === 'rain') {
      const s = src(c, 'white'), hp = c.createBiquadFilter(), lp = c.createBiquadFilter();
      hp.type = 'highpass'; hp.frequency.value = 900; lp.type = 'lowpass'; lp.frequency.value = 7000;
      s.connect(hp).connect(lp).connect(master);
      const s2 = src(c, 'brown'), g2 = c.createGain(); g2.gain.value = 0.5; s2.connect(g2).connect(master);
    }
    if (kind === 'wave') {
      const s = src(c, 'brown'), lp = c.createBiquadFilter(), g = c.createGain();
      lp.type = 'lowpass'; lp.frequency.value = 600;
      const lfo = c.createOscillator(), lg = c.createGain();
      lfo.frequency.value = 0.12; lg.gain.value = 0.45; g.gain.value = 0.55;
      lfo.connect(lg).connect(g.gain); lfo.start(); nodes.push(lfo);
      s.connect(lp).connect(g).connect(master);
    }
    if (kind === 'forest') {
      const s = src(c, 'brown'), bp = c.createBiquadFilter(), g = c.createGain();
      bp.type = 'bandpass'; bp.frequency.value = 500; g.gain.value = 0.6;
      s.connect(bp).connect(g).connect(master);
      const chirp = () => {
        if (current !== 'forest') return;
        const t = c.currentTime, o = c.createOscillator(), og = c.createGain();
        const f = 2400 + Math.random() * 1600;
        o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * 1.35, t + 0.09);
        og.gain.setValueAtTime(0, t); og.gain.linearRampToValueAtTime(0.06, t + 0.02); og.gain.linearRampToValueAtTime(0, t + 0.12);
        o.connect(og).connect(master); o.start(t); o.stop(t + 0.14);
        if (Math.random() < 0.5) setTimeout(chirp, 160);
        else setTimeout(chirp, 1200 + Math.random() * 2600);
      };
      setTimeout(chirp, 600);
    }
  }

  function stop() {
    nodes.forEach(n => { try { n.stop && n.stop(); n.disconnect(); } catch (e) {} });
    nodes = []; current = null;
  }
  function play(kind) { stop(); if (!kind) return; current = kind; build(kind); }
  function toggle(kind) { if (current === kind) { stop(); return null; } play(kind); return kind; }

  /* 효과음: 쉼 완료 */
  function chime() {
    const c = ac(), t = c.currentTime;
    [659, 784, 1047].forEach((f, i) => {
      const o = c.createOscillator(), g = c.createGain();
      o.type = 'sine'; o.frequency.value = f;
      g.gain.setValueAtTime(0, t + i * 0.12); g.gain.linearRampToValueAtTime(0.12, t + i * 0.12 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.12 + 0.6);
      o.connect(g).connect(c.destination); o.start(t + i * 0.12); o.stop(t + i * 0.12 + 0.7);
    });
  }

  /* 바름이 목소리 (브라우저 TTS) */
  let voice = null;
  function pickVoice() {
    const vs = speechSynthesis.getVoices().filter(v => v.lang && v.lang.startsWith('ko'));
    voice = vs.find(v => /yuna|sun|female|여/i.test(v.name)) || vs[0] || null;
  }
  if ('speechSynthesis' in window) { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }

  function say(text) {
    if (!('speechSynthesis' in window) || !Store.state.settings.voice) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text.replace(/\n/g, ' '));
    u.lang = 'ko-KR'; u.rate = 1.02; u.pitch = 1.25; if (voice) u.voice = voice;
    speechSynthesis.speak(u);
  }
  function hush() { if ('speechSynthesis' in window) speechSynthesis.cancel(); }

  return { play, stop, toggle, chime, say, hush, get current() { return current; }, unlock: ac };
})();
