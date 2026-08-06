# ============================================================
#  SonoMap - Phase 3 : creation des 24 tickets GitHub
#  Equipe 15 - IFT3225
#
#  PREREQUIS :
#    1. GitHub CLI installe :  winget install --id GitHub.cli
#       (fermer et rouvrir PowerShell apres l'installation)
#    2. Authentifie :          gh auth login
#    3. Lance depuis le dossier du projet :
#       cd C:\Users\siada\sonomap
#       .\creer-issues-phase3.ps1
# ============================================================

# --- A VERIFIER AVANT DE LANCER ---------------------------------
$ADAM = "Adam-rh"      # ton compte GitHub
$SAMI = "samruhix"     # <-- VERIFIE ce handle (vu sur un commit du depot)
# ----------------------------------------------------------------

$ErrorActionPreference = "Stop"

Write-Host "`n=== Verification de gh ===" -ForegroundColor Cyan
try {
    gh auth status
} catch {
    Write-Host "GitHub CLI absent ou non authentifie." -ForegroundColor Red
    Write-Host "  winget install --id GitHub.cli"
    Write-Host "  gh auth login"
    exit 1
}

# ---------- Labels ----------
Write-Host "`n=== Creation des labels ===" -ForegroundColor Cyan

$labels = @(
    @{ n = "backend";       c = "1d76db"; d = "API Express, services, repositories" },
    @{ n = "frontend";      c = "5319e7"; d = "Client React" },
    @{ n = "tests";         c = "0e8a16"; d = "Tests unitaires Vitest" },
    @{ n = "cache";         c = "fbca04"; d = "Strategie de cache" },
    @{ n = "deploiement";   c = "d93f0b"; d = "Render, CORS, variables d env" },
    @{ n = "documentation"; c = "c5def5"; d = "Rapport, README, mesures" },
    @{ n = "phase-3";       c = "b60205"; d = "Livrable 3" }
)

foreach ($l in $labels) {
    try {
        gh label create $l.n --color $l.c --description $l.d 2>$null
        Write-Host "  + $($l.n)" -ForegroundColor Green
    } catch {
        Write-Host "  = $($l.n) (existe deja)" -ForegroundColor DarkGray
    }
}

# ---------- Fonction utilitaire ----------
function New-Ticket {
    param(
        [string]$Titre,
        [string]$Corps,
        [string]$Labels,
        [string]$Assigne,
        [switch]$Fermer
    )

    $sortie = gh issue create --title $Titre --body $Corps --label $Labels --assignee $Assigne
    Write-Host "  + $Titre" -ForegroundColor Green

    if ($Fermer) {
        $numero = ($sortie -split "/")[-1]
        gh issue close $numero --comment "Termine - voir les commits de la branche phase-3." | Out-Null
        Write-Host "    (ferme)" -ForegroundColor DarkGray
    }
}

# ============================================================
#  TICKETS TERMINES - ADAM  (crees puis fermes immediatement)
# ============================================================
Write-Host "`n=== Tickets termines (Adam) ===" -ForegroundColor Cyan

New-Ticket -Assigne $ADAM -Labels "backend,phase-3" -Fermer `
  -Titre "refactor(backend): decoupage en couches config / repositories / services" -Corps @"
Sortir la logique metier des handlers de route pour la rendre testable et cachable.

- ``src/config/seuils.js`` : seuils 40/60 sortis du code en dur
- ``src/repositories/`` : seuls fichiers important Mongoose
- ``src/services/ambiance.js`` : fonctions pures (calculerSnapshot, grouperParHeure, grouperParTranche, calculerStats)
- ``src/routes/ambiance.js`` : reduit a req/res

Les agregations ``\$group`` MongoDB sont remplacees par du calcul JS.
Arbitrage assume : moins performant a tres grand volume, mais testable et memoisable.

**Fait** - comportement des endpoints inchange, verifie sur donnees reelles.
"@

New-Ticket -Assigne $ADAM -Labels "backend,phase-3" -Fermer `
  -Titre "feat(ambiance): endpoint SSE /stream absent depuis la phase 2" -Corps @"
``LieuPage.jsx`` ouvrait un ``EventSource`` vers ``/ambiance/:location/stream``, route qui n'existait pas cote backend. L'indicateur "En direct" ne s'allumait jamais.

- Snapshot pousse aux 15 s
- En-tetes ``Cache-Control: no-cache, no-transform`` et ``X-Accel-Buffering: no`` (sinon le proxy bufferise le flux)
- Heartbeat aux 25 s pour que Render ne coupe pas la connexion
- Nettoyage des intervalles sur ``req.on("close")``

