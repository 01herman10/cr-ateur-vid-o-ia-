"""Musique originale de la pub Douane Afrique v2 (120 BPM, la mineur → do majeur).

Ambiance sombre et pulsée, inspirée de la référence : grosse caisse régulière dès le début, montée avec
roulement et filtre qui s'ouvre, silence d'un demi-temps, puis temps fort quand la voix dit
« Chaque taxe est calculée » (timing.json → drop), et une fin qui se résout sur l'accord de do.
La grille des mesures part de timing.json → barOrigin, pour que le temps fort tombe sur un premier temps.
Sortie : music.wav (48 kHz, stéréo).
"""
import json, os, wave
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
T = json.load(open(os.path.join(HERE, "timing.json")))
SR = 48000; BEAT = 0.5; BAR = 2.0
DUR = T["dur"]; DROP = T["drop"]; O = T["barOrigin"] - BAR      # première mesure (incomplète) avant 0
N = int(DUR * SR)
rng = np.random.default_rng(5)
hz = lambda m: 440.0 * 2 ** ((m - 69) / 12)
L = np.zeros(N); R = np.zeros(N)

def put(dst, x, t, g=1.0):
    i = int(round(t * SR))
    if i < 0: x = x[-i:]; i = 0
    if i >= len(dst) or len(x) == 0: return
    j = min(len(dst), i + len(x)); dst[i:j] += g * x[: j - i]

def env(n, a=0.005, d=0.2, s=0.0, r=0.05, hold=None):
    tt = np.arange(n) / SR
    e = np.minimum(1, tt / max(a, 1e-4)) * (s + (1 - s) * np.exp(-np.maximum(0, tt - a) / d))
    if hold is not None: e *= 1 - np.clip((tt - hold) / r, 0, 1)
    return e

def fir_lp(x, fc, taps=255):
    k = np.arange(taps) - (taps - 1) / 2
    h = np.sinc(2 * fc / SR * k) * np.hamming(taps); h /= h.sum()
    return np.convolve(x, h, mode="same")
def fir_hp(x, fc, taps=255): return x - fir_lp(x, fc, taps)

def saws(freq, n, fc_at, voices=(-0.1, 0.0, 0.1), maxh=48):
    tt = np.arange(n) / SR; fc = fc_at(tt); out = np.zeros(n)
    for dv in voices:
        f = freq * 2 ** (dv / 12); ph = rng.uniform(0, 2 * np.pi)
        for k in range(1, maxh + 1):
            if k * f > SR / 2.4: break
            out += (1 / k) / (1 + (k * f / fc) ** 4) * np.sin(2 * np.pi * k * f * tt + k * ph)
    return out / len(voices)

def reverb(x, secs=1.6, mix=0.3):
    n = int(secs * SR)
    ir = rng.standard_normal(n) * np.exp(-np.arange(n) / SR / (secs / 6.9))
    ir = fir_lp(ir, 5500, 63); ir[: int(0.015 * SR)] = 0; ir /= np.sqrt((ir ** 2).sum())
    m = 2 ** int(np.ceil(np.log2(len(x) + n)))
    y = np.fft.irfft(np.fft.rfft(x, m) * np.fft.rfft(ir, m))[: len(x)]
    return x * (1 - mix) + y * mix * 0.6

def kick():
    n = int(0.5 * SR); tt = np.arange(n) / SR
    f = 42 + 120 * np.exp(-tt / 0.03)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt / 0.32) + 0.4 * rng.standard_normal(n) * np.exp(-tt / 0.002)
    return np.tanh(1.8 * x)
def clap():
    n = int(0.4 * SR); tt = np.arange(n) / SR
    nz = fir_hp(fir_lp(rng.standard_normal(n), 2800, 127), 900, 127)
    e = sum(np.exp(-np.maximum(0, tt - o) / 0.006) * (tt >= o) for o in (0, 0.012, 0.024)) + 0.6 * np.exp(-np.maximum(0, tt - 0.03) / 0.12) * (tt >= 0.03)
    return nz * e
