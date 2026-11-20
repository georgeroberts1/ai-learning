// Turns a tile's pixel corners on the photo into the shapes the page draws.
const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;

export const geometry = (corners, { width, height }) => {
  const pctX = (x) => (x / width) * 100;
  const pctY = (y) => (y / height) * 100;
  return {
    points: corners.map(([x, y]) => `${x},${y}`).join(" "),
    clip: `polygon(${corners.map(([x, y]) => `${pctX(x)}% ${pctY(y)}%`).join(", ")})`,
    cx: pctX(mean(corners.map(([x]) => x))),
    cy: pctY(mean(corners.map(([, y]) => y))),
  };
};
