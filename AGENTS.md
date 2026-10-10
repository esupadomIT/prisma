# AGENTS.md — prisma

Guide pour les agents de code (Claude Code, Codex, Copilot, Windsurf, Cursor…) et les humains.
**Partie 1** = contexte global, identique dans les 7 dépôts e-Supadom / Elite Étude.
**Partie 2** = ce qui est propre à `prisma`. À lire avant toute modification.

<!-- CONTEXTE-GLOBAL:DEBUT — bloc IDENTIQUE dans les 7 dépôts (e-supadom.fr, elite-etude.tn,
admin.e-supadom.fr, admin.elite-etude.tn, api.e-supadom.fr, cronjob, prisma).
Toute modification de ce bloc doit être recopiée telle quelle dans les 6 autres dépôts. -->

# Partie 1 — Contexte global de l'écosystème e-Supadom / Elite Étude

> Lu par Claude Code (via `CLAUDE.md` → `@AGENTS.md`), Codex, Copilot, Windsurf, Cursor…
> et par les humains. Dernière mise à jour du bloc global : **10/10/2026**.

## 1. Les deux plateformes

Deux marketplaces sœurs de soutien scolaire (cours particuliers à domicile / en visio,
forfaits, séances, paiements, messagerie élève ↔ prof) :

| | **e-Supadom** (ES) | **Elite Étude** (EE) |
|---|---|---|
| Site | e-supadom.fr | elite-etude.tn |
| Pays / fuseau | France — `Europe/Paris` (« heure de Paris, France ») | Tunisie — `Africa/Tunis` (« heure de la Tunisie ») |
| Base Postgres | sa propre base (`esupadomprod`, staging `esupadomStg`) | sa propre base (`eliteetudeProd`) |

Les deux sites partagent **le même schéma Prisma** et, autant que possible, **le même
code métier** : une règle ou un correctif fait sur un site doit être **reporté sur
l'autre** (et toujours pour les changements de performance), sauf différence
explicitement propre au pays (fuseau, devise, SMS, nomenclature des classes…).

## 2. Les dépôts (GitHub `esupadomIT/*`, clones locaux sous `C:\Users\PC\Documents\projects\`)

