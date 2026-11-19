/* 바름이네 — 습관 감지
 *  1) 고개 숙임: 휴대폰 기울기(DeviceOrientation beta)로 추정
 *  2) 화면 가까이: 앞 카메라 + MediaPipe 얼굴 감지 (영상은 저장·전송하지 않음)
 *  3) 오래 사용 / 자정 이후 사용: 앱이 켜져 있는 시간
 */
const Sensors = (() => {
  const S = () => Store.state;
  const listeners = [];
  const emit = (type, data) => listeners.forEach(fn => fn(type, data));

  /* ---------- 기울기 ---------- */
  let beta = null, gamma = null, lastEvent = 0, hist = [];
  let permAsked = false, permState = 'unknown';  // unknown | granted | denied | unsupported
  const demo = { on: false, angle: 70 };

  function onOrient(e) {
    if (e.beta == null) return;
    beta = e.beta; gamma = e.gamma || 0; lastEvent = Date.now();
    hist.push({ t: lastEvent, b: beta, g: gamma });
    while (hist.length && lastEvent - hist[0].t > 2000) hist.shift();
    permState = 'granted';
  }

  async function requestPermission() {
    if (permAsked && permState !== 'unknown') return permState;
    permAsked = true;
    try {
      if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
        const r = await DeviceOrientationEvent.requestPermission();
        permState = r === 'granted' ? 'granted' : 'denied';
        if (permState === 'granted') window.addEventListener('deviceorientation', onOrient);
        return permState;
      }
      if ('DeviceOrientationEvent' in window) {
        window.addEventListener('deviceorientation', onOrient);
        return 'granted';
      }
    } catch (e) { permState = 'denied'; return permState; }
    permState = 'unsupported';
    return permState;
  }

  /* 휴대폰이 바닥과 이루는 각도 (0 = 눕힘, 90 = 세움) */
  function angle() {
    if (demo.on) return demo.angle;
    if (beta == null || Date.now() - lastEvent > 3000) return null;
    let a = Math.abs(beta);
    if (a > 90) a = 180 - a;
    return Math.round(a);
  }
  /* 손에 들고 있는지: 2초 동안 미세하게 흔들림 */
  function handheld() {
    if (demo.on) return true;
    if (hist.length < 5) return false;
    const bs = hist.map(h => h.b), gs = hist.map(h => h.g);
    const range = a => Math.max(...a) - Math.min(...a);
    return range(bs) > 0.6 || range(gs) > 0.6;
  }
  /* 자세 단계 */
  function level() {
    const a = angle();
    if (a == null) return 'none';
    if (!handheld()) return 'rest';      // 책상에 내려놓음
    if (a < 35) return 'down';           // 고개 많이 숙임
    if (a < 60) return 'mid';            // 살짝 숙임
    return 'good';                       // 바른 자세
  }

  /* ---------- 얼굴 거리 ---------- */
  const face = { running: false, loading: false, detector: null, stream: null, ratio: 0, closeSince: 0, counted: false, err: '' };
  const CLOSE_RATIO = 0.55;  // 얼굴 너비가 화면의 55% 넘으면 '가까움'
  const MP = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14';

  async function startFace() {
    if (face.running || face.loading) return true;
    face.loading = true; face.err = '';
    try {
      const video = document.getElementById('cam');
      face.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 320, height: 240 }, audio: false });
      video.srcObject = face.stream; await video.play();
      if (!face.detector) {
        const vision = await import(`${MP}/vision_bundle.mjs`);
        const files = await vision.FilesetResolver.forVisionTasks(`${MP}/wasm`);
        face.detector = await vision.FaceDetector.createFromOptions(files, {
          baseOptions: { modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite' },
          runningMode: 'VIDEO'
        });
      }
      face.running = true; face.loading = false;
      faceLoop();
      return true;
    } catch (e) {
      face.loading = false; face.err = e && e.name === 'NotAllowedError' ? '카메라 권한이 막혀 있어' : '얼굴 감지를 켤 수 없어';
      stopFace();
      return false;
    }
  }
  function stopFace() {
    face.running = false; face.ratio = 0;
    if (face.stream) face.stream.getTracks().forEach(t => t.stop());
    face.stream = null;
  }
  function faceLoop() {
    if (!face.running) return;
    const video = document.getElementById('cam');
    if (!document.hidden && video.readyState >= 2 && face.detector) {
      try {
        const r = face.detector.detectForVideo(video, performance.now());
        const det = r.detections && r.detections[0];
        face.ratio = det ? det.boundingBox.width / video.videoWidth : 0;
      } catch (e) {}
      const now = Date.now();
      if (face.ratio > CLOSE_RATIO) {
        if (!face.closeSince) face.closeSince = now;
        if (!face.counted && now - face.closeSince > 2000) {   // 2초 넘게 가까우면 1번
          face.counted = true;
          Store.today().close += 1; S().closeSinceRest += 1; Store.save();
          emit('close');
        }
      } else if (face.ratio < CLOSE_RATIO - 0.08) { face.closeSince = 0; face.counted = false; }
    }
    setTimeout(faceLoop, 350);
  }

  /* 시연용: 화면 가까이 1번 */
  function fakeClose() { Store.today().close += 1; S().closeSinceRest += 1; Store.save(); emit('close'); }

  /* ---------- 1초마다 ---------- */
  let session = 0, hiddenAt = 0;
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) hiddenAt = Date.now();
    else if (hiddenAt && Date.now() - hiddenAt > 60000) session = 0;   // 1분 넘게 쉬면 새로 셈
  });

  function tick() {
    if (document.hidden) return;
    const st = S(), d = Store.today(), h = new Date().getHours();
    session += 1;
    if (session > d.longest) d.longest = session;
    if (h < 5) d.night += 1;

    const lv = st.settings.tilt ? level() : 'none';
    if (lv === 'down' || lv === 'mid') {
      d.down += 1; d.hours[h] += 1; st.sinceRest += 1;
    }
    Store.save();
    emit('tick', { level: lv, angle: angle() });
  }
  setInterval(tick, 1000);

  return {
    on: fn => listeners.push(fn),
    requestPermission, angle, level, handheld, demo,
    startFace, stopFace, fakeClose, face,
    get permState() { return permState; },
    get hasData() { return demo.on || (beta != null && Date.now() - lastEvent < 3000); }
  };
})();
