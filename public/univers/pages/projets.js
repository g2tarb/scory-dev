/**
 * SCORY — pages/projets.js
 * Logique du character select : navigation roster, mise a jour de la fiche,
 * glitch sur le nom, accent par projet.
 */

import { ROSTER } from "../projets-data.js";

const GLITCH_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*!?/<>";
const TOTAL = ROSTER.length;

let activeIndex = 0;
let cleanup = [];

function hexToRgb(hex) {
  return `${parseInt(hex.slice(1, 3), 16)}, ${parseInt(hex.slice(3, 5), 16)}, ${parseInt(hex.slice(5, 7), 16)}`;
}

function glitchType(el, finalText, duration = 380) {
  if (!el) return;
  const start = performance.now();
  function tick(now) {
    const t = Math.min(1, (now - start) / duration);
    if (t >= 1) {
      el.textContent = finalText;
      return;
    }
    let out = "";
    for (let i = 0; i < finalText.length; i++) {
      if (t > i / finalText.length || finalText[i] === " ") out += finalText[i];
      else out += GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)];
    }
    el.textContent = out;
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

// Relance les animations de manifestation (retrait + reflow + re-ajout)
function triggerManifest() {
  const zone = document.querySelector(".char-select__portrait-zone");
  const sheet = document.querySelector(".char-select__sheet");
  [zone, sheet].forEach((el) => {
    if (!el) return;
    el.classList.remove("is-manifesting");
    void el.offsetWidth; // force reflow pour relancer les keyframes
    el.classList.add("is-manifesting");
  });
}

function select(i, { skipGlitch = false } = {}) {
  activeIndex = ((i % TOTAL) + TOTAL) % TOTAL;
  const p = ROSTER[activeIndex];

  if (!skipGlitch) triggerManifest();

  // Accent global (le hub.css pilote bordures/glow via --accent)
  document.body.style.setProperty("--accent", p.accent);
  document.body.style.setProperty("--accent-rgb", hexToRgb(p.accent));

  // Compteur
  const counter = document.getElementById("cs-counter");
  if (counter) counter.textContent = `${p.num} / ${String(TOTAL).padStart(2, "0")}`;

  // Portrait : image si dispo, sinon glyph stylise
  const img = document.getElementById("cs-portrait-img");
  const glyph = document.getElementById("cs-portrait-glyph");
  if (p.portrait) {
    img.src = p.portrait;
    img.alt = p.name;
    img.style.display = "block";
    glyph.style.display = "none";
  } else {
    img.removeAttribute("src");
    img.style.display = "none";
    glyph.textContent = p.glyph;
    glyph.style.display = "grid";
  }

  // Nom (glitch) + role
  const nameEl = document.getElementById("cs-name");
  if (skipGlitch) nameEl.textContent = p.name.toUpperCase();
  else glitchType(nameEl, p.name.toUpperCase());
  document.getElementById("cs-role").textContent = p.role;

  // Fiche
  document.getElementById("cs-problem").textContent = p.problem;
  document.getElementById("cs-duration").textContent = p.duration;

  const stackEl = document.getElementById("cs-stack");
  stackEl.innerHTML = "";
  p.stack.forEach((tech) => {
    const chip = document.createElement("span");
    chip.className = "char-select__chip";
    chip.textContent = tech;
    stackEl.appendChild(chip);
  });

  // CTA : cache si pas d'URL (le portfolio lui-meme)
  const cta = document.getElementById("cs-cta");
  if (p.url) {
    cta.href = p.url;
    cta.style.display = "inline-flex";
  } else {
    cta.style.display = "none";
  }

  // Roster : tuile active
  document.querySelectorAll(".char-select__tile").forEach((t, idx) => {
    t.classList.toggle("is-active", idx === activeIndex);
    t.setAttribute("aria-selected", idx === activeIndex ? "true" : "false");
  });
}

function enterActive() {
  const p = ROSTER[activeIndex];
  if (p.url) window.open(p.url, "_blank", "noopener,noreferrer");
}

// Nombre de slots "?" verrouilles ajoutes apres les projets (effet grille
// DBZ : les persos pas encore debloques = les projets a venir)
const LOCKED_SLOTS = 3;

function buildRoster() {
  const roster = document.getElementById("cs-roster");
  if (!roster) return;
  roster.innerHTML = "";

  ROSTER.forEach((p, i) => {
    const tile = document.createElement("button");
    tile.type = "button";
    tile.className = "char-select__tile";
    tile.setAttribute("role", "tab");
    tile.setAttribute("aria-label", `${p.num} ${p.name}`);
    tile.style.setProperty("--tile-rgb", hexToRgb(p.accent));
    if (p.portrait) {
      tile.style.backgroundImage = `url(${p.portrait})`;
      tile.classList.add("has-img");
    }
    tile.innerHTML = `
      <span class="char-select__tile-glyph">${p.portrait ? "" : p.glyph}</span>
      <span class="char-select__tile-num">${p.num}</span>
    `;
    tile.addEventListener("click", () => {
      if (i === activeIndex) enterActive();
      else select(i);
    });
    roster.appendChild(tile);
  });

  // Slots verrouilles "?" — projets a venir
  for (let i = 0; i < LOCKED_SLOTS; i++) {
    const locked = document.createElement("div");
    locked.className = "char-select__tile char-select__tile--locked";
    locked.setAttribute("aria-hidden", "true");
    locked.innerHTML = `<span class="char-select__tile-glyph">?</span>`;
    roster.appendChild(locked);
  }
}

export function init() {
  if (!document.getElementById("char-select")) return;

  buildRoster();
  select(0, { skipGlitch: true });

  const onKey = (e) => {
    if (e.target && /^(INPUT|TEXTAREA|SELECT)$/i.test(e.target.tagName)) return;
    if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      select(activeIndex - 1);
    } else if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      select(activeIndex + 1);
    } else if (e.key === "Enter") {
      e.preventDefault();
      enterActive();
    } else if (/^[1-6]$/.test(e.key)) {
      e.preventDefault();
      select(parseInt(e.key, 10) - 1);
    }
  };
  window.addEventListener("keydown", onKey);
  cleanup.push(() => window.removeEventListener("keydown", onKey));
}

export function destroy() {
  cleanup.forEach((fn) => fn());
  cleanup = [];
  activeIndex = 0;
}
