<template>
	<div class="page">
		<div class="page-header page-bar">
			<h1><breadcrumb :items="[{name: 'Administration', link: '/admin'}, {name: 'Altérations (' + alterations.length + ')', link: '/admin/alterations'}]" :raw="true" /></h1>
		</div>

		<panel v-if="!data" class="first">
			<div class="empty">Données de jeu non chargées.</div>
		</panel>

		<template v-else>
			<!-- Matrice d'efficacité : c'est elle qui décide du gain, elle doit être lisible d'abord. -->
			<panel class="first" title="Matrice d'efficacité">
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
					Puits d'un composant = {{ data.well_coefficient }} × son niveau, {{ data.max_items }} altérations par tentative au plus.
				</div>
			</panel>

			<panel title="Les 36 altérations">
				<table class="alterations">
					<tr>
						<th></th>
						<th class="left">Nom</th>
						<th>Famille</th>
						<th>Carac</th>
						<th title="Numéro publié, utilisé pour composer un dosage">N°</th>
						<th title="Gain sur son type de composant">Gain fort</th>
						<th title="Gain sur le type suivant">moyen</th>
						<th title="Gain sur le dernier type">faible</th>
						<th title="Puissance consommée dans le puits par le gain fort">Puits</th>
						<th>Item</th>
					</tr>
					<tr v-for="a in alterations" :key="a.id" :class="{indivisible: isIndivisible(a.carac)}">
						<td class="icon"><alteration-icon :template="a.template" :show-number="false" /></td>
						<td class="left name">{{ $t('alteration.' + a.name) }}</td>
						<td>{{ familyLabel(a.family) }}</td>
						<td><span :class="'color-' + a.carac">{{ $t('characteristic.' + a.carac) }}</span></td>
						<td class="number">{{ a.number }}</td>
						<td class="gain strong">+{{ gain(a.carac, 0) }}</td>
						<td class="gain">+{{ gain(a.carac, 1) }}</td>
						<td class="gain">+{{ gain(a.carac, 2) }}</td>
						<td class="power">{{ power(a.carac) }}</td>
						<td class="template">{{ a.template }}</td>
					</tr>
				</table>
				<div class="legend">
					Le gain dépend du composant visé, pas de l'altération : une Vitamine D donne
					+{{ gain('life', 0) }} vie sur un fruit, +{{ gain('life', 1) }} sur un composant physique
					et +{{ gain('life', 2) }} sur un électronique.
					Les caractéristiques indivisibles (en gris) donnent toujours +1 et encaissent
					l'efficacité sur la probabilité au lieu du gain.
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

	const data = computed(() => LeekWars.alterations)

	const alterations = computed(() => {
		if (!data.value) return []
		return Object.values(data.value.alterations)
	})

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
	/** Puissance consommée dans le puits par le gain fort : c'est elle qui limite. */
	function power(carac: string): number {
		return gain(carac, 0) * (data.value?.weights[carac] ?? 0)
	}
	function isIndivisible(carac: string): boolean {
		return INDIVISIBLE.indexOf(carac) !== -1
	}
	function familyLabel(family: number): string {
		return FAMILIES.find(f => f.id === family)?.label ?? '?'
	}

	onMounted(() => {
		LeekWars.setTitle('Altérations')
		store.commit('breadcrumb', [{ name: 'Administration', link: '/admin' }])
	})
</script>

<style lang="scss" scoped>
	table {
		width: 100%;
		border-collapse: collapse;
	}
	th, td {
		padding: 4px 8px;
		text-align: center;
		border-bottom: 1px solid var(--border);
	}
	th {
		font-weight: normal;
		color: var(--text-color-secondary);
		font-size: 13px;
	}
	.left { text-align: left; }
	.name { font-weight: bold; }
	.icon { width: 44px; }
	.icon :deep(img) { width: 34px; height: 34px; }

	.matrix { width: auto; }
	.matrix td { font-weight: bold; min-width: 90px; }
	// Champion, moyen, quasi nul : trois teintes claires, assombries en sombre pour
	// rester lisibles sans flasher.
	.eff-0 { background: #d8f0d8; }
	.eff-1 { background: #fdf0d0; }
	.eff-2 { background: #f6dada; }
	:global(body.dark) .eff-0 { background: #23401f; }
	:global(body.dark) .eff-1 { background: #453a1c; }
	:global(body.dark) .eff-2 { background: #452323; }

	.gain { font-variant-numeric: tabular-nums; }
	.gain.strong { font-weight: bold; }
	.number, .power, .template {
		font-variant-numeric: tabular-nums;
		color: var(--text-color-secondary);
	}
	.indivisible .gain { color: var(--text-color-secondary); }

	.legend {
		padding: 10px 8px 4px;
		font-size: 13px;
		color: var(--text-color-secondary);
	}
	.empty { padding: 20px; text-align: center; color: var(--text-color-secondary); }
</style>
