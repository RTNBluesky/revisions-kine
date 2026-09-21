# Révisions Kinésithérapie

Index général des supports de révision, organisés par **année** puis par **semestre** (4 années prévues, **Années 1 et 2 complètes** ; Années 3/4 à venir).

**État actuel : 726 pages · 307 QCM · 15 420 questions · 271 liens vidéo (117 vidéos distinctes).**

Les trois sections partagent **un seul style et un seul moteur de QCM** : mêmes feuilles
`assets/`, même bouton retour, même bascule Fiche ⇄ QCM, mêmes modes révision / examen,
même glissement automatique. Seule la couleur d'accent change — **rose pour K1 et K2,
indigo pour SVT** — pour distinguer d'un coup d'œil le cursus kiné du bac.

| Année | Fiches | QCM | Questions |
|---|---|---|---|
| **K1** — 1ère année (Théorique + Pratique) | 184 | 188 | 9 470 |
| **K2** — 2ème année (Théorique + Pratique) | 111 | 109 | 5 450 |
| **SVT** — Terminale Spécialité · Bac 2026 | 10 | 10 | 500 |

## Arborescence

```
.
├── index.html                    ← accueil du site — le SEUL index.html
├── glossaire.html                ← glossaire général, recherche et filtres
├── README.md · LICENSE
├── .nojekyll                     ← désactive Jekyll sur GitHub Pages
├── .gitignore
│
├── assets/                       ← toutes les ressources partagées
│   ├── css/
│   │   ├── style.css                 ← socle : fiches, tableaux, quiz (thème rose)
│   │   ├── chrome.css                ← bouton retour, bascule Fiche ⇄ QCM, impression
│   │   ├── hub.css                   ← pages d'accueil (site, année, branche, semestre)
│   │   ├── module.css                ← pages d'accueil de module (onglets, cartes)
│   │   ├── acces.css                 ← écran d'accès
│   │   ├── glossaire.css             ← soulignement et infobulle
│   │   └── modules/                  ← 23 feuilles spécifiques à un module
│   └── js/
│       ├── quiz.js                   ← moteur de quiz, exemplaire unique K1/K2/SVT
│       ├── acces.js                  ← écran d'accès (voir la section dédiée)
│       └── glossaire.js              ← 269 définitions + infobulles
│
├── annee-1/                      ← K1 — complète
│   ├── accueil-k1.html
│   ├── theorique/
│   │   ├── accueil-theorique.html
│   │   ├── semestre-1/               ← accueil-semestre-1.html + 6 modules
│   │   │   ├── anatomie/  biomechanique/  eaif/
│   │   │   ├── methodes-et-techniques-de-recherche/
│   │   │   └── physiologie/  psycho/
│   │   └── semestre-2/               ← accueil-semestre-2.html + 5 modules
│   │       └── anat/  eaif-2/  physio/  physio-patho/  socio/
│   └── pratique/
│       ├── accueil-pratique.html
│       ├── semestre-1/               ← 4 matières
│       └── semestre-2/               ← 4 matières
│
├── annee-2/                      ← K2 — complète
│   ├── accueil-k2.html
│   ├── theorique/
│   │   ├── semestre-1/               ← cardio-respi/  eaif-3/  mf-2/
│   │   │                                musculo-squelettique/  physio-patho-2/
│   │   └── semestre-2/               ← neuro-musculo-squelettique/  pbe/
│   │                                    pharmaco-imagerie/  rc-1/
│   └── pratique/
│       ├── semestre-1/               ← cardio-respi/  eaif-3/  musculo-squelettique/
│       └── semestre-2/               ← neuro-musculo-squelettique/
│
├── annee-3/  annee-4/            ← structure prête, contenu à venir
│   └── theorique|pratique/semestre-1|2/accueil-semestre-N.html
│
└── svt-bac/                      ← SVT Terminale Spécialité · Bac 2026
    ├── accueil-svt.html · antiseche.html
    ├── fiches/ (10) · qcm/ (10) · annales/ (10) · methodo/ (4)
    └── assets/css/                   ← mêmes feuilles, palette indigo
```

