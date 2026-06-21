/**
 * Sphère IA en BINAIRE qui PARLE · fond du portfolio (desktop uniquement).
 *  - orbe de chiffres 0/1 qui tourne en 3D et respire ;
 *  - quand elle "parle" (bulle en train de taper) : elle vibre + émet des ondes
 *    vocales (visualiseur type assistant), cœur qui pulse ;
 *  - bulle de dialogue qui débite des répliques pour pousser à signer ;
 *  - au chatbot, elle entre dans l'écran de la TV ; réseau de particules réactif à la souris.
 * Pur JS / Canvas 2D + une bulle DOM. Désactivée sur mobile (<820px / tactile).
 */

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const TAU = Math.PI * 2;

// Sphère de Fibonacci (points unitaires).
const SPHERE = (() => {
  const pts = [], N = 260, g = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < N; i++) {
    const y = 1 - (i / (N - 1)) * 2;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const th = g * i;
    pts.push([Math.cos(th) * r, y, Math.sin(th) * r]);
  }
  return pts;
})();

// Le discours s'adapte au disque/projet affiché (index aligné sur le carousel).
const LINE_SETS = [
  // 0 — Scory / le musée : navigation + présentation
  [
    "D'abord la navigation : les flèches ‹ › ou un swipe font tourner les disques.",
    "Cliquez un disque pour ouvrir le projet et lire son histoire. Regardez.",
    "Je suis le guide IA de Scory, je reste avec vous tout le long de la visite.",
    "Ici, c'est Scory : développeur web freelance à Paris, du design au déploiement.",
    "Du sur-mesure, jamais un template. Faites tourner les disques, je vous raconte chacun.",
  ],
  // 1 — 4dayvelopment
  [
    "Là, 4dayvelopment : l'agence web de Scory, un site livré en 4 jours ou c'est gratuit.",
    "Pour solopreneurs, coachs et artisans : performant, sur-mesure, pas de projet qui traîne.",
    "Design dark à accents orange, animations Three.js, pensé pour convertir.",
  ],
  // 2 — Clara Martinez
  [
    "Clara Martinez : un site vitrine luxe pour une coach business à Paris.",
    "Sa promesse : passer de freelance débordé à entrepreneur structuré.",
    "Dark luxe, aurora en Canvas, parcours soigné jusqu'à l'appel découverte.",
  ],
  // 3 — JIMMY
  [
    "JIMMY : une expérience narrative dark et une arène de combat en temps réel.",
    "Des combats générés par IA, permadeath, 12 000 lignes de TypeScript strict.",
    "Curseur de sang en Three.js, zéro framework. Du lourd, livré en solo.",
  ],
  // 4 — DYG
  [
    "DYG, Do Your Game : un scanner de profil GitHub, gratuit et sans compte.",
    "Il note ton profil sur 8 axes, te donne ton archétype de dev et des conseils.",
    "Front vanilla JS, back Fastify, PostgreSQL. Rapide, lisible, droit au but.",
  ],
  // 5 — SecurEats
  [
    "SecurEats : un écosystème fast-food 2-en-1, PWA installable + site vitrine.",
    "Chaque commande chiffrée par QR code AES-256, zéro confusion possible.",
    "100 % vanilla JS, service worker, crypto Web native maîtrisée.",
  ],
];

// Palette qui défile (la sphère change de couleur en continu).
const PALETTE = [
  [158, 200, 255], // glacier
  [201, 169, 98],  // or
  [169, 139, 255], // violet
  [107, 224, 216], // cyan
  [255, 139, 208], // rose
];
function curColor(t) {
  const f = (t / 5) % PALETTE.length; // 5 s par couleur
  const i = Math.floor(f), frac = f - i, a = PALETTE[i], b = PALETTE[(i + 1) % PALETTE.length];
  return `${Math.round(lerp(a[0], b[0], frac))},${Math.round(lerp(a[1], b[1], frac))},${Math.round(lerp(a[2], b[2], frac))}`;
}

