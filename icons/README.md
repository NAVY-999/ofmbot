# Pack d'icônes — écran d'accueil Android

Refonte des icônes de l'écran d'accueil. Traitement retenu : **M1 « Profondeur »** —
tuile charbon en dégradé, liseré lumineux sur l'arête haute, marques en dégradé.

Cinq apps : M.A.E.V.A, AntiReels, CIC, CIC Pay, PayPal.

## Fichiers à installer

Dans `final/` :

| Fichier | Usage |
|---|---|
| `maeva.png` `antireels.png` `cic.png` `cicpay.png` `paypal.png` | 512 × 512, fond transparent — **à utiliser par défaut** |
| `*-192.png` | 192 × 192, pour les launchers qui redimensionnent mal |
| `*.svg` | sources vectorielles, regénérables à n'importe quelle taille |

Le masque squircle est déjà appliqué et les coins sont transparents : les icônes se
posent telles quelles, sans recadrage.

## Poser une icône

Android ne permet pas de remplacer une icône depuis les réglages système, et **ni le
Pixel Launcher ni One UI Home (Samsung) ne le permettent non plus**. Les thèmes Samsung
n'appliquent que des packs complets, jamais une image choisie. D'où deux méthodes.

### Méthode A — changer de launcher (recommandée)

Remplace vraiment l'icône, sans badge ni doublon.

1. Installer **Nova Launcher**, **Lawnchair** ou **Niagara**, l'ouvrir une fois, puis le
   définir comme application d'accueil par défaut.
2. Copier les PNG sur le téléphone (`Téléchargements` convient — il suffit qu'ils soient
   visibles par la galerie).
3. Appui long sur l'app → **Modifier** (Nova) ou **Edit** (Lawnchair).
4. Toucher **l'icône affichée** dans la fenêtre — c'est elle le bouton, pas le nom.
5. Choisir **Images** / **Galerie**, sélectionner le PNG.
6. Valider, puis répéter pour les autres.

Coût : changer de launcher remplace tout l'écran d'accueil. Widgets et pages sont à
reposer une fois.

### Méthode B — garder son launcher

Une app tierce crée un raccourci qui porte la nouvelle icône et ouvre l'app d'origine.

1. Installer **X Icon Changer** ou **Shortcut Maker**.
2. Choisir l'app dans la liste, toucher l'icône, puis **Galerie** → le PNG.
3. Valider : le raccourci se pose sur l'écran d'accueil.
4. Retirer l'ancienne icône de l'écran d'accueil (l'app reste dans le tiroir, rien n'est
   désinstallé).

Coût : c'est un raccourci, pas l'app. Certains launchers ajoutent une petite flèche dans
un coin, et la pastille de notification ne suit pas toujours.

## Spécifications

- Canevas **108 dp**, masque **squircle** pré-appliqué.
- Tuile en dégradé diagonal `#2A2C33 → #0B0C0E`.
- Liseré lumineux de 1 dp sur l'arête haute, dégradé vers zéro à mi-hauteur.
- Glyphes blancs dégradés vers le gris froid `#FFFFFF → #BFC4CC`.
- **Famille paiement** (9 icônes) : accent crimson `#FF6178 → #E5334E → #A81232`.
- **Famille IA** (Claude, ChatGPT, Gemini) : quadrichromie Gemini — rouge `#EA4335` en haut,
  jaune `#FBBC05` à gauche, vert `#2FA75A` en bas, bleu `#3B82F6` à droite. Obtenue par trois
  nappes radiales sur une base bleue, appliquée à la marque via un masque : un masque et non
  un détourage, pour qu'il accepte aussi les tracés au trait comme le nœud OpenAI.
- **Famille système** (14 icônes) : **blanc pur `#FFFFFF`**, sans dégradé ni gris.
  Deux valeurs et rien entre les deux. Là où deux plans d'un même dessin se touchent, le
  second n'est pas grisé mais **percé** : on le remplit du même dégradé que la tuile
  (`url(#gTile1)`), ce qui le fait disparaître dedans. Aucun masque n'est nécessaire tant
  que la forme n'est pas transformée ; Wallhabit, qui l'est, passe par un masque.
  Sont des percements : les symboles de la calculatrice, les points et le bandeau du
  calendrier, les graduations et aiguilles du réveil, l'objectif de l'appareil photo, le
  pli et les lignes des notes, le cœur de la fleur, l'écart entre les deux bulles de
  Messages, et les briques derrière la main de Wallhabit.
- **Famille sociale** (9 icônes) : dégradé diagonal `#FFE93B → #FFC400 → #FF8A00 → #F0490A`,
  plus un halo clair en haut à gauche, repris des fonds d'écran fournis. Les contre-formes —
  triangle de YouTube, arcs de Spotify, P de Pinterest, combiné de WhatsApp — sont peintes en
  noir dans le masque, ce qui laisse voir la tuile à travers.