**Fait** - aucune modification necessaire cote frontend, le format correspondait deja.
"@

New-Ticket -Assigne $ADAM -Labels "tests,phase-3" -Fermer `
  -Titre "test(services): suite Vitest sur les services d ambiance" -Corps @"
23 tests, 5 services couverts, lances par ``npm test``.

Cas limites cibles :
- 40 dB et 60 dB exactement (bornes de classification), 39.99 juste sous
- tableau vide, entree non-tableau
- passage 23h vers 00h dans le libelle horaire
- lieu avec observations mais sans mesure

Aucun test n'importe Mongoose ni ne demarre de serveur : preuve que le decoupage tient.

**Fait** - 23/23 verts en 279 ms.
"@

New-Ticket -Assigne $ADAM -Labels "cache,backend,phase-3" -Fermer `
  -Titre "feat(cache): cache applicatif TTL avec invalidation par lieu" -Corps @"
``src/cache/memoire.js`` + ``src/config/cache.js``.

| Endpoint | TTL | Invalide par |
|---|---|---|
| /stats | 1 h | POST mesure/observation sur ce lieu |
| /quiet-hours | 1 h | idem |
| /history | 5 min | idem |

Jamais mis en cache : ``/now`` (donnee la plus fraiche), le flux SSE, toutes les ecritures, et tout ce qui passe par ``requireUser``.

Invalidation **par lieu** et non globale. Le batch dedoublonne les lieux via un ``Set``.
En-tete ``X-Cache: HIT|MISS`` sur chaque reponse.

**Fait**
"@

New-Ticket -Assigne $ADAM -Labels "backend,phase-3" -Fermer `
  -Titre "fix(classification): retrait de la categorie bruyant cote serveur" -Corps @"
``classifierAmbiance()`` retournait ``"bruyant"`` au-dela de 75 dB, categorie retiree en phase 2 suite au retour du professeur. Le frontend n'avait pas de couleur correspondante : le marqueur tombait en gris "inconnu".

Bug reel et non theorique : Perce bord de mer a un ``maxAmplitude`` de 101.54 dB.

Verrouille par un test de non-regression.

**Fait**
"@

New-Ticket -Assigne $ADAM -Labels "backend,phase-3" -Fermer `
  -Titre "chore: suppression du middleware duplique requireApiKey" -Corps @"
``src/middlewares/requireApiKey`` : copie sans extension ``.js``, jamais importee (le vrai middleware est dans ``auth.js``). Egalement retire ``crypto`` des dependances, paquet npm obsolete qui masque le module natif de Node.

**Fait**
"@

# ============================================================
#  TICKETS A FAIRE - ADAM
# ============================================================
Write-Host "`n=== Tickets a faire (Adam) ===" -ForegroundColor Cyan

New-Ticket -Assigne $ADAM -Labels "backend,cache,phase-3" `
  -Titre "feat(ambiance): endpoint GET /ambiance/best" -Corps @"
**Fonctionnalite additionnelle du livrable 3.** Repond a la question que l'app ne sait pas traiter : *ou aller maintenant ?*

Classe tous les lieux selon leur ambiance a une heure donnee. Toutes les vues actuelles sont par lieu, rien ne les compare.

- Fonction pure dans ``services/``
- Cache TTL 5 min, invalide globalement a chaque nouvelle mesure
- Remplace les ``1 + 2N`` requetes actuelles de MapPage par un seul appel

Criteres :
- [ ] Repond en un seul appel
- [ ] Gere le cas "aucun lieu avec donnees"
- [ ] En-tete ``X-Cache`` present

**Debloque S6.**
"@

New-Ticket -Assigne $ADAM -Labels "tests,cache,phase-3" `
  -Titre "test(cache): couverture du module de cache" -Corps @"
- [ ] Une entree expiree compte comme un miss et est supprimee
- [ ] ``invaliderLieu`` ne touche pas les entrees des autres lieux
- [ ] ``metriques()`` calcule correctement le taux de hit
"@

New-Ticket -Assigne $ADAM -Labels "tests,phase-3" `
  -Titre "test(services): cas limites de l endpoint /best" -Corps @"
- [ ] Egalite entre deux lieux (ordre de depart deterministe)
- [ ] Lieu sans aucune mesure a cette heure
- [ ] Tous les lieux en classification inconnue
"@

New-Ticket -Assigne $ADAM -Labels "documentation,phase-3" `
  -Titre "docs(mesures): releves avant/apres pour la section optimisations" -Corps @"
