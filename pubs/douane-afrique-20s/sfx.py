"""Bruitages de l'interface, synthétisés et placés par leur crête sur les repères du film (cues.json),
puis mélangés à la musique (music.wav). Sortie : mix.wav (48 kHz, stéréo).
Les sons tonals sont dans la gamme pentatonique de do, la tonalité de la musique.
"""
import json, os, wave
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
SR = 48000
rng = np.random.default_rng(11)
hz = lambda m: 440.0 * 2 ** ((m - 69) / 12)
PENTA = [72, 74, 76, 79, 81, 84, 86, 88, 91, 93]

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

def sound(kind, p):
    if kind == "pop": return pop([76, 79, 84, 88][int(p) % 4], 0.8), 0.0
    if kind == "whoosh": return whoosh(0.4, 700, 3000, 0.55), [-0.4, 0.4, -0.3, 0.3, 0.0][int(p) % 5]
    if kind == "morphbig": return whoosh(0.6, 300, 4200, 0.6), 0.0
    if kind == "chip": return chip_sound(p), (-0.25 if int(p) % 2 == 0 else 0.25)
    if kind == "click":
        x = np.zeros(int(0.12 * SR)); a = click(2400, 0.035, 0.9); b = click(3100, 0.03, 0.55)
        x[: len(a)] += a; x[int(0.07 * SR): int(0.07 * SR) + len(b)] += b
        return x, 0.1
    if kind == "key": return keystroke() * 0.5, 0.05
    if kind == "ready":
        x = np.zeros(int(0.45 * SR)); a = blip(79, 0.3, 0.07, 0.45); b = blip(84, 0.3, 0.09, 0.5)
        x[: len(a)] += a; i = int(0.1 * SR); x[i: i + len(b)] += b
        return x, 0.0
    if kind == "row": return blip(PENTA[int(p)] - 12, 0.4, 0.1, 0.6, 0.5), 0.0
    if kind == "odo": return click(4200, 0.012, 0.22), 0.15
    if kind == "settle": return bell([84, 88, 91], 1.4, 0.5, 0.75), 0.0
    if kind == "soft": return blip(76, 0.4, 0.12, 0.35, 0.2), 0.0
    if kind == "tick":
        x = click(2600, 0.03, 0.5); y = blip(PENTA[int(p) + 2], 0.3, 0.07, 0.45)
        y[: len(x)] += x
        return y, -0.15
    if kind == "chime": return bell([84, 91], 1.1, 0.4, 0.6), 0.0
    if kind == "dots":
        x = np.zeros(int(0.3 * SR))
        for k in range(3):
            b = blip(88, 0.06, 0.012, 0.25); i = int(k * 0.08 * SR); x[i: i + len(b)] += b
        return x, 0.0
    if kind == "message":
        x = np.zeros(int(0.7 * SR)); a = blip(79, 0.5, 0.12, 0.6); b = blip(84, 0.5, 0.16, 0.6)
        x[: len(a)] += a; i = int(0.11 * SR); x[i: i + len(b)] += b
        return x, 0.0
    if kind == "thump": return thump(0.7), 0.0
    raise ValueError(kind)

def chip_sound(p):
    x = blip(PENTA[int(p)], 0.25, 0.06, 0.55); c = click(3200, 0.02, 0.25); x[: len(c)] += c
    return x

def read_wav(path):
    with wave.open(path) as w:
        return np.frombuffer(w.readframes(w.getnframes()), "<i2").reshape(-1, w.getnchannels()).astype(np.float64) / 32767

music = read_wav(os.path.join(HERE, "music.wav"))
N = len(music)
fx = np.zeros((N, 2))
cues = json.load(open(os.path.join(HERE, "cues.json")))
for t, kind, p in cues:
    x, pan = sound(kind, p)
    x = np.asarray(x, dtype=np.float64)
    pk = int(np.argmax(np.abs(x)))                      # la crête du son tombe sur le repère
    i0 = int(round(t * SR)) - pk
    if i0 < 0: x = x[-i0:]; i0 = 0
    j = min(N, i0 + len(x))
    gl, gr = np.cos((pan + 1) * np.pi / 4) * 1.414, np.sin((pan + 1) * np.pi / 4) * 1.414
    fx[i0:j, 0] += x[: j - i0] * gl; fx[i0:j, 1] += x[: j - i0] * gr

mix = music * 0.5 + fx * 0.62
mix *= 0.84 / np.abs(mix).max()   # crête réelle sous -0,5 dBTP
out = os.path.join(HERE, "mix.wav")

# Voix off (si vo/voix.wav existe) : la musique baisse d'environ 9 dB et les bruitages de 3 dB pendant qu'elle parle.
VO = os.path.join(HERE, "vo", "voix.wav")
if os.path.exists(VO) and os.environ.get("SANS_VOIX") != "1":
    v = read_wav(VO)[:, 0][:N]; v = np.pad(v, (0, N - len(v)))
    win = int(0.03 * SR)
    act = (np.convolve(np.abs(v), np.ones(win) / win, "same") > 0.01).astype(float)
    # attaque 60 ms, relâchement 300 ms, sans état : deux lissages exponentiels appliqués par convolution
    att = np.exp(-np.arange(int(0.3 * SR)) / (0.3 * SR / 4)); att /= att.sum()
    act = np.clip(np.convolve(act, att, "full")[:N] * 4, 0, 1)
    act = np.maximum(act, np.clip(np.convolve(act[::-1], np.exp(-np.arange(int(0.06 * SR)) / (0.015 * SR)), "full")[:N][::-1] / (0.015 * SR), 0, 1))
    mus = music * 0.5 * (1 - 0.65 * act)[:, None]
    bru = fx * 0.62 * (1 - 0.3 * act)[:, None]
    voix = v[:, None] * 1.0
    # niveau de la voix : environ 6 dB au-dessus de la musique baissée
    rv = np.sqrt((voix[act > 0.5] ** 2).mean()); rm = np.sqrt((mus[act > 0.5] ** 2).mean())
    voix *= (rm * 2.0) / rv
    mix = mus + bru + voix
    mix *= 0.84 / np.abs(mix).max()
    out = os.path.join(HERE, "mix-voix.wav")
with wave.open(out, "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((mix * 32767).astype("<i2").tobytes())
with wave.open(os.path.join(HERE, "sfx.wav"), "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((np.clip(fx / max(1e-9, np.abs(fx).max()) * 0.9, -1, 1) * 32767).astype("<i2").tobytes())
print("mix.wav", len(cues), "bruitages placés")
