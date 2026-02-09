import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@shared": path.resolve(__dirname, "../shared"),
    },
  },
  server: {
    port: 5176,
    host: "0.0.0.0",
    proxy: {
      "/api": {
        target: process.env.API_URL || "http://localhost:3004",
        changeOrigin: true,
      },
    },
  },
});