def hat(op=False):
    n = int((0.25 if op else 0.05) * SR); tt = np.arange(n) / SR
    return fir_hp(rng.standard_normal(n), 7500, 63) * np.exp(-tt / (0.08 if op else 0.011))
def snare():
    n = int(0.2 * SR); tt = np.arange(n) / SR
    return 0.7 * fir_hp(rng.standard_normal(n), 1300, 63) * np.exp(-tt / 0.05) + 0.5 * np.sin(2 * np.pi * 185 * tt) * np.exp(-tt / 0.03)

# ---------- forme : mesures (début en s, accord, section) ----------
CH = {"Am": [57, 60, 64, 69], "F": [53, 57, 60, 65], "C": [55, 60, 64, 67], "G": [55, 59, 62, 67], "Dm": [57, 62, 65, 69]}
RT = {"Am": 45, "F": 41, "C": 48, "G": 43, "Dm": 50}
bars = []
t = O; k = 0
while t < DUR:
    # respirations : pendant la liste des problèmes (jusqu'à « fini »), puis pendant « huit pays » (jusqu'à « toute l'Afrique »)
    L = {l["id"]: l for l in T["lignes"]}
    mot = lambda lid, d: next(m["a"] for m in L[lid]["mots"] if m["m"].startswith(d))
    PAUSES = [(L["v4"]["scene"] - 1.0, mot("v4", "fini") - 0.4), (L["v9"]["scene"] - 0.5, mot("v9", "toute") - 0.4)]
    if t < DROP - 4 * BAR + 1e-6: sec = "intro"
    elif t < DROP - 1e-6: sec = "montee"
    elif any(a - 1e-6 <= t < b - 1e-6 for a, b in PAUSES): sec = "pause"
    elif t < DUR - 6.0 - 1e-6: sec = "drop"
    else: sec = "fin"
    bars.append([t, sec]); t += BAR; k += 1
prog_intro = ["Am", "Am", "F", "G"]; prog_main = ["Am", "F", "C", "G"]
i_intro = i_main = 0
for b in bars:
    if b[1] == "pause": b.append(["Am", "F"][i_main % 2]); i_main += 1
    elif b[1] in ("intro", "montee"): b.append(prog_intro[i_intro % 4] if b[1] == "intro" else ["F", "G", "Dm", "G"][i_intro % 4]); i_intro += 1
    else: b.append(prog_main[i_main % 4]); i_main += 1
# fin : fa puis do qui résonne
fin_bars = [b for b in bars if b[1] == "fin"]
if fin_bars:
    for b, c in zip(fin_bars, ["F", "G", "C", "C"]): b[2] = c

dr = np.zeros((N, 2))
def dput(x, t, g=1.0, pan=0.0):
    put(dr[:, 0], x, t, g * np.cos((pan + 1) * np.pi / 4) * 1.414); put(dr[:, 1], x, t, g * np.sin((pan + 1) * np.pi / 4) * 1.414)

kicks = []
for b0, sec, ch in bars:
    for q in range(4):
        tq = b0 + q * BEAT
        if tq < 0 or tq >= DUR: continue
        if sec == "intro": kicks.append((tq, 0.55))
        elif sec == "montee":
            if tq < DROP - BAR: kicks.append((tq, 0.75))
            elif tq < DROP - 1.0: kicks.append((tq, 0.75))              # se vide sur les deux derniers temps
        elif sec == "drop": kicks.append((tq, 1.0))
        elif sec == "pause":
            if q in (0, 2): kicks.append((tq, 0.7))
            if q == 2: dput(clap(), tq, 0.35)
            dput(hat(True), tq + BEAT / 2, 0.08, -0.3)
        elif sec == "fin":
            if tq < DUR - 2.0: kicks.append((tq, 0.85))
        if sec in ("montee", "drop") and q in (1, 3) and tq < DROP - 1.0 or (sec == "drop" and q in (1, 3)): dput(clap(), tq, 0.5)
        if sec == "intro": dput(hat(), tq + BEAT / 2, 0.14, 0.3)
        if sec in ("drop",):
            for s in range(4): dput(hat(), tq + s * BEAT / 4, 0.14 if s % 2 else 0.08, 0.35)
            dput(hat(True), tq + BEAT / 2, 0.14, -0.3)
        if sec == "fin" and tq < DUR - 2.0: dput(hat(), tq + BEAT / 2, 0.12, 0.3)
