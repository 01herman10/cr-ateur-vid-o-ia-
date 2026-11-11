# Pub Douane Afrique v4 · le bonhomme, la vitrine, le calculateur

Vidéo verticale 1080×1920, 60 images/s, 51 s, voix d'homme, sous-titres mot à mot : `deliver/douane-afrique-v4.mp4`.
Texte validé par le propriétaire avant la production. Style clair, aux couleurs du vrai site, du début à la fin.

| # | Qui parle | Texte |
|---|---|---|
| 1 | Bonhomme | Si j'achète une voiture en Europe pour l'Afrique… combien ça va vraiment me coûter ? |
| 2 | Bonhomme | Attends… je vais chercher sur Internet ! |
| 3 | Narrateur | Bienvenue sur Douane Afrique ! Pourquoi nous choisir ? Laissez-moi vous expliquer. |
| 4 | Narrateur | La douane, la TVA, l'âge de la voiture, les papiers : fini les mauvaises surprises après l'achat ! |
| 5 | Narrateur | Un clic sur le calculateur… |
| 6 | Narrateur | Alors, choisissez le pays : Côte d'Ivoire, Sénégal ou Bénin. Entrez l'année, le prix… et voilà le coût total, taxe par taxe ! |
| 7 | Narrateur | L'âge est vérifié, et les papiers à préparer sont listés. |
| 8 | Narrateur | Un doute sur une annonce ? On la vérifie pour vous. |
| 9 | Narrateur | Aujourd'hui, on couvre huit pays d'Afrique de l'Ouest. Et bientôt, toute l'Afrique ! |
| 10 | Bonhomme | Particuliers ou entreprises, on vous attend ! Et en ce moment, c'est gratuit : profitez-en avant que ça change ! |
| 11 | Narrateur | Lien dans la bio. Abonnez-vous, likez, partagez ! |

Retouches faites pour la clarté de la voix (sens inchangé) : « Alors, » ajouté en 6, articles et « voiture » en 4,
« on couvre huit pays d'Afrique de l'Ouest » en 9 (« UEMOA » était mal prononcé ; l'écran affiche les 8 pays).

## Voix
Voix d'homme « Pierre » (modèle Piper UPMC, orateur 1, licence CC-BY-SA 4.0 : mentionner « voix UPMC » dans la description).
Le bonhomme : la même voix, un peu plus aiguë. Réglage vif (débit 0,9, expressivité 0,75) ajouté à l'outil Voix IA
(`lib/piper/piper-tts-web.js` : `globalThis.PIPER_REGLAGES`). Écritures pour la prononciation dans `vo/texte.json`
(« Dou-ane », « T V A », « laïquez »). Les phrases fragiles ont été générées 4 fois ; on garde la prise la mieux comprise
par Whisper. Contrôle final : la piste complète, musique comprise, est retranscrite presque mot pour mot.

## Image
Le bonhomme (dessiné en SVG, bouche animée par sa voix), recherche sur Internet, vitrine du site (vrais textes,
balance dessinée à la place de la photo dont la licence est inconnue), curseur qui clique sur « Calculer mes frais »,
calculateur, bulletin (vrais montants : Corolla 2022, 7 500 €, Abidjan), âge et papiers, vérification WhatsApp,
8 pays puis 54, « GRATUIT », appel à l'action.

## Refaire
Comme la v2/v3 (`../douane-afrique-v2/README.md`) ; serveur du film sur le port 8784 ; `node vo.mjs vo vo/texte.json` ;
mixage final normalisé : `ffmpeg -i mix.wav -af loudnorm=I=-14:TP=-1.5:LRA=9 mix-final.wav`.
