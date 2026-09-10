<template lang="html">
	<!-- Famille du composant (#4799) : c'est elle qui decide quelles alterations le prennent,
	     elle se lit donc AVANT les stats. Memes mots et meme icone que sur la fiche d'une
	     alteration, pour que le joueur rapproche les deux sans les comparer ligne a ligne.
	     Hors du bloc .stats : item-preview.scss y colore les enfants directs par alternance,
	     une ligne de plus decalait tout le zebrage. -->
	<div v-if="component && familyKey" class="family">
		<v-icon size="18">{{ familyIcon }}</v-icon>
		<span>{{ $t('main.' + familyKey) }}</span>
	</div>
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
import { COMPONENT_FAMILY_ICONS, COMPONENT_FAMILY_KEYS, mergeStats } from '@/model/alteration'

defineOptions({ name: 'ComponentPreview' })

const props = defineProps<{
	component?: Record<string, unknown>
	/** Altérations portées par l'instance affichée (#622), s'il y en a. */
	alterations?: { [carac: string]: number } | null
	/**
	 * Famille du composant (#4799), transmise par l'appelant : la fiche reste une vue pure,
	 * elle ne va rien chercher dans les game data. Les pièces de récupération n'ont pas de
	 * famille, elles ne sont pas altérables, et la ligne disparaît alors.
	 */
	family?: number | null
}>()

// Les stats montrées sont celles de la PIÈCE, pas celles du template : sinon un
// composant altéré affiche les mêmes chiffres qu'un neuf.
const stats = computed(() => {
	const base = ((props.component?.stats ?? []) as [string, number][])
	return mergeStats(base, props.alterations)
})
const familyKey = computed(() => props.family ? COMPONENT_FAMILY_KEYS[props.family] : null)
const familyIcon = computed(() => props.family ? COMPONENT_FAMILY_ICONS[props.family] : null)

const isAltered = (carac: string) => !!props.alterations && !!props.alterations[carac]
/** Delta porte par l'instance sur une carac, signe : negatif si la casse l'a creusee (#622). */
const delta = (carac: string) => props.alterations?.[carac] ?? 0
</script>

<style src='./item-preview.scss' lang='scss'></style>

<style lang="scss" scoped>
	.family {
		display: flex;
		align-items: center;
		gap: 7px;
		padding: 6px 8px;
		font-size: 13px;
		font-weight: bold;
		text-align: left;
		color: var(--text-color-secondary);
		background: var(--background-secondary);
	}
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
	// v3 : ni liseré ni halo, le fond uni suffit.
	//
	// Le liseré de 3 px à gauche est parti à la demande de Pierre (2026-09-10),
	// remplacé par une lueur façon halo de rareté ; essayée centrée, puis venant
	// de la droite, puis réduite à un accent de bord — et finalement abandonnée
	// (« pour le halo laisse tomber on l'enlève »). Reste le fond opaque, qui
	// porte le signe sur toute la largeur de la ligne. Le v2 garde son liseré.
	body:not(.v2) .stats .stat.altered,
	body:not(.v2) .stats .stat.broken {
		box-shadow: none;
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