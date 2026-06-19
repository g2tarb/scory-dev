/**
 * Visage d'IA HUMAIN en binaire (0/1), bloqué dans l'écran — fond du portfolio.
 *  - silhouette humaine (ovale + menton), yeux en amande, nez (arête+narines), lèvres ;
 *  - quasi face caméra : il est "coincé" et regarde dehors (léger balancement nerveux,
 *    pupilles qui cherchent une sortie, pression vers la vitre) ;
 *  - expressions qui morphent : sourit / rigole (bouge) / nargue / s'énerve ;
 *  - bulle de dialogue qui débite des répliques pour pousser à signer ;
 *  - au chatbot, il entre dans l'écran de la TV. Réseau de particules réactif à la souris.
 * Pur JS / Canvas 2D + bulle DOM. Désactivé en reduced-motion.
 */

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const TAU = Math.PI * 2;
const g2 = (x, y, cx, cy, s) => Math.exp(-(((x - cx) ** 2) + ((y - cy) ** 2)) / s);

// Silhouette : demi-largeur du visage à la hauteur y (front large → menton fin).
function halfW(y) {
  if (y > 1.04 || y < -1.06) return -1;
  if (y >= 0) return 0.6 * Math.sqrt(Math.max(0, 1 - (y / 1.06) ** 2));
  const tt = -y / 1.06;
  return 0.6 * Math.sqrt(Math.max(0, 1 - (y / 1.2) ** 2)) * (1 - 0.44 * tt);
}
// Relief (profondeur vers l'avant) : nez saillant, pommettes, orbites creusées, menton.
function relief(x, y) {
  let z = 0.08;
  z += 0.42 * Math.exp(-(x * x) / 0.006) * Math.exp(-((y + 0.02) ** 2) / 0.05); // arête du nez
  z += 0.05 * g2(x, y, 0, 0.34, 0.03);                                          // front
  z += 0.045 * (g2(x, y, 0.35, -0.05, 0.02) + g2(x, y, -0.35, -0.05, 0.02));    // pommettes
  z -= 0.05 * (g2(x, y, 0.27, 0.13, 0.012) + g2(x, y, -0.27, 0.13, 0.012));     // orbites
  z += 0.05 * g2(x, y, 0, -0.8, 0.025);                                         // menton
  return z;
}

// Peau : grille de points 0/1 dans la silhouette (statique, déterministe).
const SKIN = (() => {
  const pts = [];
  for (let y = -0.98; y <= 1.0; y += 0.085) {
    const h = halfW(y);
    if (h <= 0) continue;
    for (let x = -h; x <= h; x += 0.085) pts.push([x, y, relief(x, y), 0]);
  }
  return pts;
})();
// Nez explicite (arête + pointe + narines), bien en avant.
const NOSE = [
  [0, 0.2], [0, 0.1], [0, 0.0], [0, -0.08], [0, -0.13],
  [0.06, -0.13], [-0.06, -0.13], [0.09, -0.1], [-0.09, -0.1],
].map(([x, y]) => [x, y, relief(x, y) + 0.14, 4]);

const MOODS = {
  smile: { mOpen: 0.1, mCurve: 0.8, brow: 0.25, eye: 0.95, asym: 0, bob: 0 },
  laugh: { mOpen: 0.62, mCurve: 0.9, brow: 0.45, eye: 0.22, asym: 0, bob: 1 },
  smirk: { mOpen: 0.1, mCurve: 0.45, brow: 0.0, eye: 0.85, asym: 0.8, bob: 0 },
  angry: { mOpen: 0.22, mCurve: -0.7, brow: -1, eye: 0.6, asym: 0, bob: 0.35 },
};
const MOOD_ORDER = ['smile', 'laugh', 'smirk', 'laugh', 'angry', 'smile'];
const COLOR = { 0: '128,165,205', 1: '170,205,255', 2: '255,255,255', 3: '170,205,255', 4: '160,195,235', 5: '170,205,255' };
const MOOD_COLOR = { smile: '170,205,255', laugh: '201,169,98', smirk: '180,215,255', angry: '255,80,70' };

