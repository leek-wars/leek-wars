# API objet Leek Wars (polyglot JS / TS / Python)

Référence complète de l'**API de combat orientée objet** exposée aux IA écrites en **JavaScript**,
**TypeScript** et **Python** (style stdlib objet LeekScript v5). Généré depuis la source de vérité de
l'éditeur : `OBJECT_API_DECLARATIONS` + `CONST_CONTAINERS` dans
[leekwars-dts.ts](leekwars-dts.ts) (runtime : `generator/.../polyglot/objects.js` / `objects.py`).

> L'API plate (fonctions `getNearestEnemy()`, constantes `WEAPON_PISTOL`…) reste disponible au
> runtime, mais l'**objet** est la forme idiomatique. Ce document ne couvre que la forme objet.

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
| `getNearestEnemy()` | `Entity \| null` | Ennemi vivant le plus proche. |
| `getNearestAlly()` | `Entity \| null` | Allié vivant le plus proche. |
| `getFarthestEnemy()` | `Entity \| null` | Ennemi vivant le plus loin. |
| `getFarthestAlly()` | `Entity \| null` | Allié vivant le plus loin. |
| `getNearestEnemyTo(target)` | `Entity \| null` | Ennemi le plus proche de `target` (`EntityLike`). |
| `getNearestAllyTo(target)` | `Entity \| null` | Allié le plus proche de `target` (`EntityLike`). |
| `getNearestEnemyToCell(cell)` | `Entity \| null` | Ennemi le plus proche d'une **case** (`CellLike`). |
| `getNearestAllyToCell(cell)` | `Entity \| null` | Allié le plus proche d'une **case** (`CellLike`). |
| `getEnemies()` | `Entity[]` | Tous les ennemis. |
| `getAllies()` | `Entity[]` | Tous les alliés. |
| `getAliveEnemies()` | `Entity[]` | Ennemis vivants. |
| `getAliveAllies()` | `Entity[]` | Alliés vivants. |
| `getDeadEnemies()` | `Entity[]` | Ennemis morts. |
| `getDeadAllies()` | `Entity[]` | Alliés morts. |
| `getEnemiesCount()` | `number` | Nombre d'ennemis. |
| `getAlliesCount()` | `number` | Nombre d'alliés. |
| `getAliveEnemiesCount()` | `number` | Nombre d'ennemis vivants. |
| `getAliveAlliesCount()` | `number` | Nombre d'alliés vivants. |
| `getAlliedTurret()` | `Entity \| null` | Ta tourelle d'équipe. |
| `getEnemyTurret()` | `Entity \| null` | Tourelle ennemie. |

