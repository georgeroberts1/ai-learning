# AI Learning

A personal dashboard of AI learning projects, built with Vite and pnpm. The home page is a photo of a tiled bathroom wall, and each glowing tile on it links to its own app.

```text
pnpm install
pnpm dev      # dashboard at http://localhost:5173
pnpm build    # static site in dist/
pnpm optimize # rebuild the responsive photo files in public/img from assets/source
pnpm audit:page [url] [runs]  # Lighthouse mobile audit of a running `pnpm preview` (THROTTLING=devtools for real throttling)
pnpm test     # one test per Poteto playbook, checked against the real playbook files
```

## Add a new app

1. Make a folder with its own `index.html`, such as `my-app/`.
2. Add it to `build.rollupOptions.input` in `vite.config.js`.
3. Add an entry to `tiles.js` with the four corners of a tile on the photo (clockwise from top left, in the 1400x1050 pixels of the photo).

## Apps

- `poteto-quest/` is 🥔 Poteto Mode: the Playbook Quest, a game that explains each `/poteto-mode` playbook from [pstack](https://github.com/cursor/plugins/tree/main/pstack). Turn on **CS mode** for a harder version aimed at computer science students.

The photo is a CC0 image from [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Old_bathroom_with_subway_tiles.JPG). `pnpm optimize` turns the 6.9 MB original into AVIF, WebP and JPEG files at six widths (the 1600px AVIF is 51 KB, the 828px phone file 20 KB), and the page picks one with `srcset`.

The site is static, so GitHub Pages serves `dist/` (Settings, Pages, source GitHub Actions, which the workflow needs).

The tests read the installed pstack plugin from `~/.claude/plugins/cache/cursor-plugins/pstack`. Set `POTETO_PLAYBOOKS` to point at another copy of the `playbooks/` folder.

CI (`.github/workflows/ci.yml`) runs the tests on every PR and push, and weekly to catch upstream playbook changes. Pushes to `main` build with Vite and deploy `dist/` to GitHub Pages only when the tests pass. In CI the tests check out `cursor/plugins` and set `POTETO_PLAYBOOKS` to its playbooks.
