<template>
	<div class="alteration-palette">
		<div v-for="row in rows" :key="row.carac" class="palette-row">
			<img class="carac" :src="'/image/charac/small/' + row.carac + '.png'" :title="$t('characteristic.' + row.carac)">
			<div class="cells">
				<div v-for="a in row.alterations" :key="a.id" v-ripple class="cell" :class="{empty: owned(a.template) === 0}"
					:title="$t('alteration.' + a.name)" @click="pick(a)">
					<alteration-icon :template="a.template" />
					<span v-if="owned(a.template) > 0" class="owned">{{ owned(a.template) }}</span>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { computed } from 'vue'
	import { LeekWars } from '@/model/leekwars'
	import { store } from '@/model/store'
	import { emitter } from '@/model/vue'
	import type { InventoryItem } from '@/model/farmer'
	import type { AlterationTemplate } from '@/model/alteration'
	import AlterationIcon from '@/component/alteration/alteration-icon.vue'

	/**
	 * Palette de toutes les alterations du jeu (#622), en tete de l'onglet Ameliorer.
	 * Une ligne par caracteristique, ses trois familles cote a cote ; un clic pose
	 * l'alteration dans la forge. La quantite possedee est affichee ; les alterations
	 * absentes de l'inventaire restent visibles mais grisees, pour montrer ce qui existe.
	 */
	defineOptions({ name: 'AlterationPalette' })

	// Groupe les alterations par caracteristique, dans l'ordre canonique du jeu, chaque
	// ligne triee par famille (vitamine, alliage, survolteur).
	const rows = computed(() => {
		const data = LeekWars.alterations
		if (!data) return [] as { carac: string, alterations: AlterationTemplate[] }[]
		const byCarac: { [carac: string]: AlterationTemplate[] } = {}
		for (const id in data.alterations) {
			const a = data.alterations[id]
			;(byCarac[a.carac] ??= []).push(a)
		}
		return LeekWars.characteristics
			.filter(carac => byCarac[carac])
			.map(carac => ({ carac, alterations: byCarac[carac].sort((a, b) => a.family - b.family) }))
	})

	/** Quantite de cette alteration dans l'inventaire du fermier. */
	function owned(template: number): number {
		const item = store.state.farmer?.alterations?.find(a => a.template === template)
		return item ? item.quantity : 0
	}

	/** Pose l'alteration dans la forge : la forge verifie qu'un composant est present. */
	function pick(a: AlterationTemplate) {
		emitter.emit('add-alteration', { id: a.template, template: a.template, quantity: owned(a.template) } as InventoryItem)
	}
</script>

<style lang="scss" scoped>
	// Grille 4x3 : 4 colonnes, 3 lignes pour les 10 caracs. Chaque carte est une carac
	// en ligne : son icone suivie de ses 3 familles ; les cases retrecissent pour tenir
	// les 4 colonnes quelle que soit la largeur du panneau (#622).
	.alteration-palette {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 6px 8px;
		padding: 8px;
		border-bottom: 1px solid var(--border);
	}
	// Sous ~520px (mobile), 4 colonnes deviennent minuscules : on retombe a 2.
	@media (max-width: 520px) {
		.alteration-palette { grid-template-columns: repeat(2, 1fr); }
	}
	.palette-row {
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 5px;
		min-width: 0;
	}
	.carac {
		width: 18px;
		height: 18px;
		flex: 0 0 auto;
	}
	.cells {
		display: flex;
		gap: 3px;
		min-width: 0;
		flex: 1;
	}
	.cell {
		position: relative;
		flex: 1 1 0;
		min-width: 0;
		max-width: 32px;
		aspect-ratio: 1;
		padding: 3px;
		border: 1px solid var(--border);
		border-radius: 4px;
		background: var(--background);
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		&:hover { border-color: var(--primary); }
		// Alteration absente de l'inventaire : montree pour l'inventaire des possibles,
		// mais estompee pour signaler qu'on ne peut pas encore la poser.
		&.empty { opacity: 0.35; }
	}
	// Quantite possedee en bas a droite ; le numero de dosage est en haut a gauche,
	// pose par alteration-icon (#622).
	.owned {
		position: absolute;
		bottom: -5px;
		right: -5px;
		min-width: 15px;
		height: 15px;
		padding: 0 3px;
		border-radius: 8px;
		background: var(--primary);
		color: #fff;
		font-size: 10px;
		font-weight: bold;
		line-height: 15px;
		text-align: center;
	}
</style>