for tk, g in kicks: dput(kick(), tk, g)
# roulement : croches → doubles → triples sur les 2 mesures avant le temps fort, jusqu'à 0,5 s avant
t = DROP - 2 * BAR
while t < DROP - 0.5 - 1e-6:
    step = BEAT / 2 if t < DROP - BAR else (BEAT / 4 if t < DROP - 1.0 else BEAT / 8)
    dput(snare(), t, 0.12 + 0.4 * (t - (DROP - 2 * BAR)) / (2 * BAR - 0.5), 0.1); t += step

duck = np.ones(N)
for tk, g in kicks:
    if tk >= DROP - 4 * BAR:
        i = int(tk * SR); n = int(0.42 * SR); j = min(N, i + n)
        duck[i:j] = np.minimum(duck[i:j], 1 - 0.5 * np.exp(-np.arange(j - i) / SR / 0.12))

# ---------- nappe ----------
pad = np.zeros(N)
def fc_for(t0, sec):
    def f(tt):
        ta = t0 + tt
        if sec == "intro": return 600 + 0 * ta
        if sec == "montee": return 900 * 2 ** (np.clip((ta - (DROP - 4 * BAR)) / (4 * BAR), 0, 1) * 2.4)
        if sec == "drop": return 4200 + 0 * ta
        if sec == "pause": return 1800 + 0 * ta
        return 2600 + 0 * ta
    return f
for idx, (b0, sec, ch) in enumerate(bars):
    n = int((BAR + 0.5) * SR)
    last = idx == len(bars) - 1 or (sec == "fin" and ch == "C" and bars[idx - 1][2] == "C")
    for m in CH[ch]:
        x = saws(hz(m), n, fc_for(b0, sec))
        e = env(n, a=0.05 if idx else 0.8, d=9, s=1.0, r=0.4, hold=BAR)
        if sec == "fin" and ch == "C": e = env(n, a=0.02, d=1.6)
        put(pad, x * e, b0, 0.2)
pad *= duck
padL = reverb(pad, 2.0, 0.35); padR = reverb(np.roll(pad, 300), 2.0, 0.35)

# ---------- basse ----------
bass = np.zeros(N)
for b0, sec, ch in bars:
    r = RT[ch]
    if sec == "intro": steps = [0, 2.0]
    elif sec == "montee": steps = [0, 1.0, 2.0, 3.0] if b0 < DROP - BAR else [0, 0.5]
    elif sec == "drop": steps = [0, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5]
    elif sec == "pause": steps = [0, 2.0]
    else: steps = [0, 1.0, 2.0, 3.0] if ch != "C" else [0]
    for s in steps:
        dur = BEAT * (0.45 if sec == "drop" else 0.9)
        if sec == "fin" and ch == "C": dur = 1.8
        n = int(dur * SR); tt = np.arange(n) / SR
        f = hz(r + (12 if sec == "drop" and (s * 2) % 2 == 1 else 0))
        x = np.sin(2 * np.pi * f * tt) + 0.35 * np.sin(4 * np.pi * f * tt) + 0.12 * np.sin(6 * np.pi * f * tt)
        put(bass, x * env(n, a=0.004, d=0.2 if sec == "drop" else 0.5, s=0.3), b0 + s * BEAT, 0.3)
bass *= duck

