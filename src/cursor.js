/**
 * Curseur custom : un point qui suit instantanément + un anneau qui suit avec
 * un léger retard (effet magnétique). L'anneau grossit au survol des éléments
 * interactifs. Désactivé au tactile.
 */
export function initCursor() {
  if (window.matchMedia('(hover: none), (pointer: coarse)').matches) return;

  const dot = document.querySelector('.cursor-dot');
  const ring = document.querySelector('.cursor-ring');
  if (!dot || !ring) return;

  let mx = window.innerWidth / 2;
  let my = window.innerHeight / 2;
  let rx = mx;
  let ry = my;

  window.addEventListener('pointermove', (e) => {
    mx = e.clientX;
    my = e.clientY;
    dot.style.left = `${mx}px`;
    dot.style.top = `${my}px`;
  });

  // L'anneau rattrape la souris avec un lag (lerp).
  function tick() {
    rx += (mx - rx) * 0.18;
    ry += (my - ry) * 0.18;
    ring.style.left = `${rx}px`;
    ring.style.top = `${ry}px`;
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  // Survol d'un élément interactif → l'anneau s'agrandit.
  const interactive = 'a, button, .psquare, [role="button"]';
  document.addEventListener('pointerover', (e) => {
    if (e.target.closest(interactive)) ring.classList.add('is-hover');
  });
  document.addEventListener('pointerout', (e) => {
    if (e.target.closest(interactive)) ring.classList.remove('is-hover');
  });
}
