# API objet Leek Wars (polyglot JS / TS / Python)

Référence complète de l'**API de combat orientée objet** exposée aux IA écrites en **JavaScript**,
**TypeScript** et **Python**. Généré depuis la source de vérité de l'éditeur :
`OBJECT_API_DECLARATIONS` + `CONST_CONTAINERS` dans [leekwars-dts.ts](leekwars-dts.ts)
(runtime : `generator/.../polyglot/objects.js` / `objects.py`).

> L'API est **100 % objet** : les fonctions plates (`getNearestEnemy()`…) et les constantes plates
> (`WEAPON_PISTOL`…) **n'existent plus** en JS/TS/Python. La stdlib LeekScript (`round`, `min`,
> `jsonEncode`, `typeOf`…) n'est pas exposée non plus : utilise les natifs du langage (`Math`,
> `JSON`, `typeof` / `type()`, `random`…). `Math.random()` et le module `random` restent seedés
> par la graine du combat (reproductible).

## Point d'entrée

Ton entité courante s'obtient via **`Fight.me`** (il n'y a **pas** de variable globale `me`) :

```javascript
// JavaScript / TypeScript
const me = Fight.me
me.setWeapon(Weapon.pistol)
const enemy = Fight.getNearestEnemy()
me.moveToward(enemy)
me.useWeapon(enemy)
```

```python
# Python
me = Fight.me
me.setWeapon(Weapon.pistol)
enemy = Fight.getNearestEnemy()
me.moveToward(enemy)
me.useWeapon(enemy)
```

Pour une IA avec état, définis une fonction `turn()` (le corps du fichier n'est évalué qu'une fois) et
récupère `me = Fight.me` en début de tour.

## Notation des types

Types donnés en style TS ; équivalences par langage :

| Doc | JavaScript / TypeScript | Python |
|-----|-------------------------|--------|
| `number` | `number` | `int` / `float` |
| `boolean` | `boolean` | `bool` |
| `string` | `string` | `str` |
| `T[]` | `T[]` | `list[T]` |
| `any` | `any` | `Any` |
| `X \| null` | `X \| null` | `X` (peut être `None`) |

Alias d'arguments (acceptent l'objet **ou** son id) :

- `CellLike` = `Cell | Entity | number`
- `EntityLike` = `Entity | number`
- `WeaponLike` = `Weapon | number`
- `ChipLike` = `Chip | number`

---

## Singletons

### `Fight` — le combat

| Membre | Type | Description |
|--------|------|-------------|
| `me` | `Me` | Ton entité courante. |
| `turn` | `number` | Numéro du tour. |
| `id` | `number` | Id du combat. |
| `type` | `number` | Type de combat (`Fight.Type.*`). |
| `context` | `number` | Contexte (`Fight.Context.*`). |
| `boss` | `number` | Boss du combat (`Fight.Boss.*`). |
| `winner` | `number` | Vainqueur. |
| `alliesLife` / `enemiesLife` | `number` | Somme des PV des alliés / ennemis. |
| `getNearestEnemy()` / `getNearestAlly()` | `Entity \| null` | Ennemi/allié vivant le plus proche. |
| `getFarthestEnemy()` / `getFarthestAlly()` | `Entity \| null` | Le plus loin. |
| `getNearestEnemyTo(target)` / `getNearestAllyTo(target)` | `Entity \| null` | Le plus proche de `target` (`EntityLike`). |
| `getNearestEnemyToCell(cell)` / `getNearestAllyToCell(cell)` | `Entity \| null` | Le plus proche d'une **case**. |
| `getEnemies()` / `getAllies()` | `Entity[]` | Tous. |
| `getAliveEnemies()` / `getAliveAllies()` | `Entity[]` | Vivants. |
| `getDeadEnemies()` / `getDeadAllies()` | `Entity[]` | Morts. |
| `getEnemiesCount()` / `getAlliesCount()` | `number` | Comptes. |
| `getAliveEnemiesCount()` / `getAliveAlliesCount()` / `getDeadEnemiesCount()` | `number` | Comptes filtrés. |
| `getAlliedTurret()` / `getEnemyTurret()` | `Entity \| null` | Tourelles. |
| `getNextPlayer(entity?)` / `getPreviousPlayer(entity?)` | `Entity \| null` | Ordre de jeu. |
| `listen()` | `any[][]` | Paroles prononcées (say) : liste de `[entité, message]`. |

