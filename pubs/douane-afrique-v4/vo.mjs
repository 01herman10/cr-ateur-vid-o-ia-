// Voix off avec Piper (outil « Voix IA » du dépôt), une voix par phrase : node vo.mjs <dossier-sortie> [fichier-texte]
// Chaque ligne de vo/texte.json : [id, texte dit, texte affiché, clé de voix]. Les voix sont décrites dans VOIX ci-dessous.
// Le dépôt doit être servi sur http://127.0.0.1:8768 (python3 -m http.server 8768 depuis la racine du dépôt).
import { createRequire } from "node:module";
import fs from "node:fs";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
export const VOIX = {
  gilles: { modele: "fr_FR-gilles-low", reglages: {} },
  pierre: { modele: "fr_FR-upmc-medium", reglages: { orateur: 1 } },
  pierreVif: { modele: "fr_FR-upmc-medium", reglages: { orateur: 1, debit: 0.9, expressivite: 0.75 } },
};
const [out = "vo", fichier = "vo/texte.json"] = process.argv.slice(2);
const lignes = JSON.parse(fs.readFileSync(new URL("./" + fichier, import.meta.url)));
const b = await chromium.launch(); const p = await b.newPage();
p.on("pageerror", (e) => console.log("erreur page", e.message));
await p.goto("http://127.0.0.1:8768/voix.html");
for (const [id, texte, , cle] of lignes) {
  const v = VOIX[cle];
  const b64 = await p.evaluate(async ([t, modele, reglages]) => {
    globalThis.PIPER_REGLAGES = reglages;
    const m = await import("./ia.js");
    const blob = await m.parler(t, modele);
    const buf = new Uint8Array(await blob.arrayBuffer());
    let s = ""; for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode(...buf.subarray(i, i + 0x8000));
    return btoa(s);
  }, [texte, v.modele, v.reglages]);
  fs.writeFileSync(`${out}/${id}-${cle}.wav`, Buffer.from(b64, "base64"));
  console.log(id, cle, "ok");
}
await b.close();
