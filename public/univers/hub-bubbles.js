/**
 * SCORY — hub-bubbles.js
 * Sur la rubrique apprentissage : ~76 billes archetype DYG tournent en
 * cercles concentriques stricts (vs ellipses random) et REMPLACENT
 * visuellement le rail.
 *
 * 5 rings concentriques :
 *   - ring exterieur (large, lent)
 *   - rings intermediaires (vitesses variees, sens alternes)
 *   - ring interieur (petit, rapide)
 * Chaque ring distribue ses billes regulierement sur le cercle.
 * Couleurs : 8 archetypes DYG cyclees.
 *
 * Le canvas tourne en permanence (peu couteux), l'apparition/disparition
 * smooth se fait par opacity CSS (0.9s).
 */

const ORB_COLORS = [
  [59, 130, 246],   // architect
  [34, 197, 94],    // shipper
  [245, 197, 66],   // artisan
  [168, 85, 247],   // creative
  [6, 182, 212],    // explorer
  [239, 68, 68],    // commando
  [249, 115, 22],   // mentor
  [236, 72, 153],   // synth
];

// Definition des anneaux concentriques. radiusFactor est proportionnel au
// rayon visuel max du canvas (ex. 0.95 = juste en dedans du bord). speed est
// en radians/ms (positif = horaire visuellement, negatif = antihoraire).
const RINGS = [
  { count: 22, radiusFactor: 0.95, speed: 0.00045, size: [3.0, 5.5] },
  { count: 18, radiusFactor: 0.78, speed: -0.00065, size: [2.5, 4.5] },
  { count: 14, radiusFactor: 0.60, speed: 0.00090, size: [2.0, 4.0] },
  { count: 12, radiusFactor: 0.42, speed: -0.00130, size: [1.8, 3.5] },
  { count: 10, radiusFactor: 0.24, speed: 0.00180, size: [1.5, 3.0] },
];

let canvas = null;
let ctx = null;
let bubbles = [];
let maxRadius = 0;
let rafId = null;
let running = false;
let lastFrame = 0;

function rand(min, max) {
  return min + Math.random() * (max - min);
}

function initBubbles(w, h) {
  maxRadius = Math.min(w, h) / 2;
  bubbles = [];
  let colorIdx = 0;
  for (const ring of RINGS) {
    for (let i = 0; i < ring.count; i++) {
      const baseAngle = (i / ring.count) * Math.PI * 2;
      bubbles.push({
        ring,
        // Couleur cyclee + petit decalage par ring pour varier
        color: ORB_COLORS[(colorIdx++ + ring.count) % ORB_COLORS.length],
        baseAngle,
        angle: baseAngle + Math.random() * 0.2,
        size: rand(ring.size[0], ring.size[1]),
        // Tiny depth pulse pour vivre un peu (pas d'ellipse, le rayon ring est fixe)
        pulsePhase: Math.random() * Math.PI * 2,
        pulseAmp: 0.15 + Math.random() * 0.2,
      });
    }
  }
}

function resize() {
  if (!canvas) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const cssW = canvas.clientWidth;
  const cssH = canvas.clientHeight;
  canvas.width = cssW * dpr;
  canvas.height = cssH * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  initBubbles(cssW, cssH);
}

function frame(now) {
  if (!running) return;
  const dt = lastFrame ? Math.min(50, now - lastFrame) : 16;
  lastFrame = now;

  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  const cx = w / 2;
  const cy = h / 2;

  ctx.clearRect(0, 0, w, h);

  // Composite "lighter" : les billes additionnent leur glow ensemble,
  // forme une lueur globale plus belle quand elles se croisent.
  ctx.globalCompositeOperation = "lighter";

  for (const b of bubbles) {
    // Rotation strictement circulaire (rayon fixe sur le ring)
    b.angle += b.ring.speed * dt;
    const r = maxRadius * b.ring.radiusFactor;
    const x = cx + Math.cos(b.angle) * r;
    const y = cy + Math.sin(b.angle) * r;

    // Mini pulse alpha/scale pour donner vie sans casser l'orbit
    const pulse = (Math.sin(now * 0.002 + b.pulsePhase) + 1) / 2;
    const scale = 1 + pulse * b.pulseAmp;
    const alpha = 0.55 + pulse * 0.35;

    const [rr, gg, bb] = b.color;
    const sz = b.size * scale;
    const gr = sz * 7;

    // Halo (gradient radial)
    const halo = ctx.createRadialGradient(x, y, 0, x, y, gr);
    halo.addColorStop(0, `rgba(${rr},${gg},${bb},${(alpha * 0.22).toFixed(3)})`);
    halo.addColorStop(1, `rgba(${rr},${gg},${bb},0)`);
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(x, y, gr, 0, Math.PI * 2);
    ctx.fill();

    // Bille
    ctx.beginPath();
    ctx.arc(x, y, Math.max(0.8, sz), 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${rr},${gg},${bb},${alpha.toFixed(2)})`;
    ctx.fill();
  }

  ctx.globalCompositeOperation = "source-over";
  rafId = requestAnimationFrame(frame);
}

export function initDygBubbles() {
  canvas = document.getElementById("dyg-bubbles");
  if (!canvas) return;
  ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) return;

  resize();
  window.addEventListener("resize", resize, { passive: true });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
    else start();
  });

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced) {
    running = true;
    frame(performance.now());
    running = false;
    return;
  }

  start();
}

function start() {
  if (running || !ctx) return;
  running = true;
  lastFrame = 0;
  rafId = requestAnimationFrame(frame);
}

function stop() {
  running = false;
  if (rafId) cancelAnimationFrame(rafId);
  rafId = null;
}
