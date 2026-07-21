<template>
	<div class="page">
		<div class="page-header page-bar">
			<h1><breadcrumb :items="[{name: 'Administration', link: '/admin'}, {name: 'Altérations (' + rows.length + ')', link: '/admin/alterations'}]" :raw="true" /></h1>
		</div>

		<panel v-if="!data" class="first">
			<div class="empty">Données de jeu non chargées.</div>
		</panel>

		<template v-else>
			<!-- La matrice décide du gain : elle se lit avant le tableau. -->
			<panel class="first" icon="mdi-grid" title="Matrice d'efficacité">
				<table class="matrix">
					<tr>
						<th></th>
						<th v-for="c in COMPONENT_FAMILIES" :key="c.id">{{ c.label }}</th>
					</tr>
					<tr v-for="f in FAMILIES" :key="f.id">
						<th class="left">{{ f.label }}</th>
						<td v-for="c in COMPONENT_FAMILIES" :key="c.id" :class="'eff-' + tierOf(f.id, c.id)">
							×{{ efficiency(f.id, c.id) }}
						</td>
					</tr>
				</table>
				<div class="legend">
					Cycle parfait : chaque famille est championne d'un type, moyenne sur le suivant,
					quasi nulle sur le dernier. Aucune famille n'est jamais inutile.
					Puits d'un composant = {{ data.well_coefficient }} × son niveau,
					{{ data.max_items }} altérations par tentative au plus.
				</div>
			</panel>

			<panel icon="mdi-flask" :title="'Les ' + rows.length + ' altérations'">
				<v-data-table
					:headers="headers"
					:items="rows"
					:items-per-page="36"
					:items-per-page-options="itemsPerPageOptions"
					:sort-by="[{ key: 'id', order: 'asc' }]"
					density="compact"
					class="alterations-table">
					<template #item.name="{ item }">
						<div class="label-cell">
							<alteration-icon class="thumb" :template="item.template" :show-number="false" />
							<span class="name">{{ item.name }}</span>
						</div>
					</template>
					<template #item.carac="{ item }">
						<div class="carac-cell">
							<img class="charac-icon" :src="'/image/charac/small/' + item.carac + '.png'" :alt="item.carac">
							<span :class="'color-' + item.carac">{{ item.caracLabel }}</span>
						</div>
					</template>
					<template #item.gainStrong="{ item }"><span class="gain strong">+{{ item.gainStrong }}</span></template>
					<template #item.gainMedium="{ item }"><span class="gain" :class="{dim: item.indivisible}">+{{ item.gainMedium }}</span></template>
					<template #item.gainWeak="{ item }"><span class="gain" :class="{dim: item.indivisible}">+{{ item.gainWeak }}</span></template>
					<template #item.power="{ item }"><span class="dim">{{ item.power }}</span></template>
					<template #item.template="{ item }"><span class="dim">{{ item.template }}</span></template>
				</v-data-table>
				<div class="legend">
					Le gain dépend du composant visé, pas de l'altération : une Vitamine D donne
					+{{ gain('life', 0) }} vie sur un fruit, +{{ gain('life', 1) }} sur un composant physique
					et +{{ gain('life', 2) }} sur un électronique.
					Les caractéristiques indivisibles donnent toujours +1 et encaissent l'efficacité
					sur la probabilité au lieu du gain, d'où leur coût en puits de 200 à 250 contre
					48 à 50 pour les autres.
				</div>
			</panel>
		</template>
	</div>
</template>

