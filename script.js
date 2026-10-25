// Will you be mine? 💖 — the NO button that runs away
// Made by @hack.n.code  ·  ?name=Someone personalises the question
(() => {
  const $ = s => document.querySelector(s);
  const Q = new URLSearchParams(location.search);
  const CAP = Q.has('capture');
  const name = (Q.get('name') || '').trim().replace(/\s+/g, ' ').slice(0, 24);

  const LABELS = ['No', 'Are you sure? 🥺', 'Think again 😢', 'Pakka? 💔', 'Last chance 😭',
                  'Please? 🥹', 'Not an option 😤', 'Just say YES 💖'];
  const yes = $('#yes'), no = $('#no'), ask = $('#ask'), yay = $('#yay');
  const cv = $('#fx'), ctx = cv.getContext('2d');

  $('#q').textContent = name ? `${name}, will you be mine? 💖` : 'Will you be mine? 💖';
  if (name) document.title = `${name}, will you be mine? 💖`;

  // ---------- tiny helpers ----------
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, u) => a + (b - a) * u;
  const easeOutBack = u => { const c = 1.7; u -= 1; return 1 + (c + 1) * u * u * u + c * u * u; };
  const easeInOut = u => u < .5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
  const rnd = (i, k = 0) => { const s = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return s - Math.floor(s); };

  // ---------- state (everything is a function of time T) ----------
  let S;
  const reset = () => {
    S = { dodges: 0, moves: [], yesFrom: 1, yesTo: 1, yesT: -9, acceptedAt: null, seed: 1 };
    no.classList.remove('fled'); no.style.transform = ''; no.style.left = no.style.top = '';
    no.textContent = LABELS[0]; no.style.visibility = '';
    yes.style.transform = '';
  };
  reset();

  const noHome = () => { const r = no.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; };

  const noAt = t => {               // NO button centre + scale at time t
    let m = null; for (const x of S.moves) if (x.t <= t) m = x;
    if (!m) return null;
    const u = clamp((t - m.t) / .32), e = easeOutBack(u);
    return { x: lerp(m.from[0], m.to[0], e), y: lerp(m.from[1], m.to[1], e),
             s: lerp(m.s0, m.s1, easeOutBack(u)), rot: Math.sin(u * Math.PI) * (m.to[0] > m.from[0] ? 14 : -14), label: m.label };
  };
  const currentYesScale = t => lerp(S.yesFrom, S.yesTo, easeOutBack(clamp((t - S.yesT) / .4)));

  function dodge(t, to) {
    const cur = noAt(t), home = cur ? null : noHome();
    S.dodges++;
    const d = S.dodges;
    const s1 = Math.max(.6, 1 - d * .1), label = LABELS[Math.min(d, LABELS.length - 1)];
    const was = no.textContent; no.textContent = label;           // measure the new label so it never leaves the screen
    const hw = no.offsetWidth * s1 / 2 + 10, hh = no.offsetHeight * s1 / 2 + 10; no.textContent = was;
    to = [clamp(to[0], hw, innerWidth - hw), clamp(to[1], hh + 50, innerHeight - hh - 40)];
    S.moves.push({ t, from: cur ? [cur.x, cur.y] : home, to, s0: cur ? cur.s : 1, s1, label });
    S.yesFrom = currentYesScale(t); S.yesTo = Math.min(2.4, 1 + d * .32); S.yesT = t;
  }

  function randomSpot(px, py) {     // live mode: a free spot far from the finger and away from YES
    const W = innerWidth, H = innerHeight, r = no.getBoundingClientRect();
    const hw = Math.max(r.width, 210) / 2 + 12, hh = Math.max(r.height, 50) / 2 + 12;
    const y0 = yes.getBoundingClientRect();
    let best = null, bestD = -1;
    for (let i = 0; i < 40; i++) {
      const x = hw + Math.random() * (W - 2 * hw), y = Math.max(70, hh) + Math.random() * (H - Math.max(70, hh) - Math.max(70, hh));
      const overYes = x > y0.left - hw && x < y0.right + hw && y > y0.top - hh && y < y0.bottom + hh;
      if (overYes) continue;
      const dd = Math.hypot(x - px, y - py);
      if (dd > bestD) { bestD = dd; best = [x, y]; }
      if (dd > Math.min(W, H) * .45 && Math.random() < .5) break;
    }
    return best || [W / 2, 90];
  }

  function accept(t) { if (S.acceptedAt === null) S.acceptedAt = t; }

  // ---------- drawing ----------
  let DPR = 1;
  const fit = () => { DPR = Math.min(2, devicePixelRatio || 1); cv.width = innerWidth * DPR; cv.height = innerHeight * DPR; };
  fit(); addEventListener('resize', fit);

  function heart(x, y, s, rot, col, a) {
    ctx.save(); ctx.globalAlpha = a; ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
    ctx.beginPath(); ctx.moveTo(0, .35);
    ctx.bezierCurveTo(-.6, -.05, -.55, -.62, -.25, -.62); ctx.bezierCurveTo(-.08, -.62, 0, -.48, 0, -.38);
    ctx.bezierCurveTo(0, -.48, .08, -.62, .25, -.62); ctx.bezierCurveTo(.55, -.62, .6, -.05, 0, .35);
    ctx.fillStyle = col; ctx.fill(); ctx.restore();
  }
  const COLS = ['#ff2e63', '#ff5c8d', '#ff8fab', '#ffd1dc', '#ff0a54', '#ffffff', '#ffb3c6'];

  let lastT = 0;
  function render(T) {
    lastT = T;
    const W = innerWidth, H = innerHeight;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.clearRect(0, 0, W, H);

    // drifting background hearts
    for (let i = 0; i < 16; i++) {
      const sp = 22 + rnd(i, 1) * 30, ph = rnd(i, 2) * (H + 80);
      const y = H + 40 - ((T * sp + ph) % (H + 80)), x = rnd(i, 3) * W + Math.sin(T * .8 + i) * 14;
      heart(x, y, 10 + rnd(i, 4) * 16, Math.sin(T + i) * .3, '#ff5c8d', .10 + rnd(i, 5) * .12);
    }

    const A = S.acceptedAt;
    const k = A === null ? 0 : clamp((T - A - .15) / .45);
    // question screen
    ask.style.opacity = 1 - k; ask.style.transform = `scale(${1 - .08 * k})`;
    ask.style.pointerEvents = A === null ? '' : 'none';
    const b1 = $('#bear1'); b1.style.transform = `translateY(${Math.sin(T * 2.4) * 5}px) rotate(${Math.sin(T * 1.7) * 3}deg)`;

    // YES grows + glows
    const ys = A === null ? currentYesScale(T) : currentYesScale(T) * (1 + .25 * clamp((T - A) / .12) - .25 * clamp((T - A - .12) / .2));
    const pulse = .5 + .5 * Math.sin(T * 6.5);
    yes.style.setProperty('--g', (Math.min(1, S.dodges / 4) * .7 + .3) * pulse);
    yes.style.transform = `scale(${ys * (1 + .03 * pulse * Math.min(1, S.dodges))})`;

    // NO runs away
    const n = noAt(T);
    if (n) {
      if (!no.classList.contains('fled')) no.classList.add('fled');
      if (no.textContent !== n.label) no.textContent = n.label;
      no.style.transform = `translate(${n.x}px,${n.y}px) translate(-50%,-50%) scale(${n.s}) rotate(${n.rot}deg)`;
    }

    // success screen
    yay.style.opacity = k; yay.classList.toggle('on', k > .5);
    if (A !== null) {
      const u = T - A;
      yay.style.transform = `scale(${.85 + .15 * easeOutBack(clamp((u - .15) / .5))})`;
      const bnc = Math.abs(Math.sin(u * 5.2));
      $('#bear2').style.transform = `translateY(${-bnc * 26}px) scale(${1 + .06 * (1 - bnc)},${1 - .06 * (1 - bnc)}) rotate(${Math.sin(u * 2.6) * 6}deg)`;
      // heart explosion from the YES button
      const yr = yes.getBoundingClientRect(), cx = yr.left + yr.width / 2, cy = yr.top + yr.height / 2;
      const ox = S.ex ?? (S.ex = cx), oy = S.ey ?? (S.ey = cy);
      if (u < 3) for (let i = 0; i < 110; i++) {
        const ang = rnd(i, 7) * Math.PI * 2, sp = 260 + rnd(i, 8) * 720, life = 1.4 + rnd(i, 9) * 1.4;
        const tt = u - rnd(i, 10) * .08; if (tt < 0 || tt > life) continue;
        const dr = Math.exp(-tt * 1.6), dist = sp * (1 - dr) / 1.6;
        const x = ox + Math.cos(ang) * dist, y = oy + Math.sin(ang) * dist + 260 * tt * tt;
        heart(x, y, 14 + rnd(i, 11) * 26, Math.sin(tt * 4 + i) * .6, COLS[i % COLS.length], clamp(1 - tt / life) * clamp(tt * 12));
      }
      // shockwave ring
      if (u < .6) { ctx.save(); ctx.globalAlpha = 1 - u / .6; ctx.strokeStyle = '#ffd1dc'; ctx.lineWidth = 6 * (1 - u / .6) + 1;
        ctx.beginPath(); ctx.arc(ox, oy, 20 + u * 600, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); }
      // floating hearts rising forever
      const i0 = Math.max(0, Math.floor((u - 4.2) / .07)), i1 = Math.floor(u / .07);
      for (let i = i0; i <= i1; i++) {
        const tt = u - i * .07, life = 4.2; if (tt < 0 || tt > life) continue;
        const x = rnd(i, 12) * W + Math.sin(tt * 2 + i) * 18, y = H + 30 - tt * (H + 60) / life * (.8 + rnd(i, 13) * .4);
        heart(x, y, 12 + rnd(i, 14) * 22, Math.sin(tt * 3 + i) * .4, COLS[i % COLS.length], .85 * clamp(tt * 3) * clamp((life - tt) * 2));
      }
    }
    if (CAP) finger(T);
  }

  // ---------- live interaction ----------
  let ac = null;
  const boing = () => { if (CAP) return; try {
      ac = ac || new (window.AudioContext || window.webkitAudioContext)();
      const o = ac.createOscillator(), g = ac.createGain(), t = ac.currentTime;
      o.type = 'sine'; o.frequency.setValueAtTime(180, t); o.frequency.exponentialRampToValueAtTime(620, t + .12);
      o.frequency.exponentialRampToValueAtTime(260, t + .32);
      g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.25, t + .02); g.gain.exponentialRampToValueAtTime(.0001, t + .35);
      o.connect(g).connect(ac.destination); o.start(t); o.stop(t + .36);
    } catch (e) {} };
  const now = () => performance.now() / 1000;
  let lastDodge = -1;
  const tryNo = e => {
    if (CAP || S.acceptedAt !== null) return;
    e.preventDefault(); e.stopPropagation();
    const t = now(); if (t - lastDodge < .18) return; lastDodge = t;
    const px = e.clientX ?? innerWidth / 2, py = e.clientY ?? innerHeight / 2;
    dodge(t, randomSpot(px, py)); boing();
    if (navigator.vibrate) navigator.vibrate(15);
  };
  no.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') tryNo(e); });
  no.addEventListener('pointerdown', tryNo);
  no.addEventListener('click', tryNo);
  yes.addEventListener('click', () => { if (!CAP) { accept(now()); if (navigator.vibrate) navigator.vibrate([30, 40, 60]); } });
  $('#again').addEventListener('click', () => { reset(); });

  const toast = m => { const t = $('#toast'); t.textContent = m; t.classList.add('on'); clearTimeout(toast.h); toast.h = setTimeout(() => t.classList.remove('on'), 1800); };
  const shareUrl = nm => { const u = new URL(location.href); u.search = ''; u.hash = ''; if (nm) u.searchParams.set('name', nm); return u.toString(); };
  async function share(url) {
    const data = { title: 'Will you be mine? 💖', text: 'Try to press NO 😏', url };
    try { if (navigator.share) { await navigator.share(data); return; } } catch (e) { if (e && e.name === 'AbortError') return; }
    try { await navigator.clipboard.writeText(url); toast('Link copied! 💌'); } catch (e) { prompt('Copy this link 💌', url); }
  }
  $('#share').addEventListener('click', () => share(location.href.replace(/[?&]capture=1/, '')));
  $('#share2').addEventListener('click', () => share(location.href.replace(/[?&]capture=1/, '')));
  $('#mk').addEventListener('click', () => { const v = $('#nm').value.trim(); share(shareUrl(v)); });

  if (!CAP) { const loop = () => { render(now()); requestAnimationFrame(loop); }; requestAnimationFrame(loop); }

  // ---------- ?capture=1 : deterministic timeline for frame-by-frame recording ----------
  if (CAP) {
    document.body.classList.add('cap');
    document.body.insertAdjacentHTML('beforeend', '<div id="finger"></div><div id="rip"></div>');
    const SPOTS = [[.17, .34], [.83, .38], [.18, .82], [.82, .80], [.2, .3], [.8, .35]];
    const TL = { main: { d: [1.2, 2.3, 3.4, 4.5], y: 6.0 }, hook: { d: [.12, .42], y: .80 }, story: { d: [.7, 1.4, 2.1], y: 2.9 } };
    let tl = TL.main, built = null, home = null, yc = null;
    const build = () => {
      reset(); home = home || noHome(); const r = yes.getBoundingClientRect(); yc = yc || [r.left + r.width / 2, r.top + r.height / 2];
      tl.d.forEach((t, i) => dodge(t, [SPOTS[i % SPOTS.length][0] * innerWidth, SPOTS[i % SPOTS.length][1] * innerHeight]));
      accept(tl.y); built = { moves: S.moves.slice(), st: { ...S } };
    };
    // finger: glides to wherever NO is, NO escapes just before contact; then glides to YES and taps
    const fingerAt = T => {
      const W = innerWidth, H = innerHeight, targets = [];
      tl.d.forEach(t => { const n = noAt(t - 1e-4); targets.push({ t, p: n ? [n.x, n.y] : home }); });
      targets.push({ t: tl.y, p: yc, yes: true });
      let prevP = [W * .9, H * 1.08], prevT = Math.max(0, targets[0].t - .9);
      for (const g of targets) {
        if (T <= g.t) { const u = easeInOut(clamp((T - prevT) / Math.max(.05, g.t - prevT))); return { x: lerp(prevP[0], g.p[0], u), y: lerp(prevP[1], g.p[1], u), press: g.t - T < .07 && g.t - T >= 0, a: 1 }; }
        if (g.yes) { const u = clamp((T - g.t - .25) / .6); return { x: lerp(g.p[0], W * .85, easeInOut(u)), y: lerp(g.p[1], H * 1.1, easeInOut(u)), press: T - g.t < .1, a: 1 - u }; }
        prevP = g.p; prevT = g.t + .12;
        if (T <= prevT) return { x: prevP[0], y: prevP[1], press: true, a: 1 };
      }
      return { x: 0, y: 0, a: 0 };
    };
    function finger(T) {
      const f = $('#finger'), r = $('#rip'); const p = fingerAt(T);
      f.style.left = p.x + 'px'; f.style.top = p.y + 'px'; f.style.opacity = p.a; f.style.transform = `scale(${p.press ? .78 : 1})`;
      let last = null; for (const t of [...tl.d, tl.y]) if (t <= T) last = t;
      if (last !== null && T - last < .45) { const q = (T - last) / .45; const lp = fingerAt(last);
        r.style.left = lp.x + 'px'; r.style.top = lp.y + 'px'; r.style.opacity = 1 - q; r.style.transform = `scale(${1 + q * 2.6})`; }
      else r.style.opacity = 0;
    }
    window.__setTL = k => { tl = TL[k] || k; built = null; };
    window.__render = t => {
      if (!built) build();
      Object.assign(S, built.st); S.moves = built.moves;
      S.dodges = built.moves.filter(m => m.t <= t).length;
      // YES scale tween as seen at time t
      const d = S.dodges, tPrev = d ? tl.d[d - 1] : -9;
      S.yesTo = d ? Math.min(2.4, 1 + d * .32) : 1; S.yesFrom = d > 1 ? Math.min(2.4, 1 + (d - 1) * .32) : 1; S.yesT = tPrev;
      S.acceptedAt = t >= tl.y ? tl.y : null; S.ex = S.ey = undefined;
      if (!d) { no.classList.remove('fled'); no.style.transform = ''; no.textContent = LABELS[0]; }
      render(t);
    };
    document.fonts.ready.then(() => setTimeout(() => { window.__ready = true; }, 300));
  }
})();