**Structure d'un module** — deux formes coexistent, toutes deux assumées :

```
<module>/                             <module>/
├── accueil-<module>.html             ├── accueil-<module>.html
├── antiseche.html                    ├── antiseche.html
└── <slug-du-cours>/                  ├── fiches/   (une fiche par cours)
    ├── fiche.html                    └── qcm/      (un QCM par cours)
    └── quiz.html
      « par cours »                        « par type »
   (tout K2, Biomécanique,              (modules K1 les plus anciens,
    Pratique, Anatomie II)               SVT)
```

### Conventions de rangement

- **Tout en minuscules, sans espace ni accent.** Dossiers en `kebab-case`
  (`annee-1/`, `physio-patho-2/`, `pharmaco-imagerie/`) : les URL de GitHub Pages
  restent lisibles, sans `%20` ni caractère à encoder.
- **Un seul `assets/` à la racine.** `quiz.js` et les feuilles du socle existent en
  exemplaire unique ; seul `svt-bac/` garde les siennes, parce que sa palette est indigo.
- **Un seul `index.html`, à la racine.** Toutes les autres pages d'accueil portent un nom
  explicite : `accueil-k1.html`, `accueil-theorique.html`, `accueil-semestre-1.html`,
  `accueil-<module>.html`. On sait ce qu'on ouvre sans lire le chemin.
- **Théorique et Pratique ont exactement la même forme** :
  `annee-N/<branche>/semestre-M/<module>/`. Un seul schéma de navigation pour tout le site.
- **K3 et K4 sont déjà câblées** : les pages de semestre existent et affichent « à venir ».
  Pour ouvrir un module, déposer son dossier dans le semestre et ajouter une carte sur la
  page du semestre — rien d'autre à toucher.
- **Le CSS vit dans `assets/css/`**, jamais en `<style>` inline, sauf le cas d'une feuille
  propre à une seule page où l'extraction n'apporterait rien.
- **Chaque page porte ses métadonnées** : `lang="fr"`, `charset`, `viewport`,
  `<title>`, `<meta name="description">` et un `<h1>` unique.


## Modules — annee-1

### Semestre 1

- **Psychologie du développement** — 15 cours sur le développement humain, de la conception à la vie adulte tardive (Freud, Erikson, Piaget, Vygotsky, Bronfenbrenner). 15 fiches · 16 QCM · **900 questions**.
- **Biomécanique (Mouvement et fonction I)** — 11 cours : principes biomécaniques (Newton, leviers, énergie), structure musculo-squelettique, complexes articulaires (épaule, coude, hanche, genou, cheville) et contrôle postural. 11 fiches · 11 QCM · **550 questions**.
- **EAIF I (Stratégies d'évaluation et d'intervention en physiothérapie I)** — 17 fiches sur 5 modules : massage (théorie + 5 techniques pratiques), PTAM (positions, transferts, aides à la marche), mobilisation articulaire, corps et conscience, programme UC. 17 fiches · 17 QCM · **807 questions**.
- **Physiologie I** — 8 cours fondamentaux : histologie animale, système tégumentaire, physiologie des membranes, systèmes nerveux, endocrinien, cardiovasculaire, lymphatique et respiratoire. 8 fiches · 8 QCM · **400 questions**.
- **Méthodes et Techniques de Recherche (MTR)** — 7 chapitres : démarche scientifique, pratique fondée sur les preuves (PBE), projet de recherche, méthodologie, recherche bibliographique (PubMed/PEDro/Cochrane), organisation et rédaction scientifique (APA 7) + QCM Annales transversal. 7 fiches · 8 QCM · **400 questions**.
- **Anatomie I** — 20 cours en 3 volets : ostéologie & arthrologie (7 cours : crâne, colonne, thorax, membres), myologie (7 cours par région), neurologie (6 cours : SNC, SNP, voies sensitives/motrices, cervelet, cerveau, SNA). 20 fiches · 20 QCM · **976 questions**.

