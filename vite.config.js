import { resolve } from "node:path";
import { defineConfig } from "vite";

// One entry per page built here. Add a line when you add a folder with its own index.html.
// Projects hosted in their own repo are only linked from tiles.js and need no entry.
export default defineConfig({
  base: "./",
  build: {
    rollupOptions: {
      input: {
        home: resolve(import.meta.dirname, "index.html"),
      },
    },
  },
});
