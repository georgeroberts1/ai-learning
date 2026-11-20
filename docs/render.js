// Pure HTML-string renderers. No DOM access, so tests can run them in Node.
import { levelFor, XP_PER_LEVEL } from "./game.js";

export const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

export function renderHome(worlds, playbooks, state) {
  const level = levelFor(state.xp);
  const into = state.xp % XP_PER_LEVEL;
  const sections = worlds
    .map((w) => {
      const cards = playbooks
        .filter((p) => p.world === w.id)
        .map((p) => {
          const done = state.finished[p.id];
          const quiz = state.quizzed[p.id];
          const cs = state.mode === "cs";
          return `<a class="card${done ? " done" : ""}" href="#/${esc(p.id)}" data-playbook="${esc(p.id)}">
  <span class="card-emoji">${p.emoji}</span>
  <span class="card-title">${esc(p.title)}</span>
  <span class="card-tag">${esc(p.tagline)}</span>
  <span class="card-badges">${done ? "⭐ finished" : `${p.steps.length} steps`}${quiz ? " · 🧠 quiz" : ""}${cs && state.ordered[p.id] ? " · 🧩 order" : ""}${cs && state.advanced[p.id] ? " · 🎓 CS" : ""}</span>
</a>`;
        })
        .join("\n");
      return `<section class="world" data-world="${esc(w.id)}">
  <h2>${w.emoji} ${esc(w.name)}</h2>
  <p class="world-blurb">${esc(w.blurb)}</p>
  <div class="cards">${cards}</div>
</section>`;
    })
    .join("\n");

  return `<header class="hero">
  <h1>🥔 Poteto Mode: the Playbook Quest</h1>
  <p>An AI helper does not just start typing. It picks a <strong>playbook</strong>, a list of steps for that kind of job. Pick a level and watch the potato walk through one.</p>
  <button type="button" class="mode${state.mode === "cs" ? " on" : ""}" data-action="mode" aria-pressed="${state.mode === "cs"}">🎓 CS mode: ${state.mode === "cs" ? "on" : "off"}</button>
  <div class="xp" aria-label="Your progress"><span class="level">Level ${level}</span>
    <span class="bar"><span class="fill" style="width:${into}%"></span></span>
    <span class="xp-num">${state.xp} XP</span></div>
</header>
${sections}
<footer class="credit">Based on the playbooks in <a href="https://github.com/cursor/plugins/tree/main/pstack">pstack</a>, a plugin from Cursor. Step text is a plain-English retelling for learners.</footer>`;
}

// opts.cs is the playbook's CS lens and opts.order is the shuffled step order. Both are set only in CS mode.
export function renderView(pb, world, opts = {}) {
  const { cs, order } = opts;
  const stations = pb.steps
    .map(
      ([icon, title], i) =>
        `<button class="station" type="button" data-step="${i}" aria-label="Step ${i + 1}: ${esc(title)}"><span class="station-icon">${icon}</span><span class="station-n">${i + 1}</span></button>`
    )
    .join("");
  const panels = pb.steps
    .map(
      ([icon, title, kid], i) =>
        `<article class="panel" data-panel="${i}" hidden>
  <h3>${icon} Step ${i + 1} of ${pb.steps.length}: ${esc(title)}</h3>
  <p>${esc(kid)}</p>
</article>`
    )
    .join("\n");
  const quiz = cs ? cs.quiz : pb.quiz;
  const options = quiz.options
    .map((o, i) => `<button class="choice" type="button" data-choice="${i}">${esc(o)}</button>`)
    .join("");

  return `<a class="back" href="#/">← All levels</a>
<section class="view" data-view="${esc(pb.id)}" data-steps="${pb.steps.length}" data-answer="${quiz.answer}">
  <p class="crumb">${world.emoji} ${esc(world.name)} · from <code>playbooks/${esc(pb.file)}</code></p>
  <h2>${pb.emoji} ${esc(pb.title)}</h2>
  <p class="tagline">${esc(pb.tagline)}</p>
  <p class="analogy">💭 ${esc(pb.analogy)}</p>
  <div class="track" data-pos="-1" style="--count:${pb.steps.length}">
    <div class="rail"></div>
    <span class="hero-potato" aria-hidden="true">🥔</span>
    ${stations}
  </div>
  <div class="panels" aria-live="polite">
    <article class="panel intro" data-panel="intro"><h3>🏁 Ready?</h3><p>Press <strong>Next step</strong> or <strong>Watch it run</strong> to send the potato along the ${pb.steps.length} steps.</p></article>
    ${panels}
  </div>
  <div class="controls">
    <button type="button" data-action="back">◀ Back</button>
    <button type="button" data-action="next" class="primary">Next step ▶</button>
    <button type="button" data-action="play">▶ Watch it run</button>
    <button type="button" data-action="reset">↺ Restart</button>
  </div>
  ${cs ? renderCs(pb, cs, order) : ""}
  <section class="quiz" data-quiz hidden>
    <h3>${cs ? "🎓 CS boss question" : "🧠 Boss question"}</h3>
    <p>${esc(quiz.q)}</p>
    <div class="choices">${options}</div>
    <p class="result" data-result aria-live="polite"></p>
  </section>
</section>`;
}

function renderCs(pb, cs, order) {
  const chips = order
    .map((i) => `<button class="chip" type="button" data-pick="${i}">${pb.steps[i][0]} ${esc(pb.steps[i][1])}</button>`)
    .join("");
  return `<section class="cs" data-cs hidden>
    <h3>🎓 CS lens: ${esc(cs.concept)}</h3>
    <p>${esc(cs.explain)}</p>
    <pre><code>${esc(cs.code)}</code></pre>
    <h3>🧩 Put the steps in order</h3>
    <p>Click the steps in the order the playbook runs them. A wrong click costs nothing but your pride.</p>
    <div class="chips" data-chips>${chips}</div>
    <p class="result" data-order-result aria-live="polite"></p>
  </section>`;
}