Le critere exige des optimisations **mesurees**, pas decrites.

- [ ] Temps de reponse ``/stats`` avec et sans cache (``Measure-Command``)
- [ ] Nombre de requetes au chargement de la carte, avant et apres ``/best``
- [ ] Duree de la suite de tests
- [ ] Captures d'ecran ``X-Cache: MISS`` puis ``HIT``
"@

New-Ticket -Assigne $ADAM -Labels "documentation,phase-3" `
  -Titre "docs(rapport): sections backend" -Corps @"
- [ ] Maintenabilite : le decoupage retenu et la justesse des frontieres
- [ ] Tests : ce qui est couvert, comment les services ont ete isoles
- [ ] Cache : quoi, ou, combien de temps, invalide comment, **et ce qui ne l'est jamais**
- [ ] L'arbitrage ``\$group`` MongoDB vers JS pur, assume et explique
- [ ] Faiblesse a nommer : la collecte est concentree sur un seul jour de semaine (297 mesures le mardi contre 5 le vendredi a Perce), donc toute agregation par jour reste non representative. Attenuation : sessions Phyphox reparties sur plusieurs jours.
"@

New-Ticket -Assigne $ADAM -Labels "documentation,phase-3" `
  -Titre "docs(readme): instructions de demarrage et .env" -Corps @"
La remise doit se cloner et se lancer sans rien deviner - sinon penalite.

