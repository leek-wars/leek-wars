<template lang="html">
	<div v-if="stats.length" class="forge-stats">
		<div class="title">{{ $t('characteristic.characteristics') }}</div>
		<div class="card">
			<div v-for="[carac, value] in stats" :key="carac" class="row" :class="{ altered: isAltered(carac) }">
				<img class="ic" :src="'/image/charac/small/' + carac + '.png'">
				<span v-html="$t('characteristic.' + carac)"></span>
				<b class="value" :class="'color-' + carac">{{ value }}</b>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { computed } from 'vue'
	import { forgeComponent } from '@/model/forge-state'
	import { LeekWars } from '@/model/leekwars'
	import { mergeStats } from '@/model/alteration'

	defineOptions({ name: 'ForgeStats' })

	// Stats a jour de la piece posee dans la forge : stats de base du component_template
	// fusionnees avec les alterations deja portees par l'instance (#622). forgeComponent.family
	// EST l'id de component_template (params), la cle de LeekWars.components.
	const stats = computed<[string, number][]>(() => {
		const c = forgeComponent.value
		if (!c) return []
		const base = (LeekWars.components[c.family]?.stats ?? []) as [string, number][]
		return mergeStats(base, c.stats) as [string, number][]
	})
	// Une carac que le joueur a lui-meme montee : il doit la reperer d'un coup d'oeil.
	const isAltered = (carac: string) => !!forgeComponent.value?.stats?.[carac]
</script>

<style lang="scss" scoped>
	.forge-stats {
		width: 200px;
		flex-shrink: 0;
		padding: 10px;
	}
	.title {
		font-size: 13px;
		font-weight: bold;
		color: var(--text-color-secondary);
		text-align: center;
		margin-bottom: 6px;
	}
	.card {
		padding: 4px;
		border-radius: 6px;
		background: var(--background-secondary);
		.row {
			display: flex;
			align-items: center;
			gap: 7px;
			padding: 4px 7px;
			font-size: 13px;
			& + .row { margin-top: 2px; }
			// Carac montee par le joueur : liseré vert a gauche, franc (pas de coin arrondi).
			&.altered { box-shadow: inset 3px 0 0 #5fad1b; }
		}
		.ic { width: 17px; height: 17px; }
		.value {
			margin-left: auto;
			font-variant-numeric: tabular-nums;
			font-weight: bold;
		}
	}
</style>
