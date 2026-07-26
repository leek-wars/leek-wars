<template>
	<div v-if="ratio !== null" class="charge-badge" :title="$t('main.alteration_charge') + ' ' + chargeText">
		<svg viewBox="0 0 36 36" :class="{ reverse: ratio < 0 }">
			<circle class="track" cx="18" cy="18" r="15" />
			<circle class="fill" :class="'tier-' + tier" cx="18" cy="18" r="15"
				:stroke-dasharray="circumference" :stroke-dashoffset="circumference * (1 - Math.min(1, Math.abs(ratio)))" />
		</svg>
		<span class="value">{{ percent }}%</span>
	</div>
</template>

<script setup lang="ts">
	import { computed } from 'vue'
	import { addedPower, alterationTier, displayRatio, rawAddedPower } from '@/model/alteration'
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
		// Budget au-dessus de zero, brut en dessous : cf. displayRatio, qui porte la regle
		// pour la jauge, le liseré, la forge et le tri de l'inventaire d'un seul tenant.
		const r = displayRatio(props.alterations, props.capacity, weights)
		// Charge negative comprise : une piece creusee par la casse doit se voir, c'est
		// justement l'information qui compte avant de l'equiper ou de l'acheter (#622).
		return r !== 0 ? r : null
	})
	const percent = computed(() => ratio.value !== null ? Math.round(ratio.value * 100) : 0)
	// Infobulle : le budget consomme sur la capacite, plus la valeur NETTE des stats quand
	// elle en differe. L'ecart vaut la moitie de ce que la casse a creuse, et il n'est
	// lisible nulle part ailleurs.
	const chargeText = computed(() => {
		const cap = props.capacity ?? 0
		const weights = LeekWars.alterations?.weights
		if (!props.alterations || !weights) return '0 / ' + cap
		const used = Math.round(addedPower(props.alterations, weights))
		const raw = Math.round(rawAddedPower(props.alterations, weights))
		return used + ' / ' + cap + (raw !== used ? ' (' + raw + ' net)' : '')
	})
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
		// Charge negative : meme depart, mais l'arc tourne dans le sens ANTI-horaire.
		// Un trou se lit alors comme l'exact inverse d'un gain, sans avoir a lire le
		// pourcentage (#622). Miroir applique APRES la rotation, pour garder le depart
		// en haut ; le pourcentage est un frere du svg, il n'est pas retourne.
		&.reverse { transform: scaleX(-1) rotate(-90deg); }
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
	// Palier 0 : charge negative, la piece a ete creusee sous ses stats de base.
	.fill.tier-0 { stroke: #7d5a5a; }
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