Sous-conteneurs de constantes : `Fight.Type`, `Fight.Context`, `Fight.Boss`, `Fight.Erosion`,
`Fight.Use`, `Fight.Message` (cf. [Constantes](#constantes)).

### `Field` — le terrain

| Membre | Type | Description |
|--------|------|-------------|
| `type` | `number` | Type de carte (`Field.<MAP>`). |
| `cellFromXY(x, y)` | `Cell \| null` | Case aux coordonnées `(x, y)`. |
| `getObstacles()` | `Cell[]` | Cases obstacle. |
| `distance(a, b)` | `number` | Distance à vol d'oiseau (`CellLike`, `CellLike`). |
| `cellDistance(a, b)` | `number` | Distance en cases. |
| `pathLength(a, b)` | `number` | Longueur du chemin. |
| `lineOfSight(a, b)` | `boolean` | Ligne de vue dégagée. |
| `path(from, to, ignoredCells?)` | `Cell[]` | Chemin de `from` à `to`, en évitant `ignoredCells` (`CellLike[]`). |

### `Registers` — stockage persistant entre combats

| Membre | Type | Description |
|--------|------|-------------|
| `get(key)` | `any` | Lit un registre (`key: string`). |
| `set(key, value)` | `any` | Écrit un registre. |
| `delete(key)` | `any` | Supprime un registre. |
| `all()` | `any` | Tous les registres. |

### `Debug` — marquage / visualisation

| Membre | Type | Description |
|--------|------|-------------|
| `mark(cells, color?, duration?)` | `boolean` | Marque une/des case(s) (`CellLike \| CellLike[]`). |
| `markText(cells, text, color?, duration?)` | `boolean` | Marque avec un texte. |
| `clearMarks()` | `void` | Efface les marquages. |
| `show(cell, color?)` | `boolean` | Met en évidence une case. |
| `pause()` | `void` | Met le combat en pause (debug). |

`console.log(...)` (JS) et `print(...)` (Python) sont redirigés vers le journal de combat.

---

## Classes

### `Entity` — une entité du combat

Propriétés (lecture seule) :

| Propriété | Type | | Propriété | Type |
|-----------|------|-|-----------|------|
| `id` | `number` | | `absoluteShield` | `number` |
| `life` | `number` | | `relativeShield` | `number` |
| `maxLife` | `number` | | `cell` | `Cell` |
| `tp` | `number` | | `weapon` | `Weapon \| null` |
| `maxTP` | `number` | | `weapons` | `Weapon[]` |
| `mp` | `number` | | `chips` | `Chip[]` |
| `maxMP` | `number` | | `effects` | `Effect[]` |
| `strength` | `number` | | `launchedEffects` | `Effect[]` |
| `agility` | `number` | | `passiveEffects` | `Feature[]` |
| `wisdom` | `number` | | `states` | `any[]` |
| `resistance` | `number` | | `summons` | `Entity[]` |
| `science` | `number` | | `summoner` | `Entity \| null` |
| `magic` | `number` | | `summoned` | `boolean` |
| `power` | `number` | | `alive` | `boolean` |
| `level` | `number` | | `dead` | `boolean` |
| `name` | `string` | | | |

Méthodes :

| Méthode | Type | Description |
|---------|------|-------------|
| `isAlly()` | `boolean` | L'entité est-elle une alliée. |
| `isEnemy()` | `boolean` | L'entité est-elle une ennemie. |
| `distance(target)` | `number` | Distance en cases jusqu'à `target` (`CellLike`). |

Sous-conteneurs de constantes : `Entity.Stat`, `Entity.Type`.

### `Me` (extends `Entity`) — ton entité (actions)

En plus de tout `Entity` :

| Méthode | Type | Description |
|---------|------|-------------|
| `moveToward(target)` | `number` | Se rapproche de `target` (`CellLike`). |
| `moveAwayFrom(target)` | `number` | S'éloigne de `target` (`CellLike`). |
| `useWeapon(target)` | `number` | Utilise l'arme courante sur `target` (`EntityLike`). |
| `useWeaponOnCell(cell)` | `number` | Utilise l'arme sur une case (`CellLike`). |
| `useChip(chip, target)` | `number` | Utilise `chip` (`ChipLike`) sur `target` (`EntityLike`). |
| `useChipOnCell(chip, cell)` | `number` | Utilise `chip` sur une case. |
| `setWeapon(weapon)` | `boolean` | Équipe `weapon` (`WeaponLike`, coûte 1 PT). |
| `say(message)` | `boolean` | Fait parler ton entité. |
| `canUseWeapon(target)` | `number` | Peut-on utiliser l'arme sur `target`. |
| `canUseChip(chip, target)` | `number` | Peut-on utiliser `chip` sur `target`. |
| `resurrect(target, cell)` | `number` | Ressuscite `target` (`EntityLike`) sur `cell` (`CellLike`). |
| `weaponCell(target, weapon?, ignoredCells?)` | `Cell \| null` | Case d'où utiliser l'arme (courante ou `weapon`) sur `target` (entité **ou** case). |
| `weaponCells(target, weapon?, ignoredCells?)` | `Cell[]` | Toutes les cases d'où utiliser l'arme sur `target`. |
| `chipCell(chip, target, ignoredCells?)` | `Cell \| null` | Case d'où utiliser `chip` sur `target`. |
| `chipCells(chip, target, ignoredCells?)` | `Cell[]` | Toutes les cases d'où utiliser `chip` sur `target`. |
| `weaponTargets(cell, weapon?)` | `Entity[]` | Entités touchées si l'arme est utilisée sur `cell`. |
| `chipTargets(chip, cell)` | `Entity[]` | Entités touchées si `chip` est utilisée sur `cell`. |

### Sous-types d'entité

Renvoyés typés par l'API (`x instanceof Bulb`…). Ils héritent de `Entity`.

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
| `id` | `number` | Identifiant de la case. |
| `x` | `number` | Coordonnée X. |
| `y` | `number` | Coordonnée Y. |
| `empty` | `boolean` | Case vide. |
| `obstacle` | `boolean` | Case obstacle. |
| `entity` | `Entity \| null` | Entité présente sur la case. |
| `content` | `number` | Contenu (`Cell.Type.EMPTY/PLAYER/ENTITY/OBSTACLE`). |
| `distance(target)` | `number` | Distance en cases jusqu'à `target` (`CellLike`). |
| `pathLength(target)` | `number` | Longueur du chemin jusqu'à `target`. |
| `lineOfSight(target)` | `boolean` | Ligne de vue jusqu'à `target`. |
| `path(target, ignoredCells?)` | `Cell[]` | Chemin jusqu'à `target`, en évitant `ignoredCells`. |

Sous-conteneur de constantes : `Cell.Type`.

### `Item` — base commune arme / puce

| Membre | Type | Description |
|--------|------|-------------|
| `id` | `number` | Identifiant de l'item. |

Sous-conteneurs de constantes : `Item.LaunchType`, `Item.Area`.

### `Weapon` (extends `Item`) — une arme

| Membre | Type | | Membre | Type |
|--------|------|-|--------|------|
| `cost` | `number` (PT) | | `area` | `number` |
| `minRange` | `number` | | `launchType` | `number` |
| `maxRange` | `number` | | `maxUses` | `number` |
| `minScope` | `number` | | `inline` | `boolean` |
| `maxScope` | `number` | | `needsLos` | `boolean` |
| `name` | `string` | | `features` | `Feature[]` |

Constantes : instances `Weapon.<nom>` (ex. `Weapon.pistol`, `Weapon.machineGun`).

### `Chip` (extends `Item`) — une puce

| Membre | Type | | Membre | Type |
|--------|------|-|--------|------|
| `cost` | `number` (PT) | | `area` | `number` |
| `cooldown` | `number` | | `launchType` | `number` |
| `currentCooldown` | `number` | | `maxUses` | `number` |
| `minRange` | `number` | | `inline` | `boolean` |
| `maxRange` | `number` | | `needsLos` | `boolean` |
| `minScope` | `number` | | `features` | `Feature[]` |
| `maxScope` | `number` | | `name` | `string` |

Constantes : instances `Chip.<nom>` (ex. `Chip.bandage`, `Chip.fireball`).

### `Effect` — un effet actif/lancé sur une entité

Un effet en cours (dégâts, soin, poison…). À distinguer de `Feature` (potentiel d'un item).

| Membre | Type | Description |
|--------|------|-------------|
| `raw` | `any[]` | Tableau brut `[type, value, caster, turns, critical, item, target, modifiers]`. |
| `type` | `number` | Type d'effet (`Effect.DAMAGE`…). |
| `value` | `number` | Valeur. |
| `caster` | `Entity \| null` | Lanceur. |
| `turns` | `number` | Tours restants. |
| `critical` | `boolean` | Coup critique. |
| `item` | `number` | Id de l'arme/puce (0 si aucun). |
| `target` | `Entity \| null` | Cible. |
| `modifiers` | `number` | Modificateurs. |

### `Feature` — une caractéristique déclarée par une arme/puce

Potentiel d'un item (fourchette de valeurs), à distinguer d'`Effect` (effet actif).

| Membre | Type | Description |
|--------|------|-------------|
| `raw` | `any[]` | Tableau brut `[type, minValue, maxValue, turns, targets, modifiers]`. |
| `type` | `number` | Type. |
| `minValue` | `number` | Valeur min. |
| `maxValue` | `number` | Valeur max. |
| `turns` | `number` | Durée. |
| `targets` | `number` | Cibles. |
| `modifiers` | `number` | Modificateurs. |

---

## Constantes

Les constantes plates (`WEAPON_PISTOL`, `EFFECT_DAMAGE`, `STAT_STRENGTH`…) sont rangées par **famille**
sous des conteneurs objet. Deux formes :

- **instances** (armes/puces) : camelCase, typées par leur conteneur — `Weapon.pistol`, `Chip.bandage`.
- **catégories** : MAJUSCULES, valeur `number` — `Effect.DAMAGE`, `Fight.Type.SOLO`.

| Conteneur | Préfixe plat | Exemples |
|-----------|--------------|----------|
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
| `Fight.Boss.*` | `BOSS_` | — |
| `Fight.Erosion.*` | `EROSION_` | — |
| `Fight.Use.*` | `USE_` | `Fight.Use.SUCCESS`, `.FAILED` |
| `Fight.Message.*` | `MESSAGE_` | — |
| `Field.*` | `MAP_` | `Field.NEXUS`, `.FACTORY` |
| `Effect.*` | `EFFECT_` | `Effect.DAMAGE`, `.HEAL`, `.POISON` |
| `State.*` | `STATE_` | `State.UNHEALABLE` |

> Les noms exacts des membres proviennent des *game data* du serveur ; les exemples ci-dessus sont
> indicatifs. L'autocomplétion de l'éditeur (`Weapon.`, `Effect.`, `Entity.Stat.`…) liste les membres
> réels disponibles.

---

## Combats reproductibles

Le moteur neutralise l'aléa et l'horloge : `Math.random()` (JS) et le module `random` (Python) sont
initialisés par la graine du combat ; aucun accès au système, au réseau ni aux fichiers. Ton IA
dispose d'un budget d'opérations et de mémoire par tour, calibré pour être comparable entre langages.
