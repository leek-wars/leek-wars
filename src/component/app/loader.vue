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
				<i v-for="n in 8" :key="n"></i>
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

/* ====== v3 : une chenille pixel ======
   Le spinner circulaire est le dernier objet Material de la coquille (137 points
   d'appel). En v3, huit blocs occupent le pourtour d'une grille 3×3 — le centre
   reste vide — et une tête lumineuse en fait le tour. Chaque bloc joue la même
   descente d'opacité, décalée d'un huitième de cycle, et la descente est jouée
   en PALIERS : la tête garde donc une traînée de deux ou trois blocs à des
   niveaux francs, sans dégradé continu. Rien n'est animé d'autre que
   l'opacité (compositable, aucun repaint) et la boîte est la même qu'avant. */
body.v2 .pixel-loader {
	display: none;
}
body:not(.v2) .sbl-circ-path {
	display: none;
}
.pixel-loader {
	display: inline-grid;
	grid-template-columns: repeat(3, 1fr);
	grid-template-rows: repeat(3, 1fr);
	gap: 14%;
	vertical-align: bottom;
	i {
		background: var(--primary);
		opacity: 0.12;
		animation: lw-loader-chase 0.8s steps(4) infinite;
		// Un huitième de cycle d'écart par bloc, dans l'ordre de la course.
		animation-delay: calc(-0.1s * var(--k));
	}
	// Le pourtour, dans le sens des aiguilles d'une montre.
	i:nth-child(1) { grid-area: 1 / 1; --k: 0; }
	i:nth-child(2) { grid-area: 1 / 2; --k: 1; }
	i:nth-child(3) { grid-area: 1 / 3; --k: 2; }
	i:nth-child(4) { grid-area: 2 / 3; --k: 3; }
	i:nth-child(5) { grid-area: 3 / 3; --k: 4; }
	i:nth-child(6) { grid-area: 3 / 2; --k: 5; }
	i:nth-child(7) { grid-area: 3 / 1; --k: 6; }
	i:nth-child(8) { grid-area: 2 / 1; --k: 7; }
}
@keyframes lw-loader-chase {
	0% { opacity: 1; }
	100% { opacity: 0.12; }
}
// Mouvement réduit : la chenille ralentit au lieu de s'arrêter — un loader figé
// se lit comme une page bloquée.
@media (prefers-reduced-motion: reduce) {
	.pixel-loader i {
		animation-duration: 2.4s;
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