<script lang="ts" setup>
	import { computed, onMounted } from 'vue'
	import { AlterationFamily, ComponentFamily } from '@/model/alteration'
	import { LeekWars } from '@/model/leekwars'
	import { store } from '@/model/store'
	import { i18n, t } from '@/model/i18n'
	import AlterationIcon from '@/component/alteration/alteration-icon.vue'

	/** Page admin des altérations (#622) : catalogue et équilibrage, en lecture seule. */

	const FAMILIES = [
		{ id: AlterationFamily.VITAMIN, label: 'Vitamines' },
		{ id: AlterationFamily.ALLOY, label: 'Alliages' },
		{ id: AlterationFamily.BOOSTER, label: 'Survolteurs' },
	]
	const COMPONENT_FAMILIES = [
		{ id: ComponentFamily.FRUIT, label: 'Fruits' },
		{ id: ComponentFamily.PHYSICAL, label: 'Physiques' },
		{ id: ComponentFamily.ELECTRONIC, label: 'Électroniques' },
	]
	const INDIVISIBLE = ['tp', 'mp', 'cores', 'ram']

	const headers: any[] = [
		{ title: 'ID', key: 'id', align: 'end', sortable: true },
		{ title: 'Altération', key: 'name', align: 'start', sortable: true },
		{ title: 'Famille', key: 'family', align: 'start', sortable: true },
		{ title: 'Caractéristique', key: 'carac', align: 'start', sortable: true, value: 'caracLabel' },
		{ title: 'N°', key: 'number', align: 'end', sortable: true },
		{ title: 'Gain fort', key: 'gainStrong', align: 'end', sortable: true },
		{ title: 'moyen', key: 'gainMedium', align: 'end', sortable: true },
		{ title: 'faible', key: 'gainWeak', align: 'end', sortable: true },
		{ title: 'Puits', key: 'power', align: 'end', sortable: true },
		{ title: 'Item', key: 'template', align: 'end', sortable: true },
	]
	const itemsPerPageOptions = [
		{ value: 12, title: '12' },
		{ value: 36, title: '36' },
		{ value: -1, title: 'Tout' },
	]

	const data = computed(() => LeekWars.alterations)

	function efficiency(family: number, componentFamily: number): number {
		return (data.value?.efficiency[family] || {})[componentFamily] ?? 0
	}
	/** 0 = championne, 1 = moyenne, 2 = quasi nulle. Sert à colorer la matrice. */
	function tierOf(family: number, componentFamily: number): number {
		const e = efficiency(family, componentFamily)
		return e >= 1 ? 0 : (e >= 0.2 ? 1 : 2)
	}
	function gain(carac: string, tier: number): number {
		return (data.value?.gains[carac] || [0, 0, 0])[tier]
	}

	/** Traduit, ou retombe sur la cle brute si elle n'existe pas encore. */
	function translate(key: string, fallback: string): string {
		return (i18n.global.te as (k: string) => boolean)(key) ? t(key) : fallback
	}

	const rows = computed(() => {
		if (!data.value) return []
		const weights = data.value.weights
		return Object.values(data.value.alterations).map(a => ({
			id: a.id,
			name: translate('alteration.' + a.name, a.name),
			family: FAMILIES.find(f => f.id === a.family)?.label ?? '?',
			carac: a.carac,
			caracLabel: translate('characteristic.' + a.carac, a.carac),
			number: a.number,
			gainStrong: gain(a.carac, 0),
			gainMedium: gain(a.carac, 1),
			gainWeak: gain(a.carac, 2),
			// Puissance consommée dans le puits par le gain fort : c'est elle qui limite.
			power: gain(a.carac, 0) * (weights[a.carac] ?? 0),
			template: a.template,
			indivisible: INDIVISIBLE.indexOf(a.carac) !== -1,
		}))
	})

	onMounted(() => {
		LeekWars.setTitle('Altérations')
		store.commit('breadcrumb', [{ name: 'Administration', link: '/admin' }])
	})
</script>

<style lang="scss" scoped>
	.matrix {
		width: auto;
		border-collapse: collapse;
	}
	.matrix th, .matrix td {
		padding: 4px 10px;
		text-align: center;
		border-bottom: 1px solid var(--border);
	}
	.matrix th {
		font-weight: normal;
		color: var(--text-color-secondary);
		font-size: 13px;
	}
	.matrix td { font-weight: bold; min-width: 100px; }
	.left { text-align: left; }

	// Championne, moyenne, quasi nulle : trois teintes claires, assombries en sombre
	// pour rester lisibles sans flasher.
	.eff-0 { background: #d8f0d8; }
	.eff-1 { background: #fdf0d0; }
	.eff-2 { background: #f6dada; }
	:global(body.dark) .eff-0 { background: #23401f; }
	:global(body.dark) .eff-1 { background: #453a1c; }
	:global(body.dark) .eff-2 { background: #452323; }

	.label-cell, .carac-cell {
		display: flex;
		align-items: center;
		gap: 8px;
	}
	.thumb {
		width: 30px;
		height: 30px;
		flex: 0 0 auto;
	}
	.thumb :deep(img) { width: 30px; height: 30px; }
	.name { font-weight: bold; }
	.charac-icon {
		width: 18px;
		height: 18px;
		flex: 0 0 auto;
	}

	.gain { font-variant-numeric: tabular-nums; }
	.gain.strong { font-weight: bold; }
	.dim { color: var(--text-color-secondary); }

	.legend {
		padding: 10px 8px 4px;
		font-size: 13px;
		color: var(--text-color-secondary);
	}
	.empty { padding: 20px; text-align: center; color: var(--text-color-secondary); }
</style>
