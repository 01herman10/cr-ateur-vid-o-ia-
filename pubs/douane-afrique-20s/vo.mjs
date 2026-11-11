// Voix off avec Piper (outil « Voix IA » du dépôt) : node vo.mjs <voix> <dossier-sortie>
// Le dépôt doit être servi sur http://127.0.0.1:8768 (python3 -m http.server 8768 depuis la racine du dépôt).
import { createRequire } from "node:module";
import fs from "node:fs";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const [voix = "fr_FR-siwis-medium", out = "vo"] = process.argv.slice(2);
const lignes = JSON.parse(fs.readFileSync(new URL("./vo/texte.json", import.meta.url)));
const b = await chromium.launch(); const p = await b.newPage();
p.on("pageerror", (e) => console.log("erreur page", e.message));
await p.goto("http://127.0.0.1:8768/voix.html");
for (const [id, , , texte] of lignes) {
  const b64 = await p.evaluate(async ([t, v]) => {
    const m = await import("./ia.js");
    const blob = await m.parler(t, v);
    const buf = new Uint8Array(await blob.arrayBuffer());
    let s = ""; for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode(...buf.subarray(i, i + 0x8000));
    return btoa(s);
  }, [texte, voix]);
  fs.writeFileSync(`${out}/${id}-${voix}.wav`, Buffer.from(b64, "base64"));
  console.log(id, "ok");
}
await b.close();
