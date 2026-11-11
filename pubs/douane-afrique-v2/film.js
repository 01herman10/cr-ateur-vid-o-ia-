// Douane Afrique · pub v2 (1080×1920). Construite sur la voix off : chaque événement est calé sur un mot (timing.js).
// Tout est calculé à partir du temps dans seek(t) : ressorts en forme fermée, aucune transition CSS, aucun état gardé.
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
const SP = { w: 9, z: 0.86 }, FAST = { w: 14, z: 0.8 }, SLOW = { w: 2.2, z: 1 }, SOFT = { w: 5, z: 1 };

// ---------- les mots de la voix ----------
const LIGNE = Object.fromEntries(TM.lignes.map((l) => [l.id, l]));
function W(id, debut) { const m = LIGNE[id].mots.find((x) => x.m.startsWith(debut)); if (!m) throw new Error(id + " " + debut); return m; }
const S = TM.lignes.map((l) => l.scene).concat([DUR]);    // débuts de scène
const CUES = [];
const cue = (t, type, p = 0) => CUES.push([+t.toFixed(4), type, p]);

// ---------- panneaux 3D ----------
const PAN = {};
function panel(id, st) {
  const el = $(id);
  const p = { el, w: el.offsetWidth, h: el.offsetHeight, win: [] };
  for (const k of ["x", "y", "z", "rx", "ry", "rz", "s"]) p[k] = new Track(st[k] ?? (k === "s" ? 1 : 0));
  p.go = (t, s, sp = SP) => { for (const k in s) p[k].to(t, s[k], sp); return p; };
  p.show = (tin, tout, dOut) => { p.win.push([tin, tout, dOut]); return p; };
  PAN[id] = p; return p;
}
function drawPanel(p, t, extra = "") {
  let o = 0, b = 12;
  for (const [a, c, d] of p.win) { const v = vis(t, a, c, d); if (v.o > o) { o = v.o; b = v.b; } }
  const el = p.el;
  el.style.opacity = o.toFixed(4); el.style.display = o < 0.003 ? "none" : "";   // un panneau caché ne doit pas entrer dans le tri 3D
  el.style.filter = b > 0.05 ? `blur(${b.toFixed(2)}px)` : "none";
  el.style.transform = `translate3d(${(p.x.at(t) - p.w / 2).toFixed(2)}px,${(p.y.at(t) - p.h / 2).toFixed(2)}px,${p.z.at(t).toFixed(2)}px) rotateX(${p.rx.at(t).toFixed(3)}deg) rotateY(${p.ry.at(t).toFixed(3)}deg) rotateZ(${p.rz.at(t).toFixed(3)}deg) scale(${p.s.at(t).toFixed(4)}) ${extra}`;
}

