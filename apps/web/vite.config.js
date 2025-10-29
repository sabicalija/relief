import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { templateCompilerOptions } from "@tresjs/core";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue({
      ...templateCompilerOptions,
    }),
  ],
  base: process.env.NODE_ENV === "production" ? "/relief/" : "/",
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          three: ["three"],
        },
      },
    },
  },
  optimizeDeps: {
    exclude: ["vue", "three"],
  },
  test: {
    globals: true,
    environment: "happy-dom",
    setupFiles: "./src/test/setup.js",
  },
});
