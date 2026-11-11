// Douane Afrique · pub v3 (1080×1920) : le besoin → la solution → comment → pourquoi → vérification → appel à l'action.
// Construite sur la voix off : chaque événement est calé sur un mot (timing.js). Tout est calculé dans seek(t).
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
  return { o: e * (1 - xo), b: (1 - e) * 12 + xo * 12, e };
}
function fade(el, v, base = "", extra = "") {
  el.style.opacity = v.o.toFixed(4); el.style.filter = v.b > 0.05 ? `blur(${v.b.toFixed(2)}px)` : "none";
  el.style.transform = `${base} translateY(${((1 - v.e) * 22).toFixed(2)}px) ${extra}`;
}
const SP = { w: 9, z: 0.86 }, FAST = { w: 14, z: 0.78 }, SLOW = { w: 2.2, z: 1 }, SOFT = { w: 5, z: 1 }, POP = { w: 16, z: 0.62 };

const LIGNE = Object.fromEntries(TM.lignes.map((l) => [l.id, l]));
function W(id, debut) { const m = LIGNE[id].mots.find((x) => x.m.startsWith(debut)); if (!m) throw new Error(id + " " + debut); return m; }
const S = TM.lignes.map((l) => l.scene).concat([DUR]);
const CUES = []; const cue = (t, type, p = 0) => CUES.push([+t.toFixed(4), type, p]);

// ---------- panneaux ----------
const PAN = {};
function panel(id, st) {
  const el = $(id), p = { el, w: el.offsetWidth, h: el.offsetHeight, win: [] };
  for (const k of ["x", "y", "z", "rx", "ry", "rz", "s"]) p[k] = new Track(st[k] ?? (k === "s" ? 1 : 0));
  p.go = (t, s, sp = SP) => { for (const k in s) p[k].to(t, s[k], sp); return p; };
  p.show = (tin, tout, dOut) => { p.win.push([tin, tout, dOut]); return p; };
  PAN[id] = p; return p;
}
function drawPanel(p, t, extra = "") {
  let o = 0, b = 12;
  for (const [a, c, d] of p.win) { const v = vis(t, a, c, d); if (v.o > o) { o = v.o; b = v.b; } }
  const el = p.el;
  el.style.opacity = o.toFixed(4); el.style.display = o < 0.003 ? "none" : "";
  el.style.filter = b > 0.05 ? `blur(${b.toFixed(2)}px)` : "none";
  el.style.transform = `translate3d(${(p.x.at(t) - p.w / 2).toFixed(2)}px,${(p.y.at(t) - p.h / 2).toFixed(2)}px,${p.z.at(t).toFixed(2)}px) rotateX(${p.rx.at(t).toFixed(3)}deg) rotateY(${p.ry.at(t).toFixed(3)}deg) rotateZ(${p.rz.at(t).toFixed(3)}deg) scale(${p.s.at(t).toFixed(4)}) ${extra}`;
}
function local(el, root) { let x = 0, y = 0; while (el && el !== root) { x += el.offsetLeft; y += el.offsetTop; el = el.offsetParent; } return [x, y]; }

// ---------- soleil, fond, sol ----------
const orb = { x: new Track(540), y: new Track(1250), s: new Track(0.9), red: new Track(0.65), glow: new Track(0.45) };
const floorT = new Track(1);
const cam = { rx: new Track(4), ry: new Track(0), z: new Track(-120) };
cam.z.to(0, 0, { w: 1.6, z: 1 });
function drawFloor(t) {
  const H = 1180, f = floorT.at(t), sv = $("floor");
  sv.style.opacity = f.toFixed(3); if (f < 0.01) return;
  let d = ""; for (let i = -12; i <= 12; i++) d += `M540 ${H} L${540 + i * 260} 1920 `;
  const ph = (t * 0.35) % 1;
  for (let k = 0; k < 12; k++) { const u = (k + ph) / 12, y = H + (1920 - H) * u * u; d += `M0 ${y.toFixed(1)} L1080 ${y.toFixed(1)} `; }
  sv.innerHTML = `<rect x="0" y="${H}" width="1080" height="${1920 - H}" fill="#05080A"/><defs><linearGradient id="fg" x1="0" y1="${H}" x2="0" y2="1920" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#FFB64A" stop-opacity="0"/><stop offset=".15" stop-color="#FFB64A" stop-opacity=".22"/><stop offset="1" stop-color="#FFFFFF" stop-opacity=".05"/></linearGradient></defs><path d="${d}" stroke="url(#fg)" stroke-width="1.6" fill="none"/><rect x="0" y="${H - 1}" width="1080" height="2" fill="#FFC56A" opacity=".55"/>`;
}

