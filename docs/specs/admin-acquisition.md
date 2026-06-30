# Spec — Page admin « Acquisition »

> Statut : **implémenté en local** (serveur + client), typecheck + lint OK. Reste : vérification visuelle + déploiement (push client + serveur, aucune migration).
> Périmètre : full-stack (client Vue + serveur PHP). Page **admin uniquement**, hardcodée en FR (comme toutes les pages `/admin/*`, pas d'i18n).

## 1. Objectif

Une page `/admin/acquisition` qui répond à : **« qui sont les joueurs qu'on acquiert, et que valent-ils ? »**. On sélectionne une **cohorte** d'inscrits sur une **période** (24h / 1 sem. / 1 mois / 1 an / tout), on la **filtre** (pays, langue, mode d'inscription, parrainage, vérifié), et la page calcule **moyenne / médiane / taux** sur la cohorte filtrée, plus des **ventilations** par langue / pays / mode d'inscription / parrainage.

C'est un cousin filtrable de la page existante [`/admin/sources`](../../src/component/admin/admin-sources.vue) : celle-ci montre les *derniers* inscrits + un historique ; celle-ci agrège *une cohorte filtrée* sur toute une période.

## 2. Décisions produit (validées)

| Sujet | Décision |
|-------|----------|
| **Temps de jeu** | **Les deux** : (A) *ancienneté du compte* = `last_time - register_time` (secondes) ; (B) *heures actives* = `SUM(farmer_activity.active_hours)` (nombre d'heures-horloge distinctes d'activité). Il n'existe pas de vraie durée de session en base. |
| **Trophées** | **Les deux** : *points* (`farmer.points`, score de progression) ET *nombre* (`farmer.trophies`, compte débloqué). |
| **Filtres** | **Tous** : pays, langue, mode d'inscription, parrainage (parrainé / organique), vérifié. |
| **Agrégats** | Moyenne + médiane pour les numériques (temps, trophées) ; taux (`avg(bool::int)`) pour les booléens (vérifié, activation, didactitiel, tuto terminé). |
| **i18n** | Aucune. Page admin interne, libellés FR en dur (convention `/admin/*`). |

## 3. Données (matrice de disponibilité)

`register_time` / `last_time` sont en **secondes epoch** (cf. [`SourceController`](../../../server/api/class/SourceController.class.php) qui fait `to_timestamp(register_time)` sans `/1000`). Toutes les colonnes existent dans le modèle live ([`FarmerModel.class.php`](../../../server/api/cache/FarmerModel.class.php)) même si `sql/schema.sql` est périmé pour certaines.

| Champ | Source | Note |
|-------|--------|------|
| Date d'inscription | `farmer.register_time` (secondes) | Filtre cohorte : `register_time >= time() - N`. `all` = pas de borne. Toujours `deleted = false`. |
| Langue | `farmer.language` | Capté au signup. |
| Pays | `farmer.country` (ISO-2, geoIP au signup, [`FarmerController:243`](../../../server/api/class/FarmerController.class.php)) | NULL pour les vieux comptes → bucket `(null)`. `GROUP BY country` direct (pas de geoIP au runtime, contrairement à `serviceStats`). |
| Heures actives | `SUM(farmer_activity.active_hours)` ([`farmer_activity.sql`](../../../server/sql/farmer_activity.sql), PK `(farmer, date)`) | Jointure bornée à la cohorte. |
| Ancienneté compte | `last_time - register_time` | Idem `playtime` de `serviceAll`. |
| Trophées points | `farmer.points` | |
| Trophées nombre | `farmer.trophies` | |
| Vérifié | `farmer.verified` | Taux. |
| Mode d'inscription | dérivé de `registered_fast` / `pass` / `github` / `google` | Classes : classic / github / google / fast / fast_verified. Miroir de `serviceStats` + `regType` client. |
| Didactitiel | `didactitiel_seen OR didactitiel_step >= 6` | Taux « vu ». |
| Tuto | `tutorial_progress` (0-10) | Taux terminé (`>= 10`) + étape moyenne. |
| Activation | `fights > 0` | Taux « a combattu ». |
| Parrainage | `godfather > 0` | parrainé vs organique. |

## 4. Serveur

### 4.1 Endpoint `source/acquisition`
- **Route** : [`ServiceRegistry`](../../../server/api/class/ServiceRegistry.class.php) bloc `source` :
  `'acquisition' => ['method' => 'post', 'admin' => true, 'public' => false, 'params' => ['period' => 'string', 'filters' => 'json']]`
- **Méthode** : [`SourceController::serviceAcquisition($period, $filters)`](../../../server/api/class/SourceController.class.php). Garde admin standard (`getFromToken` + `isAdmin`).
- **`filters`** (objet JSON, valeurs vides omises côté client) : `country` (code ISO ou `(null)`), `language`, `login_mode`, `godfather` (`referred`/`organic`), `verified` (`true`/`false`).

### 4.2 Requêtes (PostgreSQL)
WHERE partagé construit par `buildAcquisitionWhere()` (toujours `deleted = false` + borne période + filtres). Conditions de `login_mode` = chaînes constantes (`acquisitionLoginModeCondition`), aucune entrée utilisateur injectée ; le reste en paramètres liés.

- **Agrégats** (1 requête, CTE `cohort` + CTE `activity`) : `count`, taux (`avg(bool::int)`), `avg` + `percentile_cont(0.5)` pour points / nombre de trophées / ancienneté / heures actives. Les heures actives sont sommées par farmer dans une CTE bornée `WHERE farmer IN (SELECT id FROM cohort)` (semi-jointure : index PK `farmer_activity(farmer)` pour les petites cohortes, hash pour `all`).
- **by_language / by_country / by_login_mode / by_godfather** : `GROUP BY` sur le même WHERE.
- **country_options** : `GROUP BY country` sur **période seule** (ignore les autres filtres) pour garder le menu déroulant stable.

Idiomes repris de [`server/.claude/skills/game-analyst/queries/acquisition.sql`](../../../server/.claude/skills/game-analyst/queries/acquisition.sql) (`language_split`, `country_top10`, `godfather_effect`).

## 5. Client

- **Page** : [`admin-acquisition.vue`](../../src/component/admin/admin-acquisition.vue) (copiée de l'ossature de `admin-sources.vue`).
  - Période : boutons `v-btn` (`.period-controls`).
  - Filtres : `<select class="filter-input">` natifs (convention `admin-security.vue`), langues depuis `LeekWars.languages`, pays depuis `country_options`.
  - Agrégats : [`kpi-card.vue`](../../src/component/admin/kpi-card.vue) pour les taux + cartes `.dual` (moy. / méd.) pour les numériques.
  - Ventilations : table `.breakdown` avec barres inline pour langue & mode d'inscription, grille de cartes pour pays, 2 cartes pour le parrainage.
  - Rechargement : `watch([period, filters])` → `POST source/acquisition`.
- **Route** : [`router.ts`](../../src/router.ts) `{ path: '/admin/acquisition', component: AdminAcquisition, beforeEnter: connected }`.
- **Hub** : carte « Acquisition » (`mdi-account-multiple-plus`) dans [`admin.vue`](../../src/component/admin/admin.vue), panneau « Statistiques & monitoring ».

## 6. Risques / limites

- **`all` = scan complet de `farmer`** + agrégat médiane (tri) + somme `farmer_activity` sur tous les farmers. Acceptable pour une page admin occasionnelle ; envisager un cache serviceté ou un index sur `register_time` si lent. Les périodes ≤ 1 an restent rapides.
- **Pays NULL** pour les comptes antérieurs à la colonne `country` → bucket `(null)` visible (cohérent avec le geoIP partiel).
- **Médianes** uniquement au niveau cohorte (pas par langue/pays) pour limiter les tris.
- **Heures actives** = nombre d'heures distinctes, pas une durée continue (affiché « X h »).

## 7. Déploiement

1. Push **serveur** (nouvelle méthode + route ; pas de migration, pas de régénération de cache — `ServiceRegistry` et le contrôleur sont chargés directement). Smoke-test authentifié admin : `POST source/acquisition {period:'1m'}`.
2. Push **client**.
3. Vérifier le rendu (light + dark) avant push (cf. règle projet).