| Dépôt | Rôle | Stack | Dev local |
|---|---|---|---|
| `new_Esup/e-supadom.fr` | Site ES (front + API Next + chat) | Next.js 15 App Router, React 18, **JS**, serveur custom `src/server/server.js` (Socket.IO), NextAuth v4 | `npm run dev` :3000 / Docker dev :3004, test :3002, prod :3000 |
| `new_Esup/elite-etude.tn` | Site EE (même architecture que ES) | idem | Docker dev :3010, test :3008, prod :3006 |
| `new_Esup/admin.e-supadom.fr` | Back-office ES | Next.js 15, **TypeScript**, template Materio (MUI 6 + Tailwind), Prisma, NextAuth | :3001 |
| `new_Esup/admin.elite-etude.tn` | Back-office EE | idem | :3001 |
| `new_Esup/api.e-supadom.fr` | **API commune (cible)** : future app mobile React Native **et** front des deux sites ES / EE | NestJS 11, TS strict, Prisma 6 | :4000 (`/api`, Swagger `/api/docs`) |
| `cronjob` | Tâches planifiées des DEUX plateformes (pas d'UI) | TypeScript (`tsx`), Prisma, Mailjet/SendGrid, iSendPro | `npx tsx src/cronJob/<job>.ts` |
| `new_Esup/prisma` | Package npm privé `@esupadomit/shared-prisma-ee-es` = **schéma partagé** | Prisma | `npm publish` (GitHub Packages) |

Site et back-office sont **volontairement des applications séparées** (un bug critique
dans l'une n'impacte pas l'autre), chacune avec ses propres stacks Docker.

## 3. Environnements et serveurs

- **Prod ES** : serveur `serverB31` (utilisateur `nextjsuser`), `~/apps/e-supadom.fr`,
  rebuild via `./docker.sh prod rebuild`.
- **Test** : serveur `serverC110` (`nextjsuser`), `~/apps/e-supadom/` →
  `test.e-supadom.fr`, `test.admin.e-supadom.fr`, `test.api.e-supadom.fr`.
- **EE** : même découpage dev / test / prod, voir le README du site EE.
- Chaque appli a `docker/` avec un compose + un `Dockerfile.*` + un `docker/.env.*` par
  environnement, piloté par `docker.sh <env> <action>`. Les `docker/.env.*` contiennent
  de vrais secrets : **jamais commités** (seuls les `*.example` le sont).
- Builds Docker : jamais de `COPY . .` (pour ne pas embarquer `tokens.json` ni les
  autres `.env.*`), `node_modules` de prod dans une étape `prod-deps` mise en cache,
  pas de ligne `# syntax=docker/dockerfile:1.7`.
- `tokens.json` (racine des sites, ignoré par git) = jeton OAuth Google vivant
  (Calendar/Meet) : monté en volume, jamais dans une image.

## 4. Workflow Git (tous les dépôts)

- **`main`** = production. **`test`** = branche d'intégration déployée sur le serveur de
  test ; elle accumule le travail de plusieurs tickets.
- **On ne merge jamais `test` dans `main`.** Chaque ticket part de `main` sur sa propre
  branche (`feat/T146-…-main`, `fix/…`, `perf/…`), puis PR vers `main` qui ne contient
  **que** ce ticket. Les changements d'architecture restent sur des branches dédiées
  (ex. `feat/nest-api`), jamais directement sur `main`.
- Tickets nommés `2026 - Txxx - <titre>`, souvent marqués « EE/ES » = à faire sur les
  deux sites.
- Fins de ligne : les clones Windows sont en CRLF, le dépôt en LF. **Ne jamais
  forcer `core.autocrlf` dans la config locale d'un dépôt** (ni depuis un worktree,
  dont la config est partagée) : tous les fichiers apparaîtraient modifiés. Un diff
  « fichier entièrement modifié » sans vrai changement = fins de ligne
  (`git diff --ignore-cr-at-eol` pour vérifier).
- `npm run build` des sites lance `npm audit` + un auto-fix qui peut modifier
  `package-lock.json`.

## 5. Schéma Prisma partagé (`@esupadomit/shared-prisma-ee-es`, dépôt `prisma`)

- **Source de vérité unique** du schéma pour les 6 consommateurs (2 sites, 2 BO, API,
  cronjob). Chaque projet le copie localement via `npm run sync-prisma`
  (postinstall / build) : **ne jamais modifier le `schema.prisma` local** d'un projet
  consommateur, il est écrasé.
- Modifier le schéma : dépôt `prisma` → éditer `prisma/schema.prisma` → bumper la version
  → `npm publish` → `npm install` dans chaque consommateur (bump `^2.0.x`).
- **Fusion additive** : on ne supprime ni ne renomme jamais un champ utilisé par un
  site ; un champ propre à un site est optionnel / avec défaut. Tags dans le schéma :
  `[COMMUN]`, `[ESUPADOM]`, `[ELITE]`, `[DIVERGENCE #n]`.
- Application en base : `prisma db push --skip-generate` au démarrage des conteneurs
  des sites et BO **sans `--accept-data-loss` en prod** (un changement destructeur
  bloque le démarrage). L'API et le cronjob ne poussent **jamais** le schéma.
  Erreur Prisma `P2022` (colonne absente) = base en retard → `prisma-push` côté site.
- Version actuelle : **2.0.18** (`SyncDispoWatermark`). Le package 2.0.18 contient
  `messageType` + `Message.isHtml` (T142), `StudentAvailabilityCronFlag`,
  `majoration_prix_per_hour` ET `minoration_prix_per_hour` (anciennes séances).

## 6. Règles métier transverses (valables sur ES et EE, site + API + BO + cron)

### 6.1 Fuseau horaire — `PLATFORM_TZ`
- Sites : `src/config/platform.js` est le **seul** endroit où le fuseau est écrit
  (`PLATFORM_TZ`, `PLATFORM_TZ_LABEL`) ; `src/libs/timezone.js` est identique sur les
  deux sites. Cron : variable `DEFAULT_TIMEZONE` + `applyDefaultTimezone()`.
- La base stocke des instants **UTC**. Toute heure saisie ou affichée (agenda,
  formulaires, disponibilités, « Mes séances », emails) est une heure murale en
  `PLATFORM_TZ`, jamais celle du navigateur ni du serveur. Les routes de création /
  modification ignorent le `timezone` envoyé par le client (incident #1425).
- Agenda FullCalendar : `timeZone={PLATFORM_TZ}` + `@fullcalendar/luxon`, on lui donne
  des ISO UTC.

### 6.2 Tarification des séances et soldes
- Coût d'une séance = `User.priceHour` × durée (h), repli sur le prix `TypeCours` si
  `priceHour` est vide. **Aucune majoration duo / groupe à la réservation** (même prix
  horaire pour 1, 2 ou 3 élèves). Ne jamais prendre un tarif dans le corps d'une requête.
- Modification : on débite / rembourse **la différence** (nouveau coût − ancien coût).
  Suppression : remboursement du coût (+ `majoration_prix_per_hour ||
  minoration_prix_per_hour` des anciennes séances — garder ce repli).
- Solde affiché en heures = solde ÷ `priceHour`, arrondi à la demi-heure.
- 1er cours offert : deux orthographes coexistent en base — `1er_cours_offert`
  (créé depuis l'agenda) et `1er_cours_offerte` (acceptation « Trouver un prof », sans
  débit) → helper `isFreeFirstCourse()`.
- Paiements (ES) : PayPal comptant ; Alma 4x / 10x / 12x = majoration additive €/h
  (`Parametre` `paiement_alma_*_fois`) ; pack calculé sur les semaines restantes
  jusqu'au 30/06 (vacances incluses / exclues).

### 6.3 Blocage de nuit (réservation / modification / suppression)
- Créneau 00h–06h `PLATFORM_TZ` bloqué pour ne pas envoyer de mails aux familles la nuit.
- Mécanisme cible (EE, en cours de portage sur ES) : `src/libs/nightBlock.js` →
  `isNightBlockDisabled()`. Bloqué **par défaut**, désactivé si
  `DISABLE_NIGHT_SESSION_BLOCK=true` / `NEXT_PUBLIC_DISABLE_NIGHT_SESSION_BLOCK=true`
  (la variable `NEXT_PUBLIC_` doit être présente au **build**), sur un hôte « test »,
  en localhost ou en `NODE_ENV=development`.
- Ancien mécanisme ES (sur `main` tant que `feat/night-block-main` n'est pas mergée) :
  `ENABLE_NIGHT_RESEVATION=true` active le blocage (non défini = pas de blocage).

### 6.4 T146 — Modifier une séance (bouton crayon)
- Interrupteur `SEANCE_EDIT_ACTIONS_ENABLED` (`src/config/features.js`), **`false`
  sur les deux sites** : « Modifier / Corriger la séance » masqué ; « Ajouter / Retirer
  un élève » et « Supprimer la séance » restent visibles.
- Séance **à venir** : date, horaire, matière, durée, type de cours modifiables
  (`/api/seance/update`, `EditSession`), conflits prof bloquants, fériés / vacances /
  disponibilités élèves en avertissement ; mails élève + prof + admin (+ `.ics` sur ES).
- Séance **passée / commencée** : seule la **correction** de l'objet de la réservation
  (type de cours) et de la matière est permise (date, horaire, durée figés), le solde est
  recalculé, **seul l'admin** est prévenu (objet « Correction de séance passée par le
  prof »), pas de `.ics`.
- Mails de modification : chaque ligne = nouvelle valeur, puis l'ancienne **barrée en
  rouge entre parenthèses** si elle a changé (Matière, Objet de la réservation, Date,
  Horaire + libellé du fuseau). Pas de tableau.

### 6.5 T138 — Disponibilités élève obligatoires
- Popup de première connexion + modal d'onboarding (`StudentAvailabilityOnboardingModal`,
  `StudentAvailabilityPopupGuard`), API `/api/student-availability`, lib
  `studentAvailability.js` (créneaux hebdo sur l'année scolaire, hors vacances / fériés).
- Le **rappel est bloquant** : `allowClose` n'a pas de valeur par défaut ; Échap / croix
  seulement si `allowClose`, clic extérieur et bouton du pied seulement si
  `!isReminder`. Depuis l'agenda élève (`allowClose`, `isReminder=false`) : fermable.
- Synchronisation des disponibilités profs ES ↔ EE : cron `cron-sync-dispo-prof.ts`
  (table `_SyncDispoWatermark`).

### 6.6 T142 — Messagerie
- Messages types gérés dans le BO (`messageType`, audience `INSTRUCTOR` / `STUDENT` /
  `ALL`, variables `[Prenom_etudiant]`, `[Prenom_prof]`, `[Prenom]`), servis par
  `/api/tchat/messages-types`.
- Messages HTML : nettoyés côté client (`src/libs/sanitizeChatHtml.js`) **et** côté
  serveur Socket.IO (`src/server/server.js`, même config — garder les deux alignés),
  `Message.isHtml`. Le rôle du destinataire (`receiverRole`) choisit les messages proposés.
- Toute logique de livraison du chat se fait dans `src/server/server.js`, pas seulement
  dans `/api/tchat/*`. Les conversations prof ↔ élève inactives depuis 6 mois sont
  purgées par le cron `cron-delete-inactive-conversations.ts`.

### 6.7 « Trouver un prof »
- Demande élève (`TrouverProfRequest`) → acceptation par un prof → 1er cours offert de
  30 min réservé automatiquement (`1er_cours_offerte`), mails élève / prof avec date et
  horaire, message d'accueil automatique dans le chat. Relances : cron
  `cron-relance-mission-trouver-prof.ts`.

### 6.8 Sécurité
- Secrets uniquement via `process.env` (jamais en dur, jamais dans un fichier commité,
  jamais dans un composant `'use client'`). `NEXT_PUBLIC_*` = valeur publique seulement.
- Toute route qui lit / modifie des données d'un utilisateur exige une session + un
  contrôle de propriété (soi-même ou admin). Ne jamais renvoyer `hashedPassword`,
  `resetToken`, `activationToken`.

## 7. API commune NestJS (`api.e-supadom.fr`, en cours)
- Cible : **une seule API** pour l'application mobile (React Native : chat, notifications,
  agenda) **et** pour le front des deux sites **ES et EE** — les sites ne gardent que
  NextAuth, l'ISR et le healthcheck, et délèguent le reste à l'API.
- Avancement : ES d'abord (branches `feat/nest-api` côté site, `feat/migration-native`
  côté API), EE ensuite. **Sur `main`, les routes sont encore dans `src/app/api` de
  chaque site.** Toute nouvelle logique doit donc rester portable vers l'API : pas de
  valeur propre à un site en dur (fuseau, libellés, URLs → configuration / env par
  plateforme), comme le fait déjà `PLATFORM_TZ`.
