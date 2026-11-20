// Finds the tile under a point on the photo and prints its four corners for tiles.js.
//   pnpm tile 528 230
// Coordinates are pixels of the 1400x1050 photo. The tile is the patch of light pixels around
// the point, bounded by the dark grout, so the point must be inside a tile and not on grout.
import sharp from "sharp";

const [sx, sy, thresholdArg] = process.argv.slice(2).map(Number);
if (!Number.isFinite(sx) || !Number.isFinite(sy)) throw new Error("usage: pnpm tile <x> <y> [grout-threshold]");
const GROUT = thresholdArg || 75;
const W = 1400;
const H = 1050;
const MAX_AREA = 12000;
const INSET = 2;

const { data } = await sharp("assets/source/bathroom.jpg").rotate().resize(W, H).raw().toBuffer({ resolveWithObject: true });
const channels = data.length / (W * H);
const luma = (i) => 0.3 * data[i * channels] + 0.59 * data[i * channels + 1] + 0.11 * data[i * channels + 2];
const isGrout = (x, y) => luma(y * W + x) < GROUT;

if (isGrout(sx, sy)) throw new Error(`(${sx}, ${sy}) is on grout. Move the point into a tile.`);

const seen = new Uint8Array(W * H);
const queue = [[sx, sy]];
seen[sy * W + sx] = 1;
const pixels = [];
while (queue.length) {
  const [x, y] = queue.pop();
  pixels.push([x, y]);
  if (pixels.length > MAX_AREA) throw new Error("the region leaks past the grout. Try a different point or threshold.");
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const nx = x + dx;
    const ny = y + dy;
    if (nx < 0 || ny < 0 || nx >= W || ny >= H || seen[ny * W + nx] || isGrout(nx, ny)) continue;
    seen[ny * W + nx] = 1;
    queue.push([nx, ny]);
  }
}

const best = (score) => pixels.reduce((a, p) => (score(p) > score(a) ? p : a));
const corners = [best(([x, y]) => -(x + y)), best(([x, y]) => x - y), best(([x, y]) => x + y), best(([x, y]) => y - x)];
const cx = pixels.reduce((n, [x]) => n + x, 0) / pixels.length;
const cy = pixels.reduce((n, [, y]) => n + y, 0) / pixels.length;
const inset = ([x, y]) => {
  const d = Math.hypot(cx - x, cy - y);
  return [Math.round(x + ((cx - x) / d) * INSET), Math.round(y + ((cy - y) / d) * INSET)];
};
console.log(`${pixels.length} px  centre (${Math.round(cx)}, ${Math.round(cy)})`);
console.log(`corners: ${JSON.stringify(corners.map(inset))}`);
