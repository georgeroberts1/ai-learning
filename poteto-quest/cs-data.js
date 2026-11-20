// One CS lens per playbook, keyed by playbook id in docs/playbooks-data.js.
export const CS = {
  "investigation": {
    concept: "Command-query separation",
    explain: "Command-query separation says a routine either returns data or changes state, never both. Investigation is a pure query. It traces code and returns a cited explanation, and its throughput checkpoint is n/a because nothing is written. If the answer leads to a change, the playbook hands back and re-routes to Bug fix or Feature, which are commands.",
    code: "class Stack {\n  #items = [];\n  size() {\n    return this.#items.length;\n  }\n  push(x) {\n    this.#items.push(x);\n  }\n}",
    quiz: {
      q: "Which stack method breaks command-query separation?",
      options: ["size() returns the item count", "push(x) appends x and returns nothing", "isEmpty() returns size() === 0", "pop() removes the top item and returns it"],
      answer: 3,
    },
  },
  "runtime-forensics": {
    concept: "Sampling profilers, self vs total time",
    explain: "A sampling profiler interrupts the process at a fixed interval and records the call stack. Self time counts samples where a function is the top frame, and total time counts samples where it is anywhere on the stack. Step 1 captures such a profile from the live process, and step 2 reduces it to the hot function before step 3 proves the mechanism.",
    code: "function attribute(samples, intervalMs) {\n  const self = new Map(), total = new Map();\n  for (const stack of samples) {\n    const top = stack[stack.length - 1];\n    self.set(top, (self.get(top) ?? 0) + intervalMs);\n    for (const fn of new Set(stack)) {\n      total.set(fn, (total.get(fn) ?? 0) + intervalMs);\n    }\n  }\n  return { self, total };\n}",
    quiz: {
      q: "A profiler samples every 1 ms for 2 s. render is the top frame in 300 samples and appears somewhere on the stack in 1200. What is render's estimated total time?",
      options: ["300 ms", "900 ms", "1200 ms", "1500 ms"],
      answer: 2,
    },
  },
  "trace-forensics": {
    concept: "SQL aggregation over trace events",
    explain: "A trace is a fixed dataset, so step 2 loads it into sqlite with one row per sample, frame or node. Finding the hot path is then a GROUP BY that sums time per frame and sorts descending. The largest single event is often not the largest total, so reading raw rows by eye misleads.",
    code: "CREATE TABLE events (name TEXT, dur_ms REAL);\nINSERT INTO events VALUES\n  ('parse', 40), ('layout', 30), ('parse', 25),\n  ('paint', 50), ('layout', 40);\nSELECT name, SUM(dur_ms) AS total\nFROM events\nGROUP BY name\nORDER BY total DESC;",
    quiz: {
      q: "events(name, dur_ms) holds (gc, 60), (layout, 35), (gc, 10), (script, 45), (layout, 40), (script, 20). What does SELECT name FROM events GROUP BY name ORDER BY SUM(dur_ms) DESC LIMIT 1 return?",
      options: ["gc", "layout", "script", "A tie between gc and layout"],
      answer: 1,
    },
  },
  "bug-fix": {
    concept: "Bisection over a hypothesis space",
    explain: "Step 2 binary-searches the cause. Each experiment splits the surviving hypotheses, and runtime evidence eliminates one side. With n candidates and even splits, ceil(log2 n) experiments isolate one, while testing them one by one costs up to n. Taking the split that cuts the most remaining space is what keeps the count logarithmic.",
    code: "def first_bad(commits, is_bad):\n    lo, hi = 0, len(commits) - 1\n    while lo < hi:\n        mid = (lo + hi) // 2\n        if is_bad(commits[mid]):\n            hi = mid\n        else:\n            lo = mid + 1\n    return commits[lo]",
    quiz: {
      q: "A regression hides somewhere in 1000 candidate commits, and each build-and-test takes 6 minutes. Bisecting, what is the worst-case time to isolate the first bad commit?",
      options: ["1 hour", "6 minutes", "10 hours", "50 hours"],
      answer: 0,
    },
  },
  "feature": {
    concept: "Critical path in a task DAG",
    explain: "Step 3's throughput checkpoint is a scheduling problem. Tasks are nodes, blocking steps are edges, and independent workstreams run at the same time. With unlimited workers the finish time is the longest weighted path through the DAG, not the sum of all work. Speeding up a task off the critical path does not finish any sooner.",
    code: "const tasks = {\n  schema: [3, []], api: [2, [\"schema\"]],\n  ui: [4, [\"schema\"]], e2e: [1, [\"api\", \"ui\"]],\n};\nconst memo = {};\nfunction finish(id) {\n  const [cost, deps] = tasks[id];\n  memo[id] ??= Math.max(0, ...deps.map(finish)) + cost;\n  return memo[id];\n}\nconsole.log(finish(\"e2e\"));",
    quiz: {
      q: "A takes 4 h. B (2 h) and C (6 h) both need A. D (3 h) needs B. E (1 h) needs C and D. With unlimited workers, what is the shortest possible finish time?",
      options: ["16 hours", "10 hours", "6 hours", "11 hours"],
      answer: 3,
    },
  },
  "refactoring": {
    concept: "Differential testing for equivalence",
    explain: "Step 1 pins behaviour with a characterization test or equivalence harness before structure moves. An equivalence harness runs old and new code on the same inputs and diffs the outputs, which is differential testing. A green run proves equivalence only over the inputs it sampled, so the input generator decides what the pin really holds.",
    code: "function checkEquivalent(oldFn, newFn, genInput, runs = 1000) {\n  for (let i = 0; i < runs; i++) {\n    const x = genInput();\n    const a = JSON.stringify(oldFn(x));\n    const b = JSON.stringify(newFn(x));\n    if (a !== b) return { ok: false, input: x, a, b };\n  }\n  return { ok: true };\n}",
    quiz: {
      q: "The harness draws x uniformly from the integers 0 to 100 and passes 10,000 runs. The new code differs from the old only when x is negative. What does the green run show?",
      options: ["The refactor preserves behaviour for every integer", "Nothing, because 10,000 runs is too few", "Equivalence on 0 to 100 only, so negatives are unpinned", "The old code had a bug on negatives"],
      answer: 2,
    },
  },
  "prototype": {
    concept: "Strategy pattern for swappable variants",
    explain: "Step 4 builds the alternatives behind one switcher, each labelled. That is the strategy pattern. Every variant implements the same interface, and the caller picks one at runtime from a table. Adding a variant is a data change, and comparing them costs a keypress instead of a rebuild.",
    code: "const data = [\"alpha\", \"beta\", \"gamma\"];\nconst variants = {\n  grid: (xs) => xs.map((x) => `[${x}]`).join(\" \"),\n  list: (xs) => xs.map((x) => `- ${x}`).join(\"\\n\"),\n  dense: (xs) => xs.join(\",\"),\n};\nconst names = Object.keys(variants);\nlet i = 0;\ndocument.addEventListener(\"keydown\", (e) => {\n  if (e.key === \"v\") i = (i + 1) % names.length;\n  document.body.textContent = `${names[i]}\\n${variants[names[i]](data)}`;\n});",
    quiz: {
      q: "A switcher cycles through Object.keys(variants) with i = (i + 1) % names.length. You add a fourth variant to the table. How many lines of the keydown handler must change?",
      options: ["Zero, the table drives the switcher", "One, the modulo bound", "One per existing variant", "Four, one per variant"],
      answer: 0,
    },
  },
  "visual-parity": {
    concept: "Golden-master tests with an exact oracle",
    explain: "The baseline screenshots are a golden master, and the image diff is the test oracle. Step 4 counts any nonzero diff as a fail, so the oracle is exact. An oracle is only trustworthy if the work under test cannot change it. Step 2 protects it by forbidding edits to the harness or the baseline.",
    code: "function pixelDiff(a, b) {\n  if (a.width !== b.width || a.height !== b.height) return Infinity;\n  let diff = 0;\n  for (let i = 0; i < a.data.length; i += 4) {\n    const same = a.data[i] === b.data[i] && a.data[i + 1] === b.data[i + 1] &&\n      a.data[i + 2] === b.data[i + 2] && a.data[i + 3] === b.data[i + 3];\n    if (!same) diff++;\n  }\n  return diff;\n}\nconst pass = pixelDiff(baseline, candidate) === 0;",
    quiz: {
      q: "A teammate proposes a 0.1% tolerance on 1000 x 500 screenshots. How many pixels could change and still pass?",
      options: ["50", "5,000", "0", "500"],
      answer: 3,
    },
  },
  "authoring-a-skill": {
    concept: "Referential integrity of a link graph",
    explain: "Step 2 checks that referenced files exist and cross-skill links resolve. Model files as nodes and links as edges, and validation becomes a scan for dangling edges, like a foreign key that points at no row. A cycle between skills is not a fault. Only a missing target is.",
    code: "import { existsSync } from \"node:fs\";\nimport { dirname, resolve } from \"node:path\";\nfunction danglingLinks(file, markdown) {\n  const links = [...markdown.matchAll(/\\]\\(([^)#\\s]+)(#[^)]*)?\\)/g)].map((m) => m[1]);\n  return links\n    .filter((href) => !/^https?:/.test(href))\n    .filter((href) => !existsSync(resolve(dirname(file), href)));\n}",
    quiz: {
      q: "Skill files A, B and C exist. A links to B and C, B links to D, and C links back to A. How many dangling references should validation report?",
      options: ["0", "1", "2", "3"],
      answer: 1,
    },
  },
  "perf-issue": {
    concept: "Amdahl's law",
    explain: "Amdahl's law says that if a fraction p of runtime gets s times faster, overall speedup is 1 / ((1 - p) + p / s). As s grows the bound is 1 / (1 - p), which is the first mantra, don't do it. So removing work beats any finite speedup of the same work. Step 1's baseline trace is what tells you p.",
    code: "def amdahl(p, s):\n    return 1 / ((1 - p) + p / s)\n\nprint(round(amdahl(0.4, 4), 2))\nprint(round(amdahl(0.4, float(\"inf\")), 2))",
    quiz: {
      q: "A function takes 40% of request time. Fix A makes it 4x faster. Fix B stops doing it at all. What overall speedups do A and B give?",
      options: ["A 4x, B infinite", "A 1.6x, B 2.5x", "A 1.43x, B 1.67x", "A 1.3x, B 1.4x"],
      answer: 2,
    },
  },
  "hillclimb": {
    concept: "Hill climbing and local optima",
    explain: "Hillclimb is greedy local search. Each iteration tries one change, keeps it only if the metric moves past noise with the gate green, and reverts it otherwise. Greedy acceptance halts at a local optimum where no single small step helps. Step 6's pivots, combined near-misses and more radical tries are escape moves, like larger neighbourhoods or random restarts.",
    code: "function hillclimb(state, neighbours, score, noise, maxSteps) {\n  let best = score(state);\n  for (let step = 0; step < maxSteps; step++) {\n    const next = neighbours(state).find((n) => score(n) > best + noise);\n    if (!next) return state;\n    state = next;\n    best = score(next);\n  }\n  return state;\n}",
    quiz: {
      q: "Maximise f over the integers, stepping by 1. f(2) = 8, f(3) = 10, f(4) = 9, and the global maximum is f(9) = 20. Starting at x = 3, where does greedy hill climbing stop?",
      options: ["x = 9, the global maximum", "x = 4, after one step", "It never stops", "x = 3, a local maximum"],
      answer: 3,
    },
  },
  "opening-a-pr": {
    concept: "Regular languages for message formats",
    explain: "The title shape type(scope): subject is a regular language, so one regular expression accepts or rejects it. The body's ## headings must appear in a fixed order with empty ones dropped, which is a subsequence check. Encoding the format as patterns turns a style rule into a test a machine can run.",
    code: "const TITLE = /^(feat|fix|perf|refactor|docs|test|chore)\\([a-z0-9-]+\\): \\S.*$/;\nconst ORDER = [\"Why\", \"What changed\", \"Scope\", \"Tradeoffs\", \"Blast Radius\", \"Verification\"];\nfunction validPr(title, body) {\n  const heads = [...body.matchAll(/^## (.+)$/gm)].map((m) => ORDER.indexOf(m[1]));\n  const ordered = heads.every((v, i) => v >= 0 && (i === 0 || v > heads[i - 1]));\n  return TITLE.test(title) && ordered && body.split(\"\\n\").length < 40;\n}",
    quiz: {
      q: "Which title matches /^(feat|fix|perf)\\([a-z-]+\\): \\S.*$/ ?",
      options: ["feat(cs-mode): add order puzzle", "Fix(cli): handle empty args", "fix: handle empty args", "perf(trace-db) : batch inserts"],
      answer: 0,
    },
  },
  "babysit": {
    concept: "Bounded retry for transient faults",
    explain: "A flaky test is a transient fault, and the playbook gives it one fresh build. If flakes are independent with probability f, a correct change fails both runs with probability f squared, while a real bug fails both every time. The bound stops a loop from rerunning a genuine failure forever. Only the diff's own failures get a commit.",
    code: "async function runWithOneRetry(runBuild) {\n  const first = await runBuild();\n  if (first.passed) return { ...first, flaky: false };\n  const second = await runBuild();\n  return { ...second, flaky: second.passed };\n}",
    quiz: {
      q: "A test flakes independently 5% of the time. With one fresh build allowed, what is the chance a correct PR still shows red?",
      options: ["5%", "0.25%", "2.5%", "10%"],
      answer: 1,
    },
  },
  "shipping": {
    concept: "Cumulative acknowledgement and in-order delivery",
    explain: "TCP hands bytes to the application only up to the first gap, even when later segments have arrived. Shipping lands a stack the same way. It walks up from the lowest unmerged PR and lands only the contiguous verified run, so a verified PR above an unverified one waits. The top of that run is the ceiling, much like a cumulative acknowledgement number.",
    code: "function verifiedRun(stack) {\n  const run = [];\n  for (const pr of stack) {\n    if (pr.verdict !== \"PASS\" && pr.verdict !== \"PASS+NOTES\") break;\n    run.push(pr);\n  }\n  return run;\n}",
    quiz: {
      q: "Bottom to top the stack is P1 PASS, P2 PASS+NOTES, P3 no verdict, P4 PASS, P5 PASS, and each PR builds on the one below. Which PRs land in this pass?",
      options: ["P1, P2, P4 and P5", "P1 and P2", "P1 only", "All five, since CI is green"],
      answer: 1,
    },
  },
  "multi-phase-plan": {
    concept: "Topological sort of a dependency graph",
    explain: "Step 3 opens the plan with PR ids in landing order and a dependency graph. A landing order is valid exactly when it is a topological order of that graph. Kahn's algorithm builds one by repeatedly taking a PR whose dependencies have all landed, and it fails only if the graph has a cycle. PRs with no dependencies are the independent ones that branch from trunk.",
    code: "function landingOrder(deps) {\n  const ids = Object.keys(deps), done = new Set(), order = [];\n  while (order.length < ids.length) {\n    const next = ids.find((pr) => !done.has(pr) && deps[pr].every((d) => done.has(d)));\n    if (!next) return null;\n    done.add(next);\n    order.push(next);\n  }\n  return order;\n}",
    quiz: {
      q: "PR2 and PR3 depend on PR1, and PR4 depends on PR2 and PR3. Which landing order is invalid?",
      options: ["PR1, PR3, PR2, PR4", "PR1, PR2, PR3, PR4", "PR1, PR2, PR4, PR3", "None, all three are valid"],
      answer: 2,
    },
  },
  "autonomous-run": {
    concept: "Polling versus event-driven wakeups",
    explain: "Step 2 picks how the loop wakes. Watching an event is interrupt-driven and reacts as soon as the event fires. A fixed-interval heartbeat is polling, and when the event time is random its average detection delay is half the interval. The playbook keeps a long heartbeat behind the watcher as a fallback, which bounds the delay if an event is missed.",
    code: "async function pollUntil(check, intervalMs) {\n  while (!(await check())) {\n    await new Promise((r) => setTimeout(r, intervalMs));\n  }\n}\n\nfunction waitForEvent(emitter, name) {\n  return new Promise((r) => emitter.once(name, r));\n}",
    quiz: {
      q: "CI finishes at a uniformly random moment and the loop polls every 20 minutes. What is the expected delay between CI finishing and the loop noticing?",
      options: ["0 minutes", "20 minutes", "40 minutes", "10 minutes"],
      answer: 3,
    },
  },
  "autopilot-full": {
    concept: "Timeout-based failure detection",
    explain: "A failure detector cannot tell a crashed process from a slow one, so it uses timeouts. The hourly audit judges each agent by its side effects and calls it stuck when nothing new appears past its stuck-after runtime. Checking once per tick means detection can lag the timeout by up to one interval. Replacement is cheap because each owner pushes every finished unit and keeps a decision trail.",
    code: "function isStuck(agent, now) {\n  if (agent.waitingOnHuman) return false;\n  return now - agent.lastSideEffectAt > agent.stuckAfterMs;\n}\nfunction auditTick(agents, now) {\n  for (const agent of agents) {\n    if (isStuck(agent, now)) replace(agent);\n  }\n}",
    quiz: {
      q: "Audit ticks run at minutes 60, 120 and 180. An owner pushed its last unit at minute 0 and then hung. Its stuck-after runtime is 90 minutes. At which tick is it first judged stuck?",
      options: ["Minute 60", "Minute 90", "Minute 120", "Minute 180"],
      answer: 2,
    },
  },
  "autopilot-stack": {
    concept: "Content-addressed cache invalidation",
    explain: "A verdict is a cached result, and the playbook keys it by git patch-id, a hash of the diff itself. A commit SHA also hashes its parent, so a restack gives every PR above the moved one a new SHA even when its patch is identical. Keying by content means only PRs whose diff actually changed lose their verdict.",
    code: "patch_key() {\n  git diff \"$1\" \"$2\" | git patch-id --stable | cut -d' ' -f1\n}\nold=$(patch_key \"$old_base\" \"$old_head\")\nnew=$(patch_key \"$new_base\" \"$new_head\")\nif [ \"$old\" = \"$new\" ]; then\n  echo \"same patch, verdict stands\"\nelse\n  echo \"patch changed, verify again\"\nfi",
    quiz: {
      q: "A new head on P1 restacks P2 and P3, and both get new SHAs. P2's patch-id is unchanged. P3's diff changed during conflict resolution. Which PRs keep their verdicts?",
      options: ["P2 only", "P2 and P3, since CI is green", "P3 only", "Neither, every new SHA needs a new verdict"],
      answer: 0,
    },
  },
  "eval": {
    concept: "Blinded, randomized comparison",
    explain: "An eval is a controlled experiment, and anything a candidate or judge can see that correlates with the variant is a confounder. The playbook strips meta words from what candidates see and shows the judge only sanitized labels, never model names. Shuffling which output gets which label goes one step further and removes position bias. Step 6 grades from transcripts, so the measurement is what candidates did, not what they claim.",
    code: "import random\n\ndef blind(outputs, seed):\n    items = list(outputs.items())\n    random.Random(seed).shuffle(items)\n    shown = {f\"run-{i}\": text for i, (_, text) in enumerate(items)}\n    key = {f\"run-{i}\": model for i, (model, _) in enumerate(items)}\n    return shown, key",
    quiz: {
      q: "The judge always reads the variant first, and it slightly favours whatever it reads first. The variant wins 55% of pairwise calls. What follows?",
      options: ["The variant is better, since 55% beats 50%", "The baseline is better", "The rubric must be rewritten", "Order is confounded with the variant, so shuffle and rerun"],
      answer: 3,
    },
  },
  "session-pickup": {
    concept: "Event sourcing and log replay",
    explain: "Event sourcing stores the history of changes and rebuilds current state by folding over it. Session pickup treats the prior trail the same way. It rebuilds done and pending work from the transcript and git log, then resumes at the first unfinished task instead of re-running finished ones. Step 5 still checks the rebuilt state against the real artifact, since a logged pass is a claim, not proof.",
    code: "const events = [\n  { type: \"planned\", tasks: [\"A\", \"B\", \"C\", \"D\"] },\n  { type: \"done\", task: \"A\" },\n  { type: \"done\", task: \"B\" },\n  { type: \"started\", task: \"C\" },\n];\nconst state = events.reduce((s, e) => {\n  if (e.type === \"planned\") return { pending: e.tasks };\n  if (e.type === \"done\") return { pending: s.pending.filter((t) => t !== e.task) };\n  return s;\n}, { pending: [] });\nconst resumeAt = state.pending[0];",
    quiz: {
      q: "A trail logs planned [migrate, api, ui, docs], then done migrate, started api, done ui, started docs. Which tasks are still pending?",
      options: ["docs only", "api and docs", "api, ui and docs", "All four"],
      answer: 1,
    },
  },
  "pause-safely": {
    concept: "Atomic transactions and rollback",
    explain: "A transaction is atomic. It commits in full or rolls back, so nobody sees a half-applied state. Step 1 applies this to work by finishing the current atomic step or backing out of it. The wip: commit in step 3 then makes that state durable, the D in ACID.",
    code: "async function pauseSafely(step, note) {\n  if (step.canFinishNow) await step.finish();\n  else await step.rollback();\n  await git(\"add\", \"-A\");\n  await git(\"commit\", \"-m\", `wip: ${step.name}`);\n  await writeFile(\"/tmp/resume.md\", note);\n}",
    quiz: {
      q: "A pause arrives while you are renaming a function, with 3 of its 5 call sites done. Which state is safe to commit as wip?",
      options: ["The 3 renamed sites as they are", "Only the 2 untouched sites", "All 5 renamed, or all 5 back on the old name", "Nothing, discard the working tree"],
      answer: 2,
    },
  },
  "worktree-cleanup": {
    concept: "Mark-and-sweep garbage collection",
    explain: "A tracing collector marks everything reachable from a root set and sweeps the rest. Worktree cleanup uses pinned and active chats as roots, and a worktree is live if a root chat touches it, including sibling trees it spawned through background subagents. The audit script's bucket is a heuristic, so the pinned set wins. Uncommitted edits pause the sweep, because that loss cannot be undone.",
    code: "function prunable(roots, touches, worktrees) {\n  const live = new Set();\n  const stack = [...roots];\n  while (stack.length) {\n    for (const next of touches[stack.pop()] ?? []) {\n      if (!live.has(next)) { live.add(next); stack.push(next); }\n    }\n  }\n  return worktrees.filter((w) => !live.has(w.path) && !w.uncommitted);\n}",
    quiz: {
      q: "Pinned chat P touches W1, and W1's arena run spawned W3. Active chat Q touches W2. W4 is clean, merged and touched by no chat. Which worktrees may be pruned?",
      options: ["W4 only", "W3 and W4", "W2, W3 and W4", "None of them"],
      answer: 0,
    },
  },
};