- Tant que la migration n'est pas en prod : toute règle métier modifiée dans
  `src/app/api` d'un site doit **aussi** être reportée dans l'API
  (`src/seance/seance-booking.service.ts`, `seance-rules.ts`, `src/common/…`).
  À reporter au 10/10/2026 : correction des séances passées (6.4), format des mails de
  modification (6.4), blocage de nuit (6.3).

## 8. État des branches à merger (au 10/10/2026)

| Dépôt | Branche (depuis `main`) | Contenu |
|---|---|---|
| e-supadom.fr | `feat/T142-messages-main` | T142 messagerie |
| e-supadom.fr | `feat/timezone-docker-main` | `PLATFORM_TZ` unifié + accélération builds Docker |
| e-supadom.fr | `feat/trouver-prof-main` | Trouver un prof : pop-up, mails avec date/horaire, message auto |
| e-supadom.fr | `feat/night-block-main` | Blocage de nuit aligné sur EE (⚠️ ajouter `DISABLE_NIGHT_SESSION_BLOCK=true` + `NEXT_PUBLIC_…` dans `docker/.env.prod` pour garder le comportement actuel) |
| e-supadom.fr | `feat/T138-modal-dispos-main` | Refonte modal disponibilités (portée d'EE) |
| e-supadom.fr / elite-etude.tn | `feat/T146-email-modif-main` | T146 : mails barrés + correction séance passée |
| elite-etude.tn | `feat/T138-disponibilites-main` | T138 disponibilités élève (rappel bloquant) |
| elite-etude.tn | `feat/T142-messages-main` | T142 messagerie (portée d'ES) |
| elite-etude.tn | `feat/docker-prod-deps-main` | `Dockerfile.prod` : node_modules de prod en cache (⚠️ build de validation sur le serveur de test avant la prod) |
| tous | `docs/agents-md` | ce fichier |

## 9. Où trouver plus de contexte
- Docs techniques à la racine des sites : `TIMEZONE_HANDLING.md`,
  `REDUCTIONS_FORFAITS_HANDLING.md`, `MAJORATION_PAIEMENT_ALMA_HANDLING.md`,
  `VACANCES_SCOLAIRES_*_HANDLING.md`, `VALIDATION_REGLES_PAIEMENT_ECHELONNE_EDB.md`…
- `cronjob/docs/SCHEMA-UNIFICATION.md` : historique de l'unification du schéma.
- Projet claude.ai « e-supadom.fr » : comptes rendus de sessions (fix majoration
  récurrentes, migration séances récurrentes, paiements échelonnés, vacances scolaires…).

## 10. Avant de terminer une tâche (tous dépôts)
- Lint / typecheck du dépôt (`npm run lint`, `npx tsc --noEmit` côté TS) ; les builds
  Next ignorent les erreurs ESLint/TS, ce contrôle manuel est le vrai garde-fou.
- Vérifier : reporté sur l'autre site ? sur l'API NestJS ? schéma partagé à publier ?
  variable d'env à ajouter dans les `*.example` ? aucun secret ajouté ?
- Une branche par ticket, depuis `main`.

<!-- CONTEXTE-GLOBAL:FIN -->

---

# Partie 2 — prisma (`@esupadomit/shared-prisma-ee-es`)

Package npm **privé** (GitHub Packages, scope `@esupadomit`) qui publie le schéma Prisma
Postgres partagé par les 6 projets consommateurs (voir partie 1 §5). Ce dépôt ne contient
pas d'application : seulement `prisma/schema.prisma`, l'historique `prisma/migrations/`
(jusqu'à juin 2025, plus la source de vérité — les apps font `db push`) et
`scripts/update-consumers.mjs`.

## Branche
- `main` est la seule branche active (l'ancienne branche / environnement `dev` n'est plus utilisée).

## Publier une modification
1. Modifier `prisma/schema.prisma` en respectant la **fusion additive** (aucun champ
   utilisé supprimé ou renommé ; champ propre à un site = optionnel ou avec défaut ;
   tag `[COMMUN]` / `[ESUPADOM]` / `[ELITE]` en commentaire).
2. Bumper `version` dans `package.json` (actuellement **2.0.18**).
3. `npm publish` (registry `https://npm.pkg.github.com`, `.npmrc` requis — son scope
   déclaré est correct même s'il diffère du nom du package ; le `package-lock.json`
   aussi est à jour malgré un nom/version différent).
4. Dans chaque consommateur : `npm install @esupadomit/shared-prisma-ee-es@^2.0.x`
   (ou `npm run update-consumers` ici) → `sync-prisma` recopie le schéma.
5. Vérifier l'application en base : `prisma db push --skip-generate` au démarrage des
   conteneurs des sites et BO (sans `--accept-data-loss` en prod) ; cronjob et API ne
   poussent jamais le schéma.

⚠️ Publier ici ne modifie **jamais** la base : c'est le `db push` de chaque site / BO qui
l'applique, à son prochain démarrage.

## Divergences connues
Voir le tableau « Divergences connues et leur état » du `README.md` et
`cronjob/docs/SCHEMA-UNIFICATION.md`. Points ouverts notables :
`TrouverProfRequest.relance12hSentAt` / `adminAlert24hSentAt` / `acceptedEmailSentAt`
(requis par `cron-relance-mission-trouver-prof.ts`).
