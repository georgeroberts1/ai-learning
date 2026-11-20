import { resolve } from "node:path";
import { defineConfig } from "vite";

// One entry per app. Add a line here when you add a folder with its own index.html.
export default defineConfig({
  base: "./",
  build: {
    rollupOptions: {
      input: {
        home: resolve(import.meta.dirname, "index.html"),
        "poteto-quest": resolve(import.meta.dirname, "poteto-quest/index.html"),
      },
    },
  },
});
