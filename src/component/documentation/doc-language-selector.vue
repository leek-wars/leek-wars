<template>
	<v-menu offset-y>
		<template #activator="{ props }">
			<div v-ripple class="tab doc-language-selector" :title="currentLabel" v-bind="props">
				<img :src="currentLogo" class="doc-language-logo" :alt="currentLabel">
				<img width="10" src="/image/selector.png" class="doc-language-caret">
			</div>
		</template>
		<v-list :dense="true">
			<v-list-item v-for="language in languages" :key="language.id"
				:class="{ active: language.id === docLanguage }"
				@click="setDocLanguage(language.id)">
				<template #prepend>
					<img :src="language.logo" class="doc-language-logo" :alt="language.label">
				</template>
				<span class="doc-language-name">{{ language.label }}</span>
			</v-list-item>
		</v-list>
	</v-menu>
</template>

<script setup lang="ts">
	import { computed, onMounted } from 'vue'
	import { VList, VListItem, VMenu } from 'vuetify/components'
	import { AI_LANGUAGES } from '@/component/editor/file-types'
	import { docLanguage, initDocLanguage, SELECTABLE_DOC_LANGUAGES, setDocLanguage, toSelectableDocLanguage } from '@/model/doc-language'
	import { store } from '@/model/store'

	/**
	 * Choix du langage dans lequel lire la documentation. L'état est global : basculer ici
	 * bascule aussi les blocs de code de l'encyclopédie et les autres pages de doc.
	 *
	 * Un seul logo — celui du langage courant — et le choix dans un menu. Afficher les quatre
	 * côte à côte faisait déborder la barre d'onglets dès 1200px et ne tenait pas du tout dans
	 * la barre d'application mobile.
	 */
	const languages = computed(() => SELECTABLE_DOC_LANGUAGES
		.map(id => AI_LANGUAGES.find(l => l.id === id))
		.filter((l): l is typeof AI_LANGUAGES[number] => !!l))

	// `javascript` peut rester dans l'état (préférence ancienne, `?lang=js`) : on l'affiche
	// comme TypeScript plutôt que de ne rien afficher.
	const current = computed(() => {
		const id = toSelectableDocLanguage(docLanguage.value)
		return languages.value.find(l => l.id === id) ?? languages.value[0]
	})
	const currentLogo = computed(() => current.value.logo)
	const currentLabel = computed(() => current.value.label)

	onMounted(() => initDocLanguage(store.state.farmer?.ai_language))
</script>

<style lang="scss" scoped>
	// La classe `tab` (global.scss : .page-bar .tabs .tab) fournit la forme d'onglet noire,
	// le fond, la hauteur et les pseudo-éléments en parallélogramme des voisins. On n'ajoute
	// ici que ce qui est propre au sélecteur, sans redéfinir display/padding/height : les
	// écraser sortait le bouton du flux des onglets et cassait l'alignement de la barre.
	.doc-language-selector {
		cursor: pointer;
	}
	// `!important` à contrecœur : `.page-bar .tabs .tab img { width: 22px }` (global.scss:445)
	// est plus spécifique que tout sélecteur scopé du composant, et s'appliquerait aussi bien
	// au logo qu'au chevron, qui n'ont pas la même taille.
	.doc-language-logo {
		width: 22px !important;
		height: 22px;
	}
	.doc-language-caret {
		width: 10px !important;
		opacity: 0.7;
		margin-left: 2px;
	}
	.doc-language-name {
		margin-left: 8px;
	}
	.v-list-item.active .doc-language-name {
		font-weight: bold;
	}
</style>
