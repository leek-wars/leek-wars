<template lang="html">
	<div v-if="component" class="stats">
		<div v-for="(stat, s) in stats" :key="s" class="stat" :class="{[stat[0]]: true, negative: stat[1] < 0, altered: isAltered(stat[0])}">
			<img class="icon" :src="'/image/charac/' + stat[0] + '.png'">
			<b :class="'color-' + stat[0]">{{ stat[1] }}</b>&nbsp;
			<span v-html="$t('characteristic.' + stat[0])"></span>
			<span v-if="isAltered(stat[0])" class="bonus" :class="'color-' + stat[0]">+{{ alterations![stat[0]] }}</span>
		</div>
		<!-- Barre de puits : seulement si la piece est deja alteree (#622). -->
		<div v-if="well" class="well">
			<div class="bar"><div class="fill" :class="'tier-' + well.tier" :style="{width: Math.min(100, well.ratio * 100) + '%'}"></div></div>
			<span class="label">{{ $t('main.alteration_well') }} {{ Math.round(well.ratio * 100) }} %</span>
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { mergeStats, well as wellCapacity, addedPower, alterationTier } from '@/model/alteration'

defineOptions({ name: 'ComponentPreview' })

const props = defineProps<{
	component?: Record<string, unknown>
	/** Altérations portées par l'instance affichée (#622), s'il y en a. */
	alterations?: { [carac: string]: number } | null
	/** Niveau du composant, pour calculer son puits. */
	level?: number
}>()

// Les stats montrées sont celles de la PIÈCE, pas celles du template : sinon un
// composant altéré affiche les mêmes chiffres qu'un neuf.
const stats = computed(() => {
	const base = ((props.component?.stats ?? []) as [string, number][])
	return mergeStats(base, props.alterations)
})
const isAltered = (carac: string) => !!props.alterations && !!props.alterations[carac]

// Remplissage du puits : puissance ajoutée / capacité (0,85 × niveau). Affiché
// seulement quand la pièce porte des altérations, sinon la barre serait toujours vide.
// Poids des caracs (couts marginaux, constants). En dur ici pour ne pas importer
// LeekWars dans un composant de preview : ca tirerait tout le store et casserait les
// tests unitaires, qui montent la preview sans app complete.
const WEIGHTS: { [carac: string]: number } = {
	life: 1, strength: 4, agility: 4, wisdom: 4, resistance: 4, science: 4, magic: 4,
	frequency: 2, tp: 200, mp: 250, cores: 200, ram: 200,
}
const well = computed(() => {
	if (!props.alterations || !props.level) return null
	const capacity = wellCapacity(props.level)
	if (capacity <= 0) return null
	const ratio = addedPower(props.alterations, WEIGHTS) / capacity
	const tier = alterationTier(ratio)
	return ratio > 0 ? { ratio, tier: tier ? tier.tier : 1 } : null
})
</script>

<style src='./item-preview.scss' lang='scss'></style>

<style lang="scss" scoped>
	.stats {
		.stat {
			padding: 4px 0;
			padding-left: 60px;
			text-align: left;
			display: flex;
			align-items: center;
			&.negative {
				background: #fcc;
			}
			// Une carac que le joueur a montee lui-meme : il doit la reperer.
			&.altered {
				box-shadow: inset 3px 0 0 #5fad1b;
			}
			.bonus {
				margin-left: auto;
				padding-right: 8px;
				font-weight: bold;
			}
			img {
				width: 20px;
				height: 20px;
				margin-bottom: 1px;
				margin-right: 6px;
			}
		}
	}
	.well {
		padding: 6px 10px 8px;
		.bar {
			position: relative;
			height: 8px;
			border-radius: 4px;
			background: var(--background-secondary);
			overflow: hidden;
		}
		.fill {
			position: absolute;
			top: 0;
			bottom: 0;
			left: 0;
		}
		// La barre reprend la couleur du palier, comme la silhouette de la vignette.
		.fill.tier-1 { background: #008800; }
		.fill.tier-2 { background: #0090ff; }
		.fill.tier-3 { background: #c21aff; }
		.fill.tier-4 { background: #f8ac00; }
		.fill.tier-5 { background: red; }
		.label {
			display: block;
			text-align: center;
			font-size: 12px;
			color: var(--text-color-secondary);
			padding-top: 3px;
		}
	}
	body.dark {
		.stats .stat.negative {
			background: rgb(83, 14, 14);
		}
		.stat.frequency img {
			filter: invert(1);
		}
	}
</style>