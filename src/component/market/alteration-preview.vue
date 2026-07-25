<template lang="html">
	<div v-if="alteration" class="alteration-preview">
		<!-- Le gain depend du composant vise, pas de l'alteration : on montre donc les
		     trois cas plutot qu'un seul chiffre, sinon le joueur croit a une valeur fixe. -->
		<div class="stats">
			<div v-for="row in rows" :key="row.family" class="stat" :class="{best: row.best}">
				<img class="icon" :src="'/image/charac/' + alteration.carac + '.png'">
				<b :class="'color-' + alteration.carac">+{{ row.gain }}</b>&nbsp;
				<span v-html="$t('characteristic.' + alteration.carac)"></span>
				<span class="on">{{ row.label }}</span>
				<span class="factor">×{{ row.efficiency }}</span>
			</div>
		</div>
		<!-- Sans ce mot, les trois "+1" d'une carac indivisible passent pour un bug. -->
		<div v-if="indivisible" class="note">{{ $t('main.alteration_indivisible') }}</div>
		<div class="dose">
			{{ $t('main.alteration_number') }} <b>{{ alteration.number }}</b>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { computed } from 'vue'
	import { ComponentFamily } from '@/model/alteration'
	import { LeekWars } from '@/model/leekwars'
	import { t } from '@/model/i18n'

	defineOptions({ name: 'AlterationPreview' })

	const props = defineProps<{
		/** item_template de l'alteration. */
		template: number
	}>()

	const data = computed(() => LeekWars.alterations)

	const alteration = computed(() => {
		if (!data.value) return null
		for (const id in data.value.alterations) {
			if (data.value.alterations[id].template === props.template) return data.value.alterations[id]
		}
		return null
	})

	const FAMILIES = [
		{ id: ComponentFamily.FRUIT, key: 'fruits' },
		{ id: ComponentFamily.PHYSICAL, key: 'physical_components' },
		{ id: ComponentFamily.ELECTRONIC, key: 'electronic_components' },
	]

	// PT, PM, coeurs et memoire ne se fractionnent pas : le gain reste +1 et c'est la
	// probabilite de reussite qui encaisse l'efficacite de famille.
	const INDIVISIBLE = ['tp', 'mp', 'cores', 'ram']
	const indivisible = computed(() => !!alteration.value && INDIVISIBLE.indexOf(alteration.value.carac) !== -1)

	const rows = computed(() => {
		const d = data.value
		const a = alteration.value
		if (!d || !a) return []
		return FAMILIES.map(f => {
			const efficiency = (d.efficiency[a.family] || {})[f.id] ?? 0
			// Palier : 0 = championne (x1), 1 = moyenne (x0,2), 2 = quasi nulle (x0,04).
			const tier = efficiency >= 1 ? 0 : (efficiency >= 0.2 ? 1 : 2)
			return {
				family: f.id,
				label: t('main.' + f.key),
				efficiency,
				gain: (d.gains[a.carac] || [0, 0, 0])[tier],
				best: tier === 0,
			}
		})
	})
</script>

<style src='./item-preview.scss' lang='scss'></style>

<style lang="scss" scoped>
	.stats .stat {
		padding: 4px 8px;
		text-align: left;
		display: flex;
		align-items: center;
		gap: 2px;
		img {
			width: 20px;
			height: 20px;
			margin-bottom: 1px;
			margin-right: 6px;
		}
		// La famille de predilection est celle qui compte : elle ressort.
		&.best {
			background: #e3f0d8;
			font-weight: bold;
		}
		.on {
			margin-left: 6px;
			color: var(--text-color-secondary);
			font-weight: normal;
		}
		.factor {
			margin-left: auto;
			color: var(--text-color-secondary);
			font-weight: normal;
		}
	}
	// item-preview.scss ne colore que les enfants directs de .stats, par alternance.
	// Ces deux blocs sont en dehors : sans fond explicite, la fiche laisse voir
	// l'inventaire au travers.
	.note {
		padding: 5px 8px;
		font-size: 13px;
		color: var(--text-color-secondary);
		text-align: left;
		background: var(--background-secondary);
	}
	.dose {
		padding: 5px 8px;
		border-top: 1px solid var(--border);
		color: var(--text-color-secondary);
		text-align: left;
		background: var(--background);
	}
	body.dark {
		.stats .stat.best { background: #23401f; }
		.stat img { filter: none; }
	}
</style>
