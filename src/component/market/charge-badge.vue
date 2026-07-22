<template>
	<div v-if="ratio !== null" class="charge-badge" :title="$t('main.alteration_charge') + ' ' + percent + ' %'">
		<svg viewBox="0 0 36 36">
			<circle class="track" cx="18" cy="18" r="15" />
			<circle class="fill" :class="'tier-' + tier" cx="18" cy="18" r="15"
				:stroke-dasharray="circumference" :stroke-dashoffset="circumference * (1 - Math.min(1, ratio))" />
		</svg>
		<span class="value">{{ percent }}%</span>
	</div>
</template>

<script setup lang="ts">
	import { computed } from 'vue'
	import { well as wellCapacity, addedPower, alterationTier } from '@/model/alteration'

	/**
	 * Jauge circulaire de charge d'un composant altere (#622). Pose en badge sur
	 * l'image, elle montre le remplissage du puits avec le pourcentage au centre.
	 * Rendue seulement si la piece est alteree.
	 */
	const props = defineProps<{
		alterations?: { [carac: string]: number } | null
		level?: number
	}>()

	// Poids des caracs (couts marginaux, constants), en dur pour ne pas importer
	// LeekWars dans un composant de preview (cf. component-preview).
	const WEIGHTS: { [carac: string]: number } = {
		life: 1, strength: 4, agility: 4, wisdom: 4, resistance: 4, science: 4, magic: 4,
		frequency: 2, tp: 200, mp: 250, cores: 200, ram: 200,
	}
	const circumference = 2 * Math.PI * 15

	const ratio = computed(() => {
		if (!props.alterations || !props.level) return null
		const capacity = wellCapacity(props.level)
		if (capacity <= 0) return null
		const r = addedPower(props.alterations, WEIGHTS) / capacity
		return r > 0 ? r : null
	})
	const percent = computed(() => ratio.value !== null ? Math.round(ratio.value * 100) : 0)
	const tier = computed(() => {
		if (ratio.value === null) return 1
		const t = alterationTier(ratio.value)
		return t ? t.tier : 1
	})
</script>

<style lang="scss" scoped>
	.charge-badge {
		position: relative;
		width: 40px;
		height: 40px;
	}
	svg {
		width: 100%;
		height: 100%;
		// Part du haut, sens horaire.
		transform: rotate(-90deg);
	}
	.track {
		fill: var(--background);
		stroke: var(--background-secondary);
		stroke-width: 4;
	}
	.fill {
		fill: none;
		stroke-width: 4;
		stroke-linecap: round;
		transition: stroke-dashoffset 0.3s ease;
	}
	.fill.tier-1 { stroke: #008800; }
	.fill.tier-2 { stroke: #0090ff; }
	.fill.tier-3 { stroke: #c21aff; }
	.fill.tier-4 { stroke: #f8ac00; }
	.fill.tier-5 { stroke: red; }
	.value {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 11px;
		font-weight: bold;
		color: var(--text-color);
	}
</style>
