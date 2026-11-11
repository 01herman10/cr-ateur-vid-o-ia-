// Douane Afrique · pub v4 (1080×1920), style clair du vrai site. Construite sur la voix off (timing.js) :
// le bonhomme se pose la question → recherche sur Internet → la vitrine s'ouvre → pourquoi nous choisir → le calculateur
// → âge et papiers → vérification → 8 pays, bientôt toute l'Afrique → particuliers, entreprises, gratuit → appel à l'action.
(function () {
const TM = window.TIMING, DUR = TM.dur;
const $ = (id) => document.getElementById(id);
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, x) => a + (b - a) * x;
const outQ = (x) => 1 - Math.pow(1 - clamp(x), 3);
function stepR(tau, { w, z }) {
  if (tau <= 0) return 0;
  if (z >= 1) { const x = w * tau; return 1 - Math.exp(-x) * (1 + x); }
  const wd = w * Math.sqrt(1 - z * z);
  return 1 - Math.exp(-z * w * tau) * (Math.cos(wd * tau) + (z * w / wd) * Math.sin(wd * tau));
}
class Track {
  constructor(v0) { this.v0 = v0; this.cur = v0; this.ev = []; }
  to(t, v, sp) { if (v !== this.cur) { this.ev.push([t, v - this.cur, sp]); this.cur = v; } return this; }
  at(t) { let v = this.v0; for (const [ti, d, sp] of this.ev) v += d * stepR(t - ti, sp); return v; }
}
function vis(t, tin, tout, dOut = 0.14) {
  const e = stepR(t - tin, { w: 22, z: 1 }), x = tout == null ? 0 : clamp((t - tout) / dOut), xo = x * x;
  return { o: e * (1 - xo), b: (1 - e) * 10 + xo * 10, e };
}
function fade(el, v, extra = "") {
  el.style.opacity = v.o.toFixed(4); el.style.filter = v.b > 0.05 ? `blur(${v.b.toFixed(2)}px)` : "none";
  el.style.transform = `translateY(${((1 - v.e) * 20).toFixed(2)}px) ${extra}`;
}
const SP = { w: 9, z: 0.86 }, FAST = { w: 14, z: 0.8 }, POP = { w: 16, z: 0.62 }, SOFT = { w: 5, z: 1 }, ARM = { w: 10, z: 0.8 };
const LIGNE = Object.fromEntries(TM.lignes.map((l) => [l.id, l]));
function W(id, debut) { const m = LIGNE[id].mots.find((x) => x.m.startsWith(debut)); if (!m) throw new Error(id + " " + debut); return m; }
const S = TM.lignes.map((l) => l.scene).concat([DUR]);
const CUES = []; const cue = (t, type, p = 0) => CUES.push([+t.toFixed(4), type, p]);

// ---------- éléments placés dans le monde (x, y = centre ; s = échelle ; r = rotation) ----------
const IT = {};
function item(id, st) {
  const el = $(id), p = { el, w: el.offsetWidth || +el.getAttribute("width"), h: el.offsetHeight || +el.getAttribute("height"), win: [] };
  for (const k of ["x", "y", "s", "r"]) p[k] = new Track(st[k] ?? (k === "s" ? 1 : 0));
  p.go = (t, s, sp = SP) => { for (const k in s) p[k].to(t, s[k], sp); return p; };
  p.show = (tin, tout, dOut) => { p.win.push([tin, tout, dOut]); return p; };
  IT[id] = p; return p;
}
function draw(p, t, extra = "") {
  let o = 0, b = 10;
  for (const [a, c, d] of p.win) { const v = vis(t, a, c, d); if (v.o > o) { o = v.o; b = v.b; } }
  const el = p.el;
  el.style.opacity = o.toFixed(4); el.style.display = o < 0.003 ? "none" : "";
  el.style.filter = b > 0.05 ? `blur(${b.toFixed(2)}px)` : "none";
  el.style.transform = `translate(${(p.x.at(t) - p.w / 2).toFixed(2)}px,${(p.y.at(t) - p.h / 2).toFixed(2)}px) rotate(${p.r.at(t).toFixed(3)}deg) scale(${p.s.at(t).toFixed(4)}) ${extra}`;
}
function local(el, root) { let x = 0, y = 0; while (el && el !== root) { x += el.offsetLeft; y += el.offsetTop; el = el.offsetParent; } return [x, y]; }
// position dans le monde du centre d'un élément contenu dans un « item » (quand l'item est à l'échelle 1, sans rotation)
function worldOf(el, it, cx, cy) { const [lx, ly] = local(el, it.el); return [cx - it.w / 2 + lx + el.offsetWidth / 2, cy - it.h / 2 + ly + el.offsetHeight / 2]; }

// ---------- caméra ----------
const cam = { x: new Track(540), y: new Track(960), z: new Track(1) };

// ---------- bonhomme : pose (bras, avant-bras, tête) ----------
const B = { bg: new Track(8), ag: new Track(-6), bd: new Track(-8), ad: new Track(6), tete: new Track(0) };
function pose(t, p, sp = ARM) { for (const k in p) B[k].to(t, p[k], sp); }

// ---------- curseur ----------
const cur = { x: new Track(980), y: new Track(1700) };
const CLICKS = [], CURWIN = [];
function go(t, x, y, sp = { w: 9, z: 0.92 }) { cur.x.to(t, x, sp); cur.y.to(t, y, sp); }

// ---------- sous-titres ----------
const CHUNKS = [];
for (const l of TM.lignes) { let c = []; l.mots.forEach((m, i) => { c.push(m); if (/[,:.?!…]$/.test(m.m) || i === l.mots.length - 1) { CHUNKS.push(c); c = []; } }); }
for (let i = 0; i < CHUNKS.length - 1; i++) if (CHUNKS[i].length === 1 && CHUNKS[i + 1][0].a - CHUNKS[i][0].b < 0.8) { CHUNKS[i] = CHUNKS[i].concat(CHUNKS[i + 1]); CHUNKS.splice(i + 1, 1); }
CHUNKS.forEach((c, i) => { c.a = c[0].a - 0.12; const n = CHUNKS[i + 1]; c.z = n && n[0].a - c[c.length - 1].b < 0.9 ? n[0].a - 0.14 : c[c.length - 1].b + 0.45; });
const chunkEls = CHUNKS.map((c) => { const d = document.createElement("div"); Object.assign(d.style, { position: "absolute", left: "0", right: "0", top: "0" }); d.innerHTML = `<div style="display:inline-block;background:rgba(255,255,255,.92);border-radius:28px;padding:12px 26px;box-shadow:0 10px 30px rgba(21,35,42,.12)">${c.map((m) => `<span>${m.m.replace(/ /g, " ")}</span>`).join(" ")}</div>`; $("caps").appendChild(d); return d; });

// ---------- contenus construits ----------
const PB = [["La douane", '<path d="M8 50 H56 M14 50 V26 M26 50 V26 M38 50 V26 M50 50 V26 M6 24 L32 8 L58 24 Z" fill="none" stroke="#0D5A66" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"/>'],
  ["La TVA", '<text x="32" y="44" text-anchor="middle" font-family="Archivo" font-weight="900" font-size="34" fill="#0D5A66">%</text><circle cx="32" cy="32" r="26" fill="none" stroke="#0D5A66" stroke-width="5"/>'],
  ["L'âge de la voiture", '<rect x="8" y="12" width="48" height="44" rx="8" fill="none" stroke="#0D5A66" stroke-width="5"/><line x1="8" y1="26" x2="56" y2="26" stroke="#0D5A66" stroke-width="5"/><line x1="20" y1="6" x2="20" y2="16" stroke="#0D5A66" stroke-width="5" stroke-linecap="round"/><line x1="44" y1="6" x2="44" y2="16" stroke="#0D5A66" stroke-width="5" stroke-linecap="round"/>'],
  ["Les papiers", '<path d="M16 6 H38 L50 18 V58 H16 Z" fill="none" stroke="#0D5A66" stroke-width="5" stroke-linejoin="round"/><line x1="23" y1="32" x2="43" y2="32" stroke="#0D5A66" stroke-width="5" stroke-linecap="round"/><line x1="23" y1="44" x2="38" y2="44" stroke="#0D5A66" stroke-width="5" stroke-linecap="round"/>']];
PB.forEach(([titre, ic], i) => {
  $("pb" + (i + 1)).innerHTML = `<svg width="64" height="64" viewBox="0 0 64 64">${ic}</svg><div class="disp" style="font:800 44px var(--fd);margin-top:22px;line-height:1.05">${titre}</div>
    <div class="badge" style="position:absolute;right:28px;top:28px;width:70px;height:70px;border-radius:50%;display:flex;align-items:center;justify-content:center;font:900 44px var(--fd);color:#fff"></div>`;
});
const LINES = [["CIF", "Valeur en douane", "5 247 656"], ["DD", "Droit de douane · 20 %", "1 049 531"], ["RS", "Redevance statistique · 1 %", "52 477"], ["PCS", "Prélèvement UEMOA · 1 %", "52 477"], ["PC", "Prélèvement CEDEAO · 0,5 %", "26 238"], ["TVA", "TVA · 18 %", "1 157 108"]];
const lineEls = LINES.map(([c, l, a]) => { const d = document.createElement("div"); d.className = "ln"; d.innerHTML = `<span class="code">${c}</span><span class="l">${l}</span><span class="a">${a.replace(/ /g, " ")}</span>`; $("lines").appendChild(d); return d; });
const PAPS = ["Facture d'achat", "Connaissement", "Carte grise d'origine", "Pièce d'identité"];
const papEls = PAPS.map((p) => { const d = document.createElement("div"); d.className = "row"; d.style.cssText = "gap:26px;margin-top:26px;font:600 40px var(--fb)"; d.innerHTML = `<div class="cb"><svg width="40" height="40" viewBox="0 0 40 40" style="position:absolute;left:6px;top:6px"><path d="M8 21 L17 30 L33 11" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="44" stroke-dashoffset="44"/></svg></div>${p}`; $("paps").appendChild(d); return d; });
const UEMOA = ["CI", "SN", "BJ", "TG", "BF", "ML", "NE", "GW"];
const dotEls = [], dotIdx = [];
for (let r = 0; r < 6; r++) for (let c = 0; c < 9; c++) {
  const d = document.createElement("div"); d.className = "dot"; d.style.left = (c * 104) + "px"; d.style.top = (r * 104) + "px";
  d.style.display = "flex"; d.style.alignItems = "center"; d.style.justifyContent = "center"; d.style.font = "800 30px var(--fd)";
  $("dots").appendChild(d); dotEls.push(d);
}
// les 8 pays de l'UEMOA au centre-ouest de la grille, le reste se remplit ensuite
const UPOS = [20, 21, 29, 30, 11, 12, 38, 19];
UPOS.forEach((k, i) => { dotEls[k].textContent = UEMOA[i]; });
const TOTAL = 2337831, slots = [];
{ const s = TOTAL.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " "); let p = s.replace(/ /g, "").length - 1;
  for (const c of s) {
    if (c === " ") { const sp = document.createElement("div"); sp.style.width = ".24em"; $("odo").appendChild(sp); continue; }
    const sl = document.createElement("div"); sl.className = "slot"; sl.style.height = "1em";
    const st = document.createElement("div"); st.className = "strip"; st.innerHTML = "01234567890".split("").map((d) => `<span style="height:1em;line-height:1em">${d}</span>`).join("");
    sl.appendChild(st); $("odo").appendChild(sl); slots.push({ st, sl, p }); p--;
  } }