### Semestre 2

- **Physiopathologie** — Neuroanatomie, neurologie (système nerveux, lésions centrales, médullaires, périphériques) et travaux pratiques. 23 fiches · 23 QCM · **1 150 questions**.
- **Physiologie II** — Six chapitres : digestif, urinaire, équilibre acido-basique, reproducteur, exercice et physiologie de la vie quotidienne. 6 fiches · 6 QCM · **300 questions**.
- **Sociologie de la santé** — Sept fiches sur santé/maladie, comportement face à la maladie, perspectives, maladies chroniques, handicap, médicalisation et conceptions de la santé. 7 fiches · 9 QCM · **562 questions**.
- **EAIF II** — Stratégies d'évaluation et d'intervention en physiothérapie II : test musculaire, goniométrie, mobilisation accessoire, exercices thérapeutiques et immobilisation sélective. 14 fiches · 14 QCM · **700 questions**.
- **Anatomie II** — Quatre grands systèmes : digestif & endocrinien, urinaire & reproducteur, cardio-lymphatique, respiratoire. 28 fiches · 28 QCM · **1 400 questions**.

### Pratique

Huit matières réparties sur les deux semestres : anatomie palpatoire, massage, mobilisation physiologique, positionnements et transferts (S1) ; goniométrie, immobilisation sélective, mobilisation accessoire, testing (S2). 28 fiches · 28 QCM · **1 325 questions**.

**Total annee-1 : 184 fiches · 188 QCM · 9 470 questions.**

## Modules — annee-2

### Semestre 1

- **Conditions Musculo-squelettiques** — 9 cours : cicatrisation des tissus mous, lésions musculaires, tendineuses et capsulo-ligamentaires, dysfonctions biomécaniques, osseuses et cartilagineuses, dysfonctions vertébrales, rhumatologie métabolique et exercice en CMS ; + fiches de travail et fiches de cas. 11 fiches · 9 QCM · **450 questions**.
- **Cardio-respiratoire** — 12 cours : transport de l'O₂, examen subjectif, imagerie du thorax, radiographie pathologique, gazométrie, EFR, aspiration, ECG, réadaptation cardiovasculaire, ventilation mécanique, patient critique et pédiatrie. 12 fiches · 12 QCM · **600 questions**.
- **EAIF III** — 6 blocs : chaînes musculaires, PNF, rééducation posturale, santé au travail, stabilité dynamique de l'épaule et stabilité lombaire dynamique. 6 fiches · 6 QCM · **300 questions**.
- **Mouvement & Fonction II** — 8 cours de contrôle moteur : mouvement humain, système somatosensoriel, systèmes visuel et vestibulaire, cortex cérébral, cervelet, noyaux gris centraux, neuroplasticité et apprentissage moteur. 8 fiches · 8 QCM · **400 questions**.
- **Physiopathologie II** — 3 modules : pathologies cardiovasculaires et hématologiques (4 cours), pathologies digestives et rénale (5 cours), système endocrinien, diabète, stress et sommeil, psychiatrie, reproducteur et tégumentaire (6 cours). 15 fiches · 15 QCM · **750 questions**.

### Semestre 2

