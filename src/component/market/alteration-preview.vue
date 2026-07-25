<template lang="html">
	<div v-if="alteration" class="alteration-preview">
		<!-- Le gain depend du composant vise, pas de l'alteration : on montre donc les
		     trois cas plutot qu'un seul chiffre, sinon le joueur croit a une valeur fixe.
		     La carac visee est la MEME sur les trois lignes : elle est sortie en en-tete,
		     et les lignes deviennent un tableau famille / efficacite / gain / charge. Tout
		     repeter par ligne debordait des 280 px de l'infobulle (#622). -->
		<div class="carac-head">
			<img class="icon" :class="alteration.carac" :src="'/image/charac/' + alteration.carac + '.png'">
			<span v-html="$t('characteristic.' + alteration.carac)"></span>
		</div>
		<div class="stats">
			<div class="stat columns">
				<span class="fam"></span>
				<span class="factor"></span>
				<!-- L'icone titre la colonne des gains : pas de mot a traduire, et sans elle
				     « 50 50 » sur la vie ne dit pas lequel est le gain. -->
				<span class="gain"><img class="mini" :class="alteration.carac" :src="'/image/charac/small/' + alteration.carac + '.png'"></span>
				<span class="charge">{{ $t('main.alteration_charge') }}</span>
			</div>
			<div v-for="row in rows" :key="row.family" class="stat" :class="{best: row.best}">
				<span class="fam" :title="row.label">{{ row.label }}</span>
				<span class="factor">×{{ row.efficiency }}</span>
				<b class="gain" :class="'color-' + alteration.carac">+{{ row.gain }}</b>
				<!-- Charge consommee dans la capacite du composant : elle depend du palier,
				     donc elle se lit par ligne et pas en pied d'infobulle (#622). -->
				<span class="charge">{{ row.charge }}</span>
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
				// Charge = points gagnes x poids de la carac : ce que l'alteration mange
				// dans la capacite du composant.
				charge: (d.gains[a.carac] || [0, 0, 0])[tier] * (d.weights[a.carac] || 0),
				best: tier === 0,
			}
		})
	})
</script>

<style src='./item-preview.scss' lang='scss'></style>

<style lang="scss" scoped>
	// La carac visee, une seule fois, en tete de fiche.
	.carac-head {
		display: flex;
		align-items: center;
		gap: 7px;
		padding: 6px 8px;
		font-size: 14px;
		font-weight: bold;
		text-align: left;
		background: var(--background-secondary);
		img { width: 20px; height: 20px; }
	}
	// Tableau a quatre colonnes. La famille prend la place restante et se tronque a
	// l'ellipse plutot que de pousser les chiffres hors des 280 px de l'infobulle : les
	// libelles varient beaucoup d'une langue a l'autre.
	.stats .stat {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto 32px 40px;
		align-items: center;
		gap: 5px;
		padding: 4px 6px;
		font-size: 12px;
		text-align: left;
		.fam {
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
		}
		.factor {
			color: var(--text-color-secondary);
			font-weight: normal;
		}
		.gain, .charge {
			text-align: right;
			font-variant-numeric: tabular-nums;
		}
		.charge { color: var(--text-color-secondary); }
		// La famille de predilection est celle qui compte : elle ressort.
		&.best {
			background: #e3f0d8;
			font-weight: bold;
		}
	}
	// Ligne de titres : discrete, elle ne sert qu'a nommer les deux colonnes de chiffres.
	.stats .stat.columns {
		padding-top: 6px;
		padding-bottom: 0;
		font-size: 11px;
		color: var(--text-color-secondary);
		.mini { width: 15px; height: 15px; vertical-align: middle; }
	}
	body.dark .stats .stat.best {
		background: #2c3a22;
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