function build() {
  // ---- 1. l'annonce et la question ----
  const v1 = LIGNE.v1, tQ = W("v1", "Mais").a;
  panel("pA", { x: 0, y: -40, z: -1100, rx: 16, ry: -30, s: 0.9 })
    .go(-0.3, { z: 0, rx: 8, ry: -14, s: 1, y: -150 }, { w: 7, z: 0.9 }).go(0.8, { ry: -6 }, SLOW)
    .go(S[1] - 0.15, { x: -30, y: -470, z: -520, rx: 16, ry: -8, s: 0.82 }, SP)
    .go(S[2] - 0.15, { y: -620, z: -1600, s: 0.6 }, SP)
    .show(-0.4, S[2] - 0.05, 0.2);
  cue(0.05, "whoosh", 0);
  panel("pQ", { x: 0, y: 420, z: -200, rx: 30 }).go(tQ - 0.3, { y: 220, z: 0, rx: 10 }, FAST).go(S[1] - 0.2, { y: -60, z: -900, rx: 30 }, SP).show(tQ - 0.3, S[1] - 0.1, 0.15);
  cue(tQ - 0.25, "whoosh", 1);
  // ---- 2. les surprises ----
  const tw = [W("v2", "Droits").a, W("v2", "TVA").a, W("v2", "refus").a], tSur = W("v2", "surprises").a;
  const WP = [{ x: -70, y: -40, z: 80, rz: -4, ry: 12 }, { x: 110, y: 170, z: 160, rz: 3, ry: -10 }, { x: -30, y: 380, z: 220, rz: -2, ry: 8 }];
  ["w1", "w2", "w3"].forEach((id, i) => {
    panel(id, { x: WP[i].x * 2.2, y: WP[i].y, z: -1900, rz: WP[i].rz * 3, ry: WP[i].ry * 2, s: 0.8 })
      .go(tw[i] - 0.12, { ...WP[i], s: 1 }, { w: 11, z: 0.75 })
      .go(S[2] - 0.2, { z: -2400, y: WP[i].y - 300, s: 0.7 }, SP)
      .show(tw[i] - 0.12, S[2] - 0.05, 0.25);
    cue(tw[i], "warn", i);
  });
  panel("pPlus", { x: 250, y: -250, z: -400, s: 0.5, rz: -8 }).go(tSur - 0.05, { s: 1, rz: -6 }, { w: 16, z: 0.6 }).go(S[2] - 0.15, { z: -1600, y: -700 }, SP).show(tSur - 0.05, S[2] - 0.05, 0.2);
  cue(tSur, "glitch");
  // ---- 3. l'appli ----
  const tName = W("v3", "Douane").a, tf = [W("v3", "pays").a, W("v3", "l'année").a, W("v3", "prix").a], tAll = W("v3", "C'est").a;
  panel("pApp", { x: 0, y: 160, z: -1300, rx: 14, ry: 26, s: 0.9 }).go(S[2] - 0.12, { y: 70, z: 0, rx: 6, ry: -8, s: 1 }, { w: 7.5, z: 0.88 }).go(S[2] + 0.8, { ry: -2 }, SLOW)
    .go(S[3] - 0.2, { rx: -64, z: -700, y: 260, s: 0.9 }, { w: 10, z: 1 }).show(S[2] - 0.12, S[3] - 0.05, 0.2);
  cue(S[2], "whoosh", 2); cue(tName, "soft"); tf.forEach((t, i) => cue(t, "tick", i)); cue(tAll, "click");
  // ---- 4. la pile ----
  const tl = [W("v4", "Chaque").a, W("v4", "l'âge").a, W("v4", "les").a];
  const LP = [{ y: -330, z: 40 }, { y: 0, z: 100 }, { y: 330, z: 160 }];
  ["L1", "L2", "L3"].forEach((id, i) => {
    panel(id, { x: 900, y: LP[i].y, z: LP[i].z - 300, rx: 30, ry: -22, rz: 5 })
      .go(tl[i] - 0.14, { x: 0, z: LP[i].z, rx: 24, ry: -14, rz: 3 }, { w: 10, z: 0.82 })
      .go(S[3] + 1.2, { ry: -8, rx: 18 }, SLOW)
      .go(S[4] - 0.18, { x: 0, y: 0, z: -500, s: 0.6, rx: 0, ry: 0, rz: 0 }, { w: 11, z: 1 })
      .show(tl[i] - 0.14, S[4] - 0.02, 0.15);
    cue(tl[i], "layer", i);
  });
  cue(S[3], "beam"); cue(W("v4", "les").a - 0.05, "beam");
  // ---- 5. le vrai prix ----
  panel("pT", { x: 0, y: -40, z: -700, s: 0.86, ry: 12 }).go(S[4] - 0.05, { z: 0, s: 1, ry: -5, rx: 4 }, { w: 9, z: 0.85 }).go(S[4] + 0.8, { ry: -1 }, SLOW)
    .go(S[5] - 0.18, { x: -760, z: -900, ry: 30 }, SP).show(S[4] - 0.05, S[5] - 0.02, 0.2);
  cue(S[4], "whoosh", 3); cue(W("v5", "prix").b, "settle");
  // ---- 6. la vérification ----
  panel("pW", { x: 760, y: 0, z: -600, ry: -34 }).go(S[5] - 0.1, { x: 0, z: 0, ry: -7, rx: 4 }, { w: 9, z: 0.85 }).go(S[5] + 0.8, { ry: -2 }, SLOW)
    .go(S[6] - 0.18, { z: -1500, y: -200, s: 0.7 }, SP).show(S[5] - 0.1, S[6] - 0.02, 0.2);
  cue(S[5], "whoosh", 4); cue(W("v6", "doute").a, "msg", 0); cue(W("v6", "vérifie").a, "msg", 1); cue(W("v6", "pour").a, "soft");
  // ---- 7. la fin ----
  const tCta = W("v7", "Calculez").a, tWord = W("v7", "Douane").a, tTag = W("v7", "Et").a, tUrl = W("v7", "prix").a;
  panel("pCta", { x: 0, y: 330, z: -300, s: 0.7 }).go(tCta - 0.08, { z: 0, s: 1 }, { w: 13, z: 0.7 }).show(tCta - 0.08, null);
  panel("pE", { x: 0, y: 30, z: -400, s: 1.12 }).go(tWord - 0.08, { z: 0, s: 1 }, { w: 11, z: 0.85 }).show(tWord - 0.08, null);
  panel("pUrl", { x: 0, y: 470, z: -100 }).go(tUrl - 0.1, { z: 0 }, FAST).show(tUrl - 0.1, null);
  cue(tCta, "pop", 2); cue(tWord, "shimmer"); cue(tTag, "soft"); cue(tUrl, "pop", 3);
}

