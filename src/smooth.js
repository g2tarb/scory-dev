import Lenis from 'lenis';

/** Scroll fluide global. Renvoie l'instance (ou null si reduced-motion). */
export function initSmooth() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return null;

  // Feel « Apple » : momentum feutré + easing exponentiel ease-out.
  const lenis = new Lenis({
    duration: 1.15,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    wheelMultiplier: 1,
    touchMultiplier: 1.6,
  });

  function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);

  // Ancres internes → scroll fluide.
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (id.length < 2) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      lenis.scrollTo(target, { offset: -20 });
    });
  });

  return lenis;
}
