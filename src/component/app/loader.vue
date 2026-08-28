<template lang="html">
	<div class="loader">
		<div v-if="LeekWars.xpTheme" class="xp-progress" :style="{width: s + 'px'}">
			<div class="xp-progress-bar"></div>
		</div>
		<template v-else>
			<!-- Le disque Material reste la peau du v2 ; la v3 a sa chenille pixel.
			     Les deux sont rendus, la coquille n'en montre qu'un. -->
			<div :style="{width: s + 'px', height: s + 'px', 'border-width': w + 'px'}" class="sbl-circ-path"></div>
			<div :style="{width: s + 'px', height: s + 'px'}" class="pixel-loader">
				<i v-for="cell in cells" :key="cell.key" :style="{gridArea: cell.row + ' / ' + cell.col, '--t': cell.t}"></i>
			</div>
		</template>
	</div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

defineOptions({ name: 'Loader' })

const props = defineProps<{
	size?: number
}>()

const s = computed(() => props.size || 60)
const w = computed(() => Math.max(3, s.value / 14))

// Décalage de départ de chaque colonne. Des valeurs volontairement dispersées :
// avec 0,1,2,3,4 les gouttes formeraient une diagonale bien nette, et l'objet
// aurait l'air réglé au métronome plutôt que d'être un flux.
const COLUMN_OFFSET = [0, 3, 1, 4, 2]
// Le cycle compte 10 temps pour 5 rangées : la goutte traverse la colonne en 5
// temps, puis la colonne reste éteinte les 5 suivants. Comme les colonnes sont
// décalées, l'ensemble n'est jamais vide.
const CYCLE = 10

/** Les 25 cases, avec le temps du cycle où la goutte passe sur chacune. */
const cells = computed(() => {
	const list: {key: string, row: number, col: number, t: number}[] = []
	for (let col = 0; col < 5; col++) {
		for (let row = 0; row < 5; row++) {
			list.push({ key: row + '-' + col, row: row + 1, col: col + 1, t: (row + COLUMN_OFFSET[col]) % CYCLE })
		}
	}
	return list
})
</script>

<style lang="scss" scoped>
.loader {
	padding: 30px;
	margin: auto;
	text-align: center;
}
.sbl-circ-path {
	display: inline-block;
	color: var(--border);
	position: relative;
	border-style: solid;
	border-radius: 50%;
	border-right-color: var(--primary);
	animation: rotate 0.8s linear infinite;
	vertical-align: bottom;
}
@keyframes rotate {
	0% {
		transform: rotate(0);
	}
	100% {
		transform: rotate(360deg);
	}
}

/* ====== v3 : une pluie de données ======
   Le spinner circulaire est le dernier objet Material de la coquille (137 points
   d'appel). En v3, une goutte tombe dans chacune des cinq colonnes d'une grille
   5×5 : tête vive, puis une traînée de deux blocs qui s'éteint. Chaque colonne
   part avec son propre décalage, si bien que rien n'est jamais synchrone — c'est
   ce qui donne la lecture « flux » plutôt que « mire ».
   Une seule règle d'animation pour les 25 cases : toutes jouent la même chute
   d'opacité, et c'est leur `--t` (le temps du cycle où la goutte leur passe
   dessus, calculé dans le script) qui les décale. La chute est jouée EN PALIERS,
   donc la traînée a des niveaux francs et non un dégradé. Seule l'opacité est
   animée : compositable, aucun repaint. */
body.v2 .pixel-loader {
	display: none;
}
body:not(.v2) .sbl-circ-path {
	display: none;
}
.pixel-loader {
	display: inline-grid;
	grid-template-columns: repeat(5, 1fr);
	grid-template-rows: repeat(5, 1fr);
	gap: 11%;
	vertical-align: bottom;
}
.pixel-loader i {
	background: var(--primary);
	opacity: 0.09;
	animation: lw-loader-rain 1s steps(3) infinite;
	// La case s'allume au temps `--t` du cycle, un dixième de seconde par temps :
	// `--t` croît avec la rangée, donc la goutte descend. Le `- 1s` recule d'un
	// cycle entier pour que le délai reste négatif — l'animation est déjà lancée
	// à l'affichage, pas de case morte au démarrage.
	animation-delay: calc(0.1s * var(--t) - 1s);
}
@keyframes lw-loader-rain {
	0% { opacity: 1; }
	30% { opacity: 0.09; }
	100% { opacity: 0.09; }
}
// Mouvement réduit : la pluie ralentit au lieu de s'arrêter — un loader figé se
// lit comme une page bloquée.
@media (prefers-reduced-motion: reduce) {
	.pixel-loader i {
		animation-duration: 3s;
	}
}
.xp-progress {
	display: inline-block;
	height: 18px;
	border: 1px solid #686868;
	border-radius: var(--radius);
	background: var(--white);
	box-shadow: inset 0 0 1px rgba(104, 104, 104, 1);
	overflow: hidden;
	padding: 1px 2px;
}
.xp-progress-bar {
	height: 100%;
	border-radius: var(--radius-tiny);
	background: repeating-linear-gradient(
		to right,
		var(--white) 0px, var(--white) 2px,
		transparent 2px, transparent 10px
	),
	linear-gradient(
		to bottom,
		#acedad 0%, #7be47d 14%, #4cda50 28%, #2ed330 42%,
		#42d845 57%, #76e275 71%, #8fe791 85%, #fff 100%
	);
	animation: xp-loading 2s ease-in-out infinite;
}
@keyframes xp-loading {
	0% { width: 0%; }
	50% { width: 100%; }
	100% { width: 0%; }
}
</style>