// ---------- caméra, soleil, sol ----------
const cam = { rx: new Track(4), ry: new Track(0), z: new Track(-120) };
cam.z.to(0, 0, { w: 1.6, z: 1 });
cam.ry.to(S[3] - 0.1, -5, { w: 3, z: 1 }).to(S[4], 0, SOFT);
cam.rx.to(S[2], 2, SOFT).to(S[6], 4, SOFT);
const orb = { x: new Track(700), y: new Track(1330), s: new Track(0.8), red: new Track(0), glow: new Track(0.5) };
orb.x.to(-0.2, 720, { w: 2.4, z: 1 }); orb.y.to(-0.2, 470, { w: 2.2, z: 1 }); orb.s.to(-0.2, 0.92, { w: 2.4, z: 1 }); orb.glow.to(0, 1, { w: 2, z: 1 });
const sceneOrb = [
  [S[1], { x: 820, y: 380, s: 0.8 }], [S[2], { x: 840, y: 330, s: 0.7 }], [S[3], { x: 540, y: 300, s: 0.75 }],
  [S[4], { x: 540, y: 330, s: 1.0 }], [S[5], { x: 250, y: 330, s: 0.7 }], [S[6], { x: 540, y: 560, s: 1.35 }],
];
for (const [t0, st] of sceneOrb) { orb.x.to(t0 - 0.2, st.x, { w: 4, z: 1 }); orb.y.to(t0 - 0.2, st.y, { w: 4, z: 1 }); orb.s.to(t0 - 0.2, st.s, { w: 4, z: 1 }); }
let tSurp;
const env = { floor: new Track(1), cranes: new Track(0) };   // grues retirées : à cette taille, on les prenait pour des meubles
env.floor.to(S[1], 0.35, SOFT).to(S[2], 0, SOFT).to(S[6] - 0.2, 1, { w: 3, z: 1 });

