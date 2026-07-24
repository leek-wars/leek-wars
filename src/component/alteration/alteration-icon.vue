<template>
	<div class="alteration-icon" :title="tooltip">
		<img class="image" :src="'/image/alteration/' + name + '.png'" :alt="tooltip" loading="lazy">
		<span v-if="number !== null" class="number">{{ LeekWars.roman(number) }}</span>
	</div>
</template>

<script lang="ts" setup>
	import { computed } from 'vue'
	import { LeekWars } from '@/model/leekwars'
	import { t } from '@/model/i18n'

	/**
	 * Icône d'une altération (#622).
	 *
	 * L'image porte la famille par sa forme (fiole, lingot, boîtier) et la
	 * caractéristique visée par sa couleur, reprise du code couleur du jeu. Le numéro
	 * publié est affiché par-dessus : c'est lui qui sert à composer un dosage, il doit
	 * être lisible sans survol.
	 */
	const props = withDefaults(defineProps<{
		/** item_template de l'altération. */
		template: number
		showNumber?: boolean
		/** Remplace l'infobulle par défaut (le nom seul), pour y ajouter la charge. */
		title?: string
	}>(), { showNumber: true, title: undefined })

	const alteration = computed(() => {
		const data = LeekWars.alterations
		if (!data) return null
		for (const id in data.alterations) {
			if (data.alterations[id].template === props.template) return data.alterations[id]
		}
		return null
	})

	const name = computed(() => alteration.value ? alteration.value.name : '')
	const number = computed(() => props.showNumber && alteration.value ? alteration.value.number : null)
	const tooltip = computed(() => props.title !== undefined
		? props.title
		: (alteration.value ? t('alteration.' + alteration.value.name) : ''))
</script>

<style lang="scss" scoped>
	.alteration-icon {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 100%;
	}
	.image {
		max-width: 100%;
		max-height: 100%;
	}

	// Le numéro publié doit rester lisible sur les deux thèmes et par-dessus n'importe
	// quelle teinte d'image, d'où le liseré sombre plutôt qu'une couleur de texte.
	// En haut à gauche : le coin bas droit est réservé à la quantité possédée (#622).
	.number {
		position: absolute;
		top: -2px;
		left: 0;
		font-size: 11px;
		font-weight: bold;
		color: #fff;
		text-shadow: 0 0 2px #000, 0 0 2px #000, 0 1px 1px #000;
		pointer-events: none;
	}
</style>
