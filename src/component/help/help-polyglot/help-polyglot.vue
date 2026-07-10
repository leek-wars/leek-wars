<template lang="html">
	<div class="page">
		<div class="content">
			<markdown :content="content" mode="encyclopedia" />
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import Markdown from '@/component/encyclopedia/markdown.vue'
import { LeekWars } from '@/model/leekwars'

// Doc joueur "écrire une IA en JS/Python/TypeScript". Contenu bilingue FR/EN rendu par le renderer
// markdown de l'encyclopédie (pas de fichiers .i18n par langue -> on importe ce .vue directement, cf
// router). Fallback anglais pour les autres langues (comme le reste de la section /help avancée).
const { locale } = useI18n()

LeekWars.setTitle(locale.value === 'fr' ? 'IA en JavaScript, Python et TypeScript' : 'AI in JavaScript, Python and TypeScript')

const FR = `# Écrire son IA en JavaScript, Python ou TypeScript

En plus du **LeekScript**, tu peux écrire tes IA en **JavaScript**, **TypeScript** ou **Python**. Le langage est déterminé par l'extension du fichier :

- **LeekScript** : *(aucune extension)*
- **JavaScript** : \`.js\` (ou \`.mjs\`)
- **TypeScript** : \`.ts\` (ou \`.mts\`)
- **Python** : \`.py\`

Tu choisis le langage à la création d'un fichier (bouton « Nouvelle IA » dans l'éditeur) ou comme langage par défaut de ta première IA à l'inscription. Les IA de langages différents peuvent combattre entre elles.

## Point d'entrée : turn()

À chaque tour, le moteur exécute ton IA. Deux façons d'écrire :

**IA simple** — écris directement ton code, il est rejoué à chaque tour :

\`\`\`javascript
const me = Fight.me
me.setWeapon(Weapon.pistol)
const enemy = Fight.getNearestEnemy()
me.moveToward(enemy)
me.useWeapon(enemy)
\`\`\`

**IA avec état** — définis une fonction \`turn()\`. Le corps du fichier n'est évalué **qu'une fois** (déclare tes classes et variables persistantes), puis \`turn()\` est rejouée à chaque tour :

\`\`\`python
memoire = []           # persiste entre les tours

def turn():
    me = Fight.me
    me.setWeapon(Weapon.pistol)
    enemy = Fight.getNearestEnemy()
    me.moveToward(enemy)
    me.useWeapon(enemy)
\`\`\`

En JavaScript, une IA simple (sans \`turn()\`) est rejouée dans une portée fraîche à chaque tour : pour garder un état, utilise \`turn()\` avec des variables/classes au niveau du fichier. En Python, les variables de module persistent d'un tour à l'autre.

## Fight.me : ton entité

Il n'y a pas de variable globale \`me\` : ton entité s'obtient via \`Fight.me\`. Récupère-la une fois en début de tour :

\`\`\`javascript
const me = Fight.me
me.life        // points de vie
me.cell        // ta case actuelle
me.tp          // PT restants
me.weapon      // arme équipée
\`\`\`

## L'API objet

Tout passe par des objets :

- **Fight.me** (ton entité) : \`life\`, \`tp\`, \`mp\`, \`strength\`, \`cell\`, \`weapon\`, \`chips\`, \`effects\`, \`states\`… et les actions \`setWeapon(w)\`, \`useWeapon(cible)\`, \`useChip(puce, cible)\`, \`moveToward(cible)\`, \`say("...")\`, \`summon(...)\`.
- **Fight** : \`getNearestEnemy()\`, \`getEnemies()\`, \`getAliveEnemies()\`, \`turn\` (numéro du tour)…
- **Entity** et ses sous-types \`Leek\`, \`Turret\`, \`Bulb\`, \`Chest\`, \`Mob\` : les cibles renvoyées sont typées.
- **Cell** (une case) : \`x\`, \`y\`, \`empty\`, \`obstacle\`, \`entity\`, \`distance(autre)\`, \`path(cible)\`.
- **Weapon / Chip** : \`cost\`, \`minRange\`, \`maxRange\`, \`name\`… et les objets prêts \`Weapon.pistol\`, \`Chip.fireBall\`.
- **Field** : géométrie du terrain (\`cellFromXY(x, y)\`, \`path(a, b)\`, \`lineOfSight(a, b)\`…).
- **Registers** : stockage persistant entre combats (\`get\`/\`set\`/\`delete\`).
- **Debug** : marquage du terrain (\`mark\`, \`show\`…).

Les **constantes** sont rangées par famille : \`Effect.DAMAGE\`, \`State.UNHEALABLE\`, \`Entity.Stat.STRENGTH\`, \`Cell.Type.EMPTY\`, \`Fight.Type.SOLO\`.

\`console.log()\` (JS) et \`print()\` (Python) sont redirigés vers le journal de combat (comme \`debug()\`) : leur sortie apparaît dans le rapport.

## Plusieurs fichiers

Tu peux découper ton IA : **modules ES** (\`import\` / \`export\`) en JavaScript/TypeScript, \`import\` en Python. Seuls tes propres fichiers sont accessibles (aucun accès disque ni réseau).

## Combats reproductibles

Pour que les combats soient rejouables à l'identique, le moteur neutralise l'aléa et l'horloge : \`Math.random()\` (JS) et le module \`random\` (Python) sont initialisés par la graine du combat ; l'horloge est figée ; aucun accès au système, au réseau ni aux fichiers.

## Budget d'exécution

Comme en LeekScript, ton IA dispose d'un budget d'opérations et de mémoire par tour (selon le niveau de ton poireau). \`getOperations()\` renvoie ta consommation courante — sers-t'en pour borner une recherche. Le budget est calibré pour être **comparable entre les langages**. Dépasser le budget interrompt le tour.

## TypeScript

En \`.ts\`, l'éditeur vérifie tes types en direct (toute l'API de combat est typée). Le TypeScript est transpilé en JavaScript au moment du combat, puis exécuté par le même moteur.
`

