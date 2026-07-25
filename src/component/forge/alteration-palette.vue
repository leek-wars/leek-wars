<template>
	<div class="alteration-palette">
		<div v-for="row in rows" :key="row.carac" class="palette-row">
			<img class="carac" :src="'/image/charac/small/' + row.carac + '.png'" :title="$t('characteristic.' + row.carac)">
			<div class="cells">
				<!-- Infobulle riche plutot que l'attribut title : elle donne les gains par
				     famille de composant, la charge consommee et le dosage, ce qu'une seule
				     ligne de texte ne pouvait pas porter (#622). -->
				<rich-tooltip-item v-for="a in row.alterations" :key="a.id" v-slot="{ props }" :item="LeekWars.items[a.template]" :inventory="true">
					<div v-ripple class="cell" :class="{empty: owned(a.template) === 0, over: !fits(a)}" v-bind="props" @click="pick(a)">
						<alteration-icon :template="a.template" title="" />
						<span v-if="owned(a.template) > 0" class="owned">{{ owned(a.template) }}</span>
					</div>
				</rich-tooltip-item>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { computed, defineAsyncComponent } from 'vue'
	import { LeekWars } from '@/model/leekwars'
	import { store } from '@/model/store'
	import { forgeComponent, forgeCharge, forgePendingPower } from '@/model/forge-state'
	import { efficiencyTier } from '@/model/alteration'
	import { emitter } from '@/model/vue'
	import type { InventoryItem } from '@/model/farmer'
	import type { AlterationTemplate } from '@/model/alteration'
	import AlterationIcon from '@/component/alteration/alteration-icon.vue'
	const RichTooltipItem = defineAsyncComponent(() => import('@/component/rich-tooltip/rich-tooltip-item.vue'))

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

	/**
	 * L'alteration rentre-t-elle encore dans la capacite de la piece posee, compte tenu de
	 * ce qui est deja dans la forge ? Le plafond souple (130 %) est la borne : au-dela la
	 * tentative est refusee, autant le montrer avant le clic (#622).
	 *
	 * Une indivisible mal ciblee est INERTE : elle ne consomme rien, donc elle rentre
	 * toujours (elle ne sert qu'a ajuster le dosage).
	 */
	const OVERFILL_CAP = 1.3
	const INDIVISIBLE = ['tp', 'mp', 'cores', 'ram']
	function fits(a: AlterationTemplate): boolean {
		const data = LeekWars.alterations
		const comp = forgeComponent.value
		if (!data || !comp) return true
		const capacity = LeekWars.componentCapacity(comp.template)
		if (capacity <= 0) return true
		const efficiency = (data.efficiency[a.family] || {})[comp.family] || 0
		if (INDIVISIBLE.indexOf(a.carac) !== -1 && efficiency < 1) return true
		const points = (data.gains[a.carac] || [0, 0, 0])[efficiencyTier(efficiency)]
		const power = points * (data.weights[a.carac] || 0)
		return forgeCharge.value + forgePendingPower.value + power <= capacity * OVERFILL_CAP
	}

	/** Pose l'alteration dans la forge : la forge verifie qu'un composant est present. */
	function pick(a: AlterationTemplate) {
		emitter.emit('add-alteration', { id: a.template, template: a.template, quantity: owned(a.template) } as InventoryItem)
	}
</script>

<style lang="scss" scoped>
	// Grille 3x4 : 3 colonnes, 4 lignes pour les 10 caracs. Chaque carte est une carac
	// en ligne : son icone suivie de ses 3 familles. A 3 colonnes plutot que 4, chaque
	// case gagne en largeur et les vignettes deviennent lisibles (#622).
	.alteration-palette {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 6px 8px;
		padding: 8px;
		border-bottom: 1px solid var(--border);
	}
	// Sous ~520px (mobile), 3 colonnes deviennent minuscules : on retombe a 2.
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
		// Assez grand pour bien voir la vignette : les cases grandissent jusque-la puis
		// se partagent la place restante de la colonne (#622).
		max-width: 44px;
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
		// Ne rentre plus dans la capacite de la piece posee : grisee et barree d'un liseré
		// rouge, pour eviter le clic qui finit en refus (#622).
		&.over {
			opacity: 0.4;
			border-color: #c62828;
		}
	}
	// Quantite possedee en bas a droite ; le numero de dosage est en haut a gauche,
	// pose par alteration-icon (#622). Blanc sur noir translucide comme les quantites
	// de l'inventaire et de l'historique : le blanc sur vert n'etait pas lisible.
	.owned {
		position: absolute;
		right: 0;
		bottom: 0;
		padding: 0 4px;
		border-top-left-radius: 4px;
		background: #000000b3;
		color: #fff;
		font-size: 11px;
		font-weight: 500;
		line-height: 15px;
		text-align: center;
	}
</style>
