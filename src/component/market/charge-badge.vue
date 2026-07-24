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
	import { addedPower, alterationTier } from '@/model/alteration'
	import { LeekWars } from '@/model/leekwars'

	/**
	 * Jauge circulaire de charge d'un composant altere (#622). Pose en badge sur
	 * l'image, elle montre le remplissage du puits avec le pourcentage au centre.
	 * Rendue seulement si la piece est alteree.
	 */
	const props = defineProps<{
		alterations?: { [carac: string]: number } | null
		/** Capacité d'altération, pré-calculée par le serveur (colonne ou formule, #622). */
		capacity?: number
	}>()

	const circumference = 2 * Math.PI * 15

	// Les poids viennent du serveur, jamais d'une copie locale : une table en dur ici
	// derivait en silence des que l'equilibrage bougeait, et le pourcentage affiche
	// devenait faux sans que rien ne le signale (#622).
	const ratio = computed(() => {
		const weights = LeekWars.alterations?.weights
		if (!props.alterations || !props.capacity || !weights) return null
		const r = addedPower(props.alterations, weights) / props.capacity
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
