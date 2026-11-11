# Pub Douane Afrique · motion design 20 s

Vidéo verticale 1080×1920, 60 images/s, pour TikTok et le statut WhatsApp.
Deux versions dans `deliver/` : `douane-afrique-20s-voix-off.mp4` (avec voix off) et `douane-afrique-20s.mp4` (musique seule).

## L'histoire
| Temps | Scène |
|---|---|
| 0–2,5 s | L'étiquette « 7 500 € » d'une annonce : combien coûte vraiment la voiture à l'arrivée ? |
| 2,5–4 s | L'étiquette devient l'application, les 8 pays de l'UEMOA tombent un par un |
| 4–8 s | Le curseur remplit l'année et le prix : 3 infos suffisent |
| 8–12,25 s | Le bulletin s'ouvre sur le temps fort de la musique, chaque taxe arrive, le total défile |
| 12,25–13,5 s | Âge accepté, papiers cochés |
| 13,5–16 s | « Faire vérifier mon véhicule » devient une discussion WhatsApp |
| 16–20 s | Logo, slogan, adresse du site |

Une seule forme se transforme du début à la fin, sans coupure. Les montants sont les vrais résultats du
calculateur (`douane/regles.js` du site) pour une Toyota Corolla 2022 à 7 500 €, fret 400 €, assurance 100 €,
livrée à Abidjan : valeur en douane 5 247 656 FCFA, droits et taxes 2 337 831 FCFA, coût total 7 585 487 FCFA.

## Refaire la vidéo
```
python3 score.py                 # musique originale → music.wav
python3 -m http.server 8781 --bind 127.0.0.1 &
node events.mjs                  # repères sonores du film → cues.json
(cd ../.. && python3 -m http.server 8768 --bind 127.0.0.1 &)   # outil Voix IA du dépôt
node vo.mjs fr_FR-siwis-medium vo   # voix off Piper, phrase par phrase (texte : vo/texte.json)
python3 voixoff.py                  # place les phrases à leur moment → vo/voix.wav
python3 sfx.py                   # bruitages + voix off, musique baissée sous la voix → mix-voix.wav
SANS_VOIX=1 python3 sfx.py       # version sans voix → mix.wav
node snap.mjs <dossier> 2.1 8.4  # images de contrôle à des temps donnés
node render.mjs <dossier>        # rendu 60 i/s avec flou de mouvement, par tranches d'une seconde
ffmpeg -f concat -safe 0 -i <dossier>/segs.txt -i mix-voix.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 256k -shortest master.mp4
```
Tout est calculé à partir du temps dans `seek(t)` (`film.js`) : ressorts en forme fermée, aucune transition CSS.
Voix off : voix Piper « SIWIS » (licence CC-BY 4.0 : mentionner « voix SIWIS » dans la description de la vidéo).
Texte à lire pour l'enregistrer avec votre propre voix : `vo/TEXTE-A-LIRE.md`.
Polices : Archivo et IBM Plex (licence SIL OFL), copiées dans `fonts/`. Musique et bruitages : originaux, synthétisés.
