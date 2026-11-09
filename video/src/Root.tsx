import { Composition } from "remotion";
import { Annonce, AnnonceProps } from "./Annonce";

// Format vertical 1080x1920 (TikTok, Reels, statuts WhatsApp), 6 secondes.
const exemple: AnnonceProps = {
  etiquette: "Nouveau",
  titre: "Votre produit",
  details: "Neuf · Garantie 1 an",
  prix: "25 000 FCFA",
  lieu: "Livraison rapide",
};

export const RemotionRoot: React.FC = () => (
  <Composition
    id="Annonce"
    component={Annonce}
    durationInFrames={180}
    fps={30}
    width={1080}
    height={1920}
    defaultProps={exemple}
  />
);
