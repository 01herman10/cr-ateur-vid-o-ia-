"""Bruitages synthétisés, placés par leur crête sur les repères du film (cues.json), puis mixage final :
musique (music.wav) + bruitages + voix off (vo/voix.wav). Pendant que la voix parle, la musique baisse
d'environ 9 dB et les bruitages de 4 dB, pour que chaque mot reste clair. Sortie : mix.wav (48 kHz, stéréo).
Les sons tonals sont dans la gamme pentatonique de la (la tonalité de la musique).
"""
import json, os, wave
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
SR = 48000
rng = np.random.default_rng(11)
hz = lambda m: 440.0 * 2 ** ((m - 69) / 12)
PENTA = [69, 72, 74, 76, 79, 81, 84, 86, 88, 91]

def tt(d): return np.arange(int(d * SR)) / SR

def fir_lp(x, fc, taps=127):
    k = np.arange(taps) - (taps - 1) / 2
    h = np.sinc(2 * fc / SR * k) * np.hamming(taps); h /= h.sum()
    return np.convolve(x, h, mode="same")

def fir_bp(x, lo, hi): return fir_lp(x, hi) - fir_lp(x, lo)

def click(f=2200, d=0.04, g=1.0):
    t = tt(d)
    return g * (np.sin(2 * np.pi * f * t) * np.exp(-t / 0.008) + 0.6 * rng.uniform(-1, 1, len(t)) * np.exp(-t / 0.0012))

def keystroke():
    t = tt(0.03)
    nz = fir_bp(rng.standard_normal(len(t)), 2000, rng.uniform(3800, 5200)) * np.exp(-t / 0.003) * 2.2
    th = np.sin(2 * np.pi * rng.uniform(170, 230) * t) * np.exp(-t / 0.007) * 0.6
    return nz + th

def blip(m, d=0.35, tau=0.09, g=1.0, bright=0.35):
    t = tt(d); f = hz(m)
    x = np.sin(2 * np.pi * f * t) + bright * np.sin(4 * np.pi * f * t) * np.exp(-t / 0.04)
    a = np.minimum(1, t / 0.003)
    return g * x * a * np.exp(-t / tau)

def bell(ms, d=1.2, tau=0.45, g=1.0):
    t = tt(d); x = np.zeros(len(t))
    for m in ms:
        f = hz(m)
        x += np.sin(2 * np.pi * f * t) * np.exp(-t / tau) + 0.25 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t / (tau * 0.3))
    return g * x * np.minimum(1, t / 0.002) / len(ms)

def pop(m, g=1.0):
    t = tt(0.14); f0 = hz(m) * 0.55
    f = f0 * (1 + 1.2 * (1 - np.exp(-t / 0.02)))
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.045)
    c = click(3000, 0.01, 0.3); x[: len(c)] += c
    return g * x

def whoosh(d=0.42, f0=500, f1=2600, g=1.0):
    t = tt(d); n = len(t)
    nz = rng.standard_normal(n)
    # balayage : filtre passe-bande glissant, appliqué par blocs
    out = np.zeros(n); B = 960
    for i in range(0, n, B):
        x = i / n; fc = f0 * (f1 / f0) ** x
        seg = nz[max(0, i - 256): i + B + 256]
        y = fir_bp(seg, fc * 0.6, fc * 1.5)
        off = i - max(0, i - 256)
        out[i: i + B] = y[off: off + min(B, n - i)]
    env = np.sin(np.pi * np.clip(t / d, 0, 1)) ** 1.6
    return g * out * env

def thump(g=1.0):
    t = tt(0.35)
    x = np.sin(2 * np.pi * np.cumsum(70 + 80 * np.exp(-t / 0.03)) / SR) * np.exp(-t / 0.09)
    c = click(900, 0.03, 0.4); x[: len(c)] += c
    return g * x

def stutter(g=1.0):
    x = np.zeros(int(0.32 * SR))
    for k in range(6):
        n = int(0.022 * SR); t0 = int(k * 0.05 * SR); f = [880, 1240, 660, 1480, 990, 520][k]
        t = np.arange(n) / SR
        x[t0:t0 + n] += np.sign(np.sin(2 * np.pi * f * t)) * 0.35 + rng.uniform(-1, 1, n) * 0.25
    return g * fir_lp(x, 6000) * np.exp(-np.arange(len(x)) / SR / 0.25)

