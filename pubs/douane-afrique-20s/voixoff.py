"""Voix off : place chaque phrase (vo/texte.json, voix Piper) à son temps et écrit vo/voix.wav (48 kHz, mono).
Chaque phrase est nettoyée (silence de début retiré, coupe-bas à 90 Hz) et légèrement accélérée si besoin.
Usage : python3 voixoff.py [voix]   (par défaut fr_FR-siwis-medium)
"""
import json, os, subprocess, sys, wave
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
SR = 48000
VOIX = sys.argv[1] if len(sys.argv) > 1 else "fr_FR-siwis-medium"
# (début de la parole en secondes, accélération) : calés sur les scènes du film
PLACE = {"v1": (0.2, 1.0), "v2": (2.6, 1.0), "v3": (4.4, 1.0), "v4": (8.15, 1.0),
         "v5": (11.95, 1.15), "v6": (13.72, 1.08), "v7": (16.25, 1.0)}

def charge(path):
    with wave.open(path) as w:
        return np.frombuffer(w.readframes(w.getnframes()), "<i2").astype(np.float64) / 32767

N = int(20.0 * SR)
voix = np.zeros(N)
for vid, _, _, texte in json.load(open(os.path.join(HERE, "vo", "texte.json"))):
    src = os.path.join(HERE, "vo", f"{vid}-{VOIX}.wav")
    tmp = os.path.join(HERE, "vo", f"_{vid}.wav")
    debut, tempo = PLACE[vid]
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", src, "-af",
                    f"silenceremove=start_periods=1:start_threshold=-42dB,atempo={tempo},highpass=f=90,aresample={SR}",
                    "-ac", "1", tmp], check=True)
    x = charge(tmp); os.remove(tmp)
    x = x[: int(np.nonzero(np.abs(x) > 0.004)[0][-1]) + int(0.08 * SR)]          # fin propre
    x *= np.minimum(1, np.arange(len(x)) / (0.004 * SR))
    i = int(debut * SR); j = min(N, i + len(x)); voix[i:j] += x[: j - i]
    print(f"{vid} {debut:5.2f} s → {debut + len(x) / SR:5.2f} s  « {texte} »")
voix *= 0.5 / np.abs(voix).max()
with wave.open(os.path.join(HERE, "vo", "voix.wav"), "wb") as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((voix * 32767).astype("<i2").tobytes())