function drawFloor(t) {
  const H = 1180, f = env.floor.at(t), sv = $("floor");
  if (f < 0.01) { sv.style.opacity = 0; return; }
  sv.style.opacity = f.toFixed(3);
  let d = "";
  for (let i = -12; i <= 12; i++) d += `M540 ${H} L${540 + i * 260} 1920 `;
  const ph = (t * 0.35) % 1;
  for (let k = 0; k < 12; k++) { const u = (k + ph) / 12, y = H + (1920 - H) * u * u; d += `M0 ${y.toFixed(1)} L1080 ${y.toFixed(1)} `; }
  sv.innerHTML = `<rect x="0" y="${H}" width="1080" height="${1920 - H}" fill="#05080A"/><defs><linearGradient id="fg" x1="0" y1="${H}" x2="0" y2="1920" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#FFB64A" stop-opacity=".0"/><stop offset=".15" stop-color="#FFB64A" stop-opacity=".22"/><stop offset="1" stop-color="#FFFFFF" stop-opacity=".05"/></linearGradient></defs><path d="${d}" stroke="url(#fg)" stroke-width="1.6" fill="none"/><rect x="0" y="${H - 1}" width="1080" height="2" fill="#FFC56A" opacity=".55"/>`;
}
function drawCranes(t) {
  const c = env.cranes.at(t), sv = $("cranes");
  sv.style.opacity = c.toFixed(3);
  if (c < 0.01 || sv.dataset.ok) return;
  // portiques du port à l'horizon (dessin fixe)
  const H = 1180;
  const crane = (x, h, w, flip) => {
    const s = flip ? -1 : 1;
    return `<g transform="translate(${x} ${H}) scale(${s} 1)"><path d="M-${w / 2} 0 L-${w / 2 - 14} -${h} L-${w / 2 - 34} -${h} L-${w / 2 - 20} 0 Z M${w / 2} 0 L${w / 2 - 14} -${h} L${w / 2 - 34} -${h} L${w / 2 - 20} 0 Z" /><rect x="-${w / 2 + 10}" y="-${h + 18}" width="${w + 170}" height="16"/><rect x="-${w / 2 - 6}" y="-${h * 0.55}" width="${w - 12}" height="10"/><path d="M${w / 2 + 160} -${h + 10} L${w / 2 + 40} -${h + 70} L${w / 2 + 20} -${h + 18} Z"/></g>`;
  };
  sv.innerHTML = `<g fill="#070B0D" stroke="rgba(255,190,110,.28)" stroke-width="1.5">${crane(170, 250, 150, false)}${crane(420, 300, 170, false)}${crane(900, 270, 160, true)}<rect x="0" y="${H - 34}" width="1080" height="34" stroke="none"/><path d="M0 ${H - 34} L60 ${H - 60} L120 ${H - 60} L120 ${H - 34} L250 ${H - 34} L250 ${H - 74} L330 ${H - 74} L330 ${H - 34} L640 ${H - 34} L640 ${H - 52} L760 ${H - 52} L760 ${H - 34} L1080 ${H - 34}" stroke="none"/></g>`;
  sv.dataset.ok = "1";
}

// ---------- sous-titres karaoké (un morceau de phrase à la fois) ----------
const CHUNKS = [];
for (const l of TM.lignes) {
  let cur = [];
  l.mots.forEach((m, i) => { cur.push(m); if (/[,:.?!…]$/.test(m.m) || i === l.mots.length - 1) { CHUNKS.push(cur); cur = []; } });
}
CHUNKS.forEach((c, i) => { c.a = c[0].a - 0.12; c.z = i + 1 < CHUNKS.length && CHUNKS[i + 1][0].a - c[c.length - 1].b < 0.9 ? CHUNKS[i + 1][0].a - 0.14 : c[c.length - 1].b + 0.45; });
const capsEl = $("caps");
const chunkEls = CHUNKS.map((c) => {
  const d = document.createElement("div"); d.style.position = "absolute"; d.style.left = "0"; d.style.right = "0"; d.style.top = "0"; d.style.transform = "translateY(-50%)";
  d.innerHTML = c.map((m) => `<span>${m.m.replace(/ /g, " ")}</span>`).join(" ");
  capsEl.appendChild(d); return d;
});

