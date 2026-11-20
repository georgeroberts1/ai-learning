import { TILES } from "./tiles.js";

const esc = (s) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

document.getElementById("tiles").innerHTML = TILES.map(
  (t) => `<a class="tile" href="${esc(t.href)}">
  <span class="tile-emoji">${esc(t.emoji)}</span>
  <span class="tile-title">${esc(t.title)}</span>
  <span class="tile-blurb">${esc(t.blurb)}</span>
</a>`,
).join("");