- **Famille verte** (leboncoin, Catawiki, Vinted) : dégradé diagonal à sept arrêts,
  `#62EC3C` à `#043A10`, qui **remonte deux fois** en cours de route (`#25BC32` à 52 %,
  `#14962A` à 86 %) — c'est ce qui donne de la variation à l'intérieur d'une même marque
  plutôt qu'un fondu uniforme. Plus un halo clair en haut à gauche.

  Les trois formes sont extraites des pixels des captures. Deux points de méthode :
  le **canal bleu** sépare l'orange du blanc pour leboncoin, là où la luminance échouait
  (rouge 249 contre 255) ; et le pli est extrait à part en **réutilisant le cadre** de la
  forme pleine, sinon chaque masque serait recadré sur ses propres limites et les deux se
  décaleraient.

  Le carré de leboncoin se cale dans l'**angle bas-droit**, pas au centre : c'est sa place
  dans le logo, et la découpe de la tuile lui rogne le coin extérieur comme le fait l'icône
  d'origine. Catawiki est décalé de 3 dp vers la gauche — géométriquement centré, sa grande
  arête droite tirait l'ensemble vers la droite.

### La règle pour les prochaines apps

**La forme du logo ne bouge pas ; la palette devient celle du pack.** On ne redessine
aucune marque — on la repeint. Tuile charbon, glyphe blanc, accent crimson, les mêmes
dégradés partout.

Le crimson va toujours à l'élément qui coupe ou qui entoure, le blanc au reste :

| Icône | Crimson | Blanc |
|---|---|---|
| M.A.E.V.A | le cercle | le M |
| AntiReels | la barre | le bouton lecture |
| CIC / CIC Pay | le « I » (et le mot « Pay ») | les deux C |
| PayPal | le P d'arrière-plan | le P avant |
| Wallet | la couche du bas, au bord ondulé | les couches empilées au-dessus |
| PaysafeCard | le triangle | le losange |
| Skrill | le losange | le triangle |
| Porte-cartes | la carte du dessous | le corps et le rabat |

La famille IA ne suit pas cette répartition : la marque entière reçoit le dégradé, sans blanc.

**PaysafeCard et Skrill partagent le même symbole** ; dans la réalité seule la couleur les
sépare. Le crimson est donc inversé de l'une à l'autre — sinon les deux icônes seraient
identiques sur l'écran d'accueil. La forme n'est pas touchée.

Seule entorse à la forme, validée explicitement : CIC a perdu ses blocs pleins. Repassés
en blanc, ils donnaient deux carrés dans lesquels les C disparaissaient à 48 dp.

### Deux limites connues

- **Les marques CIC dépassent le cercle de 72 dp.** Un « C I C » horizontal ramené à ce
  cercle deviendrait minuscule. Elles restent largement dans le squircle, donc rien n'est coupé —
  mais un launcher masquant en **cercle** les rognerait. Les trois autres icônes tiennent
  dans le cercle.
- **`cicpay.svg` et `burgerking.svg` dépendent d'une police** pour les mots « Pay » et
  « BURGER KING » (`Verdana`, repli `DejaVu Sans`). Les PNG, eux, sont rastérisés : ils ne
  dépendent de rien. C'est ce que tu installes.

## Tracer une marque exactement

Redessiner un logo à la main depuis une capture, en estimant les coordonnées à l'œil,
donne toujours un à-peu-près. Snapchat, WhatsApp et Pinterest en sont passés par là avant
d'être refaits autrement.

`extract-mask.mjs` extrait la forme **des pixels de la capture** au lieu de la retracer :

1. il repère le panneau de couleur unie qui entoure le logo,
2. il sépare la marque du fond par seuillage sur le canal qui les oppose
   (`lightOnColor` pour un logo clair sur fond coloré, `darkOnLight` pour un contour sombre),
3. il étiquette les composantes connexes et écarte celles qui pèsent moins de 5 % de la plus
   grosse — boutons d'interface, texte de la barre d'état,
4. il recadre au carré avec 7 % de marge et sort un masque blanc sur noir en 600 px.

Le masque est ensuite embarqué en base64 dans `pack.html` et la couleur passe à travers sa
luminance. La forme est donc exacte, au pixel près.

**À utiliser pour toute nouvelle marque un peu dessinée.** Il suffit d'une capture du logo
en grand sur fond uni. Les formes géométriques simples — Instagram, YouTube, les losanges
Paysafe — restent en tracé vectoriel, plus léger et sans perte à l'agrandissement.

## Regénérer

`pack.html` contient le tracé des cinq icônes et sert de planche de référence. Les exports
sont produits depuis cette page, donc modifier un tracé puis réexporter garde tout
synchronisé.

`maeva-antireels.html` conserve la comparaison des trois traitements (M1 Profondeur,
M2 Lueur, M3 Verre) ; `export/` en garde les six variantes.