// ---------- sous-titres karaoké ----------
const CHUNKS = [];
for (const l of TM.lignes) { let cur = []; l.mots.forEach((m, i) => { cur.push(m); if (/[,:.?!…]$/.test(m.m) || i === l.mots.length - 1) { CHUNKS.push(cur); cur = []; } }); }
// les morceaux très courts (« Tout ça, ») sont fusionnés avec le suivant pour rester lisibles
for (let i = 0; i < CHUNKS.length - 1; i++) if (CHUNKS[i].length === 1 && CHUNKS[i + 1][0].a - CHUNKS[i][0].b < 0.8) { CHUNKS[i] = CHUNKS[i].concat(CHUNKS[i + 1]); CHUNKS.splice(i + 1, 1); }
CHUNKS.forEach((c, i) => { c.a = c[0].a - 0.12; const nx = CHUNKS[i + 1]; c.z = nx && nx[0].a - c[c.length - 1].b < 0.9 ? nx[0].a - 0.14 : c[c.length - 1].b + 0.45; });
const chunkEls = CHUNKS.map((c) => {
  const d = document.createElement("div"); Object.assign(d.style, { position: "absolute", left: "0", right: "0", top: "0" });
  d.innerHTML = c.map((m) => `<span>${m.m.replace(/ /g, " ")}</span>`).join(" "); $("caps").appendChild(d); return d;
});

// ---------- compteur ----------
const TOTAL = 7585487, slots = [];
{ const s = TOTAL.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " "); let p = s.replace(/ /g, "").length - 1;
  for (const c of s) {
    if (c === " ") { const sp = document.createElement("div"); sp.style.width = ".24em"; $("odo").appendChild(sp); continue; }
    const sl = document.createElement("div"); sl.className = "slot"; sl.style.height = "1em";
    const st = document.createElement("div"); st.className = "strip"; st.innerHTML = "01234567890".split("").map((d) => `<span style="height:1em;line-height:1em">${d}</span>`).join("");
    sl.appendChild(st); $("odo").appendChild(sl); slots.push({ st, sl, p }); p--;
  } }

