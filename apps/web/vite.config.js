import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  base: process.env.NODE_ENV === "production" ? "/relief/" : "/",
  test: {
    globals: true,
    environment: "happy-dom",
    setupFiles: "./src/test/setup.js",
  },
});