export function initFxLayer(opts = {}) {
  // Mode "manuel" : pas de cycle auto, le discours est piloté par say() (ex. le formulaire de brief).
  const manual = !!opts.manual;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Mobile : version réduite (plus petite, allégée) au lieu de couper.
  const small = window.matchMedia('(max-width: 820px), (pointer: coarse)').matches;

  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  Object.assign(canvas.style, { position: 'fixed', inset: '0', width: '100%', height: '100%', zIndex: '40', pointerEvents: 'none', mixBlendMode: 'screen' });
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  let W = 1, H = 1;
  const resize = () => { const dpr = Math.min(devicePixelRatio, 2); W = innerWidth; H = innerHeight; canvas.width = W * dpr; canvas.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
  addEventListener('resize', resize); resize();

  // Bulle DOM + machine à écrire (pilote l'état "parle").
  const style = document.createElement('style');
  style.textContent = `
    .ai-bubble{position:fixed;z-index:45;max-width:270px;padding:11px 14px;border-radius:14px;background:rgba(9,16,24,.84);
      border:1px solid rgba(170,205,255,.45);box-shadow:0 0 26px rgba(110,200,255,.25),inset 0 0 22px rgba(0,40,60,.4);backdrop-filter:blur(6px);
      color:#e6efff;font-family:'JetBrains Mono',ui-monospace,monospace;font-size:12px;line-height:1.5;pointer-events:none;
      opacity:0;transform:translate(-50%,0) scale(.92);transition:opacity .35s ease,transform .35s ease;}
    .ai-bubble.on{opacity:1;transform:translate(-50%,0) scale(1);}
    .ai-bubble::after{content:'';position:absolute;left:26px;bottom:-7px;width:12px;height:12px;background:rgba(9,16,24,.84);
      border-right:1px solid rgba(170,205,255,.45);border-bottom:1px solid rgba(170,205,255,.45);transform:rotate(45deg);}
    .ai-cur{display:inline-block;color:#aacdff;animation:ai-blink 1s steps(2) infinite;}@keyframes ai-blink{50%{opacity:0}}
    @media (max-width:820px){.ai-bubble{max-width:168px;font-size:11px;padding:8px 11px;border-radius:11px;}.ai-bubble::after{left:18px;}}`;
  document.head.appendChild(style);
  const bubble = document.createElement('div'); bubble.className = 'ai-bubble'; bubble.setAttribute('aria-hidden', 'true');
  const btext = document.createElement('span'); const cur = document.createElement('span'); cur.className = 'ai-cur'; cur.textContent = '▍';
  bubble.append(btext, cur); document.body.appendChild(bubble);

  let li = 0, curSet = 0, pendingSet = null, typeId = 0, pauseId = 0, started = false, talking = false;
  // Cœur de la machine à écrire : tape `text` dans la bulle, puis appelle onDone().
  function typeText(text, onDone) {
    let ci = 0; btext.textContent = '';
    bubble.classList.add('on');
    if (reduced) { btext.textContent = text; if (onDone) onDone(); return; }
    talking = true;
    clearInterval(typeId);
    typeId = setInterval(() => {
      btext.textContent = text.slice(0, ci++);
      if (ci > text.length) { clearInterval(typeId); talking = false; if (onDone) onDone(); }
    }, 26);
  }
  function showLine() {
    if (pendingSet !== null) { if (pendingSet !== curSet) { curSet = pendingSet; li = 0; } pendingSet = null; }
    const lines = LINE_SETS[curSet] || LINE_SETS[0];
    typeText(lines[li % lines.length], () => {
      pauseId = setTimeout(() => { bubble.classList.remove('on'); pauseId = setTimeout(() => { li = (li + 1) % lines.length; showLine(); }, 480); }, 3400);
    });
  }
  // API manuelle : afficher un message précis (le formulaire pilote le discours).
  function say(text) {
    started = true;
    clearTimeout(pauseId); clearInterval(typeId);
    typeText(String(text || ''));
  }
  // Le discours suit le projet affiché (signal émis par app.js).
  addEventListener('scory:project', (e) => {
    const idx = e && e.detail ? e.detail.index : null;
    if (typeof idx !== 'number' || idx < 0 || idx >= LINE_SETS.length || idx === curSet) return;
    pendingSet = idx;
    // En pause entre deux phrases : on bascule tout de suite vers le nouveau projet.
    if (started && !talking) { clearTimeout(pauseId); curSet = idx; pendingSet = null; li = 0; bubble.classList.add('on'); showLine(); }
  }, { passive: true });

  // Particules.
  let seed = 11;
  const step = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff);
  const rnd = () => step() / 0x7fffffff;
  const rndChar = () => (((step() >>> 14) & 1) ? '1' : '0'); // vrai mix 0/1 (bit haut)
  const NP = small ? 22 : 50;
  const parts = Array.from({ length: NP }, () => ({ x: rnd() * W, y: rnd() * H, vx: (rnd() - .5) * .25, vy: (rnd() - .5) * .25 }));
  const mouse = { x: -1e3, y: -1e3 };
  addEventListener('mousemove', (e) => { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive: true });

  // Position de la TV en cache (coords document) → pas de reflow par frame.
  let tvDoc = null;
  const measureTv = () => { const el = document.querySelector('#chatbot-section .chatbot-container'); if (el) { const r = el.getBoundingClientRect(); tvDoc = { cx: r.left + (scrollX || 0) + r.width / 2, cy: r.top + (scrollY || 0) + r.height / 2, h: r.height }; } };
  addEventListener('resize', measureTv, { passive: true });
  [600, 1500, 3000].forEach((d) => setTimeout(measureTv, d));

  const FOCAL = 3.4;
  let voice = 0;          // niveau "vocal" lissé
  let ringT = 0;          // timer d'émission des ondes
  const rings = [];       // ondes vocales {r, a}

  function frame(now) {
    requestAnimationFrame(frame);
    const t = now / 1000;
    const C = curColor(t); // couleur courante (cycle)
    const sy = scrollY || 0;
    // Visible dès le haut : c'est là que l'IA présente le site (plus de masquage au top).
    const fade = 1;
    ctx.clearRect(0, 0, W, H);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';

    // Particules + réseau (souris).
    if (!reduced) parts.forEach((p) => { p.x += p.vx; p.y += p.vy; if (p.x < 0) p.x += W; else if (p.x > W) p.x -= W; if (p.y < 0) p.y += H; else if (p.y > H) p.y -= H; });
    ctx.lineWidth = 1; ctx.shadowBlur = 0;
    for (let i = 0; i < NP; i++) {
      const a = parts[i];
      for (let j = i + 1; j < NP; j++) { const b = parts[j], dx = a.x - b.x, dy = a.y - b.y, d2 = dx * dx + dy * dy; if (d2 < 15000) { ctx.globalAlpha = 1; ctx.strokeStyle = `rgba(170,205,255,${(1 - d2 / 15000) * .13 * fade})`; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); } }
      const mx = a.x - mouse.x, my = a.y - mouse.y, m2 = mx * mx + my * my, near = m2 < 30000;
      if (near) { ctx.strokeStyle = `rgba(201,169,98,${(1 - m2 / 30000) * .5 * fade})`; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke(); }
      ctx.globalAlpha = (near ? .9 : .32) * fade; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(a.x, a.y, near ? 2 : 1.1, 0, TAU); ctx.fill();
    }

    // Niveau vocal : flicker rapide quand elle parle, doux sinon.
    const target = reduced ? 0.15 : (talking ? 0.45 + 0.55 * Math.abs(Math.sin(t * 19)) : 0.12 + 0.06 * Math.sin(t * 1.6));
    voice = lerp(voice, target, 0.28);

    // Position : fond → écran de la TV.
    let k = 0, tvC = null, tvScale = 1;
    if (tvDoc) { const ys = tvDoc.cy - sy; tvC = { x: tvDoc.cx - (scrollX || 0), y: ys }; tvScale = tvDoc.h * 0.32; k = clamp(1 - Math.abs(ys - H / 2) / (H * 0.55), 0, 1); }
    const cx = lerp(W * 0.5, tvC ? tvC.x : W * 0.5, k) + (reduced ? 0 : Math.sin(t * 0.7) * 4);
    const cy = lerp(H * 0.34, tvC ? tvC.y : H * 0.34, k);
    const baseScale = lerp(Math.min(W, H) * (small ? 0.12 : 0.18), tvScale, k) * (1 + voice * 0.05);
    const fa = fade * lerp(0.85, 1, k);

    // Ondes vocales (émises quand elle parle).
    if (!reduced) {
      ringT += 1 / 60;
      if (talking && ringT > 0.42) { ringT = 0; rings.push({ r: 0.55, a: 0.5 }); }
      for (let i = rings.length - 1; i >= 0; i--) {
        const rg = rings[i]; rg.r += (1 / 60) * 0.9; rg.a -= (1 / 60) * 0.6;
        if (rg.a <= 0) { rings.splice(i, 1); continue; }
        ctx.globalAlpha = rg.a * fa; ctx.strokeStyle = `rgba(${C},1)`; ctx.lineWidth = 1.2;
        ctx.shadowColor = `rgba(${C},0.6)`; ctx.shadowBlur = 6;
        ctx.beginPath(); ctx.arc(cx, cy, rg.r * baseScale, 0, TAU); ctx.stroke();
      }
      ctx.shadowBlur = 0;
    }

    // Sphère de binaire qui tourne + vibre.
    const ay = reduced ? 0.3 : t * 0.22, ax = reduced ? 0.06 : Math.sin(t * 0.18) * 0.18;
    const cay = Math.cos(ay), say = Math.sin(ay), cax = Math.cos(ax), sax = Math.sin(ax);
    for (let i = 0; i < SPHERE.length; i += small ? 2 : 1) {
      const [ux, uy, uz] = SPHERE[i];
      // déformation "vocale" : ondulation radiale qui suit le niveau de voix.
      const ripple = reduced ? 0 : (voice * 0.13 * Math.sin(uy * 8 + t * 16 + ux * 4) + Math.sin(t * 1.4 + i) * 0.012);
      const rd = 1 + ripple;
      let x = ux * rd, y = uy * rd, z = uz * rd;
      let xz = x * cay - z * say; let zz = x * say + z * cay;
      const yz = y * cax - zz * sax; zz = y * sax + zz * cax;
      const persp = FOCAL / (FOCAL - zz);
      const sx = cx + xz * baseScale * persp, syy = cy - yz * baseScale * persp;
      const depth = clamp((zz + 1.1) / 2.1, 0.12, 1);
      const col = i % 9 === 0 ? '255,255,255' : C; // couleur cyclée + quelques éclats blancs
      const size = clamp(baseScale * 0.1 * persp, 6, 14);
      const tw = reduced ? 0.85 : 0.55 + 0.3 * Math.sin(t * 5 + i) + voice * 0.2;
      const a = clamp((0.55 + voice * 0.35) * depth * tw * fa, 0, 1);
      if (a < 0.03) continue;
      ctx.globalAlpha = a; ctx.fillStyle = `rgb(${col})`; ctx.shadowColor = `rgba(${col},0.7)`; ctx.shadowBlur = small ? 0 : size * 0.5;
      ctx.font = `${size}px 'JetBrains Mono', ui-monospace, monospace`;
      ctx.fillText(rndChar(), sx, syy);
    }
    // Cœur lumineux qui pulse avec la voix.
    ctx.globalAlpha = clamp((0.5 + voice * 0.5) * fa, 0, 1);
    ctx.fillStyle = '#fff'; ctx.shadowColor = `rgba(${C},0.9)`; ctx.shadowBlur = 18 + voice * 26;
    ctx.beginPath(); ctx.arc(cx, cy, 3 + voice * 4, 0, TAU); ctx.fill();
    ctx.globalAlpha = 1; ctx.shadowBlur = 0;

    // Bulle : suit la sphère.
    if (fade > 0.4) {
      if (!started) { started = true; bubble.classList.add('on'); if (!manual) showLine(); }
      bubble.style.display = '';
      const bm = small ? 90 : 150; // marge horizontale (bulle plus étroite sur mobile)
      bubble.style.left = clamp(cx + baseScale * 0.95, bm, W - bm) + 'px';
      bubble.style.top = clamp(cy - baseScale * 1.0, 16, H - 130) + 'px';
    } else bubble.style.display = 'none';
  }
  requestAnimationFrame(frame);
  return { say };
}
