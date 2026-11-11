"""Voix off d'abord : on place chaque phrase sur la grille musicale (120 BPM), on mesure le moment de
chaque mot, et le film est construit sur ces temps (timing.js). Sorties : vo/voix.wav, timing.json, timing.js.

Le moment des mots vient du son lui-même : les pauses de la voix séparent les morceaux de phrase
(virgules, deux-points, points) ; dans un morceau, les mots se partagent le temps selon leurs syllabes.
"""
import json, math, os, re, subprocess, wave
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
SR = 48000
VOIX = "fr_FR-siwis-medium"
TEMPO = 1.07            # voix un peu accélérée : plus vive, toujours claire
BEAT = 0.5
LIGNES = json.load(open(os.path.join(HERE, "vo", "texte.json")))
DROP = "v2"             # le temps fort tombe sur la solution

def charge(p):
    with wave.open(p) as w:
        return np.frombuffer(w.readframes(w.getnframes()), "<i2").astype(np.float64) / 32767

def prepare(vid):
    src = os.path.join(HERE, "vo", f"{vid}-{VOIX}.wav"); tmp = os.path.join(HERE, "vo", f"_{vid}.wav")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", src, "-af",
        "silenceremove=start_periods=1:start_threshold=-42dB,"
        f"atempo={TEMPO},highpass=f=90,equalizer=f=3200:t=q:w=1.2:g=2.5,equalizer=f=250:t=q:w=1:g=-2,"
        f"acompressor=threshold=-20dB:ratio=3:attack=5:release=80:makeup=2,aresample={SR}", "-ac", "1", tmp], check=True)
    x = charge(tmp); os.remove(tmp)
    env = np.convolve(np.abs(x), np.ones(480) / 480, "same")
    fin = int(np.nonzero(env > 0.01)[0][-1]) + int(0.05 * SR)
    x = x[:fin]; x *= np.minimum(1, np.arange(len(x)) / (0.003 * SR))
    return x, env[:fin]

syll = lambda w: max(1, len(re.findall(r"[aeiouyàâäéèêëîïôöùûüœæ]+", w.lower())))
def morceaux(t):
    t = re.sub(r"\s+([?:!;])", "\u00a0\\1", t)          # « coûter ? » : la ponctuation reste collée au mot
    return [m.strip() for m in re.split(r"(?<=[,:.?!…])\s+", t) if m.strip()]

def mots_temps(x, env, dit, ecrit):
    """Renvoie [(mot affiché, début, fin)] en secondes depuis le début de la phrase."""
    pd, pe = morceaux(dit), morceaux(ecrit)
    assert len(pd) == len(pe), (dit, ecrit)
    on = env > 0.01
    # pauses : suites de silence d'au moins 60 ms à l'intérieur de la phrase
    pauses = []; i = 0; n = len(on)
    while i < n:
        if not on[i]:
            j = i
            while j < n and not on[j]: j += 1
            if i > 0 and j < n and (j - i) / SR >= 0.06: pauses.append(((i + j) / 2 / SR, (j - i) / SR, i / SR, j / SR))
            i = j
        else: i += 1
    k = len(pd) - 1
    tot = len(x) / SR
    sy = [sum(syll(w) for w in m.split(" ")) for m in pd]
    # choix des k pauses qui séparent les morceaux : on essaie toutes les combinaisons et on garde celle
    # dont les durées de morceaux collent le mieux au nombre de syllabes (débit régulier), en pénalisant
    # une longue pause laissée à l'intérieur d'un morceau.
    import itertools
    cands = [q for q in pauses if q[1] >= 0.05]
    bornes = None
    if k == 0: bornes = []
    elif len(cands) >= k:
        best = None
        for combo in itertools.combinations(cands, k):
            edges = [0.0] + [c[0] for c in combo] + [tot]
            parole = tot - sum(c[1] for c in combo)
            r = parole / sum(sy)
            cost = 0.0
            for i in range(len(pd)):
                a = edges[i] + (combo[i - 1][1] / 2 if i else 0); b = edges[i + 1] - (combo[i][1] / 2 if i < k else 0)
                cost += ((b - a) - sy[i] * r) ** 2 / (sy[i] * r) ** 2
            cost += 4.0 * sum(q[1] for q in cands if q not in combo and q[1] > 0.15)
            if best is None or cost < best[0]: best = (cost, combo)
        bornes = [(c[2], c[3]) for c in best[1]]
    if bornes is None:
        att = np.cumsum(sy)[:-1] / sum(sy) * tot
        bornes = [(a, a) for a in att]
    spans = []; d = 0.0
    for b0, b1 in bornes: spans.append((d, b0)); d = b1
    spans.append((d, tot))
    out = []
    for (a, b), md, me in zip(spans, pd, pe):
        we = me.split(" "); wd = md.split(" ")
        if len(we) == len(wd): poids = [syll(w) for w in wd]
        else: poids = [max(1, len(w)) for w in we]
        c = np.concatenate([[0], np.cumsum(poids)]) / sum(poids)
        for w, u, v in zip(we, c[:-1], c[1:]): out.append((w, a + (b - a) * u, a + (b - a) * v))
    return out

pistes = []
for vid, dit, ecrit in LIGNES:
    x, env = prepare(vid)
    pistes.append((vid, dit, ecrit, x, mots_temps(x, env, dit, ecrit)))

# placement sur la grille : chaque scène commence sur un temps, la voix 0,12 s après
scenes, t_fin = [], 0.0
for vid, dit, ecrit, x, mots in pistes:
    if not scenes: s = 0.0; debut = 0.4
    else:
        s = math.ceil((t_fin + 0.12) / BEAT) * BEAT; debut = s + 0.08
    scenes.append({"id": vid, "scene": s, "debut": debut, "fin": debut + len(x) / SR, "texte": ecrit,
                   "mots": [{"m": w, "a": round(debut + a, 3), "b": round(debut + b, 3)} for w, a, b in mots]})
    t_fin = debut + len(x) / SR
DUR = math.ceil((t_fin + 1.5) / BEAT) * BEAT
drop = next(s["scene"] for s in scenes if s["id"] == DROP)
timing = {"dur": DUR, "beat": BEAT, "drop": drop, "barOrigin": round(drop % 2.0, 3), "lignes": scenes}

N = int(DUR * SR); voix = np.zeros(N)
for sc, (_, _, _, x, _) in zip(scenes, pistes):
    i = int(sc["debut"] * SR); j = min(N, i + len(x)); voix[i:j] += x[: j - i]
voix *= 0.6 / np.abs(voix).max()
with wave.open(os.path.join(HERE, "vo", "voix.wav"), "wb") as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((voix * 32767).astype("<i2").tobytes())
json.dump(timing, open(os.path.join(HERE, "timing.json"), "w"), ensure_ascii=False, indent=1)
open(os.path.join(HERE, "timing.js"), "w").write("window.TIMING = " + json.dumps(timing, ensure_ascii=False) + ";\n")
for sc in scenes:
    print(f"{sc['id']} scène {sc['scene']:5.2f}  voix {sc['debut']:5.2f} → {sc['fin']:5.2f}  « {sc['texte']} »")
    print("     ", " ".join(f"{w['m']}@{w['a']:.2f}" for w in sc["mots"]))
print("durée", DUR, "s · temps fort", drop, "s")
