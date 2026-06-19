/**
 * SCORY — booking.js
 * Systeme de prise de RDV in-app : calendrier, creneaux, formulaire, mailto.
 * Necessite que le chatbot soit complete avant de pouvoir prendre RDV.
 */

import { getLang, MONTHS, JOURS } from "./i18n.js";

const SLOTS = ["09:00","10:00","11:00","14:00","15:00","16:00","17:00"]; // repli si l'API est injoignable
const HORIZON_DAYS = 21;
const isoDate = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const lang = () => (getLang() === "en" ? "en" : "fr");

/**
 * @param {{ trapFocus: Function, isValidEmail: Function, contactEmail: string, getChatCompleted: ()=>boolean }} deps
 */
export function initBooking({ trapFocus, isValidEmail, contactEmail, getChatCompleted }) {
  const overlay = document.getElementById("booking-overlay");
  const modal = document.getElementById("booking-modal");
  const openBtn = document.getElementById("open-booking");
  const closeBtn = document.getElementById("booking-close");
  if (!overlay || !openBtn) return;

  const stepCal = document.getElementById("booking-step-cal");
  const stepTime = document.getElementById("booking-step-time");
  const stepForm = document.getElementById("booking-step-form");
  const stepDone = document.getElementById("booking-step-done");
  const calGrid = document.getElementById("cal-grid");
  const calMonthLabel = document.getElementById("cal-month");
  const slotsContainer = document.getElementById("booking-slots");

  let calYear, calMonth, selectedDate = null, selectedSlot = null;
  let focusTrapCleanup = null, prevFocus = null;

  function showStep(step) {
    [stepCal, stepTime, stepForm, stepDone].forEach((s) => s.classList.add("booking-step--hidden"));
    step.classList.remove("booking-step--hidden");
  }

  function formatDate(date) {
    return `${JOURS[lang()][date.getDay()]} ${date.getDate()} ${MONTHS[lang()][date.getMonth()]} ${date.getFullYear()}`;
  }

  function open() {
    const now = new Date();
    calYear = now.getFullYear();
    calMonth = now.getMonth();
    selectedDate = null;
    selectedSlot = null;
    showStep(stepCal);
    renderCalendar();
    overlay.classList.add("is-open");
    overlay.setAttribute("aria-hidden", "false");
    prevFocus = document.activeElement;
    requestAnimationFrame(() => { focusTrapCleanup = trapFocus(modal); });
  }

  function close() {
    overlay.classList.remove("is-open");
    overlay.setAttribute("aria-hidden", "true");
    if (focusTrapCleanup) { focusTrapCleanup(); focusTrapCleanup = null; }
    if (prevFocus) { prevFocus.focus(); prevFocus = null; }
  }

  function renderCalendar() {
    calMonthLabel.textContent = `${MONTHS[lang()][calMonth]} ${calYear}`;
    calGrid.innerHTML = "";
    let startDay = new Date(calYear, calMonth, 1).getDay();
    if (startDay === 0) startDay = 7;
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const today = new Date(); today.setHours(0,0,0,0);
    const maxDate = new Date(today); maxDate.setDate(maxDate.getDate() + HORIZON_DAYS); // aligné sur l'API

    for (let i = 1; i < startDay; i++) calGrid.appendChild(document.createElement("div"));

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(calYear, calMonth, d);
      const btn = document.createElement("button");
      btn.className = "cal-day";
      btn.textContent = d;
      const dow = date.getDay();
      if (date < today || date > maxDate || dow === 0 || dow === 6) {
        btn.disabled = true;
      } else {
        if (date.getTime() === today.getTime()) btn.classList.add("is-today");
        btn.addEventListener("click", () => {
          selectedDate = date;
          calGrid.querySelectorAll(".cal-day").forEach((b) => b.classList.remove("is-selected"));
          btn.classList.add("is-selected");
          setTimeout(() => goToSlots(), 200);
        });
      }
      calGrid.appendChild(btn);
    }
  }

  async function goToSlots() {
    if (!selectedDate) return;
    document.getElementById("booking-date-chosen").textContent = formatDate(selectedDate);
    slotsContainer.innerHTML = `<p class="booking-muted">…</p>`;
    showStep(stepTime);

    // Disponibilité RÉELLE via l'API ; repli sur tous les créneaux si backend injoignable.
    let slots = SLOTS;
    try {
      const r = await fetch(`/api/slots?date=${isoDate(selectedDate)}`);
      if (r.ok) { const j = await r.json(); if (Array.isArray(j.slots)) slots = j.slots; }
    } catch (_e) { /* pas de backend → repli */ }

    slotsContainer.innerHTML = "";
    if (!slots.length) {
      slotsContainer.innerHTML = `<p class="booking-muted">${lang() === "en" ? "No slot left this day." : "Aucun créneau ce jour-là."}</p>`;
      return;
    }
    slots.forEach((slot) => {
      const btn = document.createElement("button");
      btn.className = "booking-slot";
      btn.textContent = slot;
      btn.addEventListener("click", () => {
        selectedSlot = slot;
        slotsContainer.querySelectorAll(".booking-slot").forEach((b) => b.classList.remove("is-selected"));
        btn.classList.add("is-selected");
        setTimeout(() => goToForm(), 200);
      });
      slotsContainer.appendChild(btn);
    });
  }

  function goToForm() {
    if (!selectedDate || !selectedSlot) return;
    document.getElementById("booking-summary").textContent = `${formatDate(selectedDate)} a ${selectedSlot}`;
    showStep(stepForm);
    document.getElementById("booking-name").focus();
  }

  /** Affiche un toast ephemere puis scroll vers le chatbot */
  function showChatbotRedirect() {
    const toast = document.createElement("div");
    toast.className = "toast-ephemere";
    const isEn = lang() === "en";
    toast.innerHTML = isEn
      ? `<span>&#8593;</span> First answer the chatbot above to estimate your project`
      : `<span>&#8593;</span> Repondez d'abord au chatbot juste au-dessus pour estimer votre projet`;
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add("is-visible"));
    setTimeout(() => {
      toast.classList.remove("is-visible");
      setTimeout(() => toast.remove(), 400);
    }, 3500);
    const chatSection = document.getElementById("chatbot-section");
    if (chatSection) {
      chatSection.scrollIntoView({ behavior: "smooth", block: "start" });
      // Flash le chatbot pour attirer l'attention
      const container = chatSection.querySelector(".chatbot-container");
      if (container) {
        container.classList.add("chatbot-highlight");
        setTimeout(() => container.classList.remove("chatbot-highlight"), 2000);
      }
    }
  }

  // Evenements
  openBtn.addEventListener("click", (e) => {
    e.preventDefault();
    if (!getChatCompleted()) { showChatbotRedirect(); return; }
    open();
  });
  closeBtn.addEventListener("click", close);
  overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && overlay.classList.contains("is-open")) close(); });

  document.getElementById("cal-prev").addEventListener("click", () => {
    calMonth--;
    if (calMonth < 0) { calMonth = 11; calYear--; }
    renderCalendar();
  });
  document.getElementById("cal-next").addEventListener("click", () => {
    calMonth++;
    if (calMonth > 11) { calMonth = 0; calYear++; }
    renderCalendar();
  });
  document.getElementById("booking-back-cal").addEventListener("click", () => showStep(stepCal));
  document.getElementById("booking-back-time").addEventListener("click", () => showStep(stepTime));

  document.getElementById("booking-submit").addEventListener("click", async () => {
    const name = document.getElementById("booking-name").value.trim();
    const email = document.getElementById("booking-email").value.trim();
    const msg = document.getElementById("booking-msg").value.trim();
    if (!name || !email || !isValidEmail(email)) return;

    const dateStr = formatDate(selectedDate);
    const showDone = () => {
      document.getElementById("booking-done-detail").textContent = `${dateStr} a ${selectedSlot} — ${name} (${email})`;
      showStep(stepDone);
      document.getElementById("booking-name").value = "";
      document.getElementById("booking-email").value = "";
      document.getElementById("booking-msg").value = "";
    };

    // 1) On tente l'API réelle (source unique : dispo partagée + enregistrement + email serveur).
    let viaApi = false;
    try {
      const r = await fetch("/api/book", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, email, date: isoDate(selectedDate), slot: selectedSlot, answers: msg ? { message: msg } : null }),
      });
      if (r.ok) viaApi = true;
      else if (r.status === 409) { // créneau déjà pris → on renvoie au choix
        alert(lang() === "en" ? "This slot was just taken — please pick another." : "Ce créneau vient d'être pris — choisis-en un autre.");
        goToSlots();
        return;
      }
    } catch (_e) { /* backend injoignable → repli mailto */ }

    showDone();

    // 2) Repli : email pré-rempli (toujours fonctionnel sans backend).
    if (!viaApi) {
      const subject = encodeURIComponent(`Demande de RDV — ${dateStr} a ${selectedSlot}`);
      const body = encodeURIComponent(
        `Bonjour Scory,\n\nJe souhaite prendre rendez-vous :\n\nDate : ${dateStr}\nHeure : ${selectedSlot}\nNom : ${name}\nEmail : ${email}\n${msg ? `Message : ${msg}\n` : ""}\nMerci !`,
      );
      window.open(`mailto:${contactEmail}?subject=${subject}&body=${body}`, "_self");
    }
  });

  // Exposer la fonction open pour que le chatbot puisse l'appeler
  return { openBooking: open };
}
