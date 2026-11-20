import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { PLAYBOOKS, WORLDS } from "../docs/playbooks-data.js";
import { esc, renderHome, renderView } from "../docs/render.js";
import { emptyState, levelFor, pick, reduce, shuffleOrder, XP_ADVANCED, XP_FINISH, XP_ORDER, XP_QUIZ } from "../docs/game.js";
import { CS } from "../docs/cs-data.js";

// The real playbooks are the spec. POTETO_PLAYBOOKS overrides the installed pstack plugin.
function playbookDir() {
  if (process.env.POTETO_PLAYBOOKS) return process.env.POTETO_PLAYBOOKS;
  const base = path.join(os.homedir(), ".claude/plugins/cache/cursor-plugins/pstack");
  const versions = fs.readdirSync(base).sort();
  return path.join(base, versions.at(-1), "skills/poteto-mode/playbooks");
}

const dir = playbookDir();
const files = fs.readdirSync(dir).filter((f) => f.endsWith(".md")).sort();

// Top-level numbered steps, or top-level bullets when the file has no numbered list.
function realStepCount(markdown) {
  const lines = markdown.split(/\r?\n/);
  const numbered = lines.filter((l) => /^\d+\. /.test(l)).length;
  return numbered || lines.filter((l) => /^- /.test(l)).length;
}

test("there is at least one real playbook to compare against", () => {
  assert.ok(files.length >= 22, `found ${files.length} playbooks in ${dir}`);
});

for (const file of files) {
  test(`view for ${file}`, () => {
    const pb = PLAYBOOKS.find((p) => p.file === file);
    assert.ok(pb, `no view for ${file}. Add a record to site/playbooks-data.js`);

    const world = WORLDS.find((w) => w.id === pb.world);
    assert.ok(world, `${pb.id} points at unknown world ${pb.world}`);

    // The view renders the title, the source file, and every step in order.
    const html = renderView(pb, world);
    assert.match(html, new RegExp(`data-view="${pb.id}"`));
    assert.ok(html.includes(esc(pb.title)));
    assert.ok(html.includes(`playbooks/${file}`));
    pb.steps.forEach(([, title], i) => {
      assert.ok(html.includes(`data-step="${i}"`), `station ${i + 1}`);
      assert.ok(html.includes(`data-panel="${i}"`), `panel ${i + 1}`);
      assert.ok(html.includes(esc(title)), `step title "${title}"`);
    });
    assert.ok(!html.includes(`data-step="${pb.steps.length}"`), "no extra stations");

    // The view has the same number of steps as the real playbook file.
    const real = fs.readFileSync(path.join(dir, file), "utf8");
    if (pb.prose) {
      assert.equal(realStepCount(real), 0, `${file} now has a list, so drop prose:true and map its steps`);
    } else {
      assert.equal(pb.steps.length, realStepCount(real), `${file} step count drifted from the view`);
    }

    // The game bits exist: a quiz with one valid answer, and a card on the home screen.
    const { options, answer } = pb.quiz;
    assert.ok(options.length >= 2 && new Set(options).size === options.length, "quiz options are distinct");
    assert.ok(Number.isInteger(answer) && answer >= 0 && answer < options.length, "quiz answer is an option");
    assert.ok(renderHome(WORLDS, PLAYBOOKS, emptyState()).includes(`href="#/${pb.id}"`), "home card links to the view");
  });
}

test("every view maps to a real playbook file", () => {
  for (const pb of PLAYBOOKS) assert.ok(files.includes(pb.file), `${pb.id} points at missing ${pb.file}`);
  assert.equal(new Set(PLAYBOOKS.map((p) => p.id)).size, PLAYBOOKS.length, "ids are unique");
});

test("rendering escapes HTML in data", () => {
  const evil = { ...PLAYBOOKS[0], title: "<img src=x onerror=alert(1)>" };
  const html = renderView(evil, WORLDS[0]);
  assert.ok(!html.includes("<img src=x"));
});