// ---------- éléments animés à l'intérieur des panneaux ----------
const BARS = [["DD", 1049531], ["RS", 52477], ["PCS", 52477], ["PC", 26238], ["TVA", 1157108]];
const barEls = BARS.map(() => { const b = document.createElement("div"); b.className = "bar"; $("bars").appendChild(b); return b; });
const docEls = Array.from({ length: 6 }, () => { const d = document.createElement("div"); d.className = "doc"; d.innerHTML = "<i style='top:16px'></i><i style='top:28px'></i><i style='top:40px'></i>"; $("docs").appendChild(d); return d; });
const TOTAL = 7585487;
const odo = $("odo"), slots = [];
{ const s = TOTAL.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " "); let p = s.replace(/ /g, "").length - 1;
  for (const c of s) {
    if (c === " ") { const sp = document.createElement("div"); sp.style.width = ".26em"; odo.appendChild(sp); continue; }
    const sl = document.createElement("div"); sl.className = "slot"; sl.style.height = "1.0em";
    const st = document.createElement("div"); st.className = "strip"; st.innerHTML = "01234567890".split("").map((d) => `<span style="height:1.0em;line-height:1.0em">${d}</span>`).join("");
    sl.appendChild(st); odo.appendChild(sl); slots.push({ st, sl, p }); p--;
  } }

