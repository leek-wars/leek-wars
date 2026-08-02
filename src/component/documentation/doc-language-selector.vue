<template>
	<v-menu offset-y>
		<template #activator="{ props }">
			<div v-ripple class="doc-language-selector" :title="currentLabel" v-bind="props">
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
	.doc-language-selector {
		display: flex;
		align-items: center;
		gap: 4px;
		padding: 0 8px;
		height: 100%;
		cursor: pointer;
		opacity: 0.85;
		&:hover {
			opacity: 1;
		}
	}
	.doc-language-logo {
		width: 18px;
		height: 18px;
	}
	.doc-language-caret {
		opacity: 0.7;
	}
	.doc-language-name {
		margin-left: 8px;
	}
	.v-list-item.active .doc-language-name {
		font-weight: bold;
	}
</style>
