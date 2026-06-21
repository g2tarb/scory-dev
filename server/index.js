import Fastify from 'fastify';
import rateLimit from '@fastify/rate-limit';
import { readFile, writeFile, rename, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Backend du portfolio — prise de RDV.
 *   GET  /api/slots?date=YYYY-MM-DD → créneaux libres ce jour-là
 *   POST /api/book                  → enregistre + email de confirmation
 *
 * Stockage : fichier JSON (server/data/bookings.json), écriture atomique.
 * Email    : Resend si RESEND_API_KEY est défini, sinon loggé (mode dev).
 *
 * Durcissement : rate-limit, validation stricte + bornage de toutes les
 * entrées, neutralisation CR/LF, mutex anti-race, anti-abus par email.
 */

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_FILE = join(__dirname, 'data', 'bookings.json');

const WORK_HOURS = [9, 10, 11, 14, 15, 16, 17]; // créneaux quotidiens (jours ouvrés)
const VALID_SLOTS = WORK_HOURS.map((h) => `${String(h).padStart(2, '0')}:00`);
const HORIZON_DAYS = 21; // fenêtre de réservation
const MAX_PENDING_PER_EMAIL = 3; // anti-abus : RDV futurs max par adresse

/* ---------- Validation / nettoyage des entrées ---------- */

/** Tronque, retire les espaces de bord et neutralise CR/LF/TAB (anti-injection d'en-tête). */
const clean = (v, max) =>
  typeof v === 'string' ? v.replace(/[\r\n\t]/g, ' ').trim().slice(0, max) : '';

const isValidEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

/** Vraie validation calendaire (rejette 2026-13-45, 2026-02-30, etc.). */
function isValidDateStr(s) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T12:00:00`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

const todayStr = () => new Date().toISOString().slice(0, 10);

function isWorkday(dateStr) {
  const day = new Date(`${dateStr}T12:00:00`).getDay();
  return day >= 1 && day <= 5;
}

function withinHorizon(dateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(`${dateStr}T12:00:00`);
  const max = new Date(today);
  max.setDate(max.getDate() + HORIZON_DAYS);
  return d >= today && d <= max;
}

/* ---------- Persistance (écriture atomique + mutex) ---------- */

async function readBookings() {
  try {
    const parsed = JSON.parse(await readFile(DATA_FILE, 'utf8'));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeBookings(list) {
  await mkdir(dirname(DATA_FILE), { recursive: true });
  const tmp = `${DATA_FILE}.${process.pid}.tmp`;
  await writeFile(tmp, JSON.stringify(list, null, 2));
  await rename(tmp, DATA_FILE); // atomique : pas de fichier à moitié écrit
}

// Sérialise les sections lecture→vérif→écriture pour éviter toute race condition.
let writeChain = Promise.resolve();
function withLock(task) {
  const run = writeChain.then(task, task);
  writeChain = run.then(
    () => {},
    () => {},
  );
  return run;
}

/* ---------- Email ---------- */

const maskEmail = (e) => e.replace(/^(.).*(@.*)$/, '$1***$2');

async function sendConfirmation({ name, email, date, slot, budget }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.FROM_EMAIL || 'onboarding@resend.dev';
  const admin = process.env.ADMIN_EMAIL;
  const human = new Date(`${date}T12:00:00`).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  const subject = `RDV confirmé — ${human} à ${slot}`;
  const body =
    `Bonjour ${name},\n\n` +
    `Votre rendez-vous est confirmé le ${human} à ${slot}.\n` +
    `Budget estimé : à partir de ${budget ? budget.toLocaleString('fr-FR') : '—'} €.\n\n` +
    `À très vite,\nScory`;

  // Mode dev : pas de clé → on logge sans PII en clair.
  if (!apiKey) {
    console.log(`[EMAIL — mode dev] → ${maskEmail(email)} | ${subject}`);
    return { sent: false, dev: true };
  }

  const { Resend } = await import('resend');
  const resend = new Resend(apiKey);
  await resend.emails.send({ from, to: email, subject, text: body });
  if (admin) {
    await resend.emails.send({
      from,
      to: admin,
      subject: `Nouveau RDV — ${human} ${slot}`,
      text: `${body}\n\nClient : ${name}\nEmail : ${email}`,
    });
  }
  return { sent: true };
}

/* ---------- Serveur ---------- */

const app = Fastify({
  logger: true,
  bodyLimit: 64 * 1024, // 64 Ko : largement suffisant, coupe les payloads DoS
  trustProxy: true, // vraie IP derrière un reverse proxy (rate-limit fiable)
});

await app.register(rateLimit, { max: 40, timeWindow: '1 minute' });

// En-tête d'hygiène sur toutes les réponses API.
app.addHook('onSend', async (_req, reply) => {
  reply.header('X-Content-Type-Options', 'nosniff');
});

app.get('/api/slots', async (req, reply) => {
  const date = clean(req.query?.date, 10);
  if (!isValidDateStr(date)) {
    return reply.code(400).send({ error: 'Date invalide.' });
  }
  if (!isWorkday(date) || !withinHorizon(date)) {
    return { date, slots: [] };
  }
  const bookings = await readBookings();
  const taken = new Set(bookings.filter((b) => b.date === date).map((b) => b.slot));
  return { date, slots: VALID_SLOTS.filter((s) => !taken.has(s)) };
});

// Schéma : rejette types/longueurs invalides et champs en trop avant le handler.
const bookSchema = {
  body: {
    type: 'object',
    required: ['name', 'email', 'date', 'slot'],
    additionalProperties: false,
    properties: {
      name: { type: 'string', minLength: 1, maxLength: 80 },
      email: { type: 'string', minLength: 5, maxLength: 120 },
      phone: { type: ['string', 'null'], maxLength: 30 },
      date: { type: 'string', maxLength: 10 },
      slot: { type: 'string', maxLength: 5 },
      budget: { type: ['number', 'string', 'null'] },
      answers: { type: ['object', 'array', 'null'] },
    },
  },
};

app.post(
  '/api/book',
  { schema: bookSchema, config: { rateLimit: { max: 4, timeWindow: '10 minutes' } } },
  async (req, reply) => {
    const name = clean(req.body.name, 80);
    const email = clean(req.body.email, 120).toLowerCase();
    const phone = clean(req.body.phone, 30) || null;
    const date = clean(req.body.date, 10);
    const slot = clean(req.body.slot, 5);
    const budget = Number.isFinite(+req.body.budget)
      ? Math.min(Math.max(+req.body.budget, 0), 1e9)
      : null;

    let answers = null;
    try {
      const s = JSON.stringify(req.body.answers ?? null);
      answers = s.length <= 4000 ? JSON.parse(s) : null;
    } catch {
      answers = null;
    }

    if (!name || !isValidEmail(email)) {
      return reply.code(400).send({ error: 'Nom ou email invalide.' });
    }
    if (!isValidDateStr(date) || !isWorkday(date) || !withinHorizon(date) || !VALID_SLOTS.includes(slot)) {
      return reply.code(400).send({ error: 'Créneau invalide.' });
    }

    const outcome = await withLock(async () => {
      const bookings = await readBookings();
      const today = todayStr();
      const pending = bookings.filter((b) => b.email === email && b.date >= today).length;
      if (pending >= MAX_PENDING_PER_EMAIL) return { limited: true };
      if (bookings.some((b) => b.date === date && b.slot === slot)) return { conflict: true };

      bookings.push({
        id: `${date}_${slot}_${Date.now()}`,
        name,
        email,
        phone,
        date,
        slot,
        budget,
        answers,
        createdAt: new Date().toISOString(),
      });
      await writeBookings(bookings);
      return { ok: true };
    });

    if (outcome.limited) {
      return reply.code(429).send({ error: 'Trop de rendez-vous en attente pour cet email.' });
    }
    if (outcome.conflict) {
      return reply.code(409).send({ error: 'Ce créneau vient d’être pris.' });
    }

    let email_status;
    try {
      email_status = await sendConfirmation({ name, email, date, slot, budget });
    } catch (err) {
      app.log.error({ err }, 'Échec envoi email (RDV enregistré)');
      email_status = { sent: false, error: true };
    }

    return { ok: true, booking: { date, slot }, email: email_status };
  },
);

/* ---------- Brief projet (wizard) ---------- */

const BRIEFS_FILE = join(__dirname, 'data', 'briefs.json');

async function readBriefs() {
  try {
    const parsed = JSON.parse(await readFile(BRIEFS_FILE, 'utf8'));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeBriefs(list) {
  await mkdir(dirname(BRIEFS_FILE), { recursive: true });
  const tmp = `${BRIEFS_FILE}.${process.pid}.tmp`;
  await writeFile(tmp, JSON.stringify(list, null, 2));
  await rename(tmp, BRIEFS_FILE);
}

const oneLine = (v, max) => clean(v, max) || '—';
const cleanList = (arr, maxItems, maxLen) =>
  Array.isArray(arr) ? arr.slice(0, maxItems).map((x) => clean(x, maxLen)).filter(Boolean) : [];

async function sendBrief(b) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.FROM_EMAIL || 'onboarding@resend.dev';
  const admin = process.env.ADMIN_EMAIL;
  const recap =
    `Type        : ${b.projectType}\n` +
    `Objectif    : ${b.goal}\n` +
    `Fonctions   : ${b.features.length ? b.features.join(', ') : '—'}\n` +
    `Budget      : ${b.budget}\n` +
    `Délai       : ${b.timeline}\n` +
    `Style       : ${b.style.length ? b.style.join(', ') : '—'}\n` +
    `Inspirations: ${b.refs}\n\n` +
    `Société     : ${b.company}\n` +
    `Nom         : ${b.name}\n` +
    `Email       : ${b.email}\n\n` +
    `Message     : ${b.message}`;

  if (!apiKey) {
    console.log(`[EMAIL — mode dev] brief de ${maskEmail(b.email)} | ${b.projectType}`);
    return { sent: false, dev: true };
  }
  const { Resend } = await import('resend');
  const resend = new Resend(apiKey);
  if (admin) {
    await resend.emails.send({
      from,
      to: admin,
      subject: `Nouveau brief — ${b.projectType} (${b.name})`,
      text: recap,
    });
  }
  await resend.emails.send({
    from,
    to: b.email,
    subject: 'Bien reçu — votre brief est arrivé',
    text:
      `Bonjour ${b.name},\n\n` +
      `Merci pour votre brief, je l'ai bien reçu. Je reviens vers vous sous 24 h ` +
      `avec une première réponse et les prochaines étapes.\n\n` +
      `À très vite,\nScory\nscory.dev`,
  });
  return { sent: true };
}