let T = {}, ripEls = [];
function build() {
  T = {
    combien: W("v1", "combien").a, att: W("v2", "Attends").a, cherch: W("v2", "chercher").a, net: W("v2", "Internet").b,
    bien: W("v3", "Bienvenue").a, dou: W("v3", "Douane").a, afr: W("v3", "Afrique").a, pq: W("v3", "Pourquoi").a,
    pb: [W("v4", "douane").a, W("v4", "TVA").a, W("v4", "l'âge").a, W("v4", "papiers").a], fini: W("v4", "fini").a,
    clic: W("v5", "clic").a, calcW: W("v5", "calculateur").a,
    c: [W("v6", "Côte").a, W("v6", "Sénégal").a, W("v6", "Bénin").a], benin: W("v6", "Bénin").b, entrez: W("v6", "Entrez").a, annee: W("v6", "l'année").a, prix: W("v6", "prix").a,
    voila: W("v6", "voilà").a, total: W("v6", "total").a, taxe: W("v6", "taxe").a,
    verif: W("v7", "vérifié").a, papiers: W("v7", "papiers").a, listes: W("v7", "listés").a,
    doute: W("v8", "doute").a, annonce: W("v8", "annonce").a, verifie: W("v8", "vérifie").a, vous: W("v8", "vous").a,
    huit: W("v9", "huit").a, bientot: W("v9", "bientôt").a, toute: W("v9", "toute").a,
    part: W("v10", "Particuliers").a, entr: W("v10", "entreprises").a, attend: W("v10", "attend").a, grat: W("v10", "gratuit").a, prof: W("v10", "profitez").a,
    lien: W("v11", "Lien").a, bio: W("v11", "bio").a, act: [W("v11", "Abonnez").a, W("v11", "likez").a, W("v11", "partagez").a],
  };
  // ----- 0-1 : le bonhomme -----
  const bon = item("bon", { x: 540, y: 1060, s: 1.2 }).go(-0.3, { s: 1.45, y: 1000 }, { w: 6, z: 0.9 })
    .go(S[1] - 0.15, { x: 230, y: 1130, s: 1.0 }, SP).go(S[2] - 0.35, { x: 120, y: 1250, s: 0.8 }, SP)
    .go(S[9] - 0.2, { x: 540, y: 1060, s: 1.3 }, { w: 7, z: 0.85 })
    .go(S[10] - 0.2, { x: 540, y: 360, s: 0.62 }, SP)
    .show(-0.4, S[2] - 0.2, 0.2).show(S[9] - 0.25, null);
  pose(0.3, { bd: 28, ad: 128, tete: 7 }); pose(T.combien, { bg: 14, ag: -12 });
  pose(T.att - 0.05, { bd: -150, ad: -10, tete: -4 }, { w: 14, z: 0.7 });               // « Attends ! » : bras levé
  pose(T.att + 0.45, { bg: -16, ag: -104, bd: 18, ad: 98, tete: 6 });                     // il prend son téléphone
  pose(S[9] - 0.2, { bg: 10, ag: -6, bd: -8, ad: 6, tete: 0 }); pose(T.attend - 0.1, { bd: -160, ad: -8, tete: -5 }, { w: 14, z: 0.7 }); // pouce levé
  pose(S[10] - 0.2, { bd: -150, ad: -20, tete: 0 });
  item("pense", { x: 560, y: 470, s: 0.6 }).go(0.55, { s: 1 }, POP).go(S[1] - 0.15, { x: 760, y: 320, s: 0.4 }, SP).show(0.55, S[1] - 0.05, 0.2);
  item("qm1", { x: 260, y: 700, s: 0.4, r: -14 }).go(T.combien - 0.1, { s: 1 }, POP).show(T.combien - 0.1, S[1] - 0.05, 0.15);
  item("qm2", { x: 830, y: 760, s: 0.4, r: 12 }).go(T.combien + 0.35, { s: 1 }, POP).show(T.combien + 0.35, S[1] - 0.05, 0.15);
  item("idee", { x: 380, y: 700, s: 0.3 }).go(T.att - 0.06, { s: 1 }, POP).go(T.att + 0.7, { s: 0.3 }, FAST).show(T.att - 0.06, T.att + 0.75, 0.15);
  cue(0.55, "pop", 0); cue(W("v1", "coûter").b + 0.03, "warn", 0); cue(W("v2", "Attends").b + 0.02, "settle");
  // ----- 1 : la recherche -----
  const ph = item("ph", { x: 1300, y: 900, s: 0.9, r: 8 }).go(T.att + 0.25, { x: 680, r: 0, s: 1 }, { w: 9, z: 0.85 }).show(T.att + 0.25, S[2] + 0.02, 0.12);
  cue(T.att + 0.3, "whoosh", 1);
  const Q = "frais de douane voiture Afrique";
  T.q0 = T.cherch; T.q1 = T.net + 0.25;
  for (let i = 0; i < Q.length; i += 3) cue(lerp(T.q0, T.q1, i / Q.length), "key");
  T.res = T.q1 + 0.15; T.tapR = S[2] - 0.45; cue(T.res, "soft"); cue(T.tapR, "click");
  // zoom à travers le téléphone : le site s'ouvre
  const [r1x, r1y] = worldOf($("r1"), ph, 680, 900);
  cam.x.to(T.tapR + 0.12, r1x, { w: 9, z: 1 }); cam.y.to(T.tapR + 0.12, r1y, { w: 9, z: 1 }); cam.z.to(T.tapR + 0.12, 2.6, { w: 9, z: 1 });
  cam.x.to(S[2] - 0.02, 540, { w: 40, z: 1 }); cam.y.to(S[2] - 0.02, 960, { w: 40, z: 1 }); cam.z.to(S[2] - 0.02, 1, { w: 40, z: 1 });
  // ----- 2 : la vitrine -----
  const vit = item("vit", { x: 540, y: 830, s: 1.06 }).go(S[2] - 0.05, { s: 1 }, { w: 7, z: 1 })
    .go(S[3] - 0.1, { s: 0.92, y: 860 }, SP).go(S[4] - 0.25, { s: 1, y: 830 }, SP)
    .show(S[2] - 0.08, S[3] + 0.05, 0.25).show(S[4] - 0.3, S[5] - 0.3, 0.25);
  cue(S[2] - 0.2, "morphbig");
  item("pourquoi", { x: 540, y: 1380, s: 0.6 }).go(T.pq - 0.08, { s: 1 }, POP).go(S[3] - 0.1, { y: 260, s: 0.8 }, SP).show(T.pq - 0.08, S[3] + 1.2, 0.2);
  cue(T.pq, "pop", 1);
  // ----- 3 : les problèmes, puis « fini » -----
  const PP = [[290, 600], [790, 600], [290, 940], [790, 940]];
  const PBW = [W("v4", "douane").b, W("v4", "TVA").b, W("v4", "voiture").b, W("v4", "papiers").b];   // les sons tombent après les mots
  PP.forEach(([x, y], i) => { item("pb" + (i + 1), { x, y: y + 60, s: 0.7 }).go(T.pb[i] - 0.1, { y, s: 1 }, POP).go(S[4] - 0.2, { y: y - 80, s: 0.8 }, SP).show(T.pb[i] - 0.1, S[4] - 0.1, 0.2); cue(PBW[i] + 0.03, "warn", i % 3); cue(T.fini + 0.08 * i + 0.25, "tick", i); });
  item("fini", { x: 540, y: 1250, s: 0.6 }).go(T.fini + 0.3, { s: 1 }, POP).show(T.fini + 0.3, S[4] - 0.1, 0.2);
  // ----- 4 : clic sur « Calculer mes frais » -----
  const [bx, by] = worldOf($("btnCalc"), vit, 540, 830);
  CURWIN.push([S[4] - 0.05, T.calcW + 0.45]);
  go(S[4] - 0.05, bx + 60, by + 20); CLICKS.push(T.calcW); cue(T.calcW, "click");
  cam.x.to(S[4] + 0.1, bx, SOFT); cam.y.to(S[4] + 0.1, by, SOFT); cam.z.to(S[4] + 0.1, 1.25, SOFT);
  cam.x.to(T.calcW + 0.25, 540, SP); cam.y.to(T.calcW + 0.25, 960, SP); cam.z.to(T.calcW + 0.25, 1, SP);
  // le bouton s'ouvre en calculateur
  const calc = item("calc", { x: bx, y: by, s: 0.25 }).go(T.calcW + 0.15, { x: 540, y: 820, s: 1 }, { w: 9, z: 0.82 })
    .show(T.calcW + 0.15, S[8] - 0.05, 0.25);
  cue(T.calcW + 0.2, "whoosh", 2);
  // ----- 5 : le formulaire -----
  T.c.forEach((t, i) => cue(t, "tick", i));
  const [c1x, c1y] = worldOf($("r1"), calc, 540, 820), [fyx, fyy] = worldOf($("fy"), calc, 540, 820), [fpx, fpy] = worldOf($("fp"), calc, 540, 820);
  T.pick = T.benin + 0.25;
  CURWIN.push([T.c[2] - 0.2, T.voila - 0.05]);
  go(T.c[2] - 0.2, c1x + 10, c1y + 10); CLICKS.push(T.pick); cue(T.pick, "click");
  go(T.pick + 0.08, fyx + 200, fyy + 20); CLICKS.push(T.annee - 0.08);
  go(T.annee + 0.2, fpx + 200, fpy + 20); CLICKS.push(T.prix - 0.08);
  for (let i = 0; i < 4; i++) cue(T.annee + i * 0.07, "key"); for (let i = 0; i < 5; i++) cue(T.prix + i * 0.06, "key");
  go(T.prix + 0.4, 960, 1500, { w: 6, z: 1 });
  // ----- bulletin -----
  cue(T.voila, "whoosh", 3); cue(T.total + 0.6, "settle");
  LINES.forEach((_, i) => cue(T.taxe + i * 0.11, "tick", i));
  // ----- 6 : âge et papiers -----
  cue(T.verif, "settle"); PAPS.forEach((_, i) => cue(T.papiers + i * 0.25, "tick", i));
  // ----- 7 : vérification -----
  const [vx, vy] = worldOf($("btnV"), calc, 540, 820);
  CURWIN.push([T.doute - 0.1, T.annonce + 0.55]);
  go(T.doute - 0.1, vx + 120, vy + 20); T.clicV = T.annonce + 0.25; CLICKS.push(T.clicV); cue(T.clicV, "click");
  cue(T.verifie, "msg", 1); cue(T.vous + 0.3, "soft");
  // ----- 8 : les pays -----
  item("pays", { x: 540, y: 860, s: 0.92 }).go(S[8] - 0.05, { s: 1 }, SOFT).show(S[8] - 0.05, S[9] - 0.1, 0.2);
  cue(S[8] - 0.3, "whoosh", 4); cue(W("v9", "l'Ouest").b + 0.05, "pop", 1); cue(W("v9", "l'Afrique").b + 0.05, "shimmer");
  // ----- 9 : particuliers, entreprises, gratuit -----
  item("bP", { x: 290, y: 380, s: 0.6 }).go(T.part - 0.08, { s: 1 }, POP).show(T.part - 0.08, S[10] - 0.1, 0.2);
  item("bE", { x: 790, y: 500, s: 0.6 }).go(T.entr - 0.08, { s: 1 }, POP).show(T.entr - 0.08, S[10] - 0.1, 0.2);
  item("grat", { x: 540, y: 660, s: 1.8, r: -8 }).go(T.grat - 0.05, { s: 1 }, { w: 18, z: 0.6 }).show(T.grat - 0.05, S[10] - 0.1, 0.2);
  item("vite", { x: 540, y: 1400, s: 0.6 }).go(T.prof - 0.08, { s: 1 }, POP).show(T.prof - 0.08, S[10] - 0.1, 0.2);
  cue(T.part + 0.5, "pop", 0); cue(T.entr + 0.6, "pop", 1); cue(W("v10", "gratuit").b + 0.05, "thump"); cue(W("v10", "change").b + 0.05, "pop", 2);
  // ----- 10 : appel à l'action -----
  item("fin", { x: 540, y: 690, s: 1.1 }).go(S[10] - 0.05, { s: 1 }, { w: 11, z: 0.85 }).show(S[10] - 0.05, null);
  item("lien", { x: 540, y: 900, s: 0.6 }).go(T.lien - 0.08, { s: 1 }, POP).show(T.lien - 0.08, null);
  item("url", { x: 540, y: 1000 }).show(T.bio - 0.05, null);
  [240, 540, 840].forEach((x, i) => { item("a" + (i + 1), { x, y: 1250, s: 0.6 }).go(T.act[i] - 0.08, { s: 1 }, POP).show(T.act[i] - 0.08, null); cue(T.act[i] + 0.32, "pop", i + 1); });
  cue(S[10] - 0.3, "whoosh", 0);
  // scènes : petits souffles aux changements
  [S[3], S[5], S[6], S[7]].forEach((t, i) => cue(t - 0.25, "whoosh", i + 1));   // juste avant la phrase, jamais dessus
  ripEls = CLICKS.map(() => { const d = document.createElement("div"); d.className = "ripple"; $("rip").appendChild(d); return d; });
}