- [ ] Clone, ``npm install``, ``.env``, ``npm run dev``
- [ ] ``node_modules`` absent du depot et de la remise
- [ ] ``.env`` fourni **dans le zip StudiUM** (exige par l'enonce) mais jamais commite : le depot est public
- [ ] Les deux URLs Render
- [ ] Lien de comparaison phase 2 vers phase 3
"@

New-Ticket -Assigne $ADAM -Labels "documentation,phase-3" `
  -Titre "chore(release): tag v3.0.0 et release GitHub" -Corps @"
A faire **a la fin**, une fois tout merge dans main.

- [ ] ``git tag -a v3.0.0 -m "Phase 3 - SonoMap"`` puis ``git push origin v3.0.0``
- [ ] Release GitHub a partir du tag, notes par theme
- [ ] Ne pas toucher a la release Phase 2 : c'est la preuve figee de la remise precedente
- [ ] Mettre le lien ``/compare/<tag-phase-2>...v3.0.0`` dans le README et le rapport
"@

New-Ticket -Assigne $ADAM -Labels "documentation,phase-3" `
  -Titre "docs(video): script et enregistrement (Adam)" -Corps @"
8 a 10 minutes, duree stricte. Script ecrit d'avance.

- [ ] Reveiller l'API Render avant d'enregistrer (le free tier s'endort apres 15 min)
- [ ] Parcours reels sur l'application deployee
- [ ] La fonctionnalite ajoutee
- [ ] Points forts **et limites** assumees
- [ ] Les deux membres parlent
"@

# ============================================================
#  TICKETS A FAIRE - SAMI
# ============================================================
Write-Host "`n=== Tickets a faire (Sami) ===" -ForegroundColor Cyan

New-Ticket -Assigne $SAMI -Labels "deploiement,phase-3" `
  -Titre "deploy(render): mise en ligne backend et frontend" -Corps @"
**A demarrer en premier - ne depend d'aucun autre ticket.**

- Web Service : root ``.``, build ``npm install``, start ``npm start``
- Static Site : root ``frontend``, build ``npm install && npm run build``, publish ``dist``
- Variables : ``MONGO_URI``, ``JWT_SECRET``, ``TZ=America/Toronto``, ``VITE_API_URL``, ``CORS_ORIGIN``

Criteres :
- [ ] Les deux en ligne sur HTTPS et relies
- [ ] Rewrite ``/*`` vers ``/index.html`` (sinon rafraichir ``/lieu/xxx`` donne un 404)
- [ ] URLs dans le README et le rapport

Pieges :
- ``VITE_API_URL`` est injecte **au build** : tout changement demande un redeploiement du front
- Le free tier s'endort apres 15 min, le premier appel est lent
- MongoDB Atlas : Network Access doit autoriser ``0.0.0.0/0``, les IP de Render changent
- ``TZ`` compte : ``getHours()`` utilise le fuseau du serveur, sinon les creneaux calmes decalent de 4-5 h entre dev et prod
"@

New-Ticket -Assigne $SAMI -Labels "deploiement,backend,phase-3" `
  -Titre "fix(cors): restreindre l origine autorisee" -Corps @"
``src/app.js`` fait ``app.use(cors())`` : ouvert a tout le monde. A remplacer par une configuration lisant ``CORS_ORIGIN``, pointant sur l'URL du Static Site.

- [ ] Origine unique en production
- [ ] ``http://localhost:5173`` conserve pour le developpement
"@

New-Ticket -Assigne $SAMI -Labels "frontend,phase-3" `
  -Titre "refactor(front): hooks personnalises" -Corps @"
``MapPage.jsx`` fait 262 lignes, ``LieuPage.jsx`` 261. La logique doit sortir des pages.

- [ ] ``useLieuxAmbiance()`` - le fallback /now vers /stats vers inconnu
- [ ] ``useLieuData(name)`` - le ``Promise.all`` de 4 endpoints
- [ ] ``useLiveAmbiance(name)`` - le bloc ``EventSource``

Le critere evalue la clarte du decoupage, pas le nombre de fichiers.
"@

New-Ticket -Assigne $SAMI -Labels "frontend,phase-3" `
  -Titre "refactor(front): store Zustand pour les favoris" -Corps @"
``MapPage`` et ``AccountPage`` chargent chacune les favoris via ``getMe()`` et gerent leur propre copie en state. Deux sources de verite pour la meme donnee.

C'est le cas d'ecole d'un etat qui gagne a sortir des composants - a justifier tel quel dans le rapport.

- [ ] Une seule source de verite
- [ ] Ajout/retrait reflete partout sans rechargement
"@

New-Ticket -Assigne $SAMI -Labels "frontend,phase-3" `
  -Titre "refactor(front): composants reutilisables et CSS Modules" -Corps @"
``niveauHumain()`` et les couleurs de classification sont reecrits dans MapPage, ListPage et LieuPage.

- [ ] ``lib/ambiance.js`` - source unique pour les libelles et couleurs
- [ ] ``NiveauBadge``, ``EtatChargement``, ``EtatErreur``
- [ ] Styles en ligne vers CSS Modules (faiblesse assumee en phase 2 : la corriger et le dire rapporte deux fois)
"@

New-Ticket -Assigne $SAMI -Labels "frontend,phase-3" `
  -Titre "feat(front): vue Ou aller maintenant" -Corps @"
**Depend de l'endpoint ``/ambiance/best`` (ticket Adam).**

Consomme l'endpoint, classe les lieux, et remplace les ``1 + 2N`` requetes actuelles de MapPage par un seul appel.

- [ ] Etats geres : chargement, erreur, vide
- [ ] Gain de requetes mesure avant/apres
"@

New-Ticket -Assigne $SAMI -Labels "frontend,cache,phase-3" `
  -Titre "feat(front): strategie de cache client" -Corps @"
- [ ] ``staleTime`` par type de donnee, ou cache dans le store
- [ ] ``/locations`` en localStorage, 24 h
- [ ] Jamais mis en cache : ``/users/me*``, toutes les ecritures, le flux SSE
- [ ] Documenter ou la copie est conservee et comment elle est invalidee
"@

New-Ticket -Assigne $SAMI -Labels "documentation,frontend,phase-3" `
  -Titre "docs(mesures): Lighthouse avant/apres" -Corps @"
**A faire AVANT de commencer le refactor front**, sinon il n'y a rien a comparer.

- [ ] Score Lighthouse initial (performance, accessibilite)
- [ ] Taille du bundle initial
- [ ] Memes mesures apres refactor et cache client
- [ ] Nommer le poste corrige, pas seulement le score
"@

New-Ticket -Assigne $SAMI -Labels "documentation,phase-3" `
  -Titre "docs(rapport): sections frontend" -Corps @"
- [ ] Fonctionnalite additionnelle : le besoin servi et sa justification
- [ ] Maintenabilite front : hooks, store, composants reutilisables
- [ ] Cache client : quoi, ou, combien de temps, invalide comment
- [ ] Deploiement : plateforme, architecture en ligne, variables d environnement
"@

New-Ticket -Assigne $SAMI -Labels "documentation,phase-3" `
  -Titre "docs(video): script et enregistrement (Sami)" -Corps @"
- [ ] Sa portion du script
- [ ] Presente la partie frontend et le deploiement
- [ ] Duree respectee : 8 a 10 minutes au total
"@

# ---------- Fin ----------
Write-Host "`n=== Termine ===" -ForegroundColor Cyan
Write-Host "24 tickets crees, dont 6 fermes.`n"
Write-Host "Verifier :  gh issue list --limit 30"
Write-Host "Ouvrir    :  gh issue list --web`n"
