// Captures d'images à des temps donnés : node snap.mjs <dossier> t1 t2 …
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const [dir, ...ts] = process.argv.slice(2);
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
const errs = []; p.on("pageerror", (e) => errs.push(e.message)); p.on("console", (m) => m.type() === "error" && errs.push(m.text()));
await p.goto("http://127.0.0.1:8784/index.html");
await p.waitForFunction(() => window.READY === true);
for (const t of ts) { await p.evaluate((x) => window.seek(x), +t); await p.screenshot({ path: `${dir}/t${(+t).toFixed(2).padStart(6, "0")}.png` }); }
if (errs.length) console.log("ERREURS", errs);
await b.close();
