<template lang="html">
	<div v-if="owned !== null" class="stats">
		<!-- Même forme que les lignes de valeur juste au-dessus (« Valeur estimée : 137 000 ») :
		     libellé, deux-points, nombre en gras — le seul élément que l'œil vient chercher. -->
		<div>
			{{ $t('main.owned_quantity') }} : <b>{{ LeekWars.formatNumber(owned) }}</b>
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ItemTemplate } from '@/model/item'
import { LeekWars } from '@/model/leekwars'
import { store } from '@/model/store'

defineOptions({ name: 'ResourcePreview' })

const props = defineProps<{
	resource?: ItemTemplate
}>()

/**
 * Stock de la ressource, `null` quand la question n'a pas de sens : un
 * visiteur déconnecté n'a pas d'inventaire, et « Vous en possédez 0 » lui
 * mentirait. Zéro s'affiche en revanche pour un éleveur connecté — dans une
 * recette de la forge, « je n'en ai aucune » est justement l'information
 * cherchée, et la case de l'ingrédient, elle, porte la quantité REQUISE.
 *
 * Le compte vient du getter du store et non d'une boucle sur `farmer.resources` :
 * lui seul écarte les instances altérées rangées sous le même template et
 * dit donc la même chose que le serveur.
 */
const owned = computed<number | null>(() => {
	if (!store.state.farmer || !props.resource) return null
	return store.getters.item_quantity(props.resource.id)
})
</script>

<style src='./item-preview.scss' lang='scss'></style>