function seek(t) {
  // fond : lueur du soleil (ambre, ou rouge pendant « les surprises ») et halo bleu-vert discret
  const ox = orb.x.at(t), oy = orb.y.at(t), os = orb.s.at(t), red = clamp(orb.red.at(t)), gl = orb.glow.at(t);
  const c1 = [lerp(255, 255, red), lerp(170, 90, red), lerp(60, 60, red)];
  $("bgglow").style.background = `radial-gradient(${(900 * os).toFixed(0)}px ${(900 * os).toFixed(0)}px at ${ox.toFixed(1)}px ${oy.toFixed(1)}px, rgba(${c1.map(Math.round).join(",")},${(0.34 * gl).toFixed(3)}), rgba(${c1.map(Math.round).join(",")},0) 70%), radial-gradient(900px 700px at 120px 200px, rgba(98,182,195,.10), rgba(98,182,195,0) 70%), #05080A`;
  const orbEl = $("orb"), pulse = 1 + 0.018 * Math.pow(Math.max(0, Math.cos(Math.PI * 2 * ((t - TM.barOrigin) / 0.5))), 8) * (t > S[3] ? 1 : 0.4);
  orbEl.style.transform = `translate(${(ox - 170).toFixed(2)}px,${(oy - 170).toFixed(2)}px) scale(${(os * pulse).toFixed(4)})`;
  orbEl.style.boxShadow = `0 0 ${(110 * gl).toFixed(0)}px ${(36 * gl).toFixed(0)}px rgba(255,${Math.round(lerp(170, 90, red))},50,.55), 0 0 ${(380 * gl).toFixed(0)}px ${(150 * gl).toFixed(0)}px rgba(255,${Math.round(lerp(130, 70, red))},30,.22)`;
  orbEl.style.filter = red > 0.01 ? `hue-rotate(${(-22 * red).toFixed(1)}deg) saturate(${(1 + 0.4 * red).toFixed(2)})` : "none";
  const fl = $("flare");
  fl.style.transform = `translate(${(ox - 700).toFixed(1)}px,${(oy - 3).toFixed(1)}px) scaleX(${(0.6 + 0.4 * gl).toFixed(3)})`;
  fl.style.opacity = (0.55 * gl * (0.85 + 0.15 * Math.sin(t * 3))).toFixed(3);
  drawFloor(t); drawCranes(t);

  // caméra (légère respiration continue)
  $("cam").style.transform = `translateZ(${cam.z.at(t).toFixed(2)}px) rotateX(${(cam.rx.at(t) + 0.6 * Math.sin(t * 0.7)).toFixed(3)}deg) rotateY(${(cam.ry.at(t) + 0.8 * Math.sin(t * 0.5)).toFixed(3)}deg)`;

  // panneaux
  const shake = (t0, amp) => (t > t0 ? amp * Math.exp(-(t - t0) / 0.35) * Math.sin((t - t0) * 60) : 0);
  for (const id in PAN) {
    let extra = "";
    if (id === "w1" || id === "w2" || id === "w3") extra = `translateX(${shake(tSurp, 9).toFixed(2)}px)`;
    if (id === "pApp") extra = `scale(${(1 - 0.025 * Math.exp(-Math.pow((t - W("v3", "C'est").a) / 0.07, 2))).toFixed(4)})`;
    drawPanel(PAN[id], t, extra);
  }
  // 1. prix tapé avec la voix, puis barré
  const n7 = t >= W("v1", "7").a, n500 = t >= W("v1", "500").a, nE = t >= W("v1", "€").a;
  $("priceT").textContent = (n7 ? "7" : "") + (n500 ? " 500" : "") + (nE ? " €" : "");
  $("strike").style.transform = `scaleX(${outQ((t - tSurp) / 0.25).toFixed(3)})`;
  const qWords = LIGNE.v1.mots.slice(LIGNE.v1.mots.findIndex((m) => m.m === "Mais"));
  $("qT").textContent = qWords.filter((m) => t >= m.a).map((m) => m.m).join(" ") || "Posez une question";
  $("qT").style.color = qWords.some((m) => t >= m.a) ? "#F4F7F6" : "rgba(244,247,246,.4)";
  $("qCaret").style.opacity = Math.floor(t * 2.4) % 2 === 0 || qWords.some((m) => Math.abs(t - m.a) < 0.3) ? 1 : 0;
  // 3. champs de l'appli
  const tfs = [W("v3", "pays").a, W("v3", "l'année").a, W("v3", "prix").a];
  ["f1", "f2", "f3"].forEach((id, i) => {
    const v = vis(t, tfs[i] - 0.1, null);
    $(id).style.opacity = (0.25 + 0.75 * v.o).toFixed(3);
    $(id).style.borderColor = t >= tfs[i] ? `rgba(242,194,48,${(0.25 + 0.6 * Math.exp(-(t - tfs[i]) / 0.5)).toFixed(3)})` : "rgba(255,255,255,.12)";
    $(id + "v").style.opacity = v.o.toFixed(3); $(id + "v").style.filter = v.b > 0.05 ? `blur(${v.b.toFixed(1)}px)` : "none";
    const c = stepR(t - tfs[i] - 0.12, { w: 22, z: 0.6 });
    $(id + "c").style.transform = `scale(${c.toFixed(3)})`;
  });
  const tAll = W("v3", "C'est").a, g = Math.exp(-Math.pow((t - tAll - 0.15) / 0.35, 2));
  $("calc").style.boxShadow = `0 0 ${(70 * g).toFixed(0)}px ${(10 * g).toFixed(0)}px rgba(242,194,48,${(0.6 * g).toFixed(3)})`;
  const nm = Math.exp(-Math.pow((t - W("v3", "Douane").a - 0.2) / 0.3, 2));
  $("appName").style.color = `rgb(${Math.round(lerp(244, 242, nm))},${Math.round(lerp(247, 194, nm))},${Math.round(lerp(246, 48, nm))})`;
  // 4. barres, âge, papiers
  const tb = W("v4", "taxe").a;
  barEls.forEach((b, i) => { const k = stepR(t - tb - i * 0.09, { w: 16, z: 0.75 }); b.style.height = (Math.max(10, 96 * Math.sqrt(BARS[i][1] / 1157108)) * k).toFixed(2) + "px"; });
  const ta = W("v4", "vérifié").a;
  $("ageBar").style.width = (80 * outQ((t - ta + 0.1) / 0.5)).toFixed(2) + "%";
  $("ageOk").style.opacity = vis(t, ta + 0.2, null).o.toFixed(3);
  const tp = W("v4", "papiers").a;
  docEls.forEach((d, i) => { const k = t >= tp + i * 0.09 ? 1 : 0; d.style.borderColor = k ? "#5FD39A" : "rgba(255,255,255,.4)"; d.style.background = k ? "rgba(95,211,154,.16)" : "transparent"; d.style.transform = `scale(${(1 - 0.12 * Math.exp(-Math.pow((t - tp - i * 0.09) / 0.05, 2))).toFixed(3)})`; });
  // faisceau de lumière qui balaie la pile
  let bx = -400, bo = 0;
  for (const tb0 of [S[3], W("v4", "les").a - 0.05]) { const k = (t - tb0) / 0.75; if (k >= 0 && k <= 1) { bx = -300 + 1700 * outQ(k); bo = Math.sin(Math.PI * k); } }
  $("beam").style.transform = `translate(${bx.toFixed(1)}px,-140px) rotate(14deg)`; $("beam").style.opacity = (0.9 * bo).toFixed(3);
  // 5. compteur du vrai prix
  const r0 = W("v5", "voyez").a, r1 = W("v5", "prix").b;
  const v = TOTAL * outQ((t - r0) / (r1 - r0));
  for (const { st, sl, p } of slots) {
    const pp = Math.pow(10, p), pos = Math.floor(v / pp) % 10 + Math.max(0, (v % pp) - (pp - 1));
    st.style.transform = `translateY(${(-pos).toFixed(4)}em)`;
    sl.style.opacity = clamp(0.22 + 0.78 * v / pp, 0.22, 1).toFixed(3);
  }
  $("uline").style.transform = `scaleX(${outQ((t - r1) / 0.4).toFixed(3)})`; $("uline").style.transformOrigin = "0 50%";
  const av = vis(t, W("v5", "avant").a, null); $("avant").style.opacity = av.o.toFixed(3);
  // 6. bulles
  for (const [id, tt] of [["b1", W("v6", "doute").a], ["b2", W("v6", "vérifie").a], ["h48", W("v6", "pour").a]]) {
    const vv = vis(t, tt - 0.05, null), el = $(id);
    el.style.opacity = vv.o.toFixed(3); el.style.transform = `translateY(${((1 - vv.e) * 24).toFixed(2)}px) scale(${(0.94 + 0.06 * vv.e).toFixed(4)})`;
  }
  // 7. slogan
  const tg = vis(t, W("v7", "Et").a, null); $("eTag").style.opacity = tg.o.toFixed(3); $("eTag").style.transform = `translateY(${((1 - tg.e) * 20).toFixed(2)}px)`;

  // sous-titres
  CHUNKS.forEach((c, i) => {
    const el = chunkEls[i], vv = vis(t, c.a, c.z, 0.1);
    el.style.opacity = vv.o.toFixed(3); el.style.filter = vv.b > 0.05 ? `blur(${vv.b.toFixed(2)}px)` : "none";
    el.style.visibility = vv.o < 0.003 ? "hidden" : "visible";
    el.style.transform = `translateY(calc(-50% + ${((1 - vv.e) * 18).toFixed(2)}px))`;
    if (vv.o < 0.003) return;
    Array.from(el.children).forEach((sp, j) => {
      const m = c[j], on = t >= m.a - 0.02, now = on && t < m.b + 0.04;
      sp.style.color = now ? "#F2C230" : on ? "#F4F7F6" : "rgba(244,247,246,.32)";
      sp.style.transform = `scale(${(1 + 0.06 * (now ? Math.exp(-(t - m.a) / 0.12) : 0)).toFixed(4)})`;
    });
  });
}

function init() {
  tSurp = W("v2", "surprises").a;
  orb.red.to(tSurp - 0.1, 1, { w: 8, z: 1 }).to(S[2] - 0.1, 0, { w: 5, z: 1 });
  build();
  window.CUES = CUES.sort((a, b) => a[0] - b[0]);
  seek(0); window.READY = true;
}
window.DUR = DUR; window.seek = seek;
document.fonts.ready.then(init);
})();
