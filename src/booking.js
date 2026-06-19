/**
 * Modal de prise de RDV (front).
 * Choisit un jour → charge les créneaux libres (GET /api/slots) →
 * formulaire (nom / email / tél) → réserve (POST /api/book) → confirmation.
 */

const HORIZON_DAYS = 21;

function nextWorkdays(count) {
  const days = [];
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  for (let i = 0; days.length < count && i <= HORIZON_DAYS; i++) {
    const day = new Date(d);
    day.setDate(d.getDate() + i);
    const wd = day.getDay();
    if (wd >= 1 && wd <= 5) days.push(day);
  }
  return days;
}

const toISO = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const labelDay = (d) =>
  d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });

export function initBooking() {
  const overlay = document.createElement('div');
  overlay.id = 'booking';
  overlay.className = 'booking-overlay';
  overlay.innerHTML = `
    <div class="booking-modal" role="dialog" aria-modal="true" aria-label="Prise de rendez-vous">
      <button class="booking-close" aria-label="Fermer">×</button>
      <div class="booking-body"></div>
    </div>
  `;
  document.body.appendChild(overlay);

  const body = overlay.querySelector('.booking-body');
  const closeBtn = overlay.querySelector('.booking-close');

  let ctx = { date: null, slot: null, answers: null, budget: null };

  const close = () => overlay.classList.remove('is-open');
  closeBtn.addEventListener('click', close);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });

  function open(answers, budget) {
    ctx = { date: null, slot: null, answers, budget };
    overlay.classList.add('is-open');
    renderDays();
  }

  /* Étape 1 — choix du jour */
  function renderDays() {
    const days = nextWorkdays(8);
    body.innerHTML = `
      <h3>Choisissez un jour</h3>
      <div class="booking-days"></div>
      <div class="booking-slots"></div>
    `;
    const daysEl = body.querySelector('.booking-days');
    days.forEach((d) => {
      const iso = toISO(d);
      const btn = document.createElement('button');
      btn.className = 'booking-day';
      btn.textContent = labelDay(d);
      btn.addEventListener('click', () => {
        daysEl
          .querySelectorAll('.booking-day')
          .forEach((b) => b.classList.remove('selected'));
        btn.classList.add('selected');
        ctx.date = iso;
        loadSlots(iso);
      });
      daysEl.appendChild(btn);
    });
  }

  /* Étape 2 — créneaux du jour */
  async function loadSlots(date) {
    const slotsEl = body.querySelector('.booking-slots');
    slotsEl.innerHTML = '<p class="booking-muted">Chargement…</p>';
    try {
      const res = await fetch(`/api/slots?date=${date}`);
      const data = await res.json();
      if (!data.slots || data.slots.length === 0) {
        slotsEl.innerHTML = '<p class="booking-muted">Aucun créneau ce jour-là.</p>';
        return;
      }
      slotsEl.innerHTML = '<h4>Créneaux disponibles</h4>';
      const grid = document.createElement('div');
      grid.className = 'slot-grid';
      data.slots.forEach((s) => {
        const b = document.createElement('button');
        b.className = 'slot';
        b.textContent = s;
        b.addEventListener('click', () => {
          ctx.slot = s;
          renderForm();
        });
        grid.appendChild(b);
      });
      slotsEl.appendChild(grid);
    } catch {
      slotsEl.innerHTML =
        '<p class="booking-muted">Service indisponible. Réessayez plus tard.</p>';
    }
  }

  /* Étape 3 — coordonnées */
  function renderForm() {
    const human = new Date(`${ctx.date}T12:00:00`).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
    body.innerHTML = `
      <h3>Vos coordonnées</h3>
      <p class="booking-muted">${human} à ${ctx.slot}</p>
      <form class="booking-form">
        <input name="name" type="text" placeholder="Votre nom" required />
        <input name="email" type="email" placeholder="Votre email" required />
        <input name="phone" type="tel" placeholder="Votre téléphone (optionnel)" />
        <p class="booking-error" hidden></p>
        <div class="booking-actions">
          <button type="button" class="opt ghost back">Retour</button>
          <button type="submit" class="opt cta submit">Confirmer le RDV</button>
        </div>
      </form>
    `;
    const form = body.querySelector('.booking-form');
    const err = body.querySelector('.booking-error');
    body.querySelector('.back').addEventListener('click', renderDays);

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      err.hidden = true;
      const fd = new FormData(form);
      const submit = form.querySelector('.submit');
      submit.disabled = true;
      submit.textContent = 'Envoi…';
      try {
        const res = await fetch('/api/book', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: fd.get('name'),
            email: fd.get('email'),
            phone: fd.get('phone'),
            date: ctx.date,
            slot: ctx.slot,
            answers: ctx.answers,
            budget: ctx.budget,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Erreur');
        renderConfirmation(fd.get('name'), human);
      } catch (e2) {
        err.textContent = e2.message;
        err.hidden = false;
        submit.disabled = false;
        submit.textContent = 'Confirmer le RDV';
      }
    });
  }

  /* Étape 4 — confirmation */
  function renderConfirmation(name, human) {
    body.innerHTML = `
      <div class="booking-done">
        <div class="booking-check">✓</div>
        <h3 class="booking-greet"></h3>
        <p class="booking-muted">
          Rendez-vous confirmé le ${human} à ${ctx.slot}.<br />
          Un email de confirmation vous a été envoyé.
        </p>
        <button class="opt cta close-done">Fermer</button>
      </div>
    `;
    // name vient du formulaire → injecté via textContent (jamais innerHTML).
    body.querySelector('.booking-greet').textContent = `C'est noté, ${name} !`;
    body.querySelector('.close-done').addEventListener('click', close);
  }

  return { open };
}
