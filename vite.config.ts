import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    // 5173 is Vite's default and the origin the backend allows out of the box
    // via CORS_ORIGINS. This used to be 3001 — the port the API listens on —
    // so starting both meant the dev server silently moved to 3002 and every
    // request was then blocked by CORS.
    port: 5173,
    host: true,
    // Fail loudly instead of drifting to another port.
    strictPort: true,
  },
});
