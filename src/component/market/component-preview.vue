<template lang="html">
	<div v-if="component" class="stats">
		<div v-for="(stat, s) in stats" :key="s" class="stat" :class="{[stat[0]]: true, negative: stat[1] < 0, altered: isAltered(stat[0])}">
			<img class="icon" :src="'/image/charac/' + stat[0] + '.png'">
			<b :class="'color-' + stat[0]">{{ stat[1] }}</b>&nbsp;
			<span v-html="$t('characteristic.' + stat[0])"></span>
			<span v-if="isAltered(stat[0])" class="bonus">+{{ alterations![stat[0]] }}</span>
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
}>()

// Les stats montrées sont celles de la PIÈCE, pas celles du template : sinon un
// composant altéré affiche les mêmes chiffres qu'un neuf.
const stats = computed(() => {
	const base = ((props.component?.stats ?? []) as [string, number][])
	return mergeStats(base, props.alterations)
})
const isAltered = (carac: string) => !!props.alterations && !!props.alterations[carac]
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
				color: #5fad1b;
			}
			img {
				width: 20px;
				height: 20px;
				margin-bottom: 1px;
				margin-right: 6px;
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