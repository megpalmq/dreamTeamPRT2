import { defineConfig } from "vite";

export default defineConfig({
  server: {
    proxy: {
      "/balldontlie": {
        target: "https://api.balldontlie.io",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/balldontlie/, ""),
      },
    },
  },
});