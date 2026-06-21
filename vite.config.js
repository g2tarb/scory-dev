import { defineConfig } from 'vite';

// Dev only : /univers/ (dossier) doit servir le musée statique (public/univers/index.html).
// Sans ça, le fallback SPA de Vite renvoie la vitrine racine à la place du musée.
// En prod (Vercel), /univers/ → /univers/index.html est résolu nativement.
const serveUniversIndex = {
  name: 'serve-univers-index',
  configureServer(server) {
    server.middlewares.use((req, _res, next) => {
      if (req.url === '/univers' || req.url === '/univers/') req.url = '/univers/index.html';
      next();
    });
  },
};

export default defineConfig({
  plugins: [serveUniversIndex],
  // L'univers charge three/gsap/lenis via importmap (unpkg), pas via npm. On limite le scan
  // de pré-bundling à la vitrine pour éviter l'erreur "three/gsap could not be resolved".
  optimizeDeps: { entries: ['index.html'] },
  server: {
    proxy: {
      // En dev, /api → backend Fastify (évite tout problème de CORS).
      '/api': 'http://localhost:8787',
    },
  },
});
