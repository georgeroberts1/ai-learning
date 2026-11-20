# AI Stuff

A personal collection of AI stuff (games, trackers and experiments), built with Vite and pnpm. The home page is a photo of a tiled bathroom wall, and each glowing tile on it links to its own project.

```text
pnpm install
pnpm dev      # dashboard at http://localhost:5173
pnpm build    # static site in dist/
pnpm optimize # rebuild the responsive photo files in public/img from assets/source
pnpm audit:page [url] [runs]  # Lighthouse mobile audit of a running `pnpm preview` (THROTTLING=devtools for real throttling)
pnpm test     # checks every tile links somewhere real and every photo file exists
```

## Add a new project

Hosted elsewhere (the usual case): add an entry to `tiles.js` with its https URL.

Built in this repo:

1. Make a folder with its own `index.html`, such as `my-app/`.
2. Add it to `build.rollupOptions.input` in `vite.config.js`.
3. Add an entry to `tiles.js`

Either way, give the entry the four corners of a tile on the photo (clockwise from top left, in the 1400x1050 pixels of the photo).

## Projects

Each one lives in its own repo and is linked from a tile.

- 🥔 [Poteto Mode: the Playbook Quest](https://georgeroberts1.github.io/poteto-playbook-quest/) ([repo](https://github.com/georgeroberts1/poteto-playbook-quest)) is a game that explains each `/poteto-mode` playbook from [pstack](https://github.com/cursor/plugins/tree/main/pstack), with a harder CS mode.
- ⭐ [Brushing Stars](https://brushing-stars.vercel.app/) is a mobile-first tooth brushing tracker for young children.

The photo is a CC0 image from [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Old_bathroom_with_subway_tiles.JPG). `pnpm optimize` turns the 6.9 MB original into AVIF, WebP and JPEG files at six widths (the 1600px AVIF is 51 KB, the 828px phone file 20 KB), and the page picks one with `srcset`.

The site is static, so GitHub Pages serves `dist/` (Settings, Pages, source GitHub Actions, which the workflow needs).

CI (`.github/workflows/ci.yml`) runs the tests on every PR and push to `main`. Pushes to `main` build with Vite and deploy `dist/` to GitHub Pages only when the tests pass.
