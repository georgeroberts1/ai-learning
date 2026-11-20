import { PLAYBOOKS, WORLDS } from "./playbooks-data.js";
import { emptyState, reduce } from "./game.js";
import { renderHome, renderView } from "./render.js";

const KEY = "poteto-quest";
const root = document.getElementById("app");
let timer = null;

const load = () => {
  try {
    return { ...emptyState(), ...JSON.parse(localStorage.getItem(KEY) || "{}") };
  } catch {
    return emptyState();
  }
};
const save = (s) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {}
};
let state = load();
const dispatch = (event) => {
  state = reduce(state, event);
  save(state);
};

function route() {
  clearInterval(timer);
  const id = location.hash.replace(/^#\//, "");
  const pb = PLAYBOOKS.find((p) => p.id === id);
  if (!pb) {
    root.innerHTML = renderHome(WORLDS, PLAYBOOKS, state);
    document.title = "Poteto Mode: the Playbook Quest";
    return;
  }
  root.innerHTML = renderView(pb, WORLDS.find((w) => w.id === pb.world));
  document.title = `${pb.title} · Playbook Quest`;
  bindView(pb);
  window.scrollTo(0, 0);
}

function bindView(pb) {
  const view = root.querySelector(".view");
  const track = view.querySelector(".track");
  const last = pb.steps.length - 1;
  let pos = -1;

  const show = (next) => {
    pos = Math.max(-1, Math.min(last, next));
    track.dataset.pos = pos;
    track.style.setProperty("--pos", pos);
    view.querySelectorAll(".station").forEach((el) => {
      const i = Number(el.dataset.step);
      el.classList.toggle("done", i < pos);
      el.classList.toggle("active", i === pos);
    });
    view.querySelectorAll(".panel").forEach((el) => {
      el.hidden = el.dataset.panel !== (pos < 0 ? "intro" : String(pos));
    });
    const potato = track.querySelector(".hero-potato");
    potato.classList.remove("hop");
    void potato.offsetWidth;
    potato.classList.add("hop");
    if (pos === last) finish();
  };

  const finish = () => {
    clearInterval(timer);
    view.querySelector("[data-quiz]").hidden = false;
    track.classList.add("won");
    dispatch({ type: "finish", id: pb.id });
  };

  const stop = () => clearInterval(timer);
  view.querySelector("[data-action=next]").onclick = () => { stop(); show(pos + 1); };
  view.querySelector("[data-action=back]").onclick = () => { stop(); show(pos - 1); };
  view.querySelector("[data-action=reset]").onclick = () => {
    stop();
    track.classList.remove("won");
    view.querySelector("[data-quiz]").hidden = true;
    view.querySelector("[data-result]").textContent = "";
    show(-1);
  };
  view.querySelector("[data-action=play]").onclick = () => {
    stop();
    if (pos >= last) show(-1);
    timer = setInterval(() => (pos >= last ? stop() : show(pos + 1)), 1500);
    show(pos + 1);
  };
  view.querySelectorAll(".station").forEach((el) => {
    el.onclick = () => { stop(); show(Number(el.dataset.step)); };
  });
  view.querySelectorAll(".choice").forEach((el) => {
    el.onclick = () => {
      const correct = Number(el.dataset.choice) === pb.quiz.answer;
      el.classList.add(correct ? "right" : "wrong");
      view.querySelector("[data-result]").textContent = correct
        ? "✅ Correct! +25 XP (first time only)."
        : "❌ Not quite. Try another answer.";
      dispatch({ type: "quiz", id: pb.id, correct });
    };
  });
  show(-1);
}

window.addEventListener("hashchange", route);
route();
