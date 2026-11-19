/* 바름이네 — 로그인
 *  - firebase-config.js가 채워져 있으면 Firebase 이메일 로그인
 *  - 비어 있으면 이 기기 안에서만 쓰는 시연용 계정 (localStorage)
 *  - 로그인한 사람마다 기록을 따로 저장 (Store가 'bareumine:user' 값을 보고 나눠 저장)
 */
const Auth = (() => {
  const USER_KEY = 'bareumine:user';
  const LOCAL_ACCOUNTS = 'bareumine:accounts';
  const cfg = window.FIREBASE_CONFIG || {};
  const useFirebase = !!(cfg.apiKey && window.firebase);
  let fb = null;
  if (useFirebase) {
    try { firebase.initializeApp(cfg); fb = firebase.auth(); fb.languageCode = 'ko'; } catch (e) { fb = null; }
  }

  const ls = {
    get: k => { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} },
    del: k => { try { localStorage.removeItem(k); } catch (e) {} }
  };

  /* 현재 사용자: { id, email, guest } 또는 null */
  function current() {
    try { return JSON.parse(ls.get(USER_KEY) || 'null'); } catch (e) { return null; }
  }
  function setCurrent(u) { if (u) ls.set(USER_KEY, JSON.stringify(u)); else ls.del(USER_KEY); }

  /* 간단한 해시 (시연용 계정 비밀번호를 그대로 저장하지 않으려고) */
  async function hash(text) {
    try {
      const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('bareumine:' + text));
      return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (e) { return btoa(unescape(encodeURIComponent(text))); }
  }
  const accounts = () => { try { return JSON.parse(ls.get(LOCAL_ACCOUNTS) || '{}'); } catch (e) { return {}; } };

  const MSG = {
    'auth/invalid-email': '이메일 모양이 이상해',
    'auth/email-already-in-use': '이미 가입한 이메일이야. 로그인해 줘',
    'auth/weak-password': '비밀번호는 6자 이상으로 해 줘',
    'auth/user-not-found': '가입하지 않은 이메일이야',
    'auth/wrong-password': '비밀번호가 맞지 않아',
    'auth/invalid-credential': '이메일이나 비밀번호가 맞지 않아',
    'auth/invalid-login-credentials': '이메일이나 비밀번호가 맞지 않아',
    'auth/too-many-requests': '시도가 너무 많아. 잠깐 뒤에 다시 해 줘',
    'auth/network-request-failed': '인터넷 연결을 확인해 줘'
  };
  const fail = code => { const e = new Error(MSG[code] || '로그인 중에 문제가 생겼어'); e.code = code; throw e; };

  function check(email, pw) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail('auth/invalid-email');
    if (!pw || pw.length < 6) fail('auth/weak-password');
  }

  async function signUp(email, pw) {
    email = email.trim().toLowerCase(); check(email, pw);
    if (fb) {
      try { const r = await fb.createUserWithEmailAndPassword(email, pw); setCurrent({ id: r.user.uid, email }); }
      catch (e) { fail(e.code); }
    } else {
      const acc = accounts();
      if (acc[email]) fail('auth/email-already-in-use');
      acc[email] = { pw: await hash(pw), id: 'local_' + Date.now().toString(36) };
      ls.set(LOCAL_ACCOUNTS, JSON.stringify(acc));
      setCurrent({ id: acc[email].id, email });
    }
    return current();
  }

  async function signIn(email, pw) {
    email = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail('auth/invalid-email');
    if (fb) {
      try { const r = await fb.signInWithEmailAndPassword(email, pw); setCurrent({ id: r.user.uid, email }); }
      catch (e) { fail(e.code); }
    } else {
      const a = accounts()[email];
      if (!a) fail('auth/user-not-found');
      if (a.pw !== await hash(pw)) fail('auth/wrong-password');
      setCurrent({ id: a.id, email });
    }
    return current();
  }

  async function resetPassword(email) {
    email = (email || '').trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail('auth/invalid-email');
    if (!fb) return '시연용 계정은 비밀번호를 찾을 수 없어. 새로 가입해 줘';
    try { await fb.sendPasswordResetEmail(email); } catch (e) { fail(e.code); }
    return '비밀번호 재설정 메일을 보냈어';
  }

  function guest() { setCurrent({ id: 'guest', email: '', guest: true }); return current(); }

  async function signOut() {
    if (fb) { try { await fb.signOut(); } catch (e) {} }
    setCurrent(null);
  }

  return { current, signUp, signIn, signOut, guest, resetPassword, get mode() { return fb ? 'firebase' : 'local'; } };
})();
