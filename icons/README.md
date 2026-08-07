# Icônes — M.A.E.V.A & AntiReels

Refonte des icônes de l'écran d'accueil Android. L'identité d'origine est conservée
(tuile sombre, accent crimson, glyphe blanc) ; seule la matière change.

**Version retenue : M1 « Profondeur ».**

## Fichiers à installer

Dans `final/` :

| Fichier | Usage |
|---|---|
| `maeva.png`, `antireels.png` | 512 × 512, fond transparent — **à utiliser par défaut** |
| `maeva-192.png`, `antireels-192.png` | 192 × 192, pour les launchers qui redimensionnent mal |
| `maeva.svg`, `antireels.svg` | sources vectorielles, regénérables à n'importe quelle taille |

Le masque squircle est déjà appliqué et les coins sont transparents : les icônes
se posent telles quelles, sans recadrage.

## Poser une icône

Android ne permet pas de remplacer une icône depuis les réglages système. Il faut
un launcher qui l'accepte — Nova, Lawnchair ou Niagara.

1. Copier les PNG sur le téléphone (n'importe quel dossier visible par la galerie).
2. Appui long sur l'app → **Modifier**.
3. Toucher l'icône affichée dans la boîte de dialogue.
4. Choisir **Images** / **Galerie**, puis le PNG correspondant.

Compter une vingtaine de secondes par app.

## Spécifications

- Canevas **108 dp**, zone sûre **72 dp** — tout le dessin tient dans le cercle central,
  donc rien n'est coupé quel que soit le masque du launcher (cercle, squircle, carré arrondi).
- Tuile en dégradé diagonal `#2A2C33 → #0B0C0E`.
- Liseré lumineux de 1 dp sur l'arête haute, dégradé vers zéro à mi-hauteur.
- Accents en dégradé crimson `#FF6178 → #A81232`.
- Glyphes blancs dégradés vers le gris froid `#FFFFFF → #BFC4CC`.

## Regénérer

Les icônes sont dessinées dans `maeva-antireels.html`, qui sert aussi de planche de
comparaison des trois traitements (M1 Profondeur, M2 Lueur, M3 Verre). Les exports
sont produits depuis cette page, donc modifier le tracé dans le HTML puis réexporter
garde tout synchronisé.

`export/` contient les six variantes (les trois traitements × deux apps), conservées
comme alternatives.
