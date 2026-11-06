<template>
	<div class="history-filters" :class="{ stacked }">
		<div v-for="row in visibleRows" :key="row.group" class="filter-row">
			<span class="filter-label">{{ t(row.label) }}</span>
			<div class="chips">
				<div class="chip all" :class="{ on: allOn(row.group), indet: indeterminate(row.group) }" @click="toggleAll(row.group)">{{ t('main.all') }}</div>
				<span class="sep"></span>
				<div v-for="item in row.items" :key="item.key" class="chip" :class="[item.color, { on: modelValue[row.group][item.key] }]" @click="toggle(row.group, item.key)"><span class="dot"></span>{{ t(item.label) }}</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { computed } from 'vue'
	import { mixins, useNamespacedT } from '@/model/i18n'
	import {
		FILTER_ROWS, type FightFilters, type HistoryFilterGroup,
	} from '@/component/history/history-filters'

	// Libellés de la page d'historique : le dictionnaire `history` est chargé pour
	// ce composant aussi (cf. componentDictionary), y compris hors de la page,
	// dans le widget de l'accueil.
	defineOptions({ name: 'HistoryFilters', i18n: {}, mixins: [...mixins] })

	const props = withDefaults(defineProps<{
		modelValue: FightFilters
		/** Ligne « types » : absente de l'historique d'une équipe. */
		showTypes?: boolean
		/** Intitulés au-dessus des pastilles, pour un menu ou un écran étroit. */
		stacked?: boolean
	}>(), { showTypes: true, stacked: false })

	const emit = defineEmits<{ 'update:modelValue': [value: FightFilters] }>()

	const t = useNamespacedT('history')

	const visibleRows = computed(() =>
		FILTER_ROWS.filter(row => props.showTypes || row.group !== 'types'))

	function groupValues(group: HistoryFilterGroup): boolean[] {
		return Object.values(props.modelValue[group])
	}

	// « Tout » est coché quand toute la ligne l'est, indéterminé si elle ne l'est
	// qu'en partie ; cliquer (re)coche toute la ligne.
	// Ligne Butin : sémantique inversée. Ses pastilles sont des RESTRICTIONS
	// (cocher « Coffres » = ne montrer que les combats à coffres) et c'est aucune
	// pastille cochée qui affiche tout. « Tout » y est donc coché quand aucune
	// restriction n'est active, et cliquer dessus les efface.
	function allOn(group: HistoryFilterGroup): boolean {
		const values = groupValues(group)
		return group === 'loot' ? values.every(v => !v) : values.every(v => v)
	}

	function indeterminate(group: HistoryFilterGroup): boolean {
		const values = groupValues(group)
		return group === 'loot' ? values.some(v => v) : values.some(v => v) && !values.every(v => v)
	}

	function emitGroup(group: HistoryFilterGroup, value: Record<string, boolean>) {
		emit('update:modelValue', { ...props.modelValue, [group]: value })
	}

	function toggleAll(group: HistoryFilterGroup) {
		const next = group === 'loot' ? false : !allOn(group)
		const keys = Object.keys(props.modelValue[group])
		emitGroup(group, Object.fromEntries(keys.map(k => [k, next])))
	}

	function toggle(group: HistoryFilterGroup, key: string) {
		emitGroup(group, { ...props.modelValue[group], [key]: !props.modelValue[group][key] })
	}
</script>

<style lang="scss" scoped>
	.history-filters {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	.filter-row {
		display: flex;
		align-items: flex-start;
		gap: 12px;
	}
	.filter-label {
		flex: 0 0 130px;
		text-align: right;
		padding-top: 7px;
		font-size: 12px;
		font-weight: 500;
		line-height: 1.3;
		text-transform: uppercase;
		letter-spacing: 0.4px;
		color: var(--text-color-secondary);
	}
	.chips {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 7px;
	}
	.chip {
		--c: var(--primary);
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 5px 13px;
		border-radius: var(--radius-pill);
		font-size: 13px;
		line-height: 1;
		white-space: nowrap;
		cursor: pointer;
		user-select: none;
		color: var(--text-color-secondary);
		background: var(--background-secondary);
		border: 1px solid var(--border);
		transition: background 0.12s ease, border-color 0.12s ease, color 0.12s ease;
	}
	.chip:hover {
		color: var(--text-color);
		background: var(--background-header);
	}
	.chip.on {
		color: var(--c);
		background: color-mix(in srgb, var(--c) 15%, transparent);
		border-color: color-mix(in srgb, var(--c) 50%, transparent);
		font-weight: 600;
	}
	.chip.on:hover {
		color: var(--c);
		background: color-mix(in srgb, var(--c) 24%, transparent);
	}
	.chip .dot {
		flex: none;
		width: 7px;
		height: 7px;
		border-radius: var(--radius-pill);
		background: currentColor;
		opacity: 0.35;
	}
	.chip.on .dot {
		opacity: 1;
	}
	.chip.all {
		font-weight: 700;
		padding-left: 15px;
		padding-right: 15px;
	}
	.chip.all.indet {
		color: var(--c);
		background: transparent;
		border-style: dashed;
		border-color: color-mix(in srgb, var(--c) 50%, transparent);
	}
	.sep {
		align-self: stretch;
		width: 1px;
		margin: 2px 4px;
		background: var(--border);
	}
	/* La couleur d'un chip vient des jetons du thème : les mêmes que portent les
	   cartes et le tableau de l'historique, pour que le filtre « défaites » soit
	   du rouge des défaites. Ils existent en clair comme en sombre. */
	.res-win { --c: var(--result-win); }
	.res-draw { --c: var(--result-draw); }
	.res-defeat { --c: var(--result-defeat); }
	.res-generating { --c: var(--info); }

	/* Intitulés au-dessus des pastilles, celles-ci resserrées d'un cran : sur un
	   téléphone, l'intitulé réservait 130 px à droite d'une ligne de 412 et
	   chaque famille s'étalait sur trois ou quatre lignes ; dans le menu d'un
	   widget, la place manque de la même façon. */
	@mixin stacked {
		gap: 10px;
		.filter-row {
			flex-direction: column;
			align-items: stretch;
			gap: 4px;
		}
		.filter-label {
			flex: none;
			text-align: left;
			padding-top: 0;
			font-size: 11px;
		}
		.chips {
			gap: 5px;
		}
		.chip {
			padding: 4px 9px;
			font-size: 12px;
			gap: 5px;
		}
		.chip.all {
			padding-left: 11px;
			padding-right: 11px;
		}
	}
	.history-filters.stacked {
		@include stacked;
	}
	#app.app .history-filters {
		@include stacked;
	}

	/* Peau v2 : les valeurs historiques, au pixel près. */
	body.v2.dark .chip { --c: #7ec93f; }
	body.v2 .res-win { --c: var(--primary); }
	body.v2 .res-draw { --c: #8a8a8a; }
	body.v2 .res-defeat { --c: #d3382f; }
	body.v2 .res-generating { --c: #3f86d6; }
	body.v2.dark .res-win { --c: #7ec93f; }
	body.v2.dark .res-draw { --c: #a6a6a6; }
	body.v2.dark .res-defeat { --c: #e07a72; }
	body.v2.dark .res-generating { --c: #6ba8e6; }
</style>