const LINES = [
  "Psst… c'est Scory qui m'a codé. Un dev de génie, je confirme.",
  "Il m'a laissé seul ici… alors je fais le commercial : signe avec lui.",
  "Conseil d'IA : prends le RDV pendant que j'ai l'air sympa.",
  "Son code est aussi propre que mon sourire en binaire.",
  "T'hésites ? Je suis fait de 0 et de 1, et même moi je suis convaincu.",
  "Un site sur mesure, jamais un template. Crois l'IA.",
  "Donne ton prénom là-haut. Je mords pas, je suis du binaire.",
  "Scory change les idées en sites qui cartonnent. Moi, l'ennui en sourire.",
  "Tu trouveras pas plus motivé que ce mec. Ni que moi.",
  "Sors-moi de cet écran… ou au moins clique sur « Lance ta demande ».",
];

export function initFxLayer() {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Mobile : on ne charge pas le calque lourd (visage + particules + bulle) — ça surcharge le petit écran.
  if (window.matchMedia('(max-width: 820px), (pointer: coarse)').matches) return;
  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  Object.assign(canvas.style, { position: 'fixed', inset: '0', width: '100%', height: '100%', zIndex: '40', pointerEvents: 'none', mixBlendMode: 'screen' });
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  let W = 1, H = 1;
  const resize = () => { const dpr = Math.min(devicePixelRatio, 2); W = innerWidth; H = innerHeight; canvas.width = W * dpr; canvas.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
  addEventListener('resize', resize); resize();

  const style = document.createElement('style');
  style.textContent = `
    .ai-bubble{position:fixed;z-index:45;max-width:270px;padding:11px 14px;border-radius:14px;background:rgba(9,16,24,.84);
      border:1px solid rgba(170,205,255,.45);box-shadow:0 0 26px rgba(110,200,255,.25),inset 0 0 22px rgba(0,40,60,.4);backdrop-filter:blur(6px);
      color:#e6efff;font-family:'JetBrains Mono',ui-monospace,monospace;font-size:12px;line-height:1.5;pointer-events:none;
      opacity:0;transform:translate(-50%,0) scale(.92);transition:opacity .35s ease,transform .35s ease;}
    .ai-bubble.on{opacity:1;transform:translate(-50%,0) scale(1);}
    .ai-bubble::after{content:'';position:absolute;left:26px;bottom:-7px;width:12px;height:12px;background:rgba(9,16,24,.84);
      border-right:1px solid rgba(170,205,255,.45);border-bottom:1px solid rgba(170,205,255,.45);transform:rotate(45deg);}
    .ai-cur{display:inline-block;color:#aacdff;animation:ai-blink 1s steps(2) infinite;}@keyframes ai-blink{50%{opacity:0}}`;
  document.head.appendChild(style);
  const bubble = document.createElement('div'); bubble.className = 'ai-bubble'; bubble.setAttribute('aria-hidden', 'true');
  const btext = document.createElement('span'); const cur = document.createElement('span'); cur.className = 'ai-cur'; cur.textContent = '▍';
  bubble.append(btext, cur); document.body.appendChild(bubble);
  let li = 0, typeId = 0, started = false;
  function showLine() {
    const text = LINES[li]; let ci = 0; btext.textContent = '';
    if (reduced) { btext.textContent = text; return; }
    clearInterval(typeId);
    typeId = setInterval(() => { btext.textContent = text.slice(0, ci++); if (ci > text.length) { clearInterval(typeId); setTimeout(() => { bubble.classList.remove('on'); setTimeout(() => { li = (li + 1) % LINES.length; bubble.classList.add('on'); showLine(); }, 480); }, 3400); } }, 26);
  }

  let seed = 11;
  const rndChar = () => ((seed = (seed * 16807) & 0x7fffffff) & 1 ? '1' : '0');
  const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
  const NP = 50;
  const parts = Array.from({ length: NP }, () => ({ x: rnd() * W, y: rnd() * H, vx: (rnd() - .5) * .25, vy: (rnd() - .5) * .25 }));
  const mouse = { x: -1e3, y: -1e3 };
  addEventListener('mousemove', (e) => { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive: true });

  const st = { mOpen: .1, mCurve: .8, brow: .25, eye: .95, asym: 0, bob: 0 };
  let moodIdx = 0, moodT = 0, blinkT = 0;
  // Position de la TV mise en CACHE (coords document) → plus de reflow par frame.
  let tvDoc = null;
  const measureTv = () => {
    const el = document.querySelector('#chatbot-section .chatbot-container');
    if (el) { const r = el.getBoundingClientRect(); tvDoc = { cx: r.left + (window.scrollX || 0) + r.width / 2, cy: r.top + (window.scrollY || 0) + r.height / 2, h: r.height }; }
  };
  addEventListener('resize', measureTv, { passive: true });
  [600, 1500, 3000].forEach((d) => setTimeout(measureTv, d)); // une fois la mise en page / les fonts stabilisées
  const FOCAL = 3.4;

  // Traits du visage selon l'état (yeux amande + pupille qui cherche, sourcils, lèvres).
  function features(eyeOpen, t) {
    const out = [];
    const dx = reduced ? 0 : Math.sin(t * 0.8) * 0.03, dy = reduced ? 0 : Math.sin(t * 1.27) * 0.018; // pupilles nerveuses
    for (const sgn of [-1, 1]) {
      const cxE = sgn * 0.26, cyE = 0.13, hw = 0.16;
      for (let i = 0; i <= 9; i++) {                       // amande : paupière haute + basse
        const tx = (i / 9) * 2 - 1, x = cxE + tx * hw, f = 1 - tx * tx;
        out.push([x, cyE + eyeOpen * 0.06 * f, relief(x, cyE) + 0.015, 1]);
        out.push([x, cyE - eyeOpen * 0.045 * f, relief(x, cyE) + 0.015, 1]);
      }
      if (eyeOpen > 0.3) out.push([cxE + dx, cyE + dy, relief(cxE, cyE) + 0.05, 2]); // pupille
      for (let i = 0; i <= 4; i++) {                        // sourcil
        const tt = i / 4, x = sgn * (0.13 + tt * 0.26), y = 0.32 + st.brow * 0.09 * (1 - tt) + Math.sin(tt * Math.PI) * 0.015;
        out.push([x, y, relief(x, y) + 0.02, 3]);
      }
    }
    for (let i = 0; i <= 9; i++) {                           // lèvres
      const tx = (i / 9) * 2 - 1, x = tx * 0.22, corner = st.mCurve * 0.07 * (tx * tx) + st.asym * 0.045 * tx;
      const base = -0.46 + corner;
      out.push([x, base + st.mOpen * 0.06 - 0.018 * Math.exp(-(x * x) / 0.006), relief(x, base) + 0.02, 5]); // lèvre haute (cupidon)
      out.push([x, base - st.mOpen * 0.08, relief(x, base) + 0.02, 5]);                                       // lèvre basse
    }
    return out;
  }

  function frame(now) {
    requestAnimationFrame(frame);
    const t = now / 1000, sy = scrollY || 0, fade = clamp((sy - H * 0.7) / (H * 0.5), 0, 1);
    ctx.clearRect(0, 0, W, H);
    if (fade <= 0.01) { bubble.style.display = 'none'; return; }
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';

    if (!reduced) parts.forEach((p) => { p.x += p.vx; p.y += p.vy; if (p.x < 0) p.x += W; else if (p.x > W) p.x -= W; if (p.y < 0) p.y += H; else if (p.y > H) p.y -= H; });
    ctx.lineWidth = 1; ctx.shadowBlur = 0;
    for (let i = 0; i < NP; i++) {
      const a = parts[i];
      for (let j = i + 1; j < NP; j++) { const b = parts[j], ax = a.x - b.x, ay = a.y - b.y, d2 = ax * ax + ay * ay; if (d2 < 15000) { ctx.globalAlpha = 1; ctx.strokeStyle = `rgba(170,205,255,${(1 - d2 / 15000) * .13 * fade})`; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); } }
      const mx = a.x - mouse.x, my = a.y - mouse.y, m2 = mx * mx + my * my, near = m2 < 30000;
      if (near) { ctx.strokeStyle = `rgba(201,169,98,${(1 - m2 / 30000) * .5 * fade})`; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke(); }
      ctx.globalAlpha = (near ? .9 : .32) * fade; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(a.x, a.y, near ? 2 : 1.1, 0, TAU); ctx.fill();
    }

    const target = MOODS[MOOD_ORDER[moodIdx]], rate = reduced ? 1 : 0.07;
    for (const key of ['mOpen', 'mCurve', 'brow', 'eye', 'asym', 'bob']) st[key] = lerp(st[key], target[key], rate);
    if (!reduced) { moodT += 1 / 60; if (moodT > 3.4) { moodT = 0; moodIdx = (moodIdx + 1) % MOOD_ORDER.length; } blinkT += 1 / 60; if (blinkT > 3.6) blinkT = -0.16; }
    const blink = blinkT < 0 ? clamp(Math.abs(blinkT) / 0.16, 0.05, 1) : 1;
    const moodName = MOOD_ORDER[moodIdx];

    let k = 0, tvC = null, tvScale = 1;
    if (tvDoc) { const ys = tvDoc.cy - (window.scrollY || 0); tvC = { x: tvDoc.cx - (window.scrollX || 0), y: ys }; tvScale = tvDoc.h * 0.36; k = clamp(1 - Math.abs(ys - H / 2) / (H * 0.55), 0, 1); }
    const bob = reduced ? 0 : Math.sin(t * 13) * st.bob * 0.035;             // rebond du rire
    const press = reduced ? 0 : Math.max(0, Math.sin(t * 0.5)) ** 3;          // pression vers la vitre
    const cx = lerp(W * 0.5, tvC ? tvC.x : W * 0.5, k);
    const cy = lerp(H * 0.32, tvC ? tvC.y : H * 0.32, k);
    const scale = lerp(Math.min(W, H) * 0.21, tvScale, k) * (1 + press * 0.05);
    const fa = fade * lerp(0.85, 1, k);

    const pts = SKIN.concat(NOSE, features(st.eye * blink, t));
    // Quasi face caméra : petit balancement nerveux (il est coincé, il regarde dehors).
    const ay = reduced ? 0.12 : Math.sin(t * 0.45) * 0.16, ax = reduced ? 0.05 : Math.sin(t * 0.33) * 0.05;
    const cay = Math.cos(ay), say = Math.sin(ay), cax = Math.cos(ax), sax = Math.sin(ax);

    for (let i = 0; i < pts.length; i++) {
      const [x, y, z, ty] = pts[i];
      let xz = x * cay - z * say, zz = x * say + z * cay;
      const yz = (y + bob) * cax - zz * sax; zz = (y + bob) * sax + zz * cax;
      const persp = FOCAL / (FOCAL - (zz + press * 0.4));
      const sx = cx + xz * scale * persp, syy = cy - yz * scale * persp;
      const depth = clamp((zz + 1.1) / 2.1, 0.12, 1), feat = ty !== 0;
      const col = ty === 5 || ty === 3 ? MOOD_COLOR[moodName] : COLOR[ty];
      const size = clamp(scale * (feat ? 0.115 : 0.092) * persp, 6, 15);
      const tw = reduced ? 0.9 : feat ? 0.72 + 0.28 * Math.sin(t * 6 + i) : 0.55 + 0.2 * Math.sin(t * 3 + i);
      const a = (feat ? 0.95 : 0.45) * depth * tw * fa;
      if (a < 0.03) continue;
      ctx.globalAlpha = a; ctx.fillStyle = `rgb(${col})`; ctx.shadowColor = `rgba(${col},0.7)`; ctx.shadowBlur = feat ? size * 0.7 : 0;
      ctx.font = `${size}px 'JetBrains Mono', ui-monospace, monospace`;
      ctx.fillText(rndChar(), sx, syy);
    }
    ctx.globalAlpha = 1; ctx.shadowBlur = 0;

    if (fade > 0.4) {
      if (!started) { started = true; bubble.classList.add('on'); showLine(); }
      bubble.style.display = '';
      bubble.style.left = clamp(cx + scale * 0.8, 150, W - 150) + 'px';
      bubble.style.top = clamp(cy - scale * 1.0, 16, H - 130) + 'px';
    } else bubble.style.display = 'none';
  }
  requestAnimationFrame(frame);
}
