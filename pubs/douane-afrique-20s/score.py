"""Musique originale de la pub Douane Afrique (20 s, 120 BPM, do majeur).

Arc : intro filtrée (mes. 1-2) → montée avec roulement de caisse claire (3-4)
→ drop à 8 s quand le bulletin s'ouvre (5-7) → respiration (8) → fin résolue (9-10).
Grille d'accords, une mesure de 2 s chacune : Lam Fa Do Sol | Lam Fa Do Sol | Fa Do.
Sortie : music.wav (48 kHz, stéréo), écrite dans le dossier du projet.
"""
import numpy as np
import wave, os

SR = 48000
BPM = 120
BEAT = 60 / BPM            # 0,5 s
BAR = 4 * BEAT
DUR = 20.0
N = int(DUR * SR)
rng = np.random.default_rng(7)

def hz(m):                 # numéro MIDI → Hz
    return 440.0 * 2 ** ((m - 69) / 12)

CHORDS = {                 # notes MIDI (accords en position serrée autour de do4)
    "Am": [57, 60, 64, 69], "F": [53, 57, 60, 65], "C": [55, 60, 64, 67], "G": [55, 59, 62, 67],
}
ROOT = {"Am": 45, "F": 41, "C": 48, "G": 43}
PROG = ["Am", "F", "C", "G", "Am", "F", "C", "G", "F", "C"]

L = np.zeros(N); R = np.zeros(N)

def put(dst, x, t, g=1.0):
    i = int(round(t * SR))
    if i >= len(dst): return
    j = min(len(dst), i + len(x))
    if i < 0:
        x = x[-i:]; i = 0; j = min(len(dst), len(x))
    dst[i:j] += g * x[: j - i]

def stereo(x, t, g=1.0, pan=0.0):
    put(L, x, t, g * np.cos((pan + 1) * np.pi / 4) * 1.414)
    put(R, x, t, g * np.sin((pan + 1) * np.pi / 4) * 1.414)

def env(n, a=0.005, d=0.2, s=0.0, r=0.05, hold=None):
    tt = np.arange(n) / SR
    e = np.minimum(1, tt / max(a, 1e-4))
    e *= s + (1 - s) * np.exp(-np.maximum(0, tt - a) / d)
    if hold is not None:
        rel = np.clip((tt - hold) / r, 0, 1)
        e *= 1 - rel
    return e

def fir_lp(x, fc, taps=255):
    k = np.arange(taps) - (taps - 1) / 2
    h = np.sinc(2 * fc / SR * k) * np.hamming(taps); h /= h.sum()
    return np.convolve(x, h, mode="same")

def fir_hp(x, fc, taps=255):
    return x - fir_lp(x, fc, taps)

def supersaw(freq, n, fc_at, voices=(-0.08, 0.0, 0.08), maxh=48):
    """Scie additive à bande limitée ; fc_at(t) : coupure du filtre passe-bas, variable dans le temps."""
    tt = np.arange(n) / SR
    fc = fc_at(tt)
    out = np.zeros(n)
    for dv in voices:
        f = freq * 2 ** (dv / 12)
        ph0 = rng.uniform(0, 2 * np.pi)
        for k in range(1, maxh + 1):
            if k * f > SR / 2.4: break
            w = 1.0 / (1 + (k * f / fc) ** 4)
            out += (w / k) * np.sin(2 * np.pi * k * f * tt + k * ph0)
    return out / len(voices)

def reverb(x, secs=1.4, mix=0.25, pre=0.012):
    n = int(secs * SR)
    ir = rng.standard_normal(n) * np.exp(-np.arange(n) / SR / (secs / 6.9))
    ir = fir_lp(ir, 6000, 63); ir[: int(pre * SR)] = 0; ir /= np.sqrt((ir ** 2).sum())
    m = len(x) + n
    y = np.fft.irfft(np.fft.rfft(x, 2 ** int(np.ceil(np.log2(m)))) * np.fft.rfft(ir, 2 ** int(np.ceil(np.log2(m)))))[: len(x)]
    return x * (1 - mix) + y * mix * 0.6

# ---------- batterie ----------
def kick(g=1.0):
    n = int(0.45 * SR); tt = np.arange(n) / SR
    f = 46 + 110 * np.exp(-tt / 0.035)
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = np.sin(ph) * np.exp(-tt / 0.28)
    x += 0.5 * rng.standard_normal(n) * np.exp(-tt / 0.0025)
    return np.tanh(1.6 * x) * g

def clap():
    n = int(0.35 * SR); tt = np.arange(n) / SR
    nz = fir_hp(fir_lp(rng.standard_normal(n), 2600, 127), 900, 127)
    e = sum(np.exp(-np.maximum(0, tt - o) / 0.006) * (tt >= o) for o in (0, 0.011, 0.022))
    e = e + 0.6 * np.exp(-np.maximum(0, tt - 0.03) / 0.09) * (tt >= 0.03)
    return nz * e