let T = {};
function build() {
  T = {
    route0: W("v1", "importer").a, route1: W("v1", "d'Europe").b + 0.3, combien: W("v1", "combien").a,
    q: [W("v1", "vraiment").a, W("v1", "vous").a, W("v1", "coûter").a],
    pas: W("v2", "Pas").a, word: W("v2", "Douane").a, sol: W("v2", "solution").a,
    c: [W("v3", "Côte").a, W("v3", "Sénégal").a, W("v3", "Bénin").a], pick: W("v3", "Bénin").b + 0.12,
    entrez: W("v3", "Entrez").a, annee: W("v3", "l'année").a, prix: W("v3", "prix").a, voila: W("v3", "Et").a, total: W("v3", "total").b, taxes: W("v3", "taxes").a,
    t: [W("v4", "Chaque").a, W("v4", "l'âge").a, W("v4", "les").a], pour: W("v4", "Pour").a, part: W("v4", "particuliers").a, ent: W("v4", "entreprises").a,
    doute: W("v5", "doute").a, verif: W("v5", "vérifie").a, vous: W("v5", "vous").a,
    tout: W("v6", "Tout").a, appli: W("v6", "appli").a, dA: W("v6", "Douane").a, clic: W("v6", "Cliquez").a, bio: W("v6", "bio").a,
    act: [W("v6", "Abonnez").a, W("v6", "likez").a, W("v6", "partagez").a],
  };
  // 1. le besoin
  panel("pRoute", { x: 0, y: -230, z: -1100, rx: 16, ry: -24, s: 0.9 }).go(-0.3, { z: 0, rx: 6, ry: -8, s: 1 }, { w: 7, z: 0.9 }).go(0.9, { ry: -3 }, SLOW)
    .go(S[1] - 0.15, { z: -1700, y: -400, s: 0.7 }, SP).show(-0.4, S[1] - 0.05, 0.2);
  cue(0.05, "whoosh", 0); cue(T.route0, "whoosh", 1);
  panel("pTag", { x: 0, y: 200, z: -500, s: 0.7, rz: -6 }).go(T.combien - 0.1, { z: 80, s: 1, rz: -2 }, POP).go(S[1] - 0.15, { z: -1500, s: 0.5 }, SP).show(T.combien - 0.1, S[1] - 0.05, 0.2);
  cue(T.combien, "glitch");
  const QP = [{ x: -330, y: 400, z: 160, rz: -4 }, { x: 0, y: 430, z: 200, rz: 3 }, { x: 330, y: 395, z: 180, rz: -3 }];
  ["q1", "q2", "q3"].forEach((id, i) => {
    panel(id, { ...QP[i], z: -900, s: 0.6 }).go(T.q[i] - 0.08, { z: QP[i].z, s: 1 }, POP).go(S[1] - 0.15, { x: 0, y: 260, z: -400, s: 0.3 }, { w: 12, z: 1 }).show(T.q[i] - 0.08, S[1] - 0.04, 0.16);
    cue(T.q[i], "warn", i);
  });
  // 2. la solution (temps fort)
  panel("pSol", { x: 0, y: 260, z: -300, s: 0.9 }).go(S[1], { z: 0, s: 1 }, { w: 7, z: 0.9 }).go(S[2] - 0.15, { z: -900, y: -300, s: 0.6 }, SP).show(S[1], S[2] - 0.05, 0.2);
  cue(W("v2", "panique").b + 0.05, "settle"); cue(W("v2", "Afrique").b + 0.05, "shimmer"); cue(T.sol, "soft");   // les sons tombent entre les mots, jamais dessus
  // 3. le téléphone
  panel("pPhone", { x: 0, y: 340, z: -900, rx: 22, ry: 10, s: 0.85 }).go(S[2] - 0.12, { y: -10, z: 0, rx: 4, ry: -6, s: 0.98 }, { w: 8, z: 0.86 }).go(S[2] + 0.9, { ry: -2 }, SLOW)
    .go(T.voila + 0.2, { s: 1.0, ry: 0, rx: 2 }, SOFT)
    .go(S[3] - 0.15, { x: -760, y: 100, z: -700, ry: 32 }, SP).show(S[2] - 0.12, S[3] - 0.03, 0.2);
  cue(S[2], "whoosh", 2); T.c.forEach((t, i) => cue(t, "tick", i)); cue(T.pick, "click");
  ["0", "1", "2", "3"].forEach((_, i) => cue(T.annee + i * 0.07, "key"));
  for (let i = 0; i < 5; i++) cue(T.prix + i * 0.06, "key");
  cue(T.voila + 0.3, "whoosh", 3); cue(T.total + 0.3, "settle");
  // 4. pourquoi
  const TP = [-360, -120, 120];
  ["t1", "t2", "t3"].forEach((id, i) => {
    panel(id, { x: 900, y: TP[i], z: -300, ry: -30 }).go(T.t[i] - 0.14, { x: 0, z: 0, ry: -6, rx: 4 }, { w: 10, z: 0.82 }).go(T.t[i] + 0.8, { ry: -2 }, SLOW)
      .go(T.pour - 0.15, { z: -1400, y: TP[i] - 500, s: 0.6 }, SP)
      .go(T.tout - 0.05, { x: [-320, 0, 320][i], y: -560, z: -200, s: 0.42, rx: 0, ry: 0 }, { w: 9, z: 1 })
      .go(T.appli - 0.35, { x: 0, y: -340, z: -100, s: 0.06 }, { w: 10, z: 1 })
      .show(T.t[i] - 0.14, T.pour - 0.05, 0.2).show(T.tout - 0.05, T.appli - 0.15, 0.15);
    cue(T.t[i], "layer", i);
  });
  panel("wP", { x: -230, y: 80, z: -600, s: 0.8, ry: 20 }).go(T.part - 0.1, { z: 0, s: 1, ry: 6 }, POP).go(S[4] - 0.15, { z: -1200, y: -300 }, SP).show(T.part - 0.1, S[4] - 0.03, 0.2);
  panel("wE", { x: 230, y: 80, z: -600, s: 0.8, ry: -20 }).go(T.ent - 0.1, { z: 0, s: 1, ry: -6 }, POP).go(S[4] - 0.15, { z: -1200, y: -300 }, SP).show(T.ent - 0.1, S[4] - 0.03, 0.2);
  cue(T.part, "pop", 0); cue(T.ent, "pop", 1);
  // 5. la vérification
  panel("pW", { x: 760, y: 40, z: -600, ry: -34 }).go(S[4] - 0.1, { x: 0, z: 0, ry: -6, rx: 4 }, { w: 9, z: 0.85 }).go(S[4] + 0.8, { ry: -2 }, SLOW)
    .go(T.tout - 0.1, { x: 0, y: -340, z: -300, s: 0.06, ry: 0 }, { w: 9, z: 1 }).show(S[4] - 0.1, T.tout + 0.35, 0.25);
  cue(S[4], "whoosh", 4); cue(T.doute, "msg", 0); cue(T.verif, "msg", 1); cue(T.vous, "soft");
  // 6. l'appel à l'action
  panel("pEnd", { x: 0, y: -20, z: -300, s: 1.1 }).go(T.dA - 0.08, { z: 0, s: 1 }, { w: 11, z: 0.85 }).show(T.dA - 0.08, null);
  panel("pLink", { x: 0, y: 190, z: -300, s: 0.7 }).go(T.clic - 0.08, { z: 0, s: 1 }, POP).show(T.clic - 0.08, null);
  panel("pUrl", { x: 0, y: 275, z: -100 }).go(T.bio - 0.1, { z: 0 }, FAST).show(T.bio - 0.1, null);
  [-290, 0, 290].forEach((x, i) => { panel("a" + (i + 1), { x, y: 425, z: -400, s: 0.6 }).go(T.act[i] - 0.08, { z: 0, s: 1 }, POP).show(T.act[i] - 0.08, null); cue(T.act[i] + 0.32, "pop", i + 1); });
  cue(T.tout, "whoosh", 0); cue(W("v6", "appli").b + 0.05, "settle"); cue(W("v6", "Afrique").b + 0.05, "shimmer"); cue(T.clic - 0.12, "click");
  // soleil : nuit au début, lever au temps fort, puis il accompagne chaque scène
  const O = (t, x, y, s, extra = {}) => { orb.x.to(t, x, { w: 3.5, z: 1 }); orb.y.to(t, y, { w: 3.2, z: 1 }); orb.s.to(t, s, { w: 3.5, z: 1 }); for (const k in extra) orb[k].to(t, extra[k], { w: 4, z: 1 }); };
  O(S[1] - 0.1, 540, 540, 1.25, { red: 0, glow: 1 });
  O(S[2] - 0.2, 860, 300, 0.7); O(S[3] - 0.2, 200, 260, 0.65); O(S[4] - 0.2, 860, 330, 0.7); O(S[5] - 0.2, 540, 560, 1.15);
  orb.s.to(T.appli - 0.05, 1.4, { w: 12, z: 0.6 });   // le soleil « avale » tout : un léger gonflement
  floorT.to(S[2], 0.25, SOFT);
  cam.ry.to(S[2], -3, SOFT).to(S[3], 2, SOFT).to(S[5], 0, SOFT);
}

