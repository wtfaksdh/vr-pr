import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // чтобы можно было зайти с другого устройства в локальной сети
    port: 5173,
  },
});
