import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  publicDir: "static",
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        background: resolve(__dirname, "src/background.ts"),
        popup: resolve(__dirname, "src/popup.ts"),
        blocked: resolve(__dirname, "src/blocked.ts"),
      },
      output: {
        entryFileNames: "[name].js",
        chunkFileNames: "[name].js",
        assetFileNames: "[name].[ext]",
      },
    },
  },
});
