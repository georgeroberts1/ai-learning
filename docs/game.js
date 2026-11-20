// Pure game state. XP is awarded once per playbook for finishing and once for a correct quiz.

export const XP_FINISH = 50;
export const XP_QUIZ = 25;
export const XP_PER_LEVEL = 100;

export const emptyState = () => ({ xp: 0, finished: {}, quizzed: {} });

export const levelFor = (xp) => Math.floor(xp / XP_PER_LEVEL) + 1;

export function reduce(state, event) {
  if (event.type === "finish" && !state.finished[event.id]) {
    return { ...state, xp: state.xp + XP_FINISH, finished: { ...state.finished, [event.id]: true } };
  }
  if (event.type === "quiz" && event.correct && !state.quizzed[event.id]) {
    return { ...state, xp: state.xp + XP_QUIZ, quizzed: { ...state.quizzed, [event.id]: true } };
  }
  return state;
}
