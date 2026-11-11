# Pub Douane Afrique v2 · motion design avec voix off

Vidéo verticale 1080×1920, 60 images/s, 27,5 s, pour TikTok et le statut WhatsApp : `deliver/douane-afrique-v2.mp4`.
Inspirée de la pub « Mavena » (fond nuit, soleil lumineux, panneaux de verre en 3D qui s'empilent, texte tapé).

## Le texte (même structure que la référence)
| Rôle | Voix off |
|---|---|
| Question | 7 500 €. Mais combien va-t-elle vraiment vous coûter ? |
| Problème | Droits de douane, TVA, refus au port : les surprises arrivent après l'achat. |
| Simplicité | Avec l'appli Douane Afrique : le pays, l'année, le prix. C'est tout. |
| Valeur empilée | Chaque taxe est calculée, l'âge vérifié, les papiers listés. |
| Promesse | Vous voyez le vrai prix, avant d'acheter. |
| Offre | Un doute ? On vérifie l'annonce pour vous. |
| Action | Calculez gratuitement sur Douane Afrique. Et pesez le vrai prix. |

## Outils utilisés (dépôt Créateur vidéo IA)
- **Voix** : Voix IA (Piper), voix « SIWIS » — la plus claire des voix françaises testées
  (retranscription par Whisper : 12 % d'erreurs pour SIWIS seule, 4 % sur le mixage final ; UPMC 36 %, MLS inutilisable).
  « TVA » est écrit « té vé a » pour la voix (`vo/texte.json` : texte dit / texte affiché).
- **Synchronisation** : Sous-titres IA (Whisper) pour vérifier ; le moment de chaque mot vient des pauses de la voix (`voixoff.py` → `timing.js`).
  Le film est construit sur ces temps : chaque panneau, chaque champ, chaque mot du sous-titre suit la voix.
- **Animation** : méthode Product Launch Motion / Launch Video (ressorts, `seek(t)`, rendu 60 i/s avec flou de mouvement).
- **Son** : musique originale (`score.py`) et bruitages (`sfx.py`) calés sur les repères du film ; la musique baisse de 9 dB sous la voix.

## Refaire la vidéo
```
(cd ../.. && python3 -m http.server 8768 --bind 127.0.0.1 &)     # outils Voix IA et Sous-titres IA
node vo.mjs fr_FR-siwis-medium vo          # voix, phrase par phrase
python3 voixoff.py                         # placement sur la grille, moment de chaque mot → timing.js, vo/voix.wav
python3 score.py                           # musique (temps fort sur « Chaque taxe est calculée »)
python3 -m http.server 8782 --bind 127.0.0.1 &
node events.mjs && python3 sfx.py          # repères sonores → bruitages + mixage final → mix.wav
node ecoute.mjs <fichier.wav>              # contrôle : retranscription par Whisper
node render.mjs <dossier>                  # rendu
ffmpeg -f concat -safe 0 -i <dossier>/all.txt -i mix.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 256k -t 27.5 deliver/douane-afrique-v2.mp4
```
Voix : SIWIS (CC-BY 4.0) — mentionner « voix SIWIS » dans la description de la vidéo. Polices Archivo et IBM Plex (SIL OFL).
Musique et bruitages : originaux.
