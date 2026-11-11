// Douane Afrique · pub motion design 20 s, 1080×1920.
// Tout est calculé à partir du temps dans seek(t) : aucune transition CSS, aucun minuteur, aucun état gardé.
(function () {
const DUR = 20, BEAT = 0.5;
const $ = (id) => document.getElementById(id);
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, x) => a + (b - a) * x;
const outQ = (x) => 1 - Math.pow(1 - clamp(x), 3);

// ---------- ressorts (réponse indicielle amortie, forme fermée) ----------
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
function vis(t, tin, tout, dOut = 0.12) {
  const e = stepR(t - tin, { w: 26, z: 1 }), x = tout == null ? 0 : clamp((t - tout) / dOut), xo = x * x;
  return { o: e * (1 - xo), b: (1 - e) * 10 + xo * 10, dy: (1 - e) * 16 - xo * 10, e };
}
function apply(el, v, extra = "", base = "") {
  el.style.opacity = v.o.toFixed(4);
  el.style.filter = v.b > 0.05 ? `blur(${v.b.toFixed(2)}px)` : "none";
  el.style.transform = `${base} translateY(${v.dy.toFixed(2)}px) ${extra}`;
  el.style.visibility = v.o < 0.002 ? "hidden" : "visible";
}
const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const SP = { w: 15, z: 0.82 }, SPT = { w: 26, z: 1 }, CAM = { w: 7.5, z: 1 }, SLOW = { w: 2.6, z: 1 };
const LEAD = 0.1;

// ---------- temps forts (en secondes, 120 BPM) ----------
const T = {
  q: [1.5, 1.75, 2.0], brand: 2.5, chip0: 2.7, pick: 3.5,
  form: 4.0, clickYear: 4.75, keysYear: [5.0, 5.125, 5.25, 5.375], clickPrice: 5.875, keysPrice: [6.0, 6.125, 6.25, 6.375],
  live: 6.5, ready: 7.6, drop: 8.0, row0: 8.0, total: 9.5, totalEnd: 10.5, cost: 10.75,
  checks: 12.25, tick0: 12.5, cta: 13.5, press: 14.0, chat: 14.12, bubble: 14.5, h48: 14.8,
  end: 16.0, balance: 16.25, tagline: 16.5, url: 17.0, sub: 17.5,
};
const CUES = [];
const cue = (t, type, p = 0) => CUES.push([+t.toFixed(4), type, p]);

// ---------- la forme unique : position, taille, rayon, couleur ----------
const C = { surface: "#FFFFFF", accent: "#0D5A66", mark: "#F2C230" };
const S = {
  tag:    { x: 540, y: 1000, w: 640, h: 190, r: 95, c: C.surface },
  brand:  { x: 540, y: 1000, w: 960, h: 840, r: 56, c: C.accent },
  form:   { x: 540, y: 1000, w: 960, h: 1080, r: 44, c: C.surface },
  ticket: { x: 540, y: 1000, w: 980, h: 1260, r: 40, c: C.surface },
  checks: { x: 540, y: 1000, w: 940, h: 840, r: 44, c: C.surface },
  btn:    { x: 540, y: 1000, w: 880, h: 170, r: 85, c: C.accent },
  chat:   { x: 540, y: 1000, w: 940, h: 640, r: 48, c: C.surface },
  end:    { x: 540, y: 1000, w: 1180, h: 2040, r: 0, c: C.mark },
};
const sh = { x: new Track(540), y: new Track(1000), w: new Track(470), h: new Track(150), r: new Track(75), cr: new Track(255), cg: new Track(255), cb: new Track(255) };
function morph(t, st, sp = SP) {
  const [r, g, b] = hex(st.c);
  sh.x.to(t, st.x, sp); sh.y.to(t, st.y, sp); sh.w.to(t, st.w, sp); sh.h.to(t, st.h, sp); sh.r.to(t, st.r, sp);
  sh.cr.to(t, r, SPT); sh.cg.to(t, g, SPT); sh.cb.to(t, b, SPT);
}
morph(-0.3, S.tag);
morph(T.brand - LEAD, S.brand); cue(T.brand, "whoosh", 0);
morph(T.form - LEAD, S.form); cue(T.form, "whoosh", 1);
morph(7.68, { ...S.form, w: 900, h: 1000, r: 54 }, { w: 22, z: 1 });
morph(T.drop - 0.07, S.ticket, { w: 12, z: 0.7 }); cue(T.drop, "morphbig");
morph(T.checks - LEAD, S.checks); cue(T.checks, "whoosh", 2);
morph(T.cta - LEAD, S.btn); cue(T.cta, "whoosh", 3);
morph(T.chat - 0.02, S.chat); cue(T.chat, "whoosh", 4);
morph(T.end - LEAD, S.end, { w: 11, z: 0.9 }); cue(T.end, "morphbig");
// appui sur la forme (bouton) : léger écrasement
const pressShape = [T.press];

// ---------- caméra : x, y et zoom logarithmique sur ressorts ----------
const cam = { y: new Track(1000 - 160 / 1.12), lz: new Track(Math.log(1.12)) };
function shot(t, z, y, sp = CAM, off = 160) { cam.lz.to(t, Math.log(z), sp); cam.y.to(t, y - off / z, sp); }
shot(-0.25, 1.28, 1000);
shot(T.brand - 0.25, 1.0, 1000);
shot(T.form - 0.25, 0.97, 1000); shot(T.form + 0.4, 1.02, 1000, SLOW);
shot(7.62, 1.07, 1000, { w: 12, z: 1 });
shot(T.drop - 0.06, 0.93, 1000, { w: 9, z: 0.85 }); shot(T.drop + 0.6, 0.975, 1000, SLOW);
shot(T.totalEnd, 0.99, 1000, { w: 14, z: 0.7 });
shot(T.checks - 0.25, 1.0, 1000);
shot(T.cta - 0.25, 1.16, 1000);
shot(T.chat - 0.1, 1.0, 1000);
shot(T.end - 0.15, 1.0, 1000, CAM, 0); shot(T.end + 0.5, 1.045, 1000, { w: 1.3, z: 1 }, 0);
function camAt(t) { return { cx: 540, cy: cam.y.at(t), z: Math.exp(cam.lz.at(t)) }; }
function toScreen(t, wx, wy) { const c = camAt(t); return [(wx - c.cx) * c.z + 540, (wy - c.cy) * c.z + 960]; }

// ---------- légendes ----------
const CAPS = [
  [-0.2, 1.22, "Vous achetez une voiture <em>en Europe</em>&nbsp;?"],
  [1.3, 2.42, "Combien elle coûte <em>vraiment</em> à l'arrivée&nbsp;?"],
  [2.5, 3.92, "<em>8 pays</em> de l'UEMOA.<br>Un seul calculateur."],
  [4.0, 7.92, "<em>3 infos.</em><br>C'est tout."],
  [8.0, 10.07, "Chaque taxe,<br><em>expliquée.</em>"],
  [10.15, 12.17, "Le vrai prix,<br><em>avant d'acheter.</em>"],
  [12.25, 13.42, "Âge vérifié.<br><em>Papiers listés.</em>"],
  [13.5, 15.92, "Un doute&nbsp;?<br><em>On vérifie pour vous.</em>"],
];
const capEls = CAPS.map(([, , html]) => { const d = document.createElement("div"); d.className = "cap"; d.innerHTML = html; $("caps").appendChild(d); return d; });

// ---------- puces « ? » de l'accroche ----------
const QS = [["Douane <b>?</b>", 300, 790], ["TVA <b>?</b>", 805, 835], ["Refus au port <b>?</b>", 540, 1205]];
const qEls = QS.map(([html]) => { const d = document.createElement("div"); d.className = "q"; d.innerHTML = html; $("qs").appendChild(d); return d; });
const qTr = QS.map(([, x, y]) => ({ x: new Track(x).to(T.brand - 0.08, 540, { w: 18, z: 1 }), y: new Track(y).to(T.brand - 0.08, 1000, { w: 18, z: 1 }), s: new Track(0.6) }));
QS.forEach((_, i) => { qTr[i].s.to(T.q[i], 1, { w: 22, z: 0.72 }).to(T.brand - 0.08, 0.35, { w: 18, z: 1 }); cue(T.q[i], "pop", i); });

// ---------- les 8 pays ----------
const PAYS = ["Bénin", "Burkina Faso", "Côte d'Ivoire", "Guinée-Bissau", "Mali", "Niger", "Sénégal", "Togo"];
const PICK = 2;
const chipEls = PAYS.map((nom, i) => {
  const d = document.createElement("div"); d.className = "chip"; d.textContent = nom;
  d.style.left = (i % 2 ? 215 : -215) + "px"; d.style.top = (-15 + Math.floor(i / 2) * 106) + "px";
  $("chips").appendChild(d); return d;
});
const chipT = PAYS.map((_, i) => T.chip0 + i * 0.1);
chipT.forEach((t, i) => cue(t, "chip", i));
cue(T.pick, "click");

// ---------- formulaire ----------
const rowEls = Array.from(document.querySelectorAll("#g-form .f-row"));
T.keysYear.forEach((t) => cue(t, "key")); T.keysPrice.forEach((t) => cue(t, "key"));
cue(T.clickYear, "click"); cue(T.clickPrice, "click"); cue(T.ready, "ready");
const YEAR = ["2", "20", "202", "2022"], PRICE = ["7", "75", "750", "7 500"];
function typed(t, keys, steps) { let n = 0; for (const k of keys) if (t >= k) n++; return n ? steps[n - 1] : ""; }

// ---------- bulletin ----------
const ROWS = [
  ["CIF", "Valeur en douane", 5247656], ["DD", "Droit de douane · 20 %", 1049531], ["RS", "Redevance statistique · 1 %", 52477],
  ["PCS", "Prélèvement UEMOA · 1 %", 52477], ["PC", "Prélèvement CEDEAO · 0,5 %", 26238], ["TVA", "TVA · 18 %", 1157108],
];
const TOTAL = 2337831;
const fmt = (n) => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
const rowT = ROWS.map((_, i) => T.row0 + i * 0.25);
const rowEls2 = ROWS.map(([code, lab], i) => {
  const y = -420 + i * 108;
  const g = document.createElement("div"); g.className = "abs"; g.style.left = "0"; g.style.top = "0";
  g.innerHTML = `<div class="code" style="left:-440px;top:${y}px">${code}</div><div class="l row-l" style="left:-326px;top:${y}px">${lab}</div><div class="r amt" style="left:440px;top:${y}px"></div><div class="sep" style="left:0;top:${y + 52}px;width:880px"></div>`;
  $("rows").appendChild(g); return g;
});
rowT.forEach((t, i) => cue(t, "row", i));
// compteur du total : une bande de chiffres par position
const odo = $("odo"), DIG = fmt(TOTAL).split("");
const slots = [];
{ let p = DIG.filter((c) => c !== " ").length - 1;
  for (const c of DIG) {
    if (c === " ") { const s = document.createElement("div"); s.className = "sp"; odo.appendChild(s); continue; }
    const s = document.createElement("div"); s.className = "slot";
    const st = document.createElement("div"); st.className = "strip";
    st.innerHTML = "01234567890".split("").map((d) => `<span>${d}</span>`).join("");
    s.appendChild(st); odo.appendChild(s); slots.push({ st, s, p }); p--;
  } }
for (let k = 0; k < 14; k++) cue(T.total + (T.totalEnd - T.total) * (1 - Math.cbrt(1 - k / 14)), "odo", k); // un tic par 1/14 du total : serrés au début, espacés à la fin
cue(T.totalEnd, "settle"); cue(T.cost, "soft");

// ---------- âge et papiers ----------
const PAP = ["Facture d'achat", "Connaissement", "Carte grise d'origine", "Pièce d'identité"];
const cbEls = PAP.map((txt, i) => {
  const y = -55 + i * 112;
  const g = document.createElement("div"); g.className = "abs";
  g.innerHTML = `<div class="cb" style="left:-380px;top:${y}px"><svg width="40" height="40" viewBox="0 0 40 40"><path d="M8 21 L17 30 L33 11" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="44" stroke-dashoffset="44"/></svg></div><div class="l" style="left:-320px;top:${y}px;font:600 38px var(--fb)">${txt}</div>`;
  $("cbs").appendChild(g); return g;
});
const tickT = PAP.map((_, i) => T.tick0 + i * 0.2);
tickT.forEach((t, i) => cue(t, "tick", i));
cue(T.checks + 0.06, "chime", 0);

// ---------- bouton et discussion ----------
cue(T.press, "click"); cue(T.chat + 0.15, "dots"); cue(T.bubble, "message"); cue(T.h48, "soft");
// ---------- fin ----------
cue(T.balance, "thump"); cue(T.tagline, "soft"); cue(T.url, "pop", 3); cue(T.sub, "soft");
const beam = new Track(-13).to(T.balance, 0, { w: 9, z: 0.78 });

// ---------- curseur ----------
const CHIP_W = [540 - 215, 1000 - 15 + 106]; // centre de la puce « Côte d'Ivoire » dans le monde
const cur = { x: new Track(1000), y: new Track(1750) };
function go(t, x, y, sp = { w: 9, z: 0.92 }) { cur.x.to(t, x, sp); cur.y.to(t, y, sp); }
go(3.05, CHIP_W[0] + 30, CHIP_W[1] + 8);
go(4.15, 540 - 150, 1000 + 105 + 12);
go(5.45, 540 - 120, 1000 + 290 + 12);
go(6.7, 860, 1520, { w: 6, z: 1 });
go(12.9, 900, 1450, { w: 30, z: 1 });
go(13.58, 540 + 150, 1000 + 18);
const CLICKS = [T.pick, T.clickYear, T.clickPrice, T.press];
const CURWIN = [[3.0, 7.45], [13.55, 14.55]];
const ripEls = CLICKS.map(() => { const d = document.createElement("div"); d.className = "ripple"; $("rip").appendChild(d); return d; });
const thr = $("thr").getContext("2d");
function curScreen(t) { return toScreen(t, cur.x.at(t), cur.y.at(t)); }

// ---------- fond ----------
const bg = $("bg");

function seek(t) {
  // fond : deux nappes de lumière qui dérivent doucement
  const ax = 220 + 60 * Math.sin(t * 0.5), ay = 380 + 40 * Math.cos(t * 0.4), bx = 880 + 50 * Math.cos(t * 0.45), by = 1640 + 50 * Math.sin(t * 0.35);
  bg.style.background = `radial-gradient(760px 760px at ${ax}px ${ay}px, rgba(13,90,102,.13), rgba(13,90,102,0) 70%), radial-gradient(900px 900px at ${bx}px ${by}px, rgba(242,194,48,.22), rgba(242,194,48,0) 70%), #EDF1F0`;

  // caméra
  const c = camAt(t);
  $("world").style.transform = `translate(540px,960px) scale(${c.z.toFixed(5)}) translate(${-c.cx}px,${(-c.cy).toFixed(3)}px)`;

  // forme
  const w = sh.w.at(t), h = sh.h.at(t), x = sh.x.at(t), y = sh.y.at(t), r = Math.max(0, sh.r.at(t));
  const shape = $("shape");
  let ps = 1; for (const tp of pressShape) ps -= 0.045 * Math.exp(-Math.pow((t - tp) / 0.07, 2));
  shape.style.left = (x - w / 2).toFixed(2) + "px"; shape.style.top = (y - h / 2).toFixed(2) + "px";
  shape.style.width = w.toFixed(2) + "px"; shape.style.height = h.toFixed(2) + "px";
  shape.style.borderRadius = r.toFixed(2) + "px";
  shape.style.transform = `scale(${ps.toFixed(4)})`;
  const col = [sh.cr.at(t), sh.cg.at(t), sh.cb.at(t)].map((v) => Math.round(clamp(v, 0, 255)));
  shape.style.background = `rgb(${col.join(",")})`;
  const white = col[0] > 240 && col[1] > 240;
  shape.style.border = white ? "2px solid #D2DBDA" : "2px solid transparent";
  const endE = stepR(t - (T.end - LEAD), { w: 11, z: 1 });
  shape.style.boxShadow = `0 40px 90px rgba(21,35,42,${(0.13 * (1 - endE)).toFixed(3)})`;

  // groupes : chacun entre sur un ressort et sort tôt et vite
  apply($("g-tag"), vis(t, -0.25, T.brand - 0.12, 0.1));
  apply($("g-brand"), vis(t, T.brand + 0.05, T.form - 0.12, 0.1));
  apply($("g-form"), vis(t, T.form + 0.08, T.drop - 0.1, 0.1));
  apply($("g-ticket"), vis(t, T.drop - 0.04, T.checks - 0.12, 0.1));
  apply($("g-checks"), vis(t, T.checks + 0.08, T.cta - 0.12, 0.1));
  apply($("g-btn"), vis(t, T.cta + 0.06, T.chat - 0.08, 0.08));
  apply($("g-chat"), vis(t, T.chat + 0.12, T.end - 0.12, 0.1));
  apply($("g-end"), vis(t, T.end + 0.05, null));

  // légendes
  CAPS.forEach(([a, b], i) => { const v = vis(t, a, b, 0.08); apply(capEls[i], v, "", "translate(0,-50%)"); });

  // puces « ? »
  QS.forEach((_, i) => {
    const e = qEls[i], v = vis(t, T.q[i], T.brand - 0.06, 0.16), s = qTr[i].s.at(t);
    e.style.left = qTr[i].x.at(t).toFixed(2) + "px"; e.style.top = qTr[i].y.at(t).toFixed(2) + "px";
    apply(e, v, `scale(${s.toFixed(4)})`, "translate(-50%,-50%)");
  });

  // pays
  chipEls.forEach((el, i) => {
    const v = vis(t, chipT[i], null), s = 0.7 + 0.3 * stepR(t - chipT[i], { w: 24, z: 0.74 });
    let sc = s;
    let bgc = "rgba(255,255,255,.13)", fg = "#fff";
    if (i === PICK) {
      const k = stepR(t - T.pick, { w: 30, z: 1 });
      sc *= 1 - 0.07 * Math.exp(-Math.pow((t - T.pick) / 0.06, 2));
      bgc = `rgba(${Math.round(lerp(255, 242, k))},${Math.round(lerp(255, 194, k))},${Math.round(lerp(255, 48, k))},${lerp(0.13, 1, k).toFixed(3)})`;
      fg = k > 0.5 ? "#15232A" : "#fff";
    }
    el.style.background = bgc; el.style.color = fg;
    apply(el, v, `scale(${sc.toFixed(4)})`, "translate(-50%,-50%)");
  });

  // formulaire
  rowEls.forEach((el, i) => {
    const base = el.classList.contains("box") ? "translate(-50%,-50%)" : el.classList.contains("r") ? "translate(-100%,-50%)" : "translate(0,-50%)";
    apply(el, vis(t, T.form + 0.1 + Math.floor(i / 4) * 0.05, null), "", base);
  });
  const focY = t >= T.clickYear && t < T.clickPrice, focP = t >= T.clickPrice && t < T.drop;
  $("fb2").style.border = focY ? "3px solid #0D5A66" : "2px solid #D2DBDA";
  $("fb3").style.border = focP ? "3px solid #0D5A66" : "2px solid #D2DBDA";
  $("t-year").textContent = typed(t, T.keysYear, YEAR);
  $("t-price").textContent = typed(t, T.keysPrice, PRICE);
  const blink = (tf, keys) => { const last = keys.filter((k) => k <= t).pop(); return last != null && t - last < 0.35 ? 1 : (Math.floor((t - tf) * 2.4) % 2 === 0 ? 1 : 0); };
  $("c-year").style.opacity = focY ? blink(T.clickYear, T.keysYear) : 0;
  $("c-price").style.opacity = focP ? blink(T.clickPrice, T.keysPrice) : 0;
  const liveV = vis(t, T.live, null);
  $("live").style.opacity = (liveV.o * (t >= T.live ? 1 : 0)).toFixed(3);
  $("spin").style.transform = `rotate(${(t * 520) % 360}deg)`;
  $("spin").style.display = t < T.ready ? "block" : "none";
  $("live-t").textContent = t < T.ready ? "Calcul en direct…" : "✓ Estimation prête";
  $("live-t").style.color = t < T.ready ? "#566870" : "#1E7448";

  // bulletin
  rowEls2.forEach((g, i) => {
    const v = vis(t, rowT[i], null);
    g.style.opacity = v.o.toFixed(4); g.style.filter = v.b > 0.05 ? `blur(${v.b.toFixed(2)}px)` : "none";
    g.style.transform = `translateX(${((1 - v.e) * 36).toFixed(2)}px)`;
    const k = outQ((t - rowT[i]) / 0.32);
    g.querySelector(".amt").textContent = fmt(ROWS[i][2] * k);
  });
  const bandV = vis(t, T.total - 0.05, null);
  const bandS = 0.92 + 0.08 * stepR(t - (T.total - 0.05), { w: 20, z: 0.75 }) + 0.02 * Math.exp(-Math.pow((t - T.totalEnd) / 0.08, 2));
  apply($("band"), bandV, `scale(${bandS.toFixed(4)})`, "translate(-50%,-50%)");
  const kv = outQ((t - T.total) / (T.totalEnd - T.total));
  const v = TOTAL * kv;              // valeur continue : chaque chiffre ne bouge que pendant la retenue
  for (const { st, s, p } of slots) {
    const pp = Math.pow(10, p);
    const pos = Math.floor(v / pp) % 10 + Math.max(0, (v % pp) - (pp - 1));
    st.style.transform = `translateY(${(-pos * 76).toFixed(2)}px)`;
    s.style.opacity = clamp(0.22 + 0.78 * v / pp, 0.22, 1).toFixed(3);   // chiffre de tête : s'allume en approchant de sa valeur
  }
  for (const id of ["cost-l", "cost-v"]) apply($(id), vis(t, T.cost, null), "", id === "cost-l" ? "translate(0,-50%)" : "translate(-100%,-50%)");
  apply($("foot"), vis(t, T.cost + 0.25, null), "", "translate(-50%,-50%)");

  // âge et papiers
  apply($("age"), vis(t, T.checks + 0.06, null), `scale(${(0.8 + 0.2 * stepR(t - T.checks - 0.06, { w: 22, z: 0.72 })).toFixed(4)})`, "translate(-50%,-50%)");
  apply($("pap"), vis(t, T.checks + 0.14, null), "", "translate(0,-50%)");
  cbEls.forEach((g, i) => {
    const vv = vis(t, T.checks + 0.18 + i * 0.05, null);
    g.style.opacity = vv.o.toFixed(4); g.style.transform = `translateY(${vv.dy.toFixed(2)}px)`;
    const k = stepR(t - tickT[i], { w: 30, z: 1 });
    const box = g.querySelector(".cb");
    box.style.background = `rgba(13,90,102,${k.toFixed(3)})`; box.style.borderColor = k > 0.5 ? "#0D5A66" : "#D2DBDA";
    box.style.transform = `translate(-50%,-50%) scale(${(1 - 0.12 * Math.exp(-Math.pow((t - tickT[i]) / 0.05, 2))).toFixed(4)})`;
    g.querySelector("path").setAttribute("stroke-dashoffset", (44 * (1 - outQ((t - tickT[i] - 0.03) / 0.18))).toFixed(2));
  });

  // bouton : la flèche avance quand le curseur arrive
  $("arrow").style.transform = `translateX(${(10 * stepR(t - 13.85, { w: 20, z: 0.8 })).toFixed(2)}px)`;

  // discussion
  const dv = vis(t, T.chat + 0.15, T.bubble - 0.06, 0.06);
  apply($("dots"), dv, "", "translate(0,-50%)");
  $("dots").querySelectorAll(".dot").forEach((d, i) => { d.style.transform = `translateY(${(-6 * Math.max(0, Math.sin((t * 9) - i * 0.9))).toFixed(2)}px)`; });
  const bv = vis(t, T.bubble, null);
  apply($("bubble"), bv, `scale(${(0.9 + 0.1 * stepR(t - T.bubble, { w: 22, z: 0.75 })).toFixed(4)})`, "translate(0,-50%)");
  $("bubble").style.transformOrigin = "0 0";
  apply($("h48"), vis(t, T.h48, null), "", "translate(-50%,-50%)");

  // fin
  apply($("bal"), vis(t, T.end + 0.1, null), "", "translate(-50%,-50%)");
  $("beam").setAttribute("transform", `rotate(${beam.at(t).toFixed(3)} 0 -70)`);
  const bang = beam.at(t) * Math.PI / 180;
  for (const [id, sx] of [["panL", -150], ["panR", 150]]) {
    // les plateaux restent verticaux : on compense la rotation du fléau
    $(id).setAttribute("transform", `rotate(${(-beam.at(t)).toFixed(3)} ${sx} -70)`);
  }
  const ws = 1 + 0.12 * (1 - stepR(t - T.end - 0.05, { w: 16, z: 0.8 }));
  apply($("e-word"), vis(t, T.end + 0.05, null), `scale(${ws.toFixed(4)})`, "translate(-50%,-50%)");
  apply($("e-tag"), vis(t, T.tagline, null), "", "translate(-50%,-50%)");
  apply($("e-url"), vis(t, T.url, null), `scale(${(0.85 + 0.15 * stepR(t - T.url, { w: 22, z: 0.74 })).toFixed(4)})`, "translate(-50%,-50%)");
  apply($("e-sub"), vis(t, T.sub, null), "", "translate(-50%,-50%)");
  $("bg").style.opacity = (1 - endE).toFixed(3);

  // curseur
  let on = 0; for (const [a, b] of CURWIN) on = Math.max(on, stepR(t - a, { w: 22, z: 0.8 }) * (1 - clamp((t - b) / 0.12)));
  const [sx, sy] = curScreen(t), [sx2, sy2] = curScreen(t - 1 / 120);
  const vx = (sx - sx2) * 120;
  let press = 1; for (const tc of CLICKS) press -= 0.16 * Math.exp(-Math.pow((t - tc) / 0.045, 2));
  const lean = clamp(-vx * 0.0045, -14, 14);
  const curEl = $("cur");
  curEl.style.opacity = clamp(on).toFixed(3);
  curEl.style.transform = `translate(${sx.toFixed(2)}px,${sy.toFixed(2)}px) rotate(${lean.toFixed(2)}deg) scale(${(press * (0.6 + 0.4 * clamp(on))).toFixed(4)})`;
  curEl.querySelector(".pillv").style.transform = `translate(${clamp(-vx * 0.012, -24, 24).toFixed(2)}px,0)`;
  CLICKS.forEach((tc, i) => {
    const k = (t - tc) / 0.4, el = ripEls[i];
    if (k < 0 || k > 1) { el.style.opacity = 0; return; }
    const [rx, ry] = curScreen(tc);
    const d = 20 + 110 * outQ(k);
    el.style.left = rx + "px"; el.style.top = ry + "px"; el.style.width = d + "px"; el.style.height = d + "px";
    el.style.opacity = (0.7 * (1 - k)).toFixed(3);
  });
  // traînée du curseur
  thr.clearRect(0, 0, 1080, 1920);
  if (on > 0.05) {
    let prev = curScreen(t);
    for (let k = 1; k <= 22; k++) {
      const p = curScreen(t - k * 0.009), sp = Math.hypot(p[0] - prev[0], p[1] - prev[1]) / 0.009;
      const a = clamp((sp - 500) / 2500) * (1 - k / 22) * 0.35 * on;
      if (a > 0.003) { thr.strokeStyle = `rgba(13,90,102,${a.toFixed(3)})`; thr.lineWidth = 8 * (1 - k / 24); thr.lineCap = "round"; thr.beginPath(); thr.moveTo(prev[0], prev[1]); thr.lineTo(p[0], p[1]); thr.stroke(); }
      prev = p;
    }
  }
}

window.DUR = DUR; window.CUES = CUES.sort((a, b) => a[0] - b[0]); window.seek = seek;
document.fonts.ready.then(() => { seek(0); window.READY = true; });
})();
