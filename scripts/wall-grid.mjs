// Draws the wall photo with a pixel grid and every tile in tiles.js filled red, to pick a free tile.
//   pnpm wall out.png                  whole photo, grid every 100px
//   pnpm wall out.png 940 420 360 180  that region zoomed 3x, grid every 20px
import sharp from "sharp";
import { TILES, WALL } from "../tiles.js";

const [out, ...region] = process.argv.slice(2);
if (!out) throw new Error("usage: pnpm wall <out.png> [x y width height]");
const [x0, y0, w, h] = region.length === 4 ? region.map(Number) : [0, 0, WALL.width, WALL.height];
const zoom = region.length === 4 ? 3 : 1;
const step = zoom > 1 ? 20 : 100;
const px = (v, origin) => (v - origin) * zoom;

let svg = `<svg width="${w * zoom}" height="${h * zoom}" xmlns="http://www.w3.org/2000/svg">`;
for (const t of TILES) {
  svg += `<polygon points="${t.corners.map(([x, y]) => `${px(x, x0)},${px(y, y0)}`).join(" ")}" fill="red" opacity="0.6"/>`;
}
for (let x = Math.ceil(x0 / step) * step; x <= x0 + w; x += step) {
  svg += `<line x1="${px(x, x0)}" y1="0" x2="${px(x, x0)}" y2="${h * zoom}" stroke="cyan" stroke-width="${x % 100 ? 0.5 : 2}"/>`;
  if (x % 100 === 0) svg += `<text x="${px(x, x0) + 3}" y="18" fill="cyan" font-size="18">${x}</text>`;
}
for (let y = Math.ceil(y0 / step) * step; y <= y0 + h; y += step) {
  svg += `<line x1="0" y1="${px(y, y0)}" x2="${w * zoom}" y2="${px(y, y0)}" stroke="cyan" stroke-width="${y % 100 ? 0.5 : 2}"/>`;
  svg += `<text x="3" y="${px(y, y0) - 3}" fill="cyan" font-size="16">${y}</text>`;
}
svg += "</svg>";

const photo = await sharp("assets/source/bathroom.jpg").rotate().resize(WALL.width, WALL.height).toBuffer();
const crop = await sharp(photo).extract({ left: x0, top: y0, width: w, height: h }).resize(w * zoom, h * zoom).toBuffer();
await sharp(crop).composite([{ input: Buffer.from(svg) }]).png().toFile(out);
console.log(out);
