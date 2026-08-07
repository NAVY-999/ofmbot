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
- Crimson `#FF6178 → #E5334E → #A81232` pour M.A.E.V.A, AntiReels et les deux CIC.
- PayPal garde ses propres bleus `#9BA9EC → #5F72CB` et `#FFFFFF → #D3DBF2`.

### La règle pour les prochaines apps

**Le logo ne se retouche pas — seule la matière autour change.** Chaque marque garde sa
forme et ses couleurs ; on lui applique la tuile charbon, le liseré et les dégradés, rien
de plus. Ne dévier qu'en cas de nécessité réelle, et le dire.

Les deux CIC sont la seule exception à ce jour, validée explicitement : leurs aplats bleu
et turquoise, repassés en blanc, donnaient deux carrés pleins dans lesquels les C
disparaissaient à 48 dp. Le mot « Pay » suit le même crimson pour rester cohérent avec eux.

### Deux limites connues

- **Les marques CIC dépassent le cercle de 72 dp.** Un « C I C » horizontal ramené à ce
  cercle deviendrait minuscule. Elles restent largement dans le squircle, donc rien n'est coupé —
  mais un launcher masquant en **cercle** les rognerait. Les trois autres icônes tiennent
  dans le cercle.
- **`cicpay.svg` dépend d'une police** pour le mot « Pay » (`Verdana`, repli `DejaVu Sans`).
  Les PNG, eux, sont rastérisés : ils ne dépendent de rien. C'est ce que tu installes.

## Regénérer

`pack.html` contient le tracé des cinq icônes et sert de planche de référence. Les exports
sont produits depuis cette page, donc modifier un tracé puis réexporter garde tout
synchronisé.

`maeva-antireels.html` conserve la comparaison des trois traitements (M1 Profondeur,
M2 Lueur, M3 Verre) ; `export/` en garde les six variantes.
