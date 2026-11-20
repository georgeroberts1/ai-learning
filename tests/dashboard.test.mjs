import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "node:test";
import config from "../vite.config.js";
import { geometry } from "../geometry.js";
import { TILES, WALL } from "../tiles.js";

const root = resolve(import.meta.dirname, "..");
const pages = Object.values(config.build.rollupOptions.input);

test("every tile links to a folder with an index.html that Vite builds", () => {
  for (const t of TILES) {
    const page = resolve(root, t.href, "index.html");
    assert.ok(existsSync(page), `${t.title}: ${page} does not exist`);
    assert.ok(pages.includes(page), `${t.title}: ${t.href} is missing from vite.config.js`);
  }
});

test("every tile has four corners inside the photo", () => {
  for (const t of TILES) {
    assert.equal(t.corners.length, 4, `${t.title} needs four corners`);
    for (const [x, y] of t.corners) {
      assert.ok(x >= 0 && x <= WALL.width && y >= 0 && y <= WALL.height, `${t.title}: (${x}, ${y}) is off the photo`);
    }
  }
});

test("geometry gives the centre and clip of a tile as percentages of the photo", () => {
  const g = geometry([[0, 0], [100, 0], [100, 50], [0, 50]], { width: 200, height: 100 });
  assert.equal(g.cx, 25);
  assert.equal(g.cy, 25);
  assert.equal(g.clip, "polygon(0% 0%, 50% 0%, 50% 50%, 0% 50%)");
  assert.equal(g.points, "0,0 100,0 100,50 0,50");
});

test("every image in index.html's srcsets exists in public/", () => {
  const html = readFileSync(resolve(root, "index.html"), "utf8");
  const files = [...html.matchAll(/\b(img\/[\w.-]+)\s+\d+w/g)].map((m) => m[1]);
  assert.ok(files.length > 0, "found no srcset images");
  for (const f of new Set(files)) assert.ok(existsSync(resolve(root, "public", f)), `${f} is missing from public/`);
});