def hat(open_=False):
    n = int((0.22 if open_ else 0.05) * SR); tt = np.arange(n) / SR
    x = fir_hp(rng.standard_normal(n), 7000, 63)
    return x * np.exp(-tt / (0.07 if open_ else 0.012))

def snare(g=1.0):
    n = int(0.2 * SR); tt = np.arange(n) / SR
    x = 0.7 * fir_hp(rng.standard_normal(n), 1200, 63) * np.exp(-tt / 0.05)
    x += 0.5 * np.sin(2 * np.pi * 190 * tt) * np.exp(-tt / 0.03)
    return x * g

drums_L = np.zeros(N); drums_R = np.zeros(N)
def dput(x, t, g=1.0, pan=0.0):
    put(drums_L, x, t, g * np.cos((pan + 1) * np.pi / 4) * 1.414)
    put(drums_R, x, t, g * np.sin((pan + 1) * np.pi / 4) * 1.414)

kick_times = []
for b in range(40):
    t = b * BEAT
    bar = b // 4; beat = b % 4
    if bar in (0, 1):                     # intro : demi-temps
        if beat in (0, 2) and not (bar == 0 and beat == 2): kick_times.append(t)
    elif bar == 2:
        if beat in (0, 2): kick_times.append(t)
    elif bar == 3:
        if beat in (0, 1): kick_times.append(t)   # la montée se vide à partir du 3e temps
    elif bar in (4, 5, 6):
        kick_times.append(t)              # drop : 4 temps
    elif bar == 7:
        if beat in (2, 3): kick_times.append(t)   # respiration sur 2 temps
    elif bar == 8:
        kick_times.append(t)
    elif bar == 9:
        if beat == 0: kick_times.append(t)
for t in kick_times:
    dput(kick(), t, 0.95)
for b in range(40):
    t = b * BEAT; bar = b // 4; beat = b % 4
    if bar in (2, 4, 5, 6, 8) and beat in (1, 3): dput(clap(), t, 0.55, 0.05)
    if bar in (1, 2):
        dput(hat(), t + BEAT / 2, 0.18, 0.3)
    if bar in (4, 5, 6, 8):
        for s in range(4):
            dput(hat(), t + s * BEAT / 4, 0.16 if s % 2 else 0.1, 0.35)
        dput(hat(True), t + BEAT / 2, 0.16, -0.3)
# roulement de caisse claire : croches → doubles → triples sur les mesures 3-4 (4 s → 7,75 s)
t = 4.0
while t < 7.75 - 1e-6:
    if t < 6.0: step = BEAT / 2
    elif t < 7.0: step = BEAT / 4
    else: step = BEAT / 8
    g = 0.15 + 0.45 * (t - 4.0) / 3.75
    dput(snare(), t, g, 0.1)
    t += step
# remplissage avant la fin (mes. 8, 4e temps)
for k in range(4): dput(snare(), 15.5 + k * BEAT / 4, 0.25 + 0.08 * k)

# ---------- sidechain (pompe) : le pad et la basse s'effacent sous chaque grosse caisse du drop ----------
duck = np.ones(N)
for t in kick_times:
    if t >= 8.0 or 16.0 <= t:
        i = int(t * SR); n = int(0.42 * SR); tt = np.arange(n) / SR
        j = min(N, i + n)
        duck[i:j] = np.minimum(duck[i:j], 1 - 0.55 * np.exp(-tt / 0.12)[: j - i])

# ---------- pad (accords) ----------
pad = np.zeros(N)
def pad_fc(t0):
    def f(tt):
        ta = t0 + tt
        fc = np.where(ta < 4, 700 + 150 * ta,                                   # intro sombre
             np.where(ta < 8, 1300 * 2 ** ((ta - 4) / 4 * 2.2),                  # montée : le filtre s'ouvre
             np.where(ta < 14, 4200, np.where(ta < 16, 1800, 3600))))
        return fc
    return f
for i, ch in enumerate(PROG):
    t0 = i * BAR; n = int(BAR * SR) + int(0.4 * SR)
    for m in CHORDS[ch]:
        x = supersaw(hz(m), n, pad_fc(t0))
        e = env(n, a=0.04 if i else 0.6, d=9, s=1.0, r=0.4, hold=BAR)
        if i == 9: e = env(n, a=0.02, d=1.4, s=0.0)           # dernier accord : laisse résonner
        put(pad, x * e, t0, 0.21)
pad *= duck
padL = reverb(pad, 1.8, 0.35); padR = reverb(np.roll(pad, 240), 1.8, 0.35)

# ---------- basse ----------
bass = np.zeros(N)
for i, ch in enumerate(PROG):
    if i < 2: continue
    r = ROOT[ch]
    steps = [0, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5] if i in (4, 5, 6, 8) else [0, 1.5, 2.0, 3.5]
    if i == 3: steps = [0, 0.5, 1.0, 1.5]          # se tait avant le drop
    if i == 7: steps = [2.0, 2.5, 3.0, 3.5]
    if i == 9: steps = [0]
    for s in steps:
        n = int((BEAT * (1.6 if i == 9 else 0.45)) * SR); tt = np.arange(n) / SR
        f = hz(r + (12 if (s * 2) % 2 == 1 and i in (4, 5, 6, 8) else 0))
        x = np.sin(2 * np.pi * f * tt) + 0.35 * np.sin(4 * np.pi * f * tt) + 0.15 * np.sin(6 * np.pi * f * tt)
        e = env(n, a=0.004, d=0.18 if i != 9 else 0.8, s=0.3 if i != 9 else 0.0)
        put(bass, x * e, i * BAR + s * BEAT, 0.32)