function camAt(t) { return { x: cam.x.at(t), y: cam.y.at(t), z: cam.z.at(t) }; }
function toScreen(t, x, y) { const c = camAt(t); return [(x - c.x) * c.z + 540, (y - c.y) * c.z + 960]; }

function seek(t) {
  $("bg").style.background = `radial-gradient(800px 800px at ${(200 + 60 * Math.sin(t * 0.4)).toFixed(0)}px ${(300 + 40 * Math.cos(t * 0.3)).toFixed(0)}px, rgba(13,90,102,.12), rgba(13,90,102,0) 70%), radial-gradient(900px 900px at ${(900 + 50 * Math.cos(t * 0.35)).toFixed(0)}px 1650px, rgba(242,194,48,.20), rgba(242,194,48,0) 70%), #EDF1F0`;
  const c = camAt(t);
  $("world").style.transform = `translate(540px,960px) scale(${c.z.toFixed(4)}) translate(${(-c.x).toFixed(2)}px,${(-c.y).toFixed(2)}px)`;
  for (const id in IT) draw(IT[id], t, id === "bon" ? `translateY(${(t > S[9] ? -10 * Math.abs(Math.sin((t - S[9]) * 4)) * Math.exp(-(t - S[9]) / 2) : 0).toFixed(2)}px)` : "");

  // bonhomme
  $("brasG").setAttribute("transform", `rotate(${B.bg.at(t).toFixed(2)} 92 192)`);
  $("avG").setAttribute("transform", `rotate(${B.ag.at(t).toFixed(2)} 85 250)`);
  const wave = t > S[10] ? 18 * Math.sin((t - S[10]) * 7) : 0;
  $("brasD").setAttribute("transform", `rotate(${B.bd.at(t).toFixed(2)} 208 192)`);
  $("avD").setAttribute("transform", `rotate(${(B.ad.at(t) + wave).toFixed(2)} 215 250)`);
  $("tete").setAttribute("transform", `rotate(${(B.tete.at(t) + 1.5 * Math.sin(t * 1.3)).toFixed(2)} 150 150)`);
  $("tel").setAttribute("opacity", t > T.att + 0.4 && t < S[2] ? 1 : 0);
  $("pouce").setAttribute("opacity", t > T.attend - 0.05 && t < S[10] ? 1 : 0);
  const k = Math.min(TM.bouche.length - 1, Math.max(0, Math.round(t * 60))), bo = TM.bouche[k] || 0;
  const heureux = t > S[9] - 0.2;
  $("bouche").setAttribute("ry", (2.5 + 13 * bo).toFixed(2)); $("bouche").setAttribute("opacity", heureux && bo < 0.05 ? 0 : 1);
  $("sourire").setAttribute("opacity", heureux && bo < 0.05 ? 1 : 0);
  const cligne = (t % 2.9) < 0.12 ? 0.1 : 1;
  $("yeux").setAttribute("transform", `translate(0 ${(104 * (1 - cligne)).toFixed(2)}) scale(1 ${cligne})`);
  const sourc = t < S[1] ? -6 : 0;
  $("sourcilG").setAttribute("transform", `translate(0 ${sourc})`); $("sourcilD").setAttribute("transform", `translate(0 ${t < S[1] ? 0 : 0}) rotate(${t < S[1] ? -10 : 0} 175 84)`);

  // recherche
  const Q = "frais de douane voiture Afrique", n = Math.floor(clamp((t - T.q0) / (T.q1 - T.q0)) * Q.length + (t >= T.q0 ? 1 : 0));
  $("q").textContent = Q.slice(0, Math.min(Q.length, n)); $("q").style.color = n ? "#15232A" : "#9AA8AC";
  if (!n) $("q").textContent = "Rechercher…";
  $("qc").style.opacity = t < T.res && Math.floor(t * 2.6) % 2 === 0 ? 1 : 0;
  fade($("resultats"), vis(t, T.res, null));
  $("r1").style.borderColor = t > T.tapR - 0.3 ? "#0D5A66" : "#D2DBDA"; $("r1").style.background = t > T.tapR - 0.3 ? "rgba(13,90,102,.06)" : "#fff";
  const tv = t > T.tapR - 0.35 && t < T.tapR + 0.3 ? 1 : 0, [lx, ly] = local($("r1"), $("ph"));
  $("tap").style.opacity = (0.9 * tv).toFixed(2);
  $("tap").style.transform = `translate(${(lx + 300 - 55).toFixed(1)}px,${(ly + 90 - 55).toFixed(1)}px) scale(${(1 - 0.25 * Math.exp(-Math.pow((t - T.tapR) / 0.06, 2))).toFixed(3)})`;

  // vitrine : la balance se met à l'équilibre, le bouton s'illumine avant le clic
  const ang = -12 * (1 - stepR(t - T.afr, { w: 8, z: 0.55 }));
  $("beam").setAttribute("transform", `rotate(${ang.toFixed(2)} 0 -70)`);
  $("panG").setAttribute("transform", `rotate(${(-ang).toFixed(2)} -220 -70)`); $("panD").setAttribute("transform", `rotate(${(-ang).toFixed(2)} 220 -70)`);
  const hb = t > T.clic - 0.2 && t < T.calcW + 0.2 ? 1 : 0;
  $("btnCalc").style.boxShadow = hb ? "0 0 0 6px rgba(242,194,48,.45)" : "none";
  $("btnCalc").style.transform = `scale(${(1 - 0.06 * Math.exp(-Math.pow((t - T.calcW) / 0.06, 2))).toFixed(3)})`;
  // problèmes : « ? » rouge puis ✓ vert
  for (let i = 0; i < 4; i++) {
    const bdg = $("pb" + (i + 1)).querySelector(".badge"), ok = t >= T.fini + 0.08 * i + 0.25;
    bdg.textContent = ok ? "✓" : "?"; bdg.style.background = ok ? "#1E7448" : "#C2412D";
    bdg.style.transform = `scale(${(1 + 0.25 * Math.exp(-Math.pow((t - (T.fini + 0.08 * i + 0.25)) / 0.07, 2))).toFixed(3)})`;
  }
  // calculateur : groupes
  const gF = vis(t, T.calcW + 0.3, T.voila - 0.12, 0.12), gB = vis(t, T.voila - 0.02, S[6] - 0.12, 0.12), gC = vis(t, S[6], S[7] - 0.12, 0.12), gV = vis(t, S[7], null);
  [["gForm", gF], ["gBul", gB], ["gChk", gC], ["gVer", gV]].forEach(([id, v]) => { const el = $(id); el.style.opacity = v.o.toFixed(3); el.style.filter = v.b > 0.05 ? `blur(${v.b.toFixed(1)}px)` : "none"; el.style.transform = `translateX(${((1 - v.e) * 50).toFixed(1)}px)`; el.style.display = v.o < 0.003 ? "none" : ""; });
  T.c.forEach((tc, i) => {
    const on = t >= tc, picked = i === 0 && t >= T.pick, el = $("c" + (i + 1)), hl = on ? Math.exp(-(t - tc) / 0.6) : 0;
    el.style.borderColor = picked ? "#0D5A66" : `rgba(242,194,48,${(0.25 + 0.75 * hl).toFixed(3)})`;
    el.style.background = picked ? "rgba(13,90,102,.08)" : `rgba(242,194,48,${(0.25 * hl).toFixed(3)})`;
    el.style.opacity = t >= T.pick && i > 0 ? "0.5" : "1";
    $("r" + (i + 1)).style.background = picked ? "#0D5A66" : "#fff"; $("r" + (i + 1)).style.borderColor = picked ? "#0D5A66" : "#D2DBDA";
  });
  const typed = (t0, s, step) => s.slice(0, Math.max(0, Math.min(s.length, Math.floor((t - t0) / step) + 1)));
  $("ty").textContent = t >= T.annee ? typed(T.annee, "2022", 0.07) : ""; $("tp").textContent = t >= T.prix ? typed(T.prix, "7 500 €", 0.05) : "";
  $("cy").style.opacity = t >= T.annee - 0.1 && t < T.prix - 0.1 && Math.floor(t * 2.6) % 2 === 0 ? 1 : 0;
  $("cp").style.opacity = t >= T.prix - 0.1 && t < T.voila && Math.floor(t * 2.6) % 2 === 0 ? 1 : 0;
  $("fy").style.borderColor = t >= T.annee - 0.1 && t < T.prix - 0.1 ? "#0D5A66" : "#D2DBDA"; $("fp").style.borderColor = t >= T.prix - 0.1 && t < T.voila ? "#0D5A66" : "#D2DBDA";
  // bulletin
  lineEls.forEach((el, i) => {
    const v = vis(t, T.voila + 0.05 + i * 0.09, null); el.style.opacity = v.o.toFixed(3); el.style.transform = `translateX(${((1 - v.e) * 30).toFixed(1)}px)`;
    const h = Math.exp(-Math.pow((t - (T.taxe + i * 0.11 + 0.1)) / 0.14, 2)); el.style.background = `rgba(242,194,48,${(0.45 * h).toFixed(3)})`;
  });
  const vv = TOTAL * outQ((t - T.total) / 0.6);
  for (const { st, sl, p } of slots) { const pp = Math.pow(10, p), pos = Math.floor(vv / pp) % 10 + Math.max(0, (vv % pp) - (pp - 1)); st.style.transform = `translateY(${(-pos).toFixed(4)}em)`; sl.style.opacity = clamp(0.25 + 0.75 * vv / pp, 0.25, 1).toFixed(3); }
  fade($("cout"), vis(t, T.total + 0.5, null));
  // âge et papiers
  fade($("age"), vis(t, T.verif - 0.1, null), `scale(${(0.85 + 0.15 * stepR(t - T.verif, POP)).toFixed(3)})`);
  papEls.forEach((el, i) => { const tt = T.papiers + i * 0.25, k2 = stepR(t - tt, { w: 30, z: 1 }); const cb = el.querySelector(".cb"); cb.style.background = `rgba(13,90,102,${k2.toFixed(3)})`; cb.style.borderColor = k2 > 0.5 ? "#0D5A66" : "#D2DBDA"; el.querySelector("path").setAttribute("stroke-dashoffset", (44 * (1 - outQ((t - tt - 0.03) / 0.18))).toFixed(2)); el.style.opacity = vis(t, S[6] + 0.1 + i * 0.05, null).o.toFixed(3); });
  // vérification
  $("btnV").style.transform = `scale(${(1 - 0.05 * Math.exp(-Math.pow((t - T.clicV) / 0.06, 2))).toFixed(3)})`;
  fade($("wb"), vis(t, T.verifie - 0.06, null)); fade($("w48"), vis(t, T.vous - 0.05, null));
  // pays
  $("paysT1").style.opacity = (1 - clamp((t - T.bientot + 0.1) / 0.2)).toFixed(3); $("paysT2").style.opacity = clamp((t - T.bientot) / 0.2).toFixed(3);
  dotEls.forEach((d, i) => {
    const u = UPOS.indexOf(i);
    if (u >= 0) { const on = t >= T.huit + u * 0.07; d.style.background = on ? "#0D5A66" : "#fff"; d.style.color = on ? "#fff" : "transparent"; d.style.borderColor = on ? "#0D5A66" : "#D2DBDA"; d.style.transform = `scale(${(1 + 0.18 * Math.exp(-Math.pow((t - T.huit - u * 0.07) / 0.06, 2))).toFixed(3)})`; return; }
    const r = Math.floor(i / 9), col = i % 9, dist = Math.hypot(col - 2.5, r - 2.5), tt = T.toute + dist * 0.06;
    const on = t >= tt; d.style.background = on ? "#F2C230" : "#fff"; d.style.borderColor = on ? "#E0B020" : "#D2DBDA";
    d.style.transform = `scale(${(1 + 0.15 * Math.exp(-Math.pow((t - tt) / 0.06, 2))).toFixed(3)})`;
  });
  $("paysN").textContent = t < T.toute ? "Bénin · Burkina Faso · Côte d'Ivoire · Guinée-Bissau · Mali · Niger · Sénégal · Togo" : "54 pays";
  $("paysN").style.opacity = vis(t, t < T.toute ? T.huit + 0.3 : T.toute + 0.3, null).o.toFixed(3);
  // actions
  T.act.forEach((ta, i) => { const on = t >= ta, cc = $("a" + (i + 1)).querySelector(".c"); cc.style.borderColor = on ? (i === 1 ? "#C2412D" : "#0D5A66") : "#D2DBDA"; cc.style.background = on ? (i === 1 ? "#FBE8E6" : "#E3EFEF") : "#fff"; });
  $("heart").setAttribute("fill", t >= T.act[1] ? "#C2412D" : "none"); $("heart").setAttribute("stroke", t >= T.act[1] ? "#C2412D" : "#15232A");

  // curseur
  let on = 0; for (const [a, b] of CURWIN) on = Math.max(on, stepR(t - a, { w: 22, z: 0.8 }) * (1 - clamp((t - b) / 0.12)));
  const [sx, sy] = toScreen(t, cur.x.at(t), cur.y.at(t)), [sx2] = toScreen(t - 1 / 120, cur.x.at(t - 1 / 120), cur.y.at(t - 1 / 120));
  let press = 1; for (const tc of CLICKS) press -= 0.16 * Math.exp(-Math.pow((t - tc) / 0.045, 2));
  $("cur").style.opacity = clamp(on).toFixed(3);
  $("cur").style.transform = `translate(${sx.toFixed(1)}px,${sy.toFixed(1)}px) rotate(${clamp(-(sx - sx2) * 120 * 0.0045, -14, 14).toFixed(2)}deg) scale(${(press * (0.6 + 0.4 * clamp(on))).toFixed(3)})`;
  CLICKS.forEach((tc, i) => { const kk = (t - tc) / 0.4, el = ripEls[i]; if (kk < 0 || kk > 1) { el.style.opacity = 0; return; } const [rx, ry] = toScreen(tc, cur.x.at(tc), cur.y.at(tc)), d = 20 + 110 * outQ(kk); Object.assign(el.style, { left: rx + "px", top: ry + "px", width: d + "px", height: d + "px", opacity: (0.7 * (1 - kk)).toFixed(3) }); });

  // sous-titres
  CHUNKS.forEach((cc, i) => {
    const el = chunkEls[i], v = vis(t, cc.a, cc.z, 0.1);
    el.style.opacity = v.o.toFixed(3); el.style.display = v.o < 0.003 ? "none" : ""; el.style.filter = v.b > 0.05 ? `blur(${v.b.toFixed(2)}px)` : "none";
    el.style.transform = `translateY(calc(-50% + ${((1 - v.e) * 18).toFixed(2)}px))`;
    if (v.o < 0.003) return;
    Array.from(el.firstChild.children).forEach((sp, j) => { const m = cc[j], o2 = t >= m.a - 0.02, now = o2 && t < m.b + 0.04; sp.style.color = now ? "#0D5A66" : o2 ? "#15232A" : "rgba(21,35,42,.3)"; sp.style.transform = `scale(${(1 + 0.06 * (now ? Math.exp(-(t - m.a) / 0.12) : 0)).toFixed(4)})`; });
  });
}

function init() { build(); window.CUES = CUES.sort((a, b) => a[0] - b[0]); seek(0); window.READY = true; }
window.DUR = DUR; window.seek = seek;
document.fonts.ready.then(init);
})();