const EN = `# Writing your AI in JavaScript, Python or TypeScript

Besides **LeekScript**, you can write your AIs in **JavaScript**, **TypeScript** or **Python**. The language is determined by the file extension:

- **LeekScript**: *(no extension)*
- **JavaScript**: \`.js\` (or \`.mjs\`)
- **TypeScript**: \`.ts\` (or \`.mts\`)
- **Python**: \`.py\`

You pick the language when creating a file ("New AI" button in the editor) or as the default language of your first AI when signing up. AIs written in different languages can fight each other.

## Entry point: turn()

Each turn, the engine runs your AI. Two ways to write it:

**Simple AI** — write your code directly, it runs every turn:

\`\`\`javascript
const me = Fight.me
me.setWeapon(Weapon.pistol)
const enemy = Fight.getNearestEnemy()
me.moveToward(enemy)
me.useWeapon(enemy)
\`\`\`

**Stateful AI** — define a \`turn()\` function. The file body runs **only once** (declare your classes and persistent variables there), then \`turn()\` runs every turn:

\`\`\`python
memory = []            # persists between turns

def turn():
    me = Fight.me
    me.setWeapon(Weapon.pistol)
    enemy = Fight.getNearestEnemy()
    me.moveToward(enemy)
    me.useWeapon(enemy)
\`\`\`

In JavaScript, a simple AI (without \`turn()\`) runs in a fresh scope each turn: to keep state, use \`turn()\` with file-level variables/classes. In Python, module variables persist between turns.

## Fight.me: your entity

There is no global \`me\` variable: get your entity via \`Fight.me\`. Fetch it once at the start of the turn:

\`\`\`javascript
const me = Fight.me
me.life        // health
me.cell        // your current cell
me.tp          // remaining TP
me.weapon      // equipped weapon
\`\`\`

## The object API

Everything goes through objects:

- **Fight.me** (your entity): \`life\`, \`tp\`, \`mp\`, \`strength\`, \`cell\`, \`weapon\`, \`chips\`, \`effects\`, \`states\`… and the actions \`setWeapon(w)\`, \`useWeapon(target)\`, \`useChip(chip, target)\`, \`moveToward(target)\`, \`say("...")\`, \`summon(...)\`.
- **Fight**: \`getNearestEnemy()\`, \`getEnemies()\`, \`getAliveEnemies()\`, \`turn\` (turn number)…
- **Entity** and its subtypes \`Leek\`, \`Turret\`, \`Bulb\`, \`Chest\`, \`Mob\`: returned targets are typed.
- **Cell** (a cell): \`x\`, \`y\`, \`empty\`, \`obstacle\`, \`entity\`, \`distance(other)\`, \`path(target)\`.
- **Weapon / Chip**: \`cost\`, \`minRange\`, \`maxRange\`, \`name\`… and ready-made objects \`Weapon.pistol\`, \`Chip.fireBall\`.
- **Field**: field geometry (\`cellFromXY(x, y)\`, \`path(a, b)\`, \`lineOfSight(a, b)\`…).
- **Registers**: storage persisted between fights (\`get\`/\`set\`/\`delete\`).
- **Debug**: field marking (\`mark\`, \`show\`…).

**Constants** are grouped by family: \`Effect.DAMAGE\`, \`State.UNHEALABLE\`, \`Entity.Stat.STRENGTH\`, \`Cell.Type.EMPTY\`, \`Fight.Type.SOLO\`.

\`console.log()\` (JS) and \`print()\` (Python) are redirected to the fight log (like \`debug()\`): their output shows up in the fight report.

## Multiple files

You can split your AI: **ES modules** (\`import\` / \`export\`) in JavaScript/TypeScript, \`import\` in Python. Only your own files are accessible (no disk or network access).

## Reproducible fights

So that fights can be replayed identically, the engine neutralizes randomness and the clock: \`Math.random()\` (JS) and the \`random\` module (Python) are seeded from the fight seed; the clock is frozen; there is no access to the system, network or files.

## Execution budget

As in LeekScript, your AI has a budget of operations and memory per turn (based on your leek's level). \`getOperations()\` returns your current usage — use it to bound a search. The budget is calibrated to be **comparable across languages**. Exceeding the budget interrupts the turn.

## TypeScript

In \`.ts\`, the editor checks your types live (the whole combat API is typed). TypeScript is transpiled to JavaScript at fight time, then run by the same engine.
`

const content = computed(() => (locale.value === 'fr' ? FR : EN))
</script>

<style scoped lang="scss">
.page {
	padding: 10px;
}
.content {
	background: var(--background);
	border-radius: 4px;
	padding: 20px 30px;
	max-width: 900px;
	margin: 0 auto;
}
</style>
