// Runs Lighthouse (mobile profile: simulated Slow 4G, 4x CPU slowdown) several times against a
// running server and prints the median and range of each metric, plus the LCP element and the
// network waterfall from the first run.
//   pnpm build && pnpm preview        (in another terminal)
//   pnpm audit:page [url] [runs] [out-dir]
// Set THROTTLING=devtools to throttle the real page (decode included) instead of simulating it.
import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync } from "node:fs";

const [url = "http://localhost:4173/", runs = "5", out = "audit"] = process.argv.slice(2);
const THROTTLING = process.env.THROTTLING ?? "simulate";
const CHROME = process.env.CHROME_PATH ?? "C:/Program Files/Google/Chrome/Application/chrome.exe";
mkdirSync(out, { recursive: true });

const METRICS = {
  "first-contentful-paint": "FCP ms",
  "largest-contentful-paint": "LCP ms",
  "speed-index": "Speed Index ms",
  "total-blocking-time": "TBT ms",
  "cumulative-layout-shift": "CLS",
  "total-byte-weight": "Transfer KB",
};

const results = [];
for (let i = 0; i < Number(runs); i++) {
  const file = `${out}/run-${i + 1}.json`;
  const r = spawnSync(
    "npx",
    ["-y", "lighthouse@12", url, "--quiet", "--output=json", `--output-path=${file}`, "--only-categories=performance", `--throttling-method=${THROTTLING}`,
      `--chrome-path=${CHROME}`, '--chrome-flags="--headless=new --no-sandbox"'],
    { shell: true, stdio: "inherit" },
  );
  if (r.status !== 0) throw new Error(`lighthouse failed on run ${i + 1}`);
  results.push(JSON.parse(readFileSync(file, "utf8")));
}

const median = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];
const scale = (id, v) => (id === "total-byte-weight" ? v / 1024 : v);
console.log(`\n${url}  ${runs} runs\n`);
for (const [id, label] of Object.entries(METRICS)) {
  const xs = results.map((r) => scale(id, r.audits[id].numericValue));
  const fmt = (v) => (id === "cumulative-layout-shift" ? v.toFixed(3) : Math.round(v));
  console.log(`${label.padEnd(15)} median ${String(fmt(median(xs))).padStart(6)}   range ${fmt(Math.min(...xs))} to ${fmt(Math.max(...xs))}`);
}

const first = results[0];
const lcp = first.audits["largest-contentful-paint-element"]?.details?.items?.[0]?.items?.[0];
console.log(`\nLCP element: ${lcp?.node?.snippet ?? "unknown"}`);
console.log(`Errors in console: ${first.audits["errors-in-console"]?.details?.items?.length ?? 0}`);
console.log("\nNetwork, run 1 (simulated times):");
for (const n of first.audits["network-requests"].details.items) {
  const name = n.url.replace(/^https?:\/\/[^/]+/, "").slice(0, 60) || n.url;
  console.log(`${String(Math.round(n.networkRequestTime)).padStart(6)} ms  ${String(Math.round(n.transferSize / 1024)).padStart(5)} KB  ${name}`);
}
