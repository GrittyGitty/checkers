import { defineConfig } from "vite";
import eslint from "@nabla/vite-plugin-eslint";

export default defineConfig({
  plugins: [eslint()],
  build: {
    sourcemap: true,
  },
  server: {
    open: true,
  },
});
