import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    proxy: {
      // En dev, /api → backend Fastify (évite tout problème de CORS).
      '/api': 'http://localhost:8787',
    },
  },
});
