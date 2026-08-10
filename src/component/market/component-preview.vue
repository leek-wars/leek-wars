<template lang="html">
	<div v-if="component" class="stats">
		<div v-for="(stat, s) in stats" :key="s" class="stat" :class="{[stat[0]]: true, negative: stat[1] < 0, altered: isAltered(stat[0]), broken: delta(stat[0]) < 0}">
			<img class="icon" :src="'/image/charac/' + stat[0] + '.png'">
			<b :class="'color-' + stat[0]">{{ stat[1] }}</b>&nbsp;
			<span v-html="$t('characteristic.' + stat[0])"></span>
			<!-- Le delta est SIGNE : la casse peut avoir creuse la carac sous sa base (#622),
			     d'ou le signe explicite plutot qu'un « + » en dur qui affichait « +-5 ». -->
			<span v-if="isAltered(stat[0])" class="bonus" :class="{['color-' + stat[0]]: delta(stat[0]) > 0}">
				{{ delta(stat[0]) > 0 ? '+' : '−' }}{{ Math.abs(delta(stat[0])) }}
			</span>
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
/** Delta porte par l'instance sur une carac, signe : negatif si la casse l'a creusee (#622). */
const delta = (carac: string) => props.alterations?.[carac] ?? 0
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
			// Une carac que le joueur a montee lui-meme : il doit la reperer. Lisere a
			// gauche ET fond teinte, qui porte le signe du delta sur toute la ligne.
			// Couleurs OPAQUES : l'infobulle se pose par-dessus l'inventaire, une teinte
			// translucide y laissait voir les vignettes du dessous (#622).
			&.altered {
				box-shadow: inset 3px 0 0 var(--primary);
				background: #e8f4e0;
			}
			// Carac creusee par la casse : meme repere, mais dans le ton du palier
			// negatif, sinon un trou se lisait comme un gain (#622).
			&.broken {
				box-shadow: inset 3px 0 0 #7d5a5a;
				background: #f7e6e6;
			}
			.bonus {
				margin-left: auto;
				padding-right: 8px;
				font-weight: bold;
			}
			&.broken .bonus {
				color: #7d5a5a;
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
		// Memes teintes, calees sur le fond sombre des lignes (#622).
		.stats .stat.altered { background: #1e2a17; }
		.stats .stat.broken { background: #2a1a1a; }
		.stat.frequency img {
			filter: invert(1);
		}
	}
</style>