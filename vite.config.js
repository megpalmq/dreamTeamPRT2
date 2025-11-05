// vite.config.js
import { defineConfig } from "vite";

console.log("✅ vite.config.js loaded");

export default defineConfig({
  server: {
    port: 5173, 
    proxy: {
      "/balldontlie": {
        target: "https://www.balldontlie.io",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/balldontlie/, ""),
      },
    },
  },
});
