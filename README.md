# @esupadomit/shared-prisma-ee-es

Schéma Prisma Postgres **partagé** entre tous les projets e-Supadom / Elite Étude :

- `e-supadom.fr` (Next.js)
- `elite-etude.tn` (Next.js)
- `admin.e-supadom.fr` (back-office)
- `admin.elite-etude.tn` (back-office)
- `cronjob` (tâches planifiées côté serveur, pas d'UI)

Toutes ces apps consomment ce package npm privé (GitHub Packages) plutôt que de maintenir chacune leur propre copie du schéma, pour éviter que les bases divergent silencieusement les unes des autres.

## Comment c'est construit

Le schéma est le résultat d'une **fusion additive** des schémas historiques de e-supadom.fr et elite-etude.tn (voir `docs/SCHEMA-UNIFICATION.md` dans le dépôt `cronjob` pour l'historique complet des différences trouvées et de la marche à suivre par site).

Principe appliqué partout :
- aucun champ ni modèle utilisé par un site n'est supprimé ou renommé silencieusement ;
- tout champ propre à un seul site reste optionnel (ou avec une valeur par défaut), donc son ajout à l'autre base est une simple colonne inutilisée, jamais une contrainte qui casserait les écritures existantes.

Repères dans les commentaires du schéma :

| Tag | Signification |
|---|---|
| `[COMMUN]` | utilisé par les deux sites, aucune divergence |
| `[ESUPADOM]` | n'existe aujourd'hui que côté e-supadom.fr |
| `[ELITE]` | n'existe aujourd'hui que côté elite-etude.tn |
| `[DIVERGENCE #n]` / `[RÉSOLU ...]` | renvoie à `SCHEMA-UNIFICATION.md`, résolu ou non |

## Comment publier une modification

1. Modifier `prisma/schema.prisma`.
2. Bumper la version dans `package.json`.
3. `npm publish`.
4. Dans chaque projet consommateur : réinstaller la dépendance (`npm install`), ce qui déclenche `sync-prisma` (copie du schéma publié vers le `prisma/schema.prisma` local du projet).
5. Vérifier que le déploiement applique bien le nouveau schéma en base :
   - **e-supadom.fr / admin.e-supadom.fr / elite-etude.tn / admin.elite-etude.tn** (dockerisés) : `prisma db push --skip-generate` tourne automatiquement à chaque démarrage de conteneur, sans `--accept-data-loss` — un changement destructeur bloque le démarrage plutôt que de s'appliquer silencieusement.
   - **cronjob** (pas de Docker) : pas de mécanisme automatique équivalent, le schéma est resynchronisé via `postinstall`/`dev`/`build` mais chaque script cron est lancé directement par le crontab du serveur — vérifier manuellement après un changement de schéma.

⚠️ Publier une modification ici ne l'applique **jamais** automatiquement en base — c'est le `db push` (ou `migrate deploy`) de chaque consommateur qui le fait, à son prochain démarrage/déploiement.

## État des migrations

Le dossier `prisma/migrations/` reflète l'historique jusqu'à juin 2025. Depuis, **e-supadom.fr, elite-etude.tn et leurs back-offices appliquent le schéma via `prisma db push`** (pas `migrate deploy`), donc ce dossier n'est plus la source de vérité de ce qui tourne réellement en base sur ces quatre apps — il reste utile comme historique, mais un `prisma migrate deploy` sur une base neuve à partir de ce dossier seul ne reconstruirait pas l'état actuel. `prisma/migrations_backup/` est une copie de sauvegarde de cet historique, sans usage actif.

## Divergences connues et leur état

| Sujet | État au 29/08/2026 |
|---|---|
| `Disponibilite.instructorId` → `userId` | ✅ Résolu — base + code migrés des deux côtés |
| `Seance.date`/`createdAt`/`updatedAt` en `@db.Timestamptz(3)` | ✅ Résolu côté elite-etude.tn (conversion `Africa/Tunis` validée sur données réelles) |
| `User.lastLevelUpYear` | Colonne déjà en base sur e-supadom.fr, mais absente des copies de schéma actuellement installées par les 4 apps consommatrices (version npm plus ancienne) — à republier/réinstaller |
| `TrouverProfRequest` : `relance12hSentAt`, `adminAlert24hSentAt`, `acceptedEmailSentAt` | ❌ Pas encore ajoutés au schéma — bloque `cron-relance-mission-trouver-prof.ts` (dépôt `cronjob`) |

Détail complet dans `docs/SCHEMA-UNIFICATION.md` (dépôt `cronjob`).
