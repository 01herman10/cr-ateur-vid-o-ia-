// Fait retranscrire des fichiers son par Whisper (outil Sous-titres IA du dépôt) : node ecoute.mjs f1.wav f2.wav …
// Le dépôt doit être servi sur http://127.0.0.1:8768. Affiche une ligne JSON par fichier.
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const b = await chromium.launch(); const p = await b.newPage();
await p.goto("http://127.0.0.1:8768/sous-titres.html");
for (const f of process.argv.slice(2)) {
  await p.setInputFiles("#fichier", f);
  const seg = await p.evaluate(async () => {
    const m = await import("./ia.js");
    const son = await m.audio16k(document.getElementById("fichier").files[0]);
    return await m.transcrire(son, "precis");
  });
  console.log(JSON.stringify({ fichier: f, texte: seg.map((s) => s.texte).join(" "), segments: seg }));
}
await b.close();
