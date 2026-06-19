/**
 * Marque « .dev » pilotée par le scroll, type roulette.
 *  - scroll léger → le « .dev » défile brièvement puis retombe sur « .dev » ;
 *  - scroll TRÈS fort → surcharge : « .error » rouge + le site « bugue »
 *    (titres corrompus en « error », secousse, rouge), puis retour à « .dev ».
 * La nav reste visible (la secousse porte sur le contenu, pas sur <body>).
 */

const LOWER = 'abcdefghijklmnopqrstuvwxyz';
const rnd = (t) => (/[a-z]/.test(t) ? LOWER[(Math.random() * 26) | 0] : t);

const SPIN_MIN = 130; // force minimale pour lancer la roulette
const OVERLOAD = 1100; // force pour déclencher la surcharge .error
const SPIN_MAX = 600; // durée max d'un roulement léger (ms)

export function initScrollBrand(el) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const FINAL = '.dev';
  const ERROR = '.error';
  let charge = 0;
  let state = 'idle'; // idle | spin | error
  let rollId = 0;
  let landId = 0;

  function render(text) {
    el.textContent = '';
    [...text].forEach((ch) => {
      const s = document.createElement('span');
      s.className = 'slot-ch';
      s.textContent = ch;
      el.appendChild(s);
    });
    return [...el.children];
  }
  let spans = render(FINAL);

  const roll = () => spans.forEach((s, i) => { s.textContent = rnd(FINAL[i] || 'a'); });
  const startRolling = () => { if (!rollId) rollId = window.setInterval(roll, 45); };
  const stopRolling = () => { window.clearInterval(rollId); rollId = 0; };

  function landDev() {
    stopRolling();
    spans = render(FINAL);
    el.classList.add('slot-win');
    window.setTimeout(() => el.classList.remove('slot-win'), 700);
    state = 'idle';
    charge = 0;
  }

  function gentleSpin() {
    if (state === 'idle') { state = 'spin'; spans = render(FINAL); startRolling(); }
    window.clearTimeout(landId);
    landId = window.setTimeout(landDev, Math.min(160 + charge * 0.2, SPIN_MAX));
  }

  function overload() {
    state = 'error';
    charge = 0;
    window.clearTimeout(landId);
    spans = render(FINAL);
    startRolling();
    window.setTimeout(() => {
      stopRolling();
      spans = render(ERROR);
      el.classList.add('is-error');
      document.body.classList.add('site-error');
      window.dispatchEvent(new Event('scory:error')); // → corruption des titres
      window.setTimeout(() => {
        el.classList.remove('is-error');
        document.body.classList.remove('site-error');
        window.dispatchEvent(new Event('scory:error-end'));
        spans = render(FINAL);
        startRolling();
        window.setTimeout(landDev, 500);
      }, 2600); // .error visible
    }, 1100); // roulement avant le crash
  }

  function addForce(amount) {
    if (state === 'error') return;
    charge += amount;
    if (charge > OVERLOAD) overload();
    else if (charge > SPIN_MIN) gentleSpin();
  }

  window.addEventListener(
    'wheel',
    (e) => addForce(e.deltaMode ? Math.abs(e.deltaY) * 16 : Math.abs(e.deltaY)),
    { passive: true },
  );

  let ty = 0;
  window.addEventListener('touchstart', (e) => { ty = e.touches[0].clientY; }, { passive: true });
  window.addEventListener('touchmove', (e) => {
    const y = e.touches[0].clientY;
    addForce(Math.abs(y - ty) * 1.6);
    ty = y;
  }, { passive: true });

  (function tick() {
    if (state === 'idle' || state === 'spin') {
      charge *= 0.9;
      if (charge < 1) charge = 0;
    }
    window.requestAnimationFrame(tick);
  })();
}
