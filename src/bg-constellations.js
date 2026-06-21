/**
 * Fond de constellations révélé au scroll (à partir de la 2e section).
 *  - champ d'étoiles en parallaxe douce,
 *  - petites constellations ancrées le long de la page qui se dessinent
 *    étoile par étoile quand elles entrent dans le viewport.
 * Invisible sur le hero (fondu après ~0.6 écran scrollé). Canvas 2D, or/glacier.
 */

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// Petites constellations : x = position horizontale (0..1), vh = ancrage vertical
// (en hauteurs d'écran depuis le haut), s = échelle, stars = offsets, liaisons.
const SHAPES = [
  { x: 0.2, vh: 1.9, s: 0.05, seq: true, stars: [[0, 0], [1, -0.6], [2, 0], [3, -0.6], [4, 0.05]] }, // W
  { x: 0.82, vh: 2.7, s: 0.07, seq: true, close: true, stars: [[0, 0], [1.4, 0.25], [0.7, 1.2]] }, // triangle
  { x: 0.16, vh: 3.6, s: 0.05, seq: true, stars: [[0, 0], [1, 0.1], [2, 0], [3, -0.3], [3.1, 0.7], [2.1, 0.9], [1.1, 0.85]] }, // louche
  { x: 0.8, vh: 4.5, s: 0.07, edges: [[0, 1], [1, 2], [3, 4]], stars: [[0, 0], [0, 1], [0, 2], [-0.7, 1], [0.7, 1]] }, // croix
  { x: 0.24, vh: 5.4, s: 0.07, edges: [[0, 1], [1, 2], [3, 4]], stars: [[0, 0], [1, 0.7], [2, 0], [1, 0.4], [1, 1.4]] }, // chevron
  { x: 0.78, vh: 6.3, s: 0.06, seq: true, stars: [[0, 0], [0.9, 0.5], [1.9, 0.3], [2.6, 1.0], [3.6, 0.7]] }, // arc
];

const FIELD_VH = 8; // hauteur virtuelle du champ d'étoiles (en écrans)

export function initBgConstellations(canvas) {
  const ctx = canvas.getContext('2d');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let W = 1, H = 1;
  let sy = window.scrollY || 0; // mis en cache (pas de lecture du layout par frame)

  function resize() {
    const dpr = Math.min(window.devicePixelRatio, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  const onScroll = () => { sy = window.scrollY || window.pageYOffset || 0; };
  window.addEventListener('resize', resize);
  window.addEventListener('scroll', onScroll, { passive: true });
  resize();

  // Étoiles d'ambiance : positions fixes (déterministes), parallaxe douce.
  const FIELD = [];
  let seed = 7;
  const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
  for (let i = 0; i < 90; i++) {
    FIELD.push({ x: rnd(), y: rnd() * FIELD_VH, r: 0.5 + rnd() * 1.1, ph: rnd() * 6.28, par: 0.5 + rnd() * 0.3 });
  }

  function dot(x, y, r, a) {
    if (a <= 0.01 || y < -4 || y > H + 4) return;
    ctx.save();
    ctx.globalAlpha = clamp(a, 0, 1);
    ctx.shadowColor = 'rgba(201,169,98,0.8)';
    ctx.shadowBlur = 6 + r * 2;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 6.2832);
    ctx.fill();
    ctx.restore();
  }

  function seg(ax, ay, bx, by, p, a, glacier) {
    if (p <= 0) return;
    const x2 = ax + (bx - ax) * p, y2 = ay + (by - ay) * p;
    ctx.save();
    ctx.globalAlpha = a;
    ctx.strokeStyle = glacier ? 'rgba(158,200,255,0.5)' : 'rgba(201,169,98,0.5)';
    ctx.lineWidth = 1;
    ctx.shadowColor = 'rgba(158,200,255,0.4)';
    ctx.shadowBlur = 5;
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.restore();
  }

  let raf = 0;
  function frame(now) {
    raf = requestAnimationFrame(frame);
    const t = now / 1000;
    // Fondu : invisible sur le hero, plein à partir de ~1 écran scrollé.
    const fade = clamp((sy - H * 0.55) / (H * 0.55), 0, 1);
    ctx.clearRect(0, 0, W, H);
    if (fade <= 0.01) return;

    // Champ d'étoiles (parallaxe + wrap infini).
    const band = FIELD_VH * H;
    for (const s of FIELD) {
      let y = (((s.y * H - sy * s.par) % band) + band) % band;
      const tw = reduced ? 0.4 : 0.3 + 0.3 * Math.sin(t * 1.6 + s.ph);
      dot(s.x * W, y, s.r, tw * fade * 0.6);
    }

    // Constellations ancrées, révélées étoile par étoile au scroll.
    for (const sh of SHAPES) {
      const cy = sh.vh * H - sy;            // ancrage verrouillé au document
      if (cy < -H || cy > 2 * H) continue;  // hors champ élargi
      const cx = sh.x * W;
      const sc = sh.s * H;
      const pts = sh.stars.map(([ox, oy]) => [cx + ox * sc, cy + oy * sc]);
      const n = pts.length;
      // progression : 0 quand le centre est en bas du viewport → 1 vers le milieu/haut.
      const p = reduced ? 1 : clamp((H - cy) / (H * 0.55), 0, 1);
      const lit = (i) => clamp((p - i / n) * n, 0, 1);

      const edges = sh.edges
        ? sh.edges
        : sh.stars.map((_, i) => [i, (i + 1) % n]).slice(0, sh.close ? n : n - 1);
      edges.forEach(([a, b], k) => {
        seg(pts[a][0], pts[a][1], pts[b][0], pts[b][1], lit(Math.max(a, b)), 0.7 * fade, k % 2 === 1);
      });
      pts.forEach((pt, i) => dot(pt[0], pt[1], 1.4, lit(i) * fade));
    }
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