test("XP is awarded once, and only for correct answers", () => {
  let s = reduce(emptyState(), { type: "finish", id: "bug-fix" });
  s = reduce(s, { type: "finish", id: "bug-fix" });
  assert.equal(s.xp, XP_FINISH);
  s = reduce(s, { type: "quiz", id: "bug-fix", correct: false });
  assert.equal(s.xp, XP_FINISH);
  s = reduce(s, { type: "quiz", id: "bug-fix", correct: true });
  s = reduce(s, { type: "quiz", id: "bug-fix", correct: true });
  assert.equal(s.xp, XP_FINISH + XP_QUIZ);
  assert.equal(levelFor(99), 1);
  assert.equal(levelFor(100), 2);
});

test("every playbook has a CS lens with a real quiz", () => {
  assert.deepEqual(Object.keys(CS).sort(), PLAYBOOKS.map((p) => p.id).sort());
  const concepts = new Set();
  for (const [id, c] of Object.entries(CS)) {
    assert.ok(c.concept && c.explain && c.code.trim().split("\n").length >= 3, `${id} lens is filled in`);
    assert.ok(!concepts.has(c.concept), `${id} reuses concept ${c.concept}`);
    concepts.add(c.concept);
    const { options, answer } = c.quiz;
    assert.ok(options.length === 4 && new Set(options).size === 4, `${id} has 4 distinct options`);
    assert.ok(Number.isInteger(answer) && answer >= 0 && answer < 4, `${id} answer is an option`);
  }
  assert.ok(new Set(Object.values(CS).map((c) => c.quiz.answer)).size >= 3, "answer positions vary");
});

test("shuffleOrder is a deterministic permutation that never solves the puzzle", () => {
  for (let n = 2; n <= 8; n++) {
    for (let seed = 0; seed < 50; seed++) {
      const o = shuffleOrder(n, seed);
      assert.deepEqual([...o].sort((a, b) => a - b), Array.from({ length: n }, (_, i) => i));
      assert.notDeepEqual(o, Array.from({ length: n }, (_, i) => i));
    }
  }
  assert.deepEqual(shuffleOrder(6, 7), shuffleOrder(6, 7));
});

test("picking steps in order solves the puzzle, a wrong pick does not advance", () => {
  assert.deepEqual(pick(0, 0), { correct: true, next: 1 });
  assert.deepEqual(pick(1, 3), { correct: false, next: 1 });
});

test("CS challenges award XP once each, and mode switches do not touch XP", () => {
  let s = reduce(emptyState(), { type: "order", id: "bug-fix" });
  s = reduce(s, { type: "order", id: "bug-fix" });
  s = reduce(s, { type: "advanced", id: "bug-fix", correct: false });
  assert.equal(s.xp, XP_ORDER);
  s = reduce(s, { type: "advanced", id: "bug-fix", correct: true });
  s = reduce(s, { type: "mode", mode: "cs" });
  s = reduce(s, { type: "mode", mode: "nonsense" });
  assert.equal(s.xp, XP_ORDER + XP_ADVANCED);
  assert.equal(s.mode, "cs");
});

test("CS mode view shows the lens, the shuffled steps, and the CS quiz", () => {
  const pb = PLAYBOOKS.find((p) => p.id === "bug-fix");
  const cs = { ...CS["bug-fix"], code: "if (a < b && c) {}" };
  const order = shuffleOrder(pb.steps.length, 1);
  const html = renderView(pb, WORLDS.find((w) => w.id === pb.world), { cs, order });
  assert.ok(html.includes("data-cs") && html.includes(esc(cs.concept)));
  assert.ok(html.includes("a &lt; b &amp;&amp; c"), "code is escaped");
  assert.equal(html.match(/data-pick="/g).length, pb.steps.length);
  assert.ok(html.includes(esc(cs.quiz.q)) && html.includes(`data-answer="${cs.quiz.answer}"`));
  assert.ok(!renderView(pb, WORLDS[0]).includes("data-cs"), "kid mode has no lens");
});

test("home shows the CS toggle and CS badges only in CS mode", () => {
  const cs = { ...emptyState(), mode: "cs", ordered: { "bug-fix": true }, advanced: { "bug-fix": true } };
  const on = renderHome(WORLDS, PLAYBOOKS, cs);
  assert.ok(on.includes("CS mode: on") && on.includes("🧩 order") && on.includes("🎓 CS"));
  const off = renderHome(WORLDS, PLAYBOOKS, { ...cs, mode: "kid" });
  assert.ok(off.includes("CS mode: off") && !off.includes("🧩 order"));
});
