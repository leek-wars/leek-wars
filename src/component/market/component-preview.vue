<template lang="html">
	<div v-if="component" class="stats">
		<div v-for="(stat, s) in stats" :key="s" class="stat" :class="{[stat[0]]: true, negative: stat[1] < 0, altered: isAltered(stat[0])}">
			<img class="icon" :src="'/image/charac/' + stat[0] + '.png'">
			<b :class="'color-' + stat[0]">{{ stat[1] }}</b>&nbsp;
			<span v-html="$t('characteristic.' + stat[0])"></span>
			<span v-if="isAltered(stat[0])" class="bonus" :class="'color-' + stat[0]">+{{ alterations![stat[0]] }}</span>
		</div>
		<!-- Charge investie sur la capacité d'altération (#622). Toujours affichée pour un
		     composant, même neuf, pour que le joueur connaisse sa capacité avant d'agir. -->
		<div v-if="capacity" class="charge-line">
			<span>{{ $t('main.alteration_charge') }}</span>
			<b class="charge-value" :class="{ over: charge > capacity }">{{ charge }} / {{ capacity }}</b>
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { mergeStats } from '@/model/alteration'

defineOptions({ name: 'ComponentPreview' })

const props = defineProps<{
	component?: Record<string, unknown>
	/** Altérations portées par l'instance affichée (#622), s'il y en a. */
	alterations?: { [carac: string]: number } | null
	/** Puissance investie par les altérations, pré-calculée par le serveur (#622). */
	charge?: number
}>()

// Les stats montrées sont celles de la PIÈCE, pas celles du template : sinon un
// composant altéré affiche les mêmes chiffres qu'un neuf.
const stats = computed(() => {
	const base = ((props.component?.stats ?? []) as [string, number][])
	return mergeStats(base, props.alterations)
})
const isAltered = (carac: string) => !!props.alterations && !!props.alterations[carac]

// Capacité pré-calculée par le serveur (colonne component_template.capacity ou formule),
// lue dans ComponentTemplate.capacity ; charge = altered_power de l'instance. Aucun calcul
// (donc aucun import de LeekWars) : la tooltip reste un composant pur (#622).
const capacity = computed(() => (props.component?.capacity as number) ?? 0)
const charge = computed(() => props.charge ?? 0)
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
		// Ligne charge / puits : rappel du remplissage sous les stats, toujours visible
		// pour un composant afin de connaitre son puits total avant d'agir (#622).
		.charge-line {
			display: flex;
			align-items: center;
			padding: 4px 8px 4px 60px;
			border-top: 1px solid var(--border);
			.charge-value {
				margin-left: auto;
				&.over { color: #ff5252; }
			}
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