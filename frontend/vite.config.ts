import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    allowedHosts: true,
    // проксируем API на локальный backend - так фронт и бэк оказываются на одном origin
    // (не нужен ни CORS, ни отдельный ngrok-туннель под backend)
    proxy: {
      "/auth": "http://localhost:8000",
      "/users": "http://localhost:8000",
      "/boards": "http://localhost:8000",
      "/columns": "http://localhost:8000",
      "/cards": "http://localhost:8000",
      "/comments": "http://localhost:8000",
      "/health": "http://localhost:8000",
    },
  },
}); 