/**
 * SCORY — hub-wheel.js
 * La roue rotative fighting-game : 5 nœuds sur un cercle, le nœud actif
 * vient se placer en bas dans le « slot ».
 *
 * Inputs :
 *   - clavier : ← ↑ pour reculer, → ↓ pour avancer, Enter / Espace pour entrer
 *   - souris  : clic nœud (active OU enter si deja actif), drag horizontal,
 *               molette
 *   - touch   : drag horizontal
 *
 * Le contenu du slot (kicker, num, titre, tagline, accent global) est mis a
 * jour a chaque changement. Le titre se reecrit en glitch typewriter.
 */

import { RUBRIQUES } from "./hub-data.js";

const TOTAL = RUBRIQUES.length;
const ANGLE_PER_NODE = 360 / TOTAL;
const GLITCH_CHARS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*!?/<>";

// Throttle pour matcher l'anim CSS lente (1.4s). Empile pas les rotations.
const INPUT_THROTTLE_MS = 700;

let activeIndex = 0;
// Rotation cumulee — on suit le total pour toujours faire le chemin le plus
// court (sinon saut de i=4 → i=0 ferait 288°, hideux).
// Initial 180° pour que le nœud 0 (positionne a 90° + 0 = 90°) atterrisse
// au sommet du cercle (90° + 180° = 270° en CSS = haut).
let cumulativeRotation = 180;
let dragState = null;
let lastInputAt = 0;
let cleanup = [];
let navigateFn = null;

