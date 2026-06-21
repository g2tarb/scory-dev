/**
 * SCORY · chatbot.js
 * Mini-bot prospect : 5 questions multi-choix + capture contact.
 * Pas de calcul de devis. Resultat envoye par mailto a contact@scory.dev
 * pour relance manuelle.
 */
import { getLang, CHAT_FLOW as FLOW, CHAT_TX as I18N } from "./i18n.js";

const CONTACT_TARGET = "contact@scory.dev";

// FLOW (questions) et I18N (libellés) du chatbot → centralisés dans i18n.js (CHAT_FLOW / CHAT_TX).

/** Sanitisation basique anti-XSS sur les inputs libres */
function sanitize(raw) {
  if (typeof raw !== "string") return "";
  return raw.replace(/<[^>]*>/g, "").trim().slice(0, 300)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#x27;");
}

export const chatState = { completed: false, restart: null };

export function initChatbot({ isValidEmail }) {
  const messagesEl = document.getElementById("chatbot-messages");
  const pillsEl = document.getElementById("chatbot-pills");
  const progressEl = document.getElementById("chatbot-progress");
  const statusEl = document.getElementById("chatbot-status-text");
  if (!messagesEl || !pillsEl) return;

  const lang = () => (getLang() === "en" ? "en" : "fr");
  let answers = {};
  let stepIdx = 0; // 0..4 = questions, 5 = contact form, 6 = done

  function tx() { return I18N[lang()]; }
  function flow() { return FLOW[lang()]; }

  function appendBot(text) {
    const m = document.createElement("div");
    m.className = "chat-msg chat-msg--bot";
    m.textContent = text;
    messagesEl.appendChild(m);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function appendUser(text) {
    const m = document.createElement("div");
    m.className = "chat-msg chat-msg--user";
    m.textContent = text;
    messagesEl.appendChild(m);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function setProgress(pct) {
    if (progressEl) progressEl.style.setProperty("--progress", `${pct}%`);
  }

  function clearPills() { pillsEl.innerHTML = ""; }

  function renderQuestion() {
    const q = flow()[stepIdx];
    if (!q) return renderContact();
    appendBot(q.bot);
    setProgress(((stepIdx) / (flow().length + 1)) * 100);
    clearPills();
    for (const opt of q.options) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "chat-pill";
      btn.textContent = opt;
      btn.addEventListener("click", () => {
        answers[q.id] = opt;
        appendUser(opt);
        clearPills();
        stepIdx += 1;
        setTimeout(() => {
          if (stepIdx >= flow().length) renderContact();
          else renderQuestion();
        }, 250);
      });
      pillsEl.appendChild(btn);
    }
  }

  function renderContact() {
    appendBot(tx().contactIntro);
    setProgress(((flow().length) / (flow().length + 1)) * 100);
    clearPills();

    const form = document.createElement("form");
    form.className = "chat-form";
    form.noValidate = true;
    form.innerHTML = `
      <input type="email" name="email" placeholder="${tx().emailPh}" required maxlength="120" autocomplete="email" />
      <textarea name="msg" placeholder="${tx().msgPh}" maxlength="500" rows="2"></textarea>
      <button type="submit" class="chat-form__submit">${tx().submit}</button>
      <span class="chat-form__error" aria-live="polite"></span>
    `;
    pillsEl.appendChild(form);

    const errEl = form.querySelector(".chat-form__error");
    const submitBtn = form.querySelector(".chat-form__submit");

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = `${identity.prenom} ${identity.nom}`.trim();
      const email = sanitize(form.email.value);
      const msg = sanitize(form.msg.value);

      if (!email || (isValidEmail && !isValidEmail(email))) {
        errEl.textContent = tx().invalidEmail;
        return;
      }
      errEl.textContent = "";
      submitBtn.disabled = true;
      submitBtn.textContent = tx().submitting;

      // Construit un mailto pre-rempli vers contact@scory.dev
      const subject = `Lead portfolio Scory · ${name}`;
      const lines = [
        `${tx().summaryHeader}:`,
        ...flow().map((q) => `• ${q.id}: ${answers[q.id] || "-"}`),
        ``,
        `Prenom: ${identity.prenom}`,
        `Nom: ${identity.nom}`,
        `Email: ${email}`,
        msg ? `Message: ${msg}` : "",
      ].filter(Boolean);
      const body = lines.join("\n");
      const mailto = `mailto:${CONTACT_TARGET}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

      // Sauvegarde locale (au cas ou le mailto echoue)
      try {
        localStorage.setItem("scory_lead", JSON.stringify({ name, email, msg, answers, ts: Date.now() }));
      } catch (_e) {}

      // Confirmation AFFICHÉE D'ABORD (le mailto peut suspendre le JS sur certains navigateurs).
      appendUser(`${name} · ${email}`);
      clearPills();
      appendBot(tx().done);
      setProgress(100);
      if (statusEl) statusEl.textContent = tx().done;
      chatState.completed = true;

      const restartBtn = document.createElement("button");
      restartBtn.type = "button";
      restartBtn.className = "chat-pill chat-pill--restart";
      restartBtn.textContent = tx().restart;
      restartBtn.addEventListener("click", () => chatState.restart && chatState.restart());
      pillsEl.appendChild(restartBtn);

      // Puis on ouvre le client mail.
      window.location.href = mailto;
    });
  }

  let identity = { prenom: "", nom: "" };

  // Étape texte libre (prénom / nom).
  function renderTextStep(prompt, key, placeholder, next) {
    appendBot(prompt);
    clearPills();
    const form = document.createElement("form");
    form.className = "chat-form";
    form.noValidate = true;
    form.innerHTML =
      `<input type="text" name="v" placeholder="${placeholder}" required maxlength="60" autocomplete="off" />` +
      `<button type="submit" class="chat-form__submit">OK</button>` +
      `<span class="chat-form__error" aria-live="polite"></span>`;
    pillsEl.appendChild(form);
    try { form.v.focus(); } catch (_e) {}
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const val = sanitize(form.v.value);
      if (!val) { form.querySelector(".chat-form__error").textContent = tx().invalidField; return; }
      identity[key] = val;
      appendUser(val);
      clearPills();
      setTimeout(next, 250);
    });
  }

  // Présentation « Scory bot » puis prénom + nom, avant les questions.
  function start() {
    appendBot(tx().intro1);
    appendBot(tx().intro2);
    setTimeout(() =>
      renderTextStep(tx().askPrenom, "prenom", tx().prenomPh, () =>
        renderTextStep(tx().askNom, "nom", tx().nomPh, () => renderQuestion()),
      ), 450);
  }

  function reset() {
    answers = {};
    identity = { prenom: "", nom: "" };
    stepIdx = 0;
    messagesEl.innerHTML = "";
    clearPills();
    chatState.completed = false;
    if (statusEl) statusEl.textContent = (lang() === "en" ? "Online" : "En ligne");
    start();
  }

  chatState.restart = reset;
  reset();
}