function seek(t) {
  const ox = orb.x.at(t), oy = orb.y.at(t), os = orb.s.at(t), red = clamp(orb.red.at(t)), gl = orb.glow.at(t);
  const c1 = [255, lerp(170, 90, red), 60].map(Math.round).join(",");
  $("bgglow").style.background = `radial-gradient(${(900 * os).toFixed(0)}px ${(900 * os).toFixed(0)}px at ${ox.toFixed(1)}px ${oy.toFixed(1)}px, rgba(${c1},${(0.34 * gl).toFixed(3)}), rgba(${c1},0) 70%), radial-gradient(900px 700px at 120px 200px, rgba(98,182,195,.10), rgba(98,182,195,0) 70%), #05080A`;
  const pulse = 1 + 0.018 * Math.pow(Math.max(0, Math.cos(Math.PI * 2 * ((t - TM.barOrigin) / 0.5))), 8) * (t > S[1] ? 1 : 0.3);
  const orbEl = $("orb");
  orbEl.style.transform = `translate(${(ox - 170).toFixed(2)}px,${(oy - 170).toFixed(2)}px) scale(${(os * pulse).toFixed(4)})`;
  orbEl.style.boxShadow = `0 0 ${(110 * gl).toFixed(0)}px ${(36 * gl).toFixed(0)}px rgba(255,${Math.round(lerp(170, 90, red))},50,.55), 0 0 ${(380 * gl).toFixed(0)}px ${(150 * gl).toFixed(0)}px rgba(255,${Math.round(lerp(130, 70, red))},30,.22)`;
  orbEl.style.filter = red > 0.01 ? `hue-rotate(${(-22 * red).toFixed(1)}deg) saturate(${(1 + 0.4 * red).toFixed(2)}) brightness(${(1 - 0.35 * red).toFixed(2)})` : "none";
  $("flare").style.transform = `translate(${(ox - 700).toFixed(1)}px,${(oy - 3).toFixed(1)}px) scaleX(${(0.6 + 0.4 * gl).toFixed(3)})`;
  $("flare").style.opacity = (0.55 * gl).toFixed(3);
  drawFloor(t);
  $("cam").style.transform = `translateZ(${cam.z.at(t).toFixed(2)}px) rotateX(${(cam.rx.at(t) + 0.6 * Math.sin(t * 0.7)).toFixed(3)}deg) rotateY(${(cam.ry.at(t) + 0.8 * Math.sin(t * 0.5)).toFixed(3)}deg)`;

  for (const id in PAN) {
    let extra = "";
    if (id === "pTag") extra = `translateX(${(t > T.combien ? 6 * Math.exp(-(t - T.combien) / 0.4) * Math.sin((t - T.combien) * 55) : 0).toFixed(2)}px)`;
    drawPanel(PAN[id], t, extra);
  }
  // 1. la voiture traverse, le prix reste inconnu
  const route = $("route"), L = route.getTotalLength(), k = outQ((t - T.route0) / (T.route1 - T.route0));
  const pt = route.getPointAtLength(L * k);
  $("car").setAttribute("transform", `translate(${pt.x.toFixed(1)} ${pt.y.toFixed(1)})`);
  route.setAttribute("stroke-dashoffset", (-t * 30).toFixed(1));
  $("qm").style.opacity = (0.75 + 0.25 * Math.sin(t * 9)).toFixed(3);
  // 2. la solution
  fade($("ok"), vis(t, T.pas - 0.05, null), "", `scale(${(0.6 + 0.4 * stepR(t - T.pas, POP)).toFixed(4)})`);
  fade($("solWord"), vis(t, T.word - 0.08, null), "", `scale(${(1 + 0.1 * (1 - stepR(t - T.word, { w: 12, z: 0.85 }))).toFixed(4)})`);
  fade($("solSub"), vis(t, T.sol - 0.1, null)); fade($("solChip"), vis(t, T.sol + 0.25, null));
  // 3. le téléphone : écrans
  const s1 = vis(t, S[2], T.entrez - 0.15, 0.15), s2 = vis(t, T.entrez - 0.05, T.voila + 0.22, 0.12), s3 = vis(t, T.voila + 0.3, null);
  [["sc1", s1, 0], ["sc2", s2, 1], ["sc3", s3, 2]].forEach(([id, v]) => { const el = $(id); el.style.opacity = v.o.toFixed(3); el.style.filter = v.b > 0.05 ? `blur(${v.b.toFixed(1)}px)` : "none"; el.style.transform = `translateX(${((1 - v.e) * 60).toFixed(1)}px)`; });
  T.c.forEach((tc, i) => {
    const on = t >= tc, picked = i === 0 && t >= T.pick, el = $("c" + (i + 1));
    const hl = on ? Math.exp(-(t - tc) / 0.6) : 0;
    el.style.borderColor = picked ? "#F2C230" : `rgba(242,194,48,${(0.15 + 0.8 * hl).toFixed(3)})`;
    el.style.background = picked ? "rgba(242,194,48,.16)" : `rgba(255,255,255,${(0.06 + 0.08 * hl).toFixed(3)})`;
    el.style.opacity = t >= T.pick && i > 0 ? "0.5" : "1";
    el.style.transform = `scale(${(1 + 0.04 * hl * (t - tc < 0.5 ? 1 : 0)).toFixed(4)})`;
    $("r" + (i + 1)).style.background = picked ? "#F2C230" : "transparent";
    $("r" + (i + 1)).style.borderColor = picked ? "#F2C230" : "rgba(255,255,255,.3)";
  });
  const typed = (t0, s, step) => s.slice(0, Math.max(0, Math.min(s.length, Math.floor((t - t0) / step) + 1)));
  $("ty").textContent = t >= T.annee ? typed(T.annee, "2022", 0.07) : "";
  $("tp").textContent = t >= T.prix ? typed(T.prix, "7 500 €", 0.05) : "";
  $("cy").style.opacity = t >= T.entrez && t < T.prix && Math.floor(t * 2.6) % 2 === 0 ? 1 : 0;
  $("cp").style.opacity = t >= T.prix && Math.floor(t * 2.6) % 2 === 0 ? 1 : 0;
  $("fy").style.borderColor = t >= T.annee && t < T.prix ? "#F2C230" : "rgba(255,255,255,.12)";
  $("fp").style.borderColor = t >= T.prix ? "#F2C230" : "rgba(255,255,255,.12)";
  const v = TOTAL * outQ((t - T.voila - 0.35) / (T.total + 0.25 - T.voila - 0.35));
  for (const { st, sl, p } of slots) {
    const pp = Math.pow(10, p), pos = Math.floor(v / pp) % 10 + Math.max(0, (v % pp) - (pp - 1));
    st.style.transform = `translateY(${(-pos).toFixed(4)}em)`; sl.style.opacity = clamp(0.25 + 0.75 * v / pp, 0.25, 1).toFixed(3);
  }
  fade($("tx"), vis(t, T.taxes - 0.05, null));
  // doigt qui touche l'écran
  const phone = $("pPhone"), tapEl = $("tap");
  const taps = [[T.pick, $("r1")], [T.annee - 0.05, $("fy")], [T.prix - 0.05, $("fp")]];
  let tv = 0, tx = 0, ty = 0, press = 1;
  for (const [tt, el] of taps) {
    const [lx, ly] = local(el, phone);
    if (t >= tt - 0.35 && t < tt + 0.45) { tv = Math.max(tv, Math.min(clamp((t - (tt - 0.35)) / 0.15), clamp((tt + 0.45 - t) / 0.15))); tx = lx + el.offsetWidth / 2; ty = ly + el.offsetHeight / 2; }
    press -= 0.25 * Math.exp(-Math.pow((t - tt) / 0.06, 2));
  }
  tapEl.style.opacity = (0.9 * tv).toFixed(3);
  tapEl.style.transform = `translate(${(tx - 55).toFixed(1)}px,${(ty - 55).toFixed(1)}px) scale(${press.toFixed(3)})`;
  // 5. bulles
  for (const [id, tt] of [["b1", T.doute], ["b2", T.verif], ["h48", T.vous]]) fade($(id), vis(t, tt - 0.06, null), "", `scale(${(0.94 + 0.06 * vis(t, tt - 0.06, null).e).toFixed(4)})`);
  // 6. icônes d'action : elles s'allument quand la voix les nomme
  T.act.forEach((ta, i) => {
    const on = t >= ta, c = $("a" + (i + 1)).querySelector(".c");
    c.style.background = on ? (i === 1 ? "rgba(255,107,74,.25)" : "rgba(242,194,48,.22)") : "rgba(255,255,255,.08)";
    c.style.borderColor = on ? (i === 1 ? "#FF6B4A" : "#F2C230") : "rgba(255,255,255,.2)";
  });
  $("heart").setAttribute("fill", t >= T.act[1] ? "#FF6B4A" : "none"); $("heart").setAttribute("stroke", t >= T.act[1] ? "#FF6B4A" : "#F4F7F6");

  // sous-titres
  CHUNKS.forEach((c, i) => {
    const el = chunkEls[i], vv = vis(t, c.a, c.z, 0.1);
    el.style.opacity = vv.o.toFixed(3); el.style.display = vv.o < 0.003 ? "none" : "";
    el.style.filter = vv.b > 0.05 ? `blur(${vv.b.toFixed(2)}px)` : "none";
    el.style.transform = `translateY(calc(-50% + ${((1 - vv.e) * 18).toFixed(2)}px))`;
    if (vv.o < 0.003) return;
    Array.from(el.children).forEach((sp, j) => {
      const m = c[j], on = t >= m.a - 0.02, now = on && t < m.b + 0.04;
      sp.style.color = now ? "#F2C230" : on ? "#F4F7F6" : "rgba(244,247,246,.32)";
      sp.style.transform = `scale(${(1 + 0.06 * (now ? Math.exp(-(t - m.a) / 0.12) : 0)).toFixed(4)})`;
    });
  });
}

function init() { build(); window.CUES = CUES.sort((a, b) => a[0] - b[0]); seek(0); window.READY = true; }
window.DUR = DUR; window.seek = seek;
document.fonts.ready.then(init);
})();
