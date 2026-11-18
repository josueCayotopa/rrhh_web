import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 5174 },
  // Un solo paquete de ~550 kB (160 kB gzip): aceptable para una app interna.
  build: { chunkSizeWarningLimit: 1000 },
});
