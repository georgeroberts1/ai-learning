// The wall photo is 1400x1050 here, whatever its file size. Each link is the four corners of
// one tile on the photo, clockwise from top left, measured in those pixels.
// Add a link by adding an entry. `href` is a folder with its own index.html, or an https URL.
// `side: "left"` puts the label to the left of the tile when the right would run off the photo.
export const WALL = { width: 1400, height: 1050 };

// The glass of the mirror, in the same pixels. The page title is written on it.
export const MIRROR = [[1015, 90], [1215, 90], [1160, 420], [978, 392]];

export const TILES = [
  {
    emoji: "🥔",
    title: "Poteto Mode",
    blurb: "The Playbook Quest, a game that explains each playbook.",
    href: "poteto-quest/",
    corners: [[356, 335], [434, 319], [439, 366], [363, 383]],
  },
  {
    emoji: "⭐",
    title: "Brushing Stars",
    blurb: "A mobile-first tooth brushing tracker for young children.",
    description:
      "A mobile-first tooth brushing tracker for young children. Parents open it on their phone at the bathroom sink — the kid watches their favourite brushing video, then taps to earn a gold star for morning and evening brushes throughout the week.",
    href: "https://brushing-stars.vercel.app/",
    corners: [[1172, 527], [1248, 547], [1239, 577], [1158, 565]],
    side: "left",
  },
];
