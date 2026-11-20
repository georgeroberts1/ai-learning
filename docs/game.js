// Pure game state. XP is awarded once per playbook for each challenge.

export const XP_FINISH = 50;
export const XP_QUIZ = 25;
export const XP_ORDER = 40;
export const XP_ADVANCED = 40;
export const XP_PER_LEVEL = 100;

export const MODES = ["kid", "cs"];

export const emptyState = () => ({ xp: 0, mode: "kid", finished: {}, quizzed: {}, ordered: {}, advanced: {} });

export const levelFor = (xp) => Math.floor(xp / XP_PER_LEVEL) + 1;

const AWARDS = {
  finish: ["finished", XP_FINISH],
  quiz: ["quizzed", XP_QUIZ],
  order: ["ordered", XP_ORDER],
  advanced: ["advanced", XP_ADVANCED],
};

export function reduce(state, event) {
  if (event.type === "mode" && MODES.includes(event.mode)) return { ...state, mode: event.mode };
  const award = AWARDS[event.type];
  if (!award) return state;
  const [bucket, xp] = award;
  const needsCorrect = event.type === "quiz" || event.type === "advanced";
  if ((needsCorrect && !event.correct) || state[bucket][event.id]) return state;
  return { ...state, xp: state.xp + xp, [bucket]: { ...state[bucket], [event.id]: true } };
}

// Deterministic Fisher-Yates over [0..n) driven by a mulberry32 PRNG. Never returns the identity order for n > 1.
export function shuffleOrder(n, seed) {
  let a = seed >>> 0;
  const rand = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const order = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  if (n > 1 && order.every((v, i) => v === i)) order.push(order.shift());
  return order;
}

// The puzzle is solved by picking steps in their real order. `next` is how many are already placed.
export const pick = (next, clicked) => ({ correct: clicked === next, next: clicked === next ? next + 1 : next });
