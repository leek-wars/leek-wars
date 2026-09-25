<template>
	<div class="code-tabs">
		<div class="code-tabs-header">
			<button v-for="block in blocks" :key="block.language"
				:class="{ active: block.language === active }"
				class="code-tab" type="button"
				@click="select(block.language)">
				<img v-if="logoOf(block.language)" :src="logoOf(block.language)" class="code-tab-logo">
				{{ labelOf(block.language) }}
			</button>
		</div>
		<code :key="active" ref="code" class="multi" :class="themeClass"></code>
	</div>
</template>

<script setup lang="ts">
	import { computed, nextTick, onMounted, ref, watch } from 'vue'
	import { AI_LANGUAGES } from '@/component/editor/file-types'
	import { resolveCodeThemeClass } from '@/component/editor/code-theme'
	import { DocLanguage, docLanguage, setDocLanguage, toSelectableDocLanguage } from '@/model/doc-language'
	import { LeekWars } from '@/model/leekwars'

	/**
	 * Un même exemple décliné en plusieurs langages, présenté en onglets. Les onglets sont
	 * pilotés par l'état GLOBAL `docLanguage` : changer de langage sur un bloc le change sur
	 * toute la page (et sur les suivantes), plutôt que de laisser le lecteur rebasculer
	 * chaque bloc un par un.
	 */
	const props = defineProps<{ blocks: { language: DocLanguage, code: string }[] }>()

	const code = ref<HTMLElement | null>(null)
	const themeClass = resolveCodeThemeClass()

	/**
	 * Le langage global n'est pas forcément disponible sur CE bloc (une page peut n'avoir
	 * qu'un exemple LeekScript et un Python). On retombe alors sur le premier onglet, sans
	 * toucher à la préférence globale : le lecteur en Python garde sa préférence pour la
	 * suite même s'il passe devant un exemple qui ne l'a pas.
	 */
	const active = computed<DocLanguage>(() => {
		if (props.blocks.some(b => b.language === docLanguage.value)) return docLanguage.value
		// TypeScript et JavaScript sont interchangeables à la lecture (même API, même runtime).
		if (docLanguage.value === 'typescript' && props.blocks.some(b => b.language === 'javascript')) return 'javascript'
		if (docLanguage.value === 'javascript' && props.blocks.some(b => b.language === 'typescript')) return 'typescript'
		return props.blocks[0].language
	})

	// Un bloc ```js est étiqueté « TypeScript » : les deux langages ne font qu'un pour le
	// lecteur (même API, même runtime) et le sélecteur n'offre plus JavaScript. Afficher
	// « JavaScript » sur l'onglet alors que le sélecteur affiche TypeScript sèmerait le doute.
	const displayed = (language: DocLanguage) => toSelectableDocLanguage(language)
	const labelOf = (language: DocLanguage) => AI_LANGUAGES.find(l => l.id === displayed(language))?.label ?? language
	const logoOf = (language: DocLanguage): string | undefined => AI_LANGUAGES.find(l => l.id === displayed(language))?.logo

	function select(language: DocLanguage) {
		setDocLanguage(language)
	}

	function render() {
		const element = code.value
		if (!element) return
		const block = props.blocks.find(b => b.language === active.value)
		if (!block) return
		LeekWars.createCodeArea(block.code, element, block.language)
	}

	// `:key="active"` recrée l'élément à chaque changement d'onglet : createCodeArea refuse de
	// reformater un élément déjà formaté, il lui faut un élément neuf.
	onMounted(render)
	watch(active, () => nextTick(render))
</script>

<style lang="scss" scoped>
	.code-tabs {
		margin: 8px 0;
	}
	.code-tabs-header {
		display: flex;
		gap: 2px;
		flex-wrap: wrap;
	}
	.code-tab {
		display: flex;
		align-items: center;
		gap: 5px;
		padding: 4px 10px;
		border: 1px solid var(--border);
		border-bottom: none;
		border-radius: 4px 4px 0 0;
		background: var(--background-secondary);
		color: var(--text-color-secondary);
		font-size: 13px;
		cursor: pointer;
		&:hover {
			color: var(--text-color);
		}
		&.active {
			background: var(--background);
			color: var(--text-color);
			font-weight: bold;
		}
	}
	.code-tab-logo {
		width: 14px;
		height: 14px;
	}
	// Pas de `display` ici : la règle globale `code { display: flex }` (global.scss) place la
	// gouttière de numéros de ligne à gauche du <pre>. L'écraser la renvoyait à droite avec
	// un grand vide au-dessus du code.
	code.multi {
		border: 1px solid var(--border);
		border-top-left-radius: 0;
	}
</style>
