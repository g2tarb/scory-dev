/**
 * SCORY — hub-orbs.js
 * Canvas plein viewport avec orbes qui orbitent en arriere-plan.
 * Inspire de pageOrbs.js de DYG : 8 couleurs archetypes, mouvement "orbit",
 * blur, glow, depth via Z fake (scale + alpha).
 *
 * Performance : 1 canvas, 8 orbes, requestAnimationFrame, pause hors focus.
 */

const ORB_COLORS = [
  [59, 130, 246],   // architect — bleu
  [34, 197, 94],    // shipper — vert
  [245, 197, 66],   // artisan — jaune
  [168, 85, 247],   // creative — violet
  [6, 182, 212],    // explorer — cyan
  [239, 68, 68],    // commando — rouge
  [249, 115, 22],   // mentor — orange
  [236, 72, 153],   // synth — rose
];

let canvas = null;
let ctx = null;
let orbs = [];
let rafId = null;
let lastFrame = 0;
let running = false;

function initOrbs(w, h) {
  const cx = w / 2;
  const cy = h / 2;
  const baseR = Math.min(w, h) * 0.35;
  orbs = ORB_COLORS.map((color, i) => ({
    color,
    angle: (i / ORB_COLORS.length) * Math.PI * 2,
    rx: baseR + (i % 3) * 80 + Math.random() * 60,
    ry: baseR * 0.7 + (i % 4) * 50,
    speed: 0.00012 + Math.random() * 0.00018,
    size: 240 + Math.random() * 140,
    alpha: 0.045 + Math.random() * 0.025,
    phase: Math.random() * Math.PI * 2,
  }));
}

function resize() {
  if (!canvas) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = window.innerWidth;
  const h = window.innerHeight;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  initOrbs(w, h);
}

function frame(now) {
  if (!running) return;
  const dt = lastFrame ? now - lastFrame : 16;
  lastFrame = now;

  const w = window.innerWidth;
  const h = window.innerHeight;
  const cx = w / 2;
  const cy = h / 2;

  // Pas de clear — on laisse une trail via fillRect semi-transparent.
  // Effet "depth + ambient" plus doux que clearRect.
  ctx.fillStyle = "rgba(9, 9, 11, 0.18)";
  ctx.fillRect(0, 0, w, h);

  // Composite "lighter" = additive blending, fait briller les orbes ensemble
  ctx.globalCompositeOperation = "lighter";

  for (const orb of orbs) {
    orb.angle += orb.speed * dt;
    const x = cx + Math.cos(orb.angle) * orb.rx;
    const y = cy + Math.sin(orb.angle) * orb.ry;
    // Depth fake : scale + alpha selon position Y (orbes "devant" plus claires)
    const depth = 0.5 + Math.sin(orb.angle + orb.phase) * 0.5;
    const size = orb.size * (0.85 + depth * 0.3);
    const alpha = orb.alpha * (0.6 + depth * 0.6);
    const [r, g, b] = orb.color;
    const grad = ctx.createRadialGradient(x, y, 0, x, y, size);
    grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${alpha})`);
    grad.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, ${alpha * 0.35})`);
    grad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalCompositeOperation = "source-over";
  rafId = requestAnimationFrame(frame);
}

export function initPageOrbs() {
  canvas = document.getElementById("page-orbs");
  if (!canvas) return;
  ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) return;

  resize();
  window.addEventListener("resize", resize, { passive: true });

  // Pause hors focus pour economiser CPU
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
    else start();
  });

  // Respect des prefs : pas de reduced-motion = pas d'orbes en mouvement
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced) {
    // Dessine 1 frame statique
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