// Helpers -----------------------------------------------------------

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r}, ${g}, ${b}`;
}

function mod(n, m) {
  return ((n % m) + m) % m;
}

// Glitch typewriter : reecrit le titre en remplacant chars un par un -

function glitchType(el, finalText, duration = 420) {
  if (!el) return;
  const start = performance.now();
  function frame(now) {
    const t = Math.min(1, (now - start) / duration);
    if (t >= 1) {
      el.textContent = finalText;
      return;
    }
    let out = "";
    for (let i = 0; i < finalText.length; i++) {
      const charRatio = i / finalText.length;
      if (t > charRatio) {
        out += finalText[i];
      } else if (finalText[i] === " ") {
        out += " ";
      } else {
        out +=
          GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)];
      }
    }
    el.textContent = out;
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

// Render du hub -----------------------------------------------------

export function renderHub(root, opts = {}) {
  if (opts.navigate) navigateFn = opts.navigate;

  const hub = document.createElement("div");
  hub.className = "hub";

  const wheel = document.createElement("div");
  wheel.className = "hub__wheel";
  wheel.setAttribute("role", "listbox");
  wheel.setAttribute("aria-label", "Selection de rubrique");
  wheel.setAttribute("tabindex", "0");

  const rotate = document.createElement("div");
  rotate.className = "hub__wheel-rotate";

  // Construction des 5 nœuds. Chaque nœud est positionne sur le cercle a
  // un angle de base 90° + i × 72° (90° = pointe vers le bas en SVG/CSS).
  // Au repos avec activeIndex=0, le nœud 0 est en bas (sur le marker).
  RUBRIQUES.forEach((rub, i) => {
    const angle = 90 + i * ANGLE_PER_NODE;
    const node = document.createElement("button");
    node.className = "hub__node";
    node.type = "button";
    node.setAttribute("role", "option");
    node.setAttribute("aria-label", `${rub.num} ${rub.label}`);
    node.dataset.index = String(i);
    node.style.setProperty("--node-angle", `${angle}deg`);
    node.style.setProperty("--node-rgb", hexToRgb(rub.accent));

    node.innerHTML = `
      <div class="hub__node-inner">
        <span class="hub__node-glyph">${rub.glyph}</span>
        <span class="hub__node-label">${rub.num}</span>
      </div>
    `;

    node.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const i = parseInt(node.dataset.index, 10);
      if (i === activeIndex) {
        enterActive();
      } else {
        setActive(i);
      }
    });

    rotate.appendChild(node);
  });

  const marker = document.createElement("div");
  marker.className = "hub__marker";
  marker.setAttribute("aria-hidden", "true");

  wheel.appendChild(rotate);
  wheel.appendChild(marker);

  // Slot actif en bas
  const slot = document.createElement("div");
  slot.className = "hub__slot";
  slot.innerHTML = `
    <span class="hub__slot-kicker">
      <span class="hub__slot-num">01</span>
      <span class="hub__slot-kicker-text">—</span>
    </span>
    <h1 class="hub__slot-title">—</h1>
    <p class="hub__slot-tagline">—</p>
    <button type="button" class="hub__slot-cta" aria-label="Entrer dans la rubrique">
      <span>»</span>
      <span class="hub__slot-cta-text">Entrer</span>
      <span>«</span>
    </button>
  `;
  slot.querySelector(".hub__slot-cta").addEventListener("click", enterActive);

  hub.appendChild(wheel);
  hub.appendChild(slot);
  root.appendChild(hub);

  // Inputs : la MOLETTE fait tourner la roue (intercepte le scroll page).
  // Plus drag souris/touch + clavier + click.
  attachWheelInput(wheel);
  attachDrag(wheel);
  attachKeyboard();

  // Initial state — toujours au nœud 0 au boot
  activeIndex = 0;
  cumulativeRotation = 180;
  setActive(activeIndex, { skipGlitch: false });

  // Focus la roue pour capter le clavier (sans scroll-jump)
  try { wheel.focus({ preventScroll: true }); } catch {}

  // Auto-hide hint clavier apres 6s
  const hint = document.getElementById("kbd-hint");
  if (hint) {
    const t = setTimeout(() => hint.classList.add("is-hidden"), 6000);
    cleanup.push(() => clearTimeout(t));
  }
}

// State -------------------------------------------------------------

function setActive(i, { skipGlitch = false } = {}) {
  const newIndex = mod(i, TOTAL);

  // Trouve le chemin le plus court sur le cercle (sinon i=4 → i=0 ferait
  // un tour quasi complet en visuel). On reste avec |step| <= TOTAL/2.
  let step = newIndex - activeIndex;
  if (Math.abs(step) > TOTAL / 2) {
    step = step > 0 ? step - TOTAL : step + TOTAL;
  }
  cumulativeRotation -= step * ANGLE_PER_NODE;
  activeIndex = newIndex;
  const rub = RUBRIQUES[activeIndex];

  // Rotation : on rotate l'orbit pour amener le nœud actif AU SOMMET du
  // cercle (12h = 270° en CSS). Position de base d'un nœud i = 90° + i × 72°.
  // Pour amener nœud i au sommet : rotation = 180° - i × 72° (modulo).
  // On utilise cumulativeRotation pour garantir un chemin court.
  const rotateEl = document.querySelector(".hub__wheel-rotate");
  if (rotateEl) {
    rotateEl.style.setProperty("--rotation", `${cumulativeRotation}deg`);
  }

  // Mise a jour classe active
  document.querySelectorAll(".hub__node").forEach((n, idx) => {
    n.classList.toggle("is-active", idx === activeIndex);
  });

  // Mise a jour slot
  const slot = document.querySelector(".hub__slot");
  if (slot) {
    slot.querySelector(".hub__slot-num").textContent = rub.num;
    slot.querySelector(".hub__slot-kicker-text").textContent = rub.kicker;
    const title = slot.querySelector(".hub__slot-title");
    if (skipGlitch) {
      title.textContent = rub.label.toUpperCase();
    } else {
      glitchType(title, rub.label.toUpperCase());
    }
    slot.querySelector(".hub__slot-tagline").textContent = rub.tagline;
  }

  // Mise a jour accent global
  document.body.style.setProperty("--accent", rub.accent);
  document.body.style.setProperty("--accent-rgb", hexToRgb(rub.accent));

  // Toggle classes par rubrique : permet le rendu special DYG (billes
  // archetype apparaissent quand on est sur la rubrique apprentissage)
  RUBRIQUES.forEach((r) => {
    document.body.classList.toggle(`is-rubrique-${r.id}`, r.id === rub.id);
  });
}

function enterActive() {
  const rub = RUBRIQUES[activeIndex];
  if (navigateFn) navigateFn(rub.route);
}

// Inputs ------------------------------------------------------------

// === Inputs : molette + drag + clavier ===

function throttleInput() {
  const now = performance.now();
  if (now - lastInputAt < INPUT_THROTTLE_MS) return false;
  lastInputAt = now;
  return true;
}

// Molette : intercepte le scroll page et fait tourner la roue.
// Capture globale au document pour fonctionner partout sur le hub
// (pas seulement quand la souris est pile sur la roue).
function attachWheelInput(wheel) {
  const handler = (e) => {
    // Bloque le scroll natif de la page (deja overflow:hidden mais on
    // empeche aussi le bounce/momentum sur trackpad)
    e.preventDefault();
    if (!throttleInput()) return;
    const delta = e.deltaY || e.deltaX;
    if (delta > 0) setActive(activeIndex + 1);
    else if (delta < 0) setActive(activeIndex - 1);
  };
  // Capture au niveau document (pas seulement la roue) : molette fonctionne
  // partout sur le hub, sans avoir a viser la roue.
  document.addEventListener("wheel", handler, { passive: false });
  cleanup.push(() => document.removeEventListener("wheel", handler));
}

function attachKeyboard() {
  const handler = (e) => {
    if (e.target && /^(INPUT|TEXTAREA|SELECT)$/i.test(e.target.tagName))
      return;

    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      enterActive();
      return;
    }

    if (/^[1-5]$/.test(e.key)) {
      if (!throttleInput()) return;
      e.preventDefault();
      setActive(parseInt(e.key, 10) - 1);
      return;
    }

    if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      if (!throttleInput()) return;
      e.preventDefault();
      setActive(activeIndex - 1);
    } else if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      if (!throttleInput()) return;
      e.preventDefault();
      setActive(activeIndex + 1);
    }
  };
  window.addEventListener("keydown", handler);
  cleanup.push(() => window.removeEventListener("keydown", handler));
}

function attachDrag(wheel) {
  const SWIPE_MIN = 50;

  const onDown = (e) => {
    const pt = e.touches ? e.touches[0] : e;
    dragState = { x: pt.clientX, y: pt.clientY, dx: 0 };
  };
  const onMove = (e) => {
    if (!dragState) return;
    const pt = e.touches ? e.touches[0] : e;
    dragState.dx = pt.clientX - dragState.x;
  };
  const onUp = () => {
    if (!dragState) return;
    const dx = dragState.dx;
    dragState = null;
    if (Math.abs(dx) > SWIPE_MIN) {
      if (!throttleInput()) return;
      if (dx > 0) setActive(activeIndex - 1);
      else setActive(activeIndex + 1);
    }
  };

  wheel.addEventListener("mousedown", onDown);
  window.addEventListener("mousemove", onMove);
  window.addEventListener("mouseup", onUp);
  wheel.addEventListener("touchstart", onDown, { passive: true });
  window.addEventListener("touchmove", onMove, { passive: true });
  window.addEventListener("touchend", onUp);

  cleanup.push(() => {
    wheel.removeEventListener("mousedown", onDown);
    window.removeEventListener("mousemove", onMove);
    window.removeEventListener("mouseup", onUp);
    wheel.removeEventListener("touchstart", onDown);
    window.removeEventListener("touchmove", onMove);
    window.removeEventListener("touchend", onUp);
  });
}

// Cleanup -----------------------------------------------------------

export function destroyHub() {
  cleanup.forEach((fn) => fn());
  cleanup = [];
  // Retire toutes les classes de rubrique pour ne pas polluer les pages
  RUBRIQUES.forEach((r) => {
    document.body.classList.remove(`is-rubrique-${r.id}`);
  });
}
