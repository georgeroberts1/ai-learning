import { geometry } from "./geometry.js";
import { MIRROR, TILES, WALL } from "./tiles.js";

const esc = (s) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

const link = (t) => {
  const external = /^https?:/.test(t.href);
  return `href="${esc(t.href)}"${external ? ' target="_blank" rel="noopener noreferrer"' : ""}${t.description ? ` aria-label="${esc(`${t.title}. ${t.description}`)}"` : ""}`;
};

const text = (t) => `<span class="tag-title">${esc(t.title)}</span><span class="tag-blurb">${esc(t.blurb)}</span>`;

const spot = (t, i) => {
  const { points, clip, cx, cy } = geometry(t.corners, WALL);
  return `<div class="spot" data-id="${i}" style="--cx:${cx}%;--cy:${cy}%;--clip:${clip}">
  <svg viewBox="0 0 ${WALL.width} ${WALL.height}" preserveAspectRatio="none" aria-hidden="true"><polygon points="${points}"/></svg>
  <button class="pin" type="button" aria-expanded="false" aria-label="Show ${esc(t.title)}"></button>
  <a class="tag" ${link(t)}>${text(t)}</a>
</div>`;
};

const card = (t, i) => `<a class="card" data-id="${i}" ${link(t)}>
  <span class="card-glyph" aria-hidden="true">${esc(t.emoji)}</span>
  <span class="card-text">${text(t)}</span>
  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>
</a>`;

const mirror = geometry(MIRROR, WALL);
document.querySelector(".mirror").setAttribute("style", `--clip:${mirror.clip};--cx:${mirror.cx}%;--cy:${mirror.cy}%`);

document.getElementById("spots").innerHTML = TILES.map(spot).join("");
document.getElementById("links").innerHTML = TILES.map(card).join("");

const setOpen = (id) => {
  for (const el of document.querySelectorAll("[data-id]")) el.classList.toggle("open", el.dataset.id === id);
  for (const spotEl of document.querySelectorAll(".spot")) {
    spotEl.querySelector(".pin").setAttribute("aria-expanded", String(spotEl.dataset.id === id));
  }
};

document.addEventListener("click", (e) => {
  const spotEl = e.target.closest(".pin")?.parentElement;
  if (spotEl) setOpen(spotEl.classList.contains("open") ? null : spotEl.dataset.id);
  else if (!e.target.closest(".tag, .card")) setOpen(null);
});

document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  const pin = document.activeElement.closest?.(".spot")?.querySelector(".pin");
  setOpen(null);
  pin?.focus();
});
