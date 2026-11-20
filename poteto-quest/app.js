import { PLAYBOOKS, WORLDS } from "./playbooks-data.js";
import { emptyState, pick, reduce, shuffleOrder } from "./game.js";
import { CS } from "./cs-data.js";
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
    root.querySelector("[data-action=mode]").onclick = () => {
      dispatch({ type: "mode", mode: state.mode === "cs" ? "kid" : "cs" });
      route();
    };
    document.title = "Poteto Mode: the Playbook Quest";
    return;
  }
  const cs = state.mode === "cs" ? CS[pb.id] : undefined;
  const order = cs && shuffleOrder(pb.steps.length, Date.now());
  root.innerHTML = renderView(pb, WORLDS.find((w) => w.id === pb.world), { cs, order });
  document.title = `${pb.title} · Playbook Quest`;
  bindView(pb, cs);
  window.scrollTo(0, 0);
}

function bindView(pb, cs) {
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
    if (cs) view.querySelector("[data-cs]").hidden = false;
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
    if (cs) {
      view.querySelector("[data-cs]").hidden = true;
      resetPuzzle();
    }
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
      const answer = cs ? cs.quiz.answer : pb.quiz.answer;
      const correct = Number(el.dataset.choice) === answer;
      el.classList.add(correct ? "right" : "wrong");
      view.querySelector("[data-result]").textContent = correct
        ? `✅ Correct! +${cs ? 40 : 25} XP (first time only).`
        : "❌ Not quite. Try another answer.";
      dispatch({ type: cs ? "advanced" : "quiz", id: pb.id, correct });
    };
  });
  show(-1);

  let next = 0;
  const resetPuzzle = () => {
    next = 0;
    view.querySelectorAll(".chip").forEach((el) => el.classList.remove("right", "wrong"));
    view.querySelector("[data-order-result]").textContent = "";
  };
  view.querySelectorAll(".chip").forEach((el) => {
    el.onclick = () => {
      if (el.classList.contains("right")) return;
      const res = pick(next, Number(el.dataset.pick));
      next = res.next;
      el.classList.add(res.correct ? "right" : "wrong");
      setTimeout(() => el.classList.remove("wrong"), 400);
      if (res.correct && next === pb.steps.length) {
        view.querySelector("[data-order-result]").textContent = "✅ Perfect order! +40 XP (first time only).";
        dispatch({ type: "order", id: pb.id });
      }
    };
  });
}

window.addEventListener("hashchange", route);
route();
