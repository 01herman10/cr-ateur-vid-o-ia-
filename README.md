# Créateur vidéo IA

Tout pour créer des vidéos avec l'IA : des outils qui tournent dans le navigateur, et un studio de motion design pour Claude Code.

| Outil | Page | Ce qu'il fait |
|---|---|---|
| Studio vidéo IA | `studio.html` | Fond, personnage animé, voix IA et sous-titres réunis dans une vidéo (WebM ou MP4) |
| Voix IA | `voix.html` | Texte → voix française (WAV) |
| Sous-titres IA | `sous-titres.html` | Transcription automatique (SRT, VTT) et incrustation dans la vidéo |
| Détourage IA | `detourage.html` | Retirer le fond d'une photo (personnes, objets, produits, véhicules) |
| Atelier vidéo | `video.html` | Couper, compresser, convertir en GIF, extraire le son |

## Studio de motion design dans Claude Code

Ce dépôt contient aussi des **compétences Claude Code** (dossier `.claude/skills/`) pour créer des vidéos animées en les décrivant.
Ouvrez une session Claude Code sur ce dépôt et demandez simplement, par exemple :
« Fais une vidéo de lancement pour https://mon-site.com », « Monte ces rushs et coupe les blancs », « Ajoute le sound design ».

| Catégorie | Outil | Compétences | Source et licence |
|---|---|---|---|
| Vidéos de lancement | **Product Launch Motion** : un lien de produit devient une vidéo de lancement | `product-launch-motion` | AbubakrChan/product-launch-motion, MIT |
| Vidéos de lancement | **Motion Graphics Skills** : 15 compétences (lancements, graphiques animés, réels) | `launch-video`, `apple-launch-film`, `animated-chart`, `milestone-reveal`, `title-sequence-3d`, `vox-explainer`, `reel-export`… | charlie947/motion-graphics-skills, MIT |
| Montage de vos vidéos | **HyperFrames** : coupe les blancs et les ratés, ajoute animations et sous-titres | `hyperframes`, `hyperframes-cli`, `media-use`, `reverse-any-video`, `slideshow`… | heygen-com/hyperframes, Apache 2.0 |
| Sound design | **Claude Motion** : goût du mouvement, vérification des images, moteur de sons sans échantillons | `claude-motion-design`, `sound-design`, `review-loop`, `web-sims` (outils dans `claude-motion/`) | whaleyxbt/claude-motion, MIT |
| Effets sur vos vidéos face caméra | **Claude Video Effects** : 51 effets qui suivent votre visage (orbite, projecteur, widgets en verre, bulles iMessage, mur de titres…), certains passent derrière votre tête | `effects` (tapez `/effects`) | Vibha-Ramprakash/claude-video-effects, MIT (polices OFL, modèles MIT et Apache 2.0) |
| Fondations | **Motion Design** : les 12 principes d'animation de Disney, adaptés | `motion-design` | LottieFiles/motion-design-skill, MIT |

Ces compétences s'appuient sur Node.js, Python, ffmpeg et Chromium, et installent leurs outils (`npx hyperframes`, `npm install`) au moment où on s'en sert.
Certaines options utilisent des services payants (voix HeyGen ou ElevenLabs, par exemple) : elles ne servent que si une clé d'API est fournie ; sinon, les compétences utilisent des solutions gratuites.
Le fichier de licence de chaque outil est dans son dossier.

## Services d'IA en ligne

Le carrousel « 7 outils IA payants… et leur version gratuite » présente 14 outils. Voici où en est chacun.

**Installé :**

| Service | Ce qu'il fait | Comment | Compte |
|---|---|---|---|
| **ElevenLabs** | Voix off de grande qualité | Connecteur hébergé officiel, déclaré dans `.mcp.json` : il tourne sur les serveurs d'ElevenLabs, rien n'est installé | Connexion à son compte ElevenLabs ; offre gratuite de 10 000 crédits par mois |

