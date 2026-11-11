# Pub Douane Afrique v3 · le besoin d'abord

Vidéo verticale 1080×1920, 60 images/s, 33,5 s, voix off française, sous-titres mot à mot : `deliver/douane-afrique-v3.mp4`.
Texte validé par le propriétaire de Douane Afrique (besoin → solution → comment → pourquoi → vérification → appel à l'action).

| Partie | Voix off | À l'écran |
|---|---|---|
| Le besoin | Vous voulez importer une voiture d'Europe ? Mais combien va-t-elle vraiment vous coûter ? | La voiture traverse d'Europe vers l'Afrique de l'Ouest, « ??? FCFA », Douane ? TVA ? Papiers ? |
| La solution (temps fort) | Pas de panique : l'appli Douane Afrique a la solution. | Le soleil se lève, ✓, Douane Afrique, 8 pays de l'UEMOA |
| Comment | Choisissez le pays : Côte d'Ivoire, Sénégal ou Bénin. Entrez l'année et le prix. Et voilà le coût total, taxes comprises. | Téléphone : choix du pays, année, prix, puis le coût total (7 585 487 FCFA, vrai calcul pour une Corolla 2022 à 7 500 € livrée à Abidjan) |
| Pourquoi | Chaque taxe expliquée, l'âge vérifié, les papiers listés. Pour les particuliers comme pour les entreprises. | 3 tuiles, puis Particuliers / Entreprises |
| Vérification | Un doute sur une annonce ? On la vérifie pour vous. | Discussion WhatsApp, réponse sous 48 h |
| Action | Tout ça, dans une seule appli : Douane Afrique. Cliquez sur le lien dans la bio. Abonnez-vous, likez et partagez ! | Tout converge vers le soleil, logo, « Lien dans la bio », adresse, icônes S'abonner / J'aime / Partager |

Même chaîne que la v2 (voir `../douane-afrique-v2/README.md`) : `vo.mjs` → `voixoff.py` (moment de chaque mot, choisi sur les vraies
pauses de la voix) → `score.py` (temps fort sur la solution, respiration pendant les arguments) → `events.mjs` + `sfx.py`
(les bruitages tombent entre les mots, jamais dessus) → `render.mjs` → assemblage. Serveur local du film : port 8783.
Voix : SIWIS (CC-BY 4.0) — mentionner « voix SIWIS ». « likez » est écrit « laïkez » pour la voix.