- **Neuro-musculo-squelettique** — Conditions neurologiques centrales et périphériques, évaluation et intervention. 10 fiches · 10 QCM · **500 questions**.
- **Pratique fondée sur les preuves (PBE)** — Science et méthode scientifique, questions cliniques, étapes du processus de recherche, design et types d'études (primaires, secondaires, méthodologiques), méthodes et instruments d'évaluation des résultats, statistiques, PBE et pratique informée par l'évidence + une fiche d'annexes répertoriant les checklists (CONSORT, STROBE, PRISMA, CARE, SQUIRE, AGREE, COSMIN, Beaton). 8 fiches · 8 QCM · **400 questions**.
- **Pharmacologie & imagerie** — Pharmacologie générale, pharmacocinétique (ADME et voies d'administration), groupes thérapeutiques (SNC, antalgiques, cardiovasculaire, respiratoire, digestif) ; méthodes d'imagerie (RX, TDM, IRM, échographie), anatomie radiologique, pathologie du thorax et pathologie ostéoarticulaire. 6 fiches · 6 QCM · **300 questions**.
- **Raisonnement clinique I** — Processus et stratégies du raisonnement clinique, cadre de la CIF et processus kinésithérapique, puis application à des cas cliniques cardio-respiratoires, musculo-squelettique et neurologiques (AVC, lésion médullaire). 5 fiches · 5 QCM · **250 questions**.

### Pratique

Quatre matières : cardio-respiratoire, EAIF III, musculo-squelettique (S1) et neuro-musculo-squelettique (S2). 30 fiches · 30 QCM · **1 500 questions**.

**Total annee-2 : 111 fiches · 109 QCM · 5 450 questions.**

## Stack technique

- HTML/CSS/JS statique (zéro build, déployable tel quel)
- **Un seul moteur de QCM pour tout le site** : `assets/js/quiz.js`, identique au fichier près en K1 et en K2. Chaque page déclare `window.QUIZ = {titre, fiche, questions:[…]}` puis appelle `demarrerQuiz()`.
  - une question : `{ q, o: […], r, e }` — `o` accepte un nombre libre de propositions ;
  - `r` est un **nombre** → une seule bonne réponse, boutons radio ;
  - `r` est un **tableau** → plusieurs bonnes réponses, cases à cocher et bouton « Valider » (408 questions du site sont dans ce cas) ;
  - options mélangées à chaque passage, ordre des questions conservé ;
  - deux modes, **révision** (correction immédiate) et **examen** (score à la fin), mémorisés en `localStorage` ;
  - **glissement automatique** vers la question suivante après chaque réponse : immédiat en examen, après 0,5 s en révision (le temps de lire la justification). Le glissement est annulé si tu scrolles toi-même, saute les questions déjà répondues, et laisse la main sur les QCM à plusieurs réponses en mode examen.
- **Une seule feuille de style par rôle**, partagée par les deux années :
  - `assets/css/style.css` — fiches et pages de QCM ;
  - `assets/css/chrome.css` — la navigation commune (bouton retour, bascule Fiche ⇄ QCM, fil d'Ariane, pied de page) ; importée par `style.css`, et chargée seule par les fiches qui gardent leur propre mise en page ;
  - `assets/css/module.css` — index de module (hero, cartes de statistiques, onglets) ;
  - `assets/css/hub.css` — pages de regroupement (accueil, année, semestre).
- **Une seule palette, deux accents** : fonds `#0f1117 → #20243a` et textes `#e8eaf0 / #9aa3b8 / #6a7388` partout ; accents **roses** `#ff6b9d · #ff5c6b · #f472b6 · #ff8fa3` en K1/K2 et **indigo** `#7c6cf5 · #6366f1 · #8b7cf8 · #a5a0ff` en SVT. Le vert `#3dd68c` (« correct ») et le rouge `#ff5c6b` (« faux ») sont identiques dans les deux thèmes : une mauvaise réponse doit rester rouge quel que soit l'habillage.
- Les feuilles de `svt-bac/assets/` sont **le même code** que celles de `annee-1/assets/` : seules les déclarations d'accent diffèrent.
- Polices Google Fonts : Playfair Display (titres) + Source Sans 3 (texte)

## Glossaire

269 termes et sigles définis à partir des fiches, répartis en 13 domaines. Le dictionnaire
vit en un seul exemplaire dans `assets/js/glossaire.js` : le corriger une fois le corrige partout.

Dans les fiches, un terme repéré est écrit `<span class="def" data-terme="cle">mot</span>` ;
le script pose le soulignement pointillé, l'infobulle, l'accès clavier et un repli `title`
si le JavaScript est bloqué. La page `glossaire.html`, à la racine, lit le même dictionnaire
et ajoute la recherche et le filtre par domaine.

**Ajouter un terme** — l'écrire dans le dictionnaire, puis marquer sa première occurrence
dans les fiches concernées. Une seule occurrence par fiche : au-delà, le texte devient illisible.

**Attention aux sigles polysémiques.** `AP` vaut antéro-postérieur en musculo-squelettique,
activité physique en santé publique, et initiales d'auteur dans une référence. Plusieurs clés
portent donc une restriction de terrain, et `sensibilité` n'est jamais marqué automatiquement :
le mot désigne aussi bien la sensibilité d'un test que la sensibilité cutanée.

## Écran d'accès

Toutes les pages chargent `assets/css/acces.css` et `assets/js/acces.js` : un écran
demande un **code d'accès** avant de laisser naviguer. Le déverrouillage vaut pour la
**session** (onglet fermé = code redemandé).

> ⚠ **Ce n'est pas une sécurité.** Le site est statique : son contenu est livré au
> navigateur *avant* d'être masqué. Qui ouvre les outils de développement, désactive
> JavaScript ou lit le dépôt passe outre en quelques secondes. Le verrou évite seulement
> qu'on tombe sur le site par hasard et qu'on s'y promène.
>
> Pour une **vraie** protection il faut un dépôt privé et une authentification côté
> serveur — Cloudflare Access ou Netlify Identity, que GitHub Pages ne sait pas faire.

Sans JavaScript, rien n'est masqué : le site reste consultable plutôt que de rester noir.
C'est un choix assumé — un verrou JavaScript ne peut de toute façon rien contre un
navigateur sans JavaScript, autant ne pas casser la page.

**Changer le code** — dans la console du navigateur, sur n'importe quelle page :

```js
codeAcces('MonNouveauCode')
```

puis recopier l'empreinte affichée dans la constante `EMPREINTE`, au début de
`assets/js/acces.js`.

## Déploiement GitHub Pages

Le fichier `.nojekyll` désactive le traitement Jekyll pour préserver tous les fichiers tels quels.

**Aucun chemin du site ne contient d'accent.** C'est délibéré : macOS écrit les accents sous forme décomposée (`e` + accent combinant) alors qu'un lien HTML les écrit sous forme composée. Les deux se ressemblent à l'écran et le Finder les confond, mais un serveur HTTP compare les chemins octet par octet — un dossier `Année 1` sur le disque et un lien `Année 1` dans le HTML donnent alors une 404 en ligne alors que tout marche en local. D'où `annee-1`, `biomechanique`, `methodes-et-techniques-de-recherche`. Même logique pour les espaces et les majuscules : tout est en `kebab-case`, donc aucune URL n'a besoin d'être encodée. **À conserver : ni accent, ni espace, ni majuscule dans un nom de dossier.**

Pour publier :

1. Pousser le dossier sur un dépôt GitHub
2. Settings → Pages → Source : `main` / `/ (root)`
3. L'URL sera `https://<utilisateur>.github.io/<dépôt>/`

## Navigation

- L'**accueil** propose un sélecteur par année : K1, K2, K3, K4 et SVT Bac
- Chaque **année** s'ouvre sur deux entrées : **Théorique** et **Pratique**, puis un semestre, puis un module
- Chaque **index de module** a 2 onglets : **📝 QCM interactifs** et **📚 Fiches de révision**
- Chaque module dispose d'une **antisèche** (bannière orange sur l'index) : vocabulaire, chiffres-clés et repères condensés, sans explication, à relire juste avant l'examen
- Sur chaque **fiche** et chaque **QCM** : bouton retour « ← *NomModule* » en haut à gauche et bascule 📝 QCM ⇄ 📚 Fiche en haut au centre — même composant, même animation, en K1 comme en K2
- Le dossier **svt-bac** suit exactement la même mise en page et les mêmes animations, en indigo
- Sur chaque **QCM** : mêmes éléments, barre de progression, compteur, et choix du mode **révision** (correction immédiate avec justification) ou **examen** (correction et score à la fin)
