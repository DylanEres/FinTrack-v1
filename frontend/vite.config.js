import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // ✅ Allows external access (important for Fly.io)
    port: 3000, // ✅ Standard web port
  },
});