# ---------- arpège (tension) et accroche (temps fort) ----------
pl = np.zeros(N)
def pluck(m, g=1.0, d=0.3):
    n = int(d * SR); tt = np.arange(n) / SR; f = hz(m)
    return g * (np.sin(2 * np.pi * f * tt) + 0.4 * np.sin(4 * np.pi * f * tt) * np.exp(-tt / 0.03)) * np.exp(-tt / 0.1)
ARP = {"Am": [69, 72, 76, 72], "F": [65, 69, 72, 69], "C": [67, 72, 76, 72], "G": [67, 71, 74, 71], "Dm": [69, 74, 77, 74]}
HOOK = [(0, 76), (0.75, 74), (1.5, 72), (2.0, 74), (2.5, 76), (3.0, 79), (3.5, 76)]
for b0, sec, ch in bars:
    if sec in ("montee", "pause"):
        for s in range(8): put(pl, pluck(ARP[ch][s % 4], 0.2 if sec == "montee" else 0.12), b0 + s * BEAT / 2)
    if sec == "drop":
        for bb, m in HOOK: put(pl, pluck(m - (2 if ch == "F" and m == 76 else 0), 0.24, 0.4), b0 + bb * BEAT)
plL = reverb(pl, 1.3, 0.3); plR = reverb(np.roll(pl, 500), 1.3, 0.3)

# ---------- effets : souffle grave du début, montée, impacts ----------
fx = np.zeros(N)
n = int(3.0 * SR); tt = np.arange(n) / SR
put(fx, fir_lp(rng.standard_normal(n), 400, 255) * np.sin(np.pi * tt / 3.0) * 0.5 + np.sin(2 * np.pi * 55 * tt) * np.sin(np.pi * tt / 3.0) * 0.25, 0.0)
n = int((2 * BAR - 0.5) * SR); tt = np.arange(n) / SR
put(fx, 0.16 * fir_hp(rng.standard_normal(n), 1500, 63) * (tt / tt[-1]) ** 2.2
        + 0.05 * np.sin(2 * np.pi * np.cumsum(220 * 2 ** (tt / tt[-1] * 3)) / SR) * (tt / tt[-1]) ** 2, DROP - 2 * BAR)
def impact(g):
    n = int(1.8 * SR); tt = np.arange(n) / SR
    boom = np.sin(2 * np.pi * np.cumsum(36 + 60 * np.exp(-tt / 0.08)) / SR) * np.exp(-tt / 0.5)
    return (np.tanh(1.4 * boom) + fir_hp(rng.standard_normal(n), 3500, 63) * np.exp(-tt / 0.6) * 0.3) * g
put(fx, impact(0.8), DROP)
fin_scene = T["lignes"][-1]["scene"]
put(fx, impact(0.55), fin_scene)
fxR = reverb(fx, 2.2, 0.3)

mixL = dr[:, 0] * 0.42 + padL + bass * 1.25 + plL * 1.5 + fxR
mixR = dr[:, 1] * 0.42 + padR + bass * 1.25 + plR * 1.5 + fxR
g = np.ones(N); a, b = int((DROP - 0.5) * SR), int(DROP * SR); g[a:b] = np.linspace(1, 0.06, b - a) ** 2
k = int(0.8 * SR); g[-k:] *= np.linspace(1, 0, k) ** 1.5
mixL *= g; mixR *= g
mixL = np.tanh(1.2 * mixL) / 1.2; mixR = np.tanh(1.2 * mixR) / 1.2
pk = max(np.abs(mixL).max(), np.abs(mixR).max()); mixL *= 0.9 / pk; mixR *= 0.9 / pk
with wave.open(os.path.join(HERE, "music.wav"), "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((np.stack([mixL, mixR], 1) * 32767).astype("<i2").tobytes())
print("music.wav", DUR, "s · temps fort", DROP, "s ·", " ".join(f"{b0:.1f}{sec[0]}{ch}" for b0, sec, ch in bars))
