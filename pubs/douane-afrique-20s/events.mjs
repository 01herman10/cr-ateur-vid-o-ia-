// Exporte les repères sonores du film (window.CUES) vers cues.json : une seule source de vérité.
import { createRequire } from "node:module";
import fs from "node:fs";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
await p.goto("http://127.0.0.1:8781/index.html"); await p.waitForFunction(() => window.READY === true);
const cues = await p.evaluate(() => window.CUES);
fs.writeFileSync(new URL("./cues.json", import.meta.url), JSON.stringify(cues, null, 0));
console.log(cues.length, "repères");
await b.close();
