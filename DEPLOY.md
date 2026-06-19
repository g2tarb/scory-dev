# Déploiement — scory.dev

Le site a **deux parties** :

1. **Statique** : la vitrine (build Vite → `dist/`) + le portfolio (`/univers/`, copié tel quel dans `dist/univers/`).
2. **Backend RDV** : un serveur **Fastify** (`server/index.js`) qui expose `GET /api/slots` et `POST /api/book`.

> Le statique fonctionne **sans backend** : la prise de RDV bascule automatiquement sur un `mailto:` (repli). Le backend n'est nécessaire que pour la **disponibilité partagée des créneaux** et l'**email automatique** via Resend.

---

## 1. Statique (vitrine + portfolio)

- **Build** : `npm run build` → produit `dist/` (vitrine) avec `dist/univers/` (portfolio).
- **Output directory** : `dist`.
- **Headers de sécurité** : déjà dans `vercel.json` (racine) — CSP, X-Frame-Options, nosniff, etc.

### Vercel (recommandé pour le statique)
```
Framework preset : Vite
Build command    : npm run build
Output directory : dist
```
Domaine : pointer `scory.dev` dessus.

> Netlify / Cloudflare Pages marchent aussi (même build/output) — reporter alors les headers de `vercel.json` dans leur config (`_headers` / `netlify.toml`).

---

## 2. Backend Fastify (`/api/*`)

Le backend est un process Node **persistant** (pas du statique). Deux approches :

### Option A — Hébergeur Node séparé + proxy (le plus simple)
1. Déployer `server/` sur **Render / Railway / Fly.io / un VPS / Coolify**.
   - Start : `node server/index.js`
   - Variables d'env (voir `.env.example`) :
     - `RESEND_API_KEY` (clé Resend)
     - `FROM_EMAIL` (adresse d'un **domaine vérifié dans Resend**, ex. `rdv@scory.dev`)
     - `ADMIN_EMAIL=contact@scory.dev`
     - `PORT` (souvent fourni par l'hôte)
   - **Persistance** : `server/data/bookings.json` doit être sur un disque persistant (sinon les RDV se perdent au redéploiement). Sur Render/Railway → ajouter un volume.
2. Faire **proxifier `/api/*`** vers ce service depuis le domaine principal. Sur Vercel, dans `vercel.json` :
   ```json
   { "rewrites": [{ "source": "/api/(.*)", "destination": "https://api.scory.dev/api/$1" }] }
   ```
   (ou exposer le backend sur `api.scory.dev` et appeler directement — mais alors gérer le CORS côté Fastify).

### Option B — Réécrire l'API en fonctions serverless Vercel
Porter `GET /api/slots` et `POST /api/book` en `api/slots.js` / `api/book.js` (format Vercel Functions).
⚠️ Le stockage fichier (`bookings.json`) ne marche pas en serverless (filesystem éphémère) → passer sur une **base** (Vercel KV, Upstash Redis, Supabase…). Plus propre à terme, plus de boulot.

---

## 3. Resend (emails de RDV)
1. Créer un compte Resend, ajouter et **vérifier le domaine `scory.dev`** (DNS).
2. Générer une `RESEND_API_KEY`.
3. Mettre `FROM_EMAIL` sur une adresse de ce domaine (ex. `rdv@scory.dev`).
Sans ça, les emails restent en mode dev (loggés), mais le RDV reste enregistré et le repli mailto fonctionne.

---

## Récap variables d'env (backend)
| Variable | Rôle |
|---|---|
| `RESEND_API_KEY` | Clé API Resend (sinon mode dev) |
| `FROM_EMAIL` | Expéditeur (domaine vérifié Resend) |
| `ADMIN_EMAIL` | Destinataire des RDV — `contact@scory.dev` |
| `PORT` | Port du serveur Fastify |
