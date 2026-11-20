// Turns assets/source/bathroom.jpg into responsive AVIF, WebP and JPEG files in public/img.
// Run with `pnpm optimize` after replacing the source photo.
import { mkdir, stat } from "node:fs/promises";
import sharp from "sharp";

const SOURCE = "assets/source/bathroom.jpg";
const OUT = "public/img";
const WIDTHS = [640, 828, 1000, 1200, 1600, 2400];

const FORMATS = {
  avif: (img) => img.avif({ quality: 42, effort: 6 }),
  webp: (img) => img.webp({ quality: 72, effort: 6 }),
  jpg: (img) => img.jpeg({ quality: 76, mozjpeg: true, progressive: true }),
};

await mkdir(OUT, { recursive: true });
const meta = await sharp(SOURCE).rotate().metadata();
console.log(`source ${meta.width}x${meta.height}`);

for (const width of WIDTHS) {
  for (const [ext, encode] of Object.entries(FORMATS)) {
    const file = `${OUT}/bathroom-${width}.${ext}`;
    await encode(sharp(SOURCE).rotate().resize({ width })).toFile(file);
    console.log(file, `${((await stat(file)).size / 1024).toFixed(0)} KB`);
  }
}

const { dominant } = await sharp(SOURCE).rotate().stats();
console.log("dominant colour", `rgb(${dominant.r}, ${dominant.g}, ${dominant.b})`);
