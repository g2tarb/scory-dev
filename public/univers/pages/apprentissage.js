/**
 * SCORY — pages/apprentissage.js
 * Init du scan GitHub : simule la progress bar 4 etapes, puis redirige vers
 * DYG hosted avec le username en query param.
 *
 * Charge dynamiquement par le router quand on entre sur /apprentissage.
 * La cleanup function est appelee quand on quitte la rubrique.
 */

const DYG_BASE_URL = "https://dyg-olfu.onrender.com";
const SCAN_STEPS = [
  "Fetch GitHub profile…",
  "Analyse 8 piliers…",
  "Calcul archetype dominant…",
  "Prêt — redirection vers DYG.",
];

let cleanupFn = null;

export function init() {
  const input = document.getElementById("hero-github-input");
  const btn = document.getElementById("hero-scan-btn");
  const errorEl = document.getElementById("hero-scan-error");
  const progressEl = document.getElementById("hero-scan-progress");
  const barFill = document.getElementById("hero-scan-bar");
  const stepEl = document.getElementById("hero-scan-step");

  if (!input || !btn) return; // partial pas encore monte

  let inFlight = false;

  function showError(msg) {
    if (!errorEl) return;
    errorEl.textContent = msg;
    errorEl.style.display = "block";
  }

  function clearError() {
    if (!errorEl) return;
    errorEl.style.display = "none";
    errorEl.textContent = "";
  }

  async function runScan() {
    if (inFlight) return;
    clearError();

    const raw = input.value.trim();
    if (!raw) {
      showError("Tape ton pseudo GitHub d'abord.");
      input.focus();
      return;
    }
    // Validation simple : GitHub usernames = 1-39 chars, alphanum + hyphens
    if (!/^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/.test(raw)) {
      showError("Format invalide. Lettres, chiffres et tirets uniquement.");
      input.focus();
      return;
    }

    inFlight = true;
    btn.disabled = true;
    input.disabled = true;
    progressEl.style.display = "flex";

    // Animation simulee 4 etapes : chacune ~600ms, la barre se remplit
    // progressivement. Sur la derniere, on redirige vers DYG.
    for (let i = 0; i < SCAN_STEPS.length; i++) {
      stepEl.textContent = SCAN_STEPS[i];
      const pct = ((i + 1) / SCAN_STEPS.length) * 100;
      barFill.style.width = `${pct}%`;
      // Wait
      await new Promise((r) =>
        setTimeout(r, 500 + Math.random() * 300),
      );
    }

    // Redirection : DYG va recevoir ?github=<username> et lancera son scan
    // (en J2 on cablera le gating soft : token + check referer cote DYG)
    const url = `${DYG_BASE_URL}/?github=${encodeURIComponent(raw)}&ref=scory`;
    window.location.href = url;
  }

  // Click bouton + Enter sur input
  btn.addEventListener("click", runScan);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      runScan();
    }
  });

  // Focus auto sur le champ (mais sans scroll-jump)
  try { input.focus({ preventScroll: true }); } catch {}

  cleanupFn = () => {
    btn.removeEventListener("click", runScan);
    inFlight = false;
  };
}

export function destroy() {
  if (cleanupFn) cleanupFn();
  cleanupFn = null;
}
