<template>
	<div class="doc-language-selector">
		<button v-for="language in AI_LANGUAGES" :key="language.id"
			:class="{ active: language.id === docLanguage }"
			:title="language.label"
			class="doc-language" type="button"
			@click="setDocLanguage(language.id)">
			<img :src="language.logo" class="doc-language-logo" :alt="language.label">
		</button>
	</div>
</template>

<script setup lang="ts">
	import { onMounted } from 'vue'
	import { AI_LANGUAGES } from '@/component/editor/file-types'
	import { docLanguage, initDocLanguage, setDocLanguage } from '@/model/doc-language'
	import { store } from '@/model/store'

	/**
	 * Choix du langage dans lequel lire la documentation. L'état est global : basculer ici
	 * bascule aussi les blocs de code de l'encyclopédie et les autres pages de doc.
	 *
	 * Logos seuls, sans libellé : quatre noms de langages côte à côte débordent de la barre
	 * d'onglets dès 1200px (« Python » passait sous l'icône de recherche). Le nom reste en
	 * `title`, et c'est déjà la présentation de la bannière d'inscription.
	 */
	onMounted(() => initDocLanguage(store.state.farmer?.ai_language))
</script>

<style lang="scss" scoped>
	.doc-language-selector {
		display: flex;
		align-items: center;
	}
	.doc-language {
		display: flex;
		align-items: center;
		gap: 5px;
		padding: 0 6px;
		height: 100%;
		border: none;
		background: none;
		color: var(--text-color-secondary);
		font-size: 13px;
		cursor: pointer;
		opacity: 0.5;
		&:hover {
			opacity: 0.8;
		}
		&.active {
			opacity: 1;
			color: var(--text-color);
			font-weight: bold;
		}
	}
	.doc-language-logo {
		width: 18px;
		height: 18px;
	}
	// Sur écran étroit chaque pixel de la barre d'onglets compte : sans ce resserrement les
	// 4 langages poussent le bouton plein écran hors champ.
	@media screen and (max-width: 700px) {
		.doc-language {
			padding: 0 3px;
		}
	}
</style>