def sound(kind, p):
    p = int(p)
    if kind == "whoosh": return whoosh(0.45, 500, 3200, 0.5), [-0.4, 0.4, -0.3, 0.3, 0.0][p % 5]
    if kind == "warn":
        x = thump(0.6); a = blip(PENTA[p] - 12, 0.3, 0.08, 0.35); b = blip(PENTA[p] - 11, 0.3, 0.08, 0.25)
        y = np.zeros(max(len(x), len(a))); y[: len(x)] += x; y[: len(a)] += a + b[: len(a)]
        return y, [-0.3, 0.3, 0.0][p % 3]
    if kind == "glitch": return stutter(0.6), 0.0
    if kind == "key": return keystroke() * 0.3, 0.05
    if kind == "morphbig": return whoosh(0.6, 300, 4200, 0.6), 0.0
    if kind == "thump": return thump(0.8), 0.0
    if kind == "soft": return blip(76, 0.4, 0.12, 0.3, 0.2), 0.0
    if kind == "tick":
        x = click(2600, 0.03, 0.45); y = blip(PENTA[(p + 3) % len(PENTA)], 0.3, 0.07, 0.4); y[: len(x)] += x
        return y, -0.1
    if kind == "click":
        x = np.zeros(int(0.12 * SR)); a = click(2400, 0.035, 0.9); b = click(3100, 0.03, 0.55)
        x[: len(a)] += a; x[int(0.07 * SR): int(0.07 * SR) + len(b)] += b
        return x, 0.05
    if kind == "layer":
        w = whoosh(0.3, 900, 4200, 0.35); b = blip(PENTA[(p + 4) % len(PENTA)], 0.4, 0.1, 0.45, 0.5)
        y = np.zeros(max(len(w), len(b))); y[: len(w)] += w; y[int(0.12 * SR): int(0.12 * SR) + len(b)] += b[: len(y) - int(0.12 * SR)]
        return y, [0.3, 0.0, -0.3][p % 3]
    if kind == "beam": return whoosh(0.75, 1500, 7000, 0.35), 0.0
    if kind == "msg":
        x = np.zeros(int(0.6 * SR)); a = blip(76 + 3 * p, 0.45, 0.1, 0.5); b = blip(81 + 3 * p, 0.45, 0.14, 0.5)
        x[: len(a)] += a; i = int(0.1 * SR); x[i: i + len(b)] += b
        return x, 0.25 if p == 0 else -0.25
    if kind == "pop": return pop([76, 79, 84, 88][p % 4], 0.7), 0.0
    if kind == "shimmer": return bell([81, 88, 93], 1.6, 0.6, 0.6), 0.0
    if kind == "settle": return bell([81, 88], 1.2, 0.45, 0.5), 0.0
    raise ValueError(kind)

def read_wav(path):
    with wave.open(path) as w:
        x = np.frombuffer(w.readframes(w.getnframes()), "<i2").reshape(-1, w.getnchannels()).astype(np.float64) / 32767
    return x

music = read_wav(os.path.join(HERE, "music.wav"))
N = len(music)
fx = np.zeros((N, 2))
for t, kind, p in json.load(open(os.path.join(HERE, "cues.json"))):
    x, pan = sound(kind, p); x = np.asarray(x, dtype=np.float64)
    pk = int(np.argmax(np.abs(x))); i0 = int(round(t * SR)) - pk
    if i0 < 0: x = x[-i0:]; i0 = 0
    j = min(N, i0 + len(x))
    fx[i0:j, 0] += x[: j - i0] * np.cos((pan + 1) * np.pi / 4) * 1.414
    fx[i0:j, 1] += x[: j - i0] * np.sin((pan + 1) * np.pi / 4) * 1.414

v = read_wav(os.path.join(HERE, "vo", "voix.wav"))[:, 0]
v = np.pad(v, (0, max(0, N - len(v))))[:N]
# activité de la voix, lissée : attaque rapide, relâchement en douceur (300 ms)
win = int(0.02 * SR)
act = (np.convolve(np.abs(v), np.ones(win) / win, "same") > 0.008).astype(float)
k = int(0.3 * SR); rel = np.exp(-np.arange(k) / (0.1 * SR))
act = np.clip(np.convolve(act, rel / rel.max(), "full")[:N], 0, 1)
act = np.maximum(act, np.clip(np.convolve(act[::-1], np.exp(-np.arange(int(0.05 * SR)) / (0.012 * SR)), "full")[:N][::-1], 0, 1))
mus = music * 0.5 * (1 - 0.75 * act)[:, None]
bru = fx * 0.6 * (1 - 0.6 * act)[:, None]
on = act > 0.5
rv = np.sqrt((v[on] ** 2).mean()); rm = np.sqrt((mus[on] ** 2).mean())
voix = (v * (rm * 3.0) / rv)[:, None]                # voix ≈ 7,6 dB au-dessus de la musique baissée
mix = mus + bru + voix
mix *= 0.84 / np.abs(mix).max()
with wave.open(os.path.join(HERE, "mix.wav"), "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((mix * 32767).astype("<i2").tobytes())
print("mix.wav · voix", round(20 * np.log10(rv * (rm * 2.4) / rv * 0.84 / np.abs(mus + bru + voix).max() + 1e-9), 1), "dB")
