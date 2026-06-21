/**
 * Constellation du Capricorne (Capricornus) — sur la droite du hero.
 * Les étoiles s'allument une par une, puis se relient par un trait lumineux.
 * Scintillement continu, boucle douce. Canvas 2D, couleurs or/glacier.
 */

// Capricornus — vraies positions (RA/Dec des étoiles Bayer) projetées et normalisées,
// dans l'ordre du tracé standard : α–β–ψ–ω–ζ–ε–δ–γ–ι–θ (boucle fermée).
const STARS = [
  { x: 0.000, y: 0.177, m: 2.6 }, // 0  α Algedi      (haut-gauche)
  { x: 0.036, y: 0.280, m: 2.6 }, // 1  β Dabih
  { x: 0.314, y: 0.751, m: 1.8 }, // 2  ψ Cap
  { x: 0.381, y: 0.823, m: 1.9 }, // 3  ω Cap          (pointe basse)
  { x: 0.771, y: 0.621, m: 2.0 }, // 4  ζ Cap
  { x: 0.910, y: 0.491, m: 1.8 }, // 5  ε Cap
  { x: 1.000, y: 0.338, m: 3.0 }, // 6  δ Deneb Algedi (la plus brillante, haut-droite)
  { x: 0.919, y: 0.365, m: 2.4 }, // 7  γ Nashira
  { x: 0.605, y: 0.370, m: 1.8 }, // 8  ι Cap
  { x: 0.538, y: 0.388, m: 2.0 }, // 9  θ Cap
];

// Étoiles d'ambiance (sans lien), positions fixes.
const FIELD = [
  [0.06, 0.12], [0.28, 0.08], [0.62, 0.1], [0.92, 0.16], [0.97, 0.36],
  [0.95, 0.7], [0.78, 0.9], [0.46, 0.94], [0.2, 0.86], [0.05, 0.66],
  [0.4, 0.5], [0.6, 0.46], [0.72, 0.42], [0.3, 0.4],
];

const STAR_T = 0.34; // délai entre l'allumage de deux étoiles
const REVEAL = STARS.length * STAR_T;
const HOLD = 4.0;
const FADE = 0.8;
const LOOP = REVEAL + HOLD + FADE;

export function initConstellation(canvas) {
  const ctx = canvas.getContext('2d');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let W = 1, H = 1, box = 1, ox = 0, oy = 0;
  // Géométrie mise en cache (évite de lire le layout à chaque frame → pas de reflow forcé).
  let vh = window.innerHeight || 1;
  let sy = window.scrollY || 0;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio, 2);
    W = canvas.clientWidth || 1;
    H = canvas.clientHeight || 1;
    vh = window.innerHeight || 1;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    box = Math.min(W, H) * 0.86;
    ox = (W - box) / 2;
    oy = (H - box) / 2;
  }
  const onScroll = () => { sy = window.scrollY || 0; };
  window.addEventListener('resize', resize);
  window.addEventListener('scroll', onScroll, { passive: true });
  resize();

  const PX = (s) => ox + s.x * box;
  const PY = (s) => oy + s.y * box;

  function star(x, y, r, a) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, a));
    ctx.shadowColor = 'rgba(201, 169, 98, 0.9)';
    ctx.shadowBlur = 12 + r * 3;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function line(a, b, p, alpha) {
    const ax = PX(a), ay = PY(a), bx = PX(b), by = PY(b);
    const x2 = ax + (bx - ax) * p, y2 = ay + (by - ay) * p;
    const g = ctx.createLinearGradient(ax, ay, bx, by);
    g.addColorStop(0, 'rgba(201, 169, 98, 0.55)');
    g.addColorStop(1, 'rgba(158, 200, 255, 0.55)');
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = g;
    ctx.lineWidth = 1;
    ctx.shadowColor = 'rgba(158, 200, 255, 0.5)';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.restore();
  }

  let t0 = 0, raf = 0;
  function frame(now) {
    raf = requestAnimationFrame(frame);
    if (sy > vh * 1.05) return; // hero hors écran : on gèle le dessin
    if (!t0) t0 = now;
    const t = (now - t0) / 1000;
    const cycle = reduced ? REVEAL + HOLD : t % LOOP;

    // Fondu global en fin de boucle.
    let ga = 1;
    if (cycle > REVEAL + HOLD) ga = 1 - (cycle - (REVEAL + HOLD)) / FADE;

    ctx.clearRect(0, 0, W, H);

    // Étoiles d'ambiance (scintillent).
    FIELD.forEach((f, i) => {
      const tw = 0.25 + 0.25 * Math.sin(t * 2 + i * 1.7);
      star(ox + f[0] * box, oy + f[1] * box, 0.9, tw * ga);
    });

    // Lignes : chaque segment se trace quand l'étoile d'arrivée est allumée.
    const n = STARS.length;
    for (let i = 0; i < n; i++) {
      const a = STARS[i];
      const b = STARS[(i + 1) % n];
      const litTime = i < n - 1 ? (i + 1) * STAR_T : n * STAR_T; // le segment de fermeture en dernier
      const p = Math.max(0, Math.min(1, (cycle - litTime) / 0.45));
      if (p > 0) line(a, b, p, 0.75 * ga);
    }

    // Étoiles : allumage une par une + scintillement.
    STARS.forEach((s, i) => {
      const k = Math.max(0, Math.min(1, (cycle - i * STAR_T) / 0.4));
      if (k > 0) {
        const tw = 0.72 + 0.28 * Math.sin(t * 3 + i);
        star(PX(s), PY(s), s.m * (0.4 + 0.6 * k), k * tw * ga);
      }
    });

  }
  raf = requestAnimationFrame(frame);

  return {
    dispose() {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('scroll', onScroll);
    },
  };
}
