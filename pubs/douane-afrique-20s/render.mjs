// Rendu : 4 sous-images par image (flou de mouvement), 60 i/s, par tranches d'une seconde.
// node render.mjs <dossier-travail> [début_s] [fin_s] [workers]
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const [work, s0 = "0", s1 = "20", nw = "3"] = process.argv.slice(2);
const FPS = 60, SUB = 4, W = +nw;
const URL = "http://127.0.0.1:8781/index.html";
fs.mkdirSync(work, { recursive: true });
const subT = (i) => Math.floor(i / SUB) / FPS + ((i % SUB) - 1.5) / (FPS * SUB);

let browser = await chromium.launch();
async function newPage() {
  const p = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  await p.goto(URL); await p.waitForFunction(() => window.READY === true, null, { timeout: 30000 });
  return p;
}
async function shoot(pageRef, i, file) {
  for (let essai = 0; essai < 4; essai++) {
    try {
      if (!browser.isConnected()) browser = await chromium.launch();
      if (!pageRef.p || pageRef.p.isClosed()) pageRef.p = await newPage();
      await pageRef.p.evaluate((x) => window.seek(Math.max(0, x)), subT(i));
      await pageRef.p.screenshot({ path: file });
      return;
    } catch (e) { pageRef.p = null; }
  }
  throw new Error("échec sous-image " + i);
}

const pages = []; for (let k = 0; k < W; k++) pages.push({ p: await newPage() });
const segs = [];
for (let sec = +s0; sec < +s1; sec++) {
  const dir = path.join(work, "c" + String(sec).padStart(2, "0"));
  const seg = path.join(work, "seg" + String(sec).padStart(2, "0") + ".mp4");
  segs.push(seg);
  if (fs.existsSync(seg)) continue;
  fs.mkdirSync(dir, { recursive: true });
  const i0 = sec * FPS * SUB, n = FPS * SUB;
  const t0 = Date.now();
  await Promise.all(pages.map(async (pr, k) => {
    for (let j = k; j < n; j += W) await shoot(pr, i0 + j, path.join(dir, "s" + String(j).padStart(5, "0") + ".png"));
  }));
  execFileSync("ffmpeg", ["-v", "error", "-y", "-framerate", String(FPS * SUB), "-i", path.join(dir, "s%05d.png"),
    "-vf", "tmix=frames=4:weights='1 1 1 1',select='eq(mod(n\\,4)\\,3)',setpts=N/(60*TB),scale=out_color_matrix=bt709:out_range=tv,format=yuv420p",
    "-r", "60", "-c:v", "libx264", "-preset", "slow", "-crf", "15", "-tune", "film",
    "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709", seg]);
  for (const f of fs.readdirSync(dir)) if (/^s\d{5}\.png$/.test(f)) fs.unlinkSync(path.join(dir, f));
  fs.rmdirSync(dir);
  console.log(`seconde ${sec} : ${((Date.now() - t0) / 1000).toFixed(1)} s`);
}
fs.writeFileSync(path.join(work, "segs.txt"), segs.map((s) => `file '${path.resolve(s)}'`).join("\n"));
await browser.close().catch(() => {});
process.exit(0);