Sous-conteneurs de constantes : `Fight.Type`, `Fight.Context`, `Fight.Boss`, `Fight.Erosion`,
`Fight.Use` (cf. [Constantes](#constantes)).

### `Field` — le terrain

| Membre | Type | Description |
|--------|------|-------------|
| `type` | `number` | Type de carte (`Field.<MAP>`). |
| `cellFromXY(x, y)` | `Cell \| null` | Case aux coordonnées `(x, y)`. |
| `getObstacles()` | `Cell[]` | Cases obstacle. |
| `distance(a, b)` | `number` | Distance à vol d'oiseau. |
| `cellDistance(a, b)` | `number` | Distance en cases. |
| `pathLength(a, b, ignoredCells?)` | `number` | Longueur du chemin. |
| `lineOfSight(a, b, ignoredEntities?)` | `boolean` | Ligne de vue dégagée. |
| `onSameLine(a, b)` | `boolean` | Les deux cases sont alignées. |
| `path(from, to, ignoredCells?)` | `Cell[]` | Chemin de `from` à `to`. |

### `Network` — messages d'équipe

| Membre | Type | Description |
|--------|------|-------------|
| `sendTo(entity, type, params)` | `boolean` | Envoie un message typé (`Message.Type.*`) à un allié. |
| `sendAll(type, params)` | `void` | Envoie à tous les alliés. |
| `getMessages(entity?)` | `Message[]` | Messages reçus (de `entity` seulement si fourni). |

### `Registers` — stockage persistant entre combats

| Membre | Type | Description |
|--------|------|-------------|
| `get(key)` | `any` | Lit un registre (`key: string`). |
| `set(key, value)` | `any` | Écrit un registre. |
| `delete(key)` | `any` | Supprime un registre. |
| `all()` | `any` | Tous les registres. |

### `Debug` — marquage / visualisation / journal

| Membre | Type | Description |
|--------|------|-------------|
| `log(value, color?)` | `void` | Écrit dans le journal de combat (en couleur si `color`). |
| `mark(cells, color?, duration?)` | `boolean` | Marque une/des case(s). |
| `markText(cells, text, color?, duration?)` | `boolean` | Marque avec un texte. |
| `clearMarks()` | `void` | Efface les marquages. |
| `show(cell, color?)` | `boolean` | Met en évidence une case. |
| `pause()` | `void` | Met le combat en pause (debug). |

`console.log(...)` (JS) et `print(...)` (Python) sont aussi redirigés vers le journal de combat
(`console.warn`/`console.error` → niveaux warning/erreur).

### `System` — budget d'exécution et horloge

| Membre | Type | Description |
|--------|------|-------------|
| `operations` | `number` | Opérations consommées ce tour (borne tes recherches avec `maxOperations`). |
| `maxOperations` | `number` | Budget d'opérations du tour. |
| `instructionsCount` | `number` | Instructions exécutées. |
| `usedRAM` / `maxRAM` | `number` | Mémoire utilisée / budget. |
| `date` / `time` | `string` | Date / heure du combat. |
| `timestamp` | `number` | Timestamp du combat. |

Constantes : `System.OPERATIONS_LIMIT`, `System.INSTRUCTIONS_LIMIT`.

### `Color` — couleurs (journal, marquages)

| Membre | Type | Description |
|--------|------|-------------|
| `rgb(r, g, b)` | `number` | Compose une couleur (composantes 0-255). |
| `red(c)` / `green(c)` / `blue(c)` | `number` | Extrait une composante. |

Constantes : `Color.RED`, `Color.GREEN`, `Color.BLUE`.

---

## Classes

### `Entity` — une entité du combat

Propriétés (lecture seule) :

| Propriété | Type | | Propriété | Type |
|-----------|------|-|-----------|------|
| `id` | `number` | | `cell` | `Cell` |
| `life` / `maxLife` | `number` | | `weapon` | `Weapon \| null` |
| `tp` / `maxTP` | `number` | | `weapons` | `Weapon[]` |
| `mp` / `maxMP` | `number` | | `chips` | `Chip[]` |
| `strength` | `number` | | `effects` | `Effect[]` |
| `agility` | `number` | | `launchedEffects` | `Effect[]` |
| `wisdom` | `number` | | `passiveEffects` | `Feature[]` |
| `resistance` | `number` | | `states` | `any[]` |
| `science` | `number` | | `summons` | `Entity[]` |
| `magic` | `number` | | `summoner` | `Entity \| null` |
| `power` | `number` | | `summoned` | `boolean` |
| `level` | `number` | | `alive` / `dead` | `boolean` |
| `name` | `string` | | `isStatic` | `boolean` |
| `absoluteShield` | `number` | | `birthTurn` / `turnOrder` / `side` | `number` |
| `relativeShield` | `number` | | `leekID` / `teamID` / `farmerID` / `aiID` | `number` |
| `damageReturn` | `number` | | `teamName` / `compositionName` | `string` |
| `frequency` | `number` | | `farmerName` / `farmerCountry` | `string` |
| `cores` / `ram` | `number` | | `aiName` | `string` |

Méthodes :

| Méthode | Type | Description |
|---------|------|-------------|
| `isAlly()` / `isEnemy()` | `boolean` | Camp de l'entité. |
| `stat(stat)` | `number` | Caractéristique par constante (`Entity.Stat.*`). |
| `distance(target)` | `number` | Distance en cases jusqu'à `target` (`CellLike`). |

Sous-conteneurs de constantes : `Entity.Stat`, `Entity.Type`.

### `Me` (extends `Entity`) — ton entité (actions)

En plus de tout `Entity` :

| Méthode | Type | Description |
|---------|------|-------------|
| `moveToward(target, mp?)` / `moveAwayFrom(target, mp?)` | `number` | Se rapproche / s'éloigne (`mp` = PM max à dépenser). |
| `moveTowardCells(cells, mp?)` / `moveAwayFromCells(cells, mp?)` | `number` | Variante plurielle (cases). |
| `moveTowardEntities(entities, mp?)` / `moveAwayFromEntities(entities, mp?)` | `number` | Variante plurielle (entités). |
| `moveTowardLine(a, b, mp?)` / `moveAwayFromLine(a, b, mp?)` | `number` | Vers/depuis une ligne. |
| `useWeapon(target)` / `useWeaponOnCell(cell)` | `number` | Utilise l'arme courante. |
| `useChip(chip, target?)` / `useChipOnCell(chip, cell)` | `number` | Utilise une puce. |
| `setWeapon(weapon)` | `boolean` | Équipe `weapon` (coûte 1 PT). |
| `say(message)` | `boolean` | Fait parler ton entité. |
| `lama()` | `void` | « lama » (trophée). |
| `canUseWeapon(target)` / `canUseWeapon(weapon, target)` | `number` | Test d'attaque à l'arme. |
| `canUseWeaponOnCell(cell)` / `canUseWeaponOnCell(weapon, cell)` | `number` | Idem sur case. |
| `canUseChip(chip, target)` / `canUseChipOnCell(chip, cell)` | `number` | Test de lancement de puce. |
| `resurrect(target, cell)` | `number` | Ressuscite `target` sur `cell`. |
| `itemUses(item)` | `number` | Utilisations de l'item ce tour. |
| `setLoadout(name, keep?)` | `boolean` | Change l'équipement courant. |
| `summon(chip, cell, callback, name?)` | `number` | Invoque un bulbe (`callback` rejouée à chaque tour du bulbe). |
| `weaponCell(target, weapon?, ignoredCells?)` | `Cell \| null` | Case d'où utiliser l'arme sur `target` (entité **ou** case). |
| `weaponCells(target, weapon?, ignoredCells?)` | `Cell[]` | Toutes les cases. |
| `chipCell(chip, target, ignoredCells?)` / `chipCells(...)` | `Cell \| null` / `Cell[]` | Idem pour une puce. |
| `weaponTargets(cell, weapon?)` / `chipTargets(chip, cell)` | `Entity[]` | Entités touchées. |

### Sous-types d'entité

Renvoyés typés par l'API (`x instanceof Bulb` / `isinstance(x, Bulb)`). Ils héritent de `Entity`.

| Classe | Membre propre | Constantes |
|--------|---------------|------------|
| `Leek` | — | Un poireau. |
| `Turret` | — | Une tourelle d'équipe. |
| `Bulb` | `type: number` | Sous-type `Bulb.Type`. |
| `Chest` | `type: number` | Sous-type `Chest.Type` (chasse aux coffres). |
| `Mob` | `type: number` | Sous-type `Mob.Type` (monstre / boss). |

### `Cell` — une case

| Membre | Type | Description |
|--------|------|-------------|
| `id` / `x` / `y` | `number` | Identifiant et coordonnées. |
| `empty` / `obstacle` / `hasEntity` | `boolean` | Nature de la case. |
| `entity` | `Entity \| null` | Entité présente sur la case. |
| `content` | `number` | Contenu (`Cell.Type.EMPTY/PLAYER/ENTITY/OBSTACLE`). |
| `distance(target)` | `number` | Distance en cases. |
| `pathLength(target, ignoredCells?)` | `number` | Longueur du chemin. |
| `lineOfSight(target, ignoredEntities?)` | `boolean` | Ligne de vue. |
| `path(target, ignoredCells?)` | `Cell[]` | Chemin jusqu'à `target`. |
| `onSameLine(target)` | `boolean` | Case alignée avec la cible. |

Sous-conteneur de constantes : `Cell.Type`.

### `Item` — base commune arme / puce

`id: number` + sous-conteneurs `Item.LaunchType`, `Item.Area`.

### `Weapon` (extends `Item`) — une arme

| Membre | Type | | Membre | Type |
|--------|------|-|--------|------|
| `cost` | `number` (PT) | | `maxUses` | `number` |
| `minRange` / `maxRange` | `number` | | `inline` | `boolean` |
| `name` | `string` | | `needsLos` | `boolean` |
| `area` | `number` | | `failure` | `number` (%) |
| `launchType` | `number` | | `features` / `passiveFeatures` | `Feature[]` |

Méthodes : `effectiveArea(cell, from?): Cell[]`. Statiques : `Weapon.getAll(): Weapon[]`,
`Weapon.isWeapon(v): boolean`. Constantes : instances `Weapon.<nom>` (ex. `Weapon.pistol`).

### `Chip` (extends `Item`) — une puce

| Membre | Type | | Membre | Type |
|--------|------|-|--------|------|
| `cost` | `number` (PT) | | `maxUses` | `number` |
| `cooldown` / `currentCooldown` | `number` | | `inline` / `needsLos` | `boolean` |
| `minRange` / `maxRange` | `number` | | `failure` | `number` (%) |
| `minScope` / `maxScope` | `number` | | `features` | `Feature[]` |
| `name` | `string` | | `bulbChips` | `Chip[]` (puce d'invocation) |
| `area` / `launchType` | `number` | | `bulbCharacteristics` / `bulbStats` | `any` |

Méthodes : `currentCooldownOf(entity): number`, `effectiveArea(cell, from?): Cell[]`.
Statiques : `Chip.getAll(): Chip[]`, `Chip.isChip(v): boolean`. Constantes : instances
`Chip.<nom>` (ex. `Chip.bandage`, `Chip.fireball`).

### `Effect` — un effet actif/lancé sur une entité

Un effet en cours (dégâts, soin, poison…). À distinguer de `Feature` (potentiel d'un item).

| Membre | Type | Description |
|--------|------|-------------|
| `raw` | `any[]` | Tableau brut `[type, value, caster, turns, critical, item, target, modifiers]`. |
| `type` / `value` / `turns` / `item` / `modifiers` | `number` | Champs nommés. |
| `caster` / `target` | `Entity \| null` | Lanceur / cible. |
| `critical` | `boolean` | Coup critique. |

Statique : `Effect.getAll(): number[]` (liste des ids de types d'effets). Constantes : `Effect.DAMAGE`…

### `Feature` — une caractéristique déclarée par une arme/puce

Potentiel d'un item (fourchette de valeurs), à distinguer d'`Effect` (effet actif).
`raw` = `[type, minValue, maxValue, turns, targets, modifiers]`, champs nommés idem.

### `Message` — un message d'équipe reçu

| Membre | Type | Description |
|--------|------|-------------|
| `raw` | `any[]` | Tableau brut `[auteur, type, params]`. |
| `author` | `Entity \| null` | Expéditeur. |
| `type` | `number` | Type (`Message.Type.*`). |
| `params` | `any` | Contenu. |

---

## Constantes

Les constantes sont rangées par **famille** sous des conteneurs objet. Deux formes :

- **instances** (armes/puces) : camelCase, typées par leur conteneur — `Weapon.pistol`, `Chip.bandage`.
- **catégories** : MAJUSCULES, valeur `number` — `Effect.DAMAGE`, `Fight.Type.SOLO`.

| Conteneur | Préfixe LS | Exemples |
|-----------|------------|----------|
| `Weapon.<nom>` | `WEAPON_` | `Weapon.pistol`, `Weapon.machineGun` |
| `Chip.<nom>` | `CHIP_` | `Chip.bandage`, `Chip.fireball` |
| `Item.LaunchType.*` | `LAUNCH_TYPE_` | `Item.LaunchType.LINE`, `.STAR` |
| `Item.Area.*` | `AREA_` | `Item.Area.CIRCLE_1` |
| `Entity.Stat.*` | `STAT_` | `Entity.Stat.STRENGTH`, `.AGILITY` |
| `Entity.Type.*` | `ENTITY_` | `Entity.Type.LEEK`, `.BULB`, `.TURRET` |
| `Cell.Type.*` | `CELL_` | `Cell.Type.EMPTY`, `.OBSTACLE` |
| `Chest.Type.*` | `CHEST_` | `Chest.Type.WOOD` |
| `Bulb.Type.*` | `BULB_` | `Bulb.Type.PUNY` |
| `Mob.Type.*` | `MOB_` | `Mob.Type.GRAAL` |
| `Fight.Type.*` | `FIGHT_TYPE_` | `Fight.Type.SOLO`, `.TEAM`, `.BR` |
| `Fight.Context.*` | `FIGHT_CONTEXT_` | `Fight.Context.TEST`, `.GARDEN` |
| `Fight.Boss.*` / `Fight.Erosion.*` / `Fight.Use.*` | `BOSS_` / `EROSION_` / `USE_` | `Fight.Use.SUCCESS` |
| `Message.Type.*` | `MESSAGE_` | `Message.Type.HEAL` |
| `Field.*` | `MAP_` | `Field.NEXUS`, `.FACTORY` |
| `Effect.*` | `EFFECT_` | `Effect.DAMAGE`, `.HEAL`, `.POISON` |
| `State.*` | `STATE_` | `State.UNHEALABLE` |
| `Color.*` | `COLOR_` | `Color.RED`, `.GREEN`, `.BLUE` |
| `System.*` | — | `System.OPERATIONS_LIMIT`, `.INSTRUCTIONS_LIMIT` |
| `Fight.*` | — | `Fight.CRITICAL_FACTOR`, `.MAX_TURNS`, `.SUMMON_LIMIT` |

> Les noms exacts des membres proviennent des *game data* du serveur ; les exemples ci-dessus sont
> indicatifs. L'autocomplétion de l'éditeur (`Weapon.`, `Effect.`, `Entity.Stat.`…) liste les membres
> réels disponibles. Les constantes sans famille (`PI`, `SORT_*`, `TYPE_*`…) ne sont pas exposées :
> utilise les natifs du langage.

---

## Combats reproductibles

Le moteur neutralise l'aléa et l'horloge : `Math.random()` (JS) et le module `random` (Python) sont
initialisés par la graine du combat ; aucun accès au système, au réseau ni aux fichiers. Ton IA
dispose d'un budget d'opérations et de mémoire par tour, calibré pour être comparable entre langages
(surveille-le avec `System.operations` / `System.maxOperations`).