**Disponibles, pas encore installés** (ils téléchargent et lancent leur propre programme sur l'ordinateur : à ajouter seulement si vous le décidez) :

| Service | Ce qu'il fait | Source et licence | Compte |
|---|---|---|---|
| **MiniMax** (et **Hailuo**) | Voix, vidéos Hailuo, images, musique | github.com/MiniMax-AI/MiniMax-MCP, MIT (officiel) | Clé `MINIMAX_API_KEY` |
| **Nano Banana** | Création et retouche d'images (Gemini) | github.com/ConechoAI/Nano-Banana-MCP, MIT (communautaire) | Clé `GEMINI_API_KEY` (offre gratuite Google AI Studio) |
| **Higgsfield** | Images et vidéos (30+ modèles), photos produit, vidéos sans visage, miniatures YouTube | github.com/higgsfield-ai/skills, MIT (officiel) | Compte Higgsfield payant |

**Non installables ici :**

| Outil | Pourquoi |
|---|---|
| HeyGen (avatars) | Déjà couvert : HyperFrames (compétence `media-use`) sait utiliser les avatars et voix HeyGen |
| Hedra (avatars) | Pas d'outil libre sous licence sur GitHub ; s'utilise sur hedra.com |
| Midjourney (images) | Aucune interface officielle pour les programmes ; s'utilise sur midjourney.com |
| Runway (vidéos) | Connecteur officiel hébergé, à ajouter dans les connecteurs de claude.ai (runway.com/mcp) ; crédits Runway payants |
| Stable Diffusion | Logiciel libre (ComfyUI), mais il faut un ordinateur avec une carte graphique puissante |
| Canva Pro (design) | Connecteur Canva disponible dans les connecteurs de claude.ai |
| Lovart (design) | La compétence publiée par Lovart n'a pas de licence : elle ne peut pas être copiée ici |
| CapCut Pro, Edits (montage) | Applications à installer ; le montage est déjà couvert par HyperFrames |

## Modèles d'IA

Les moteurs d'IA tournent dans le navigateur. Les modèles sont téléchargés depuis huggingface.co au premier usage, puis gardés en cache par le navigateur :

| Usage | Modèle | Taille | Licence |
|---|---|---|---|
| Voix « Siwis » (femme) | Piper fr_FR-siwis-medium | ≈ 60 Mo | CC-BY 4.0 : citer « voix SIWIS » |
| Voix « Gilles » (homme) | Piper fr_FR-gilles-low | ≈ 60 Mo | CC0 |
| Voix « UPMC » (femme) | Piper fr_FR-upmc-medium | ≈ 75 Mo | CC-BY-SA 4.0 |
| Sous-titres rapides | Whisper base | ≈ 80 Mo | MIT |
| Sous-titres précis | Whisper small | ≈ 250 Mo | MIT |
| Détourage de personnes | MODNet | ≈ 7 Mo | Apache 2.0 |
| Détourage d'objets | ORMBG | ≈ 45 Mo | Apache 2.0 |

Ce qui n'est pas possible dans un navigateur : générer des images ou des vidéos entières par IA (décors, personnages réalistes, avatars qui parlent à partir d'une photo). Ces modèles demandent une carte graphique puissante sur un serveur.

## Vidéos d'annonce en série (Remotion)

Le dossier `video/` crée une vidéo verticale (TikTok, Reels, statut WhatsApp) : étiquette, titre, détails, prix et une dernière ligne.

- **Depuis GitHub, sans rien installer** : onglet **Actions → Créer une vidéo d'annonce → Run workflow**, puis téléchargez la vidéo dans **Artifacts**.
- **Sur un ordinateur** : `cd video && npm install && npm run studio` pour modifier le modèle en direct.

Remotion est gratuit pour les particuliers et les petites entreprises ; une entreprise plus grande a besoin d'une licence payante (voir remotion.dev/license).

## Vérification automatique

À chaque envoi sur GitHub, l'action **Vérification du site** contrôle que tous les liens, images et scripts des pages existent (`scripts/verifier-liens.mjs`).

## Logiciels libres inclus

| Outil | Version | Licence | Emplacement |
|---|---|---|---|
| ffmpeg.wasm | 0.12.15 | MIT | `lib/ffmpeg/` (le moteur FFmpeg, GPL, est chargé depuis cdn.jsdelivr.net) |
| transformers.js | 4.3.1 | Apache 2.0 | chargé depuis cdn.jsdelivr.net par `ia.js` ; ses fichiers ONNX Runtime sont dans `lib/transformers/` |
| ONNX Runtime Web | 1.30.0 et 1.31.0-dev | MIT | `lib/onnxruntime/`, `lib/transformers/` |
| piper-tts-web, piper-wasm | 1.0.5, 1.0.0 | MIT (données eSpeak NG : GPL-3.0) | `lib/piper/` |
| Police DejaVu Sans | – | licence libre DejaVu | `lib/polices/` |
| Remotion | 4.0.537 | Licence Remotion | `video/` (installé par npm) |

Le fichier de licence de chaque outil se trouve dans son dossier.
