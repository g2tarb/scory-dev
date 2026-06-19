/**
 * Effet « roulette / machine à sous » : les lettres défilent puis se
 * verrouillent une à une (gauche → droite), puis flash « gagné » en surbrillance.
 */

const LOWER = 'abcdefghijklmnopqrstuvwxyz';
const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function randChar(target) {
  if (/[a-z]/.test(target)) return LOWER[(Math.random() * LOWER.length) | 0];
  if (/[A-Z]/.test(target)) return UPPER[(Math.random() * UPPER.length) | 0];
  return target; // espaces, '.', '-', etc. : pas de défilement
}

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * @param {HTMLElement} el       conteneur (son contenu est remplacé)
 * @param {string} target        texte final
 * @param {object} [opts]
 * @param {number} [opts.spin=45]     intervalle de défilement (ms)
 * @param {number} [opts.start=220]   délai avant 1er verrouillage (ms)
 * @param {number} [opts.step=85]     décalage de verrouillage entre lettres (ms)
 */
export function slotText(el, target, opts = {}) {
  if (el.dataset.slotBusy === '1') return;
  const { spin = 45, start = 220, step = 85 } = opts;
  const chars = [...target];

  // Construit un span par lettre.
  el.textContent = '';
  el.dataset.slotBusy = '1';
  el.classList.remove('slot-win');
  const spans = chars.map((ch) => {
    const s = document.createElement('span');
    s.className = 'slot-ch';
    s.textContent = ch === ' ' ? ' ' : ch;
    el.appendChild(s);
    return s;
  });

  // Mode sobre : pose le texte direct + petit flash.
  if (reduced) {
    el.dataset.slotBusy = '0';
    el.classList.add('slot-win');
    window.setTimeout(() => el.classList.remove('slot-win'), 600);
    return;
  }

  let remaining = 0;
  spans.forEach((s, i) => {
    const finalCh = chars[i];
    // Les caractères non-alphabétiques (espace, '.', '-') se posent direct.
    if (!/[a-zA-Z]/.test(finalCh)) {
      s.classList.add('locked');
      return;
    }
    remaining++;
    s.classList.add('spinning');
    const spinId = window.setInterval(() => { s.textContent = randChar(finalCh); }, spin);
    window.setTimeout(() => {
      window.clearInterval(spinId);
      s.textContent = finalCh;
      s.classList.remove('spinning');
      s.classList.add('locked');
      remaining--;
      if (remaining <= 0) {
        // Jackpot : surbrillance.
        el.classList.add('slot-win');
        el.dataset.slotBusy = '0';
        window.setTimeout(() => el.classList.remove('slot-win'), 700);
      }
    }, start + i * step);
  });

  // Sécurité si la cible n'a aucune lettre.
  if (remaining === 0) el.dataset.slotBusy = '0';
}