const briefSchema = {
  body: {
    type: 'object',
    required: ['name', 'email'],
    additionalProperties: false,
    properties: {
      projectType: { type: ['string', 'null'], maxLength: 40 },
      goal: { type: ['string', 'null'], maxLength: 40 },
      features: { type: ['array', 'null'], maxItems: 30, items: { type: 'string', maxLength: 40 } },
      budget: { type: ['string', 'null'], maxLength: 40 },
      timeline: { type: ['string', 'null'], maxLength: 40 },
      style: { type: ['array', 'null'], maxItems: 20, items: { type: 'string', maxLength: 40 } },
      refs: { type: ['string', 'null'], maxLength: 600 },
      company: { type: ['string', 'null'], maxLength: 80 },
      name: { type: 'string', minLength: 1, maxLength: 80 },
      email: { type: 'string', minLength: 5, maxLength: 120 },
      message: { type: ['string', 'null'], maxLength: 2000 },
    },
  },
};

app.post(
  '/api/brief',
  { schema: briefSchema, config: { rateLimit: { max: 4, timeWindow: '10 minutes' } } },
  async (req, reply) => {
    const b = {
      projectType: oneLine(req.body.projectType, 40),
      goal: oneLine(req.body.goal, 40),
      features: cleanList(req.body.features, 30, 40),
      budget: oneLine(req.body.budget, 40),
      timeline: oneLine(req.body.timeline, 40),
      style: cleanList(req.body.style, 20, 40),
      refs: clean(req.body.refs, 600) || '—',
      company: clean(req.body.company, 80) || '—',
      name: clean(req.body.name, 80),
      email: clean(req.body.email, 120).toLowerCase(),
      message: clean(req.body.message, 2000) || '—',
    };

    if (!b.name || !isValidEmail(b.email)) {
      return reply.code(400).send({ error: 'Nom ou email invalide.' });
    }

    await withLock(async () => {
      const briefs = await readBriefs();
      briefs.push({ id: `brief_${Date.now()}`, ...b, createdAt: new Date().toISOString() });
      if (briefs.length > 1000) briefs.splice(0, briefs.length - 1000); // borne le fichier
      await writeBriefs(briefs);
    });

    let email_status;
    try {
      email_status = await sendBrief(b);
    } catch (err) {
      app.log.error({ err }, 'Échec envoi email (brief enregistré)');
      email_status = { sent: false, error: true };
    }

    return { ok: true, email: email_status };
  },
);

const PORT = process.env.PORT || 8787;
app
  .listen({ port: PORT, host: '0.0.0.0' })
  .then(() => app.log.info(`API RDV sur http://localhost:${PORT}`))
  .catch((err) => {
    app.log.error(err);
    process.exit(1);
  });