bass *= duck

# ---------- pluck (motif mélodique, gamme pentatonique de do) ----------
PENTA = [60, 62, 64, 67, 69, 72, 74, 76, 79, 81]
pl = np.zeros(N)
def pluck(m, g=1.0, dur=0.32):
    n = int(dur * SR); tt = np.arange(n) / SR; f = hz(m)
    x = np.sin(2 * np.pi * f * tt) + 0.4 * np.sin(4 * np.pi * f * tt) * np.exp(-tt / 0.03) + 0.2 * np.sin(6 * np.pi * f * tt) * np.exp(-tt / 0.02)
    return x * np.exp(-tt / 0.11) * g
arp = {"Am": [69, 72, 76, 72], "F": [65, 69, 72, 69], "C": [67, 72, 76, 72], "G": [67, 71, 74, 71]}
for i, ch in enumerate(PROG):
    if i in (0, 1, 2):
        for s in range(8):
            if i == 0 and s % 2: continue
            put(pl, pluck(arp[ch][s % 4], 0.22 if i else 0.16), i * BAR + s * BEAT / 2)
HOOK = [(0, 76), (0.75, 74), (1.5, 72), (2.0, 74), (2.5, 76), (3.0, 79), (3.5, 76)]   # en temps
for i in (4, 5, 6, 8):
    for (b, m), k in zip(HOOK, range(99)):
        mm = m - (2 if PROG[i] == "F" and m == 76 else 0)
        put(pl, pluck(mm, 0.26, 0.4), i * BAR + b * BEAT)
plL = reverb(pl, 1.2, 0.3); plR = reverb(np.roll(pl, 480), 1.2, 0.3)

# ---------- effets : montée, impacts ----------
fx = np.zeros(N)
n = int(3.75 * SR); tt = np.arange(n) / SR
riser = rng.standard_normal(n)
riser = fir_hp(riser, 1500, 63) * (tt / tt[-1]) ** 2.2
sweep = np.sin(2 * np.pi * np.cumsum(220 * 2 ** (tt / tt[-1] * 3)) / SR) * (tt / tt[-1]) ** 2
put(fx, 0.16 * riser + 0.06 * sweep, 4.0)
def impact(g=1.0):
    n = int(1.6 * SR); tt = np.arange(n) / SR
    boom = np.sin(2 * np.pi * np.cumsum(38 + 60 * np.exp(-tt / 0.08)) / SR) * np.exp(-tt / 0.45)
    crash = fir_hp(rng.standard_normal(n), 3500, 63) * np.exp(-tt / 0.5) * 0.35
    return (np.tanh(1.4 * boom) + crash) * g
put(fx, impact(0.75), 8.0)
put(fx, impact(0.6), 16.0)
# petite descente avant le drop (silence de 7,75 à 8 s) : filtre déjà ouvert, on coupe tout
gate = np.ones(N); a, b = int(7.75 * SR), int(8.0 * SR)
gate[a:b] = np.linspace(1, 0.05, b - a) ** 2
fxR = reverb(fx, 2.0, 0.3)

mixL = drums_L * 0.42 + padL + bass * 1.25 + plL * 1.6 + fxR
mixR = drums_R * 0.42 + padR + bass * 1.25 + plR * 1.6 + fxR
mixL *= gate; mixR *= gate
# fin : fondu des 0,6 dernières secondes
fo = np.ones(N); k = int(0.6 * SR); fo[-k:] = np.linspace(1, 0, k) ** 1.5
mixL *= fo; mixR *= fo
mixL = np.tanh(1.2 * mixL) / 1.2; mixR = np.tanh(1.2 * mixR) / 1.2
pk = max(np.abs(mixL).max(), np.abs(mixR).max()); mixL *= 0.9 / pk; mixR *= 0.9 / pk

out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "music.wav")
with wave.open(out, "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((np.stack([mixL, mixR], 1) * 32767).astype("<i2").tobytes())
print("music.wav", DUR, "s, crête", round(float(pk), 3))

if os.environ.get("STEMS"):
    def db(x, a, b):
        s = x[int(a * SR):int(b * SR)]; return round(20 * np.log10(np.sqrt((s ** 2).mean()) + 1e-9), 1)
    for nom, x in [("batterie", drums_L), ("pad", padL), ("basse", bass), ("pluck", plL), ("fx", fxR)]:
        print(nom, "intro", db(x, 0, 4), "montée", db(x, 4, 7.75), "drop", db(x, 8, 14), "fin", db(x, 16, 19))
