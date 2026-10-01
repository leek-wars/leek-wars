<template lang="html">
	<div v-if="version" class="version">
		<!-- L'affiche de la version prend tout l'écran : quand la recherche ne garde
		     que quelques lignes, elle éloignerait les résultats les uns des autres. -->
		<img v-if="!found_sections" :src="'/image/mail/mail_' + version.version + '.webp'" class="image" loading="lazy" @error="($event.target as HTMLImageElement).style.display = 'none'">
		<div class="wrapper">
			<div class="sections">
				<div v-for="(section, s) in sections" :key="section.index" class="section">
					<h4 v-if="all_sections.length > 1" :class="{first: s === 0}">{{ $t('changelog.title_' + section.index) }}</h4>
					<div v-for="(change, c) in section.changes" :key="c" class="change">
						<span v-html="'➤ ' + change.text"></span>
						<v-menu v-for="image in change.images" :key="image" :close-on-content-click="false" offset-overflow :nudge-top="0" transition="none" :open-on-hover="true" :open-delay="200" :close-delay="10" offset-y location="top">
							<template #activator="{ props }">
								<v-icon class="screenshot" v-bind="props">mdi-tooltip-image-outline</v-icon>
							</template>
							<img class="image-menu" :src="'/image/changelog/' + image + '.png'">
						</v-menu>
					</div>
				</div>
			</div>
			<!-- Même chose pour le sujet forum : les résultats des différentes
			     versions se suivent ainsi de plus près. -->
			<router-link v-if="version.forum_topic && !found_sections" :to="'/forum/category-' + version.forum_category + '/topic-' + version.forum_topic">
				<v-btn color="primary" class="button">➤ {{ $t('changelog.forum_topic') }}</v-btn>
			</router-link>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { mixins } from '@/model/i18n'
import { changeHtml, changeImages, highlight, searchVersion, versionSections } from './changelog-search'
import type { ChangelogSection, ChangelogYamlVersion } from './changelog-search'

interface ChangelogVersion {
	version: string | number
	forum_topic?: number | null
	forum_category?: number | null
	[key: string]: unknown
}

defineOptions({ name: 'ChangelogVersion', i18n: {}, mixins: [...mixins] })

const props = withDefaults(defineProps<{
	version: ChangelogVersion | null
	// Termes de recherche déjà normalisés : la version ne montre alors que les
	// lignes qui les contiennent toutes, surlignées.
	terms?: string[]
}>(), { terms: () => [] })

const { t, locale } = useI18n()
const changelog = ref<Record<string, unknown> | null>(null)

// Seules ces langues ont un changelog traduit ; les autres retombent sur l'anglais.
const CHANGELOG_LOCALES = ['fr', 'en', 'es', 'it']
function update() {
	const lang = CHANGELOG_LOCALES.includes(locale.value) ? locale.value : 'en'
	import(/* webpackChunkName: "changelog-[request]" */ `@/component/changelog/changelog.${lang}.yaml`).then((module) => {
		changelog.value = module.default
	})
}

watch(locale, update)
update()

const changes = computed<unknown>(() => {
	if (!props.version || !changelog.value) return []
	return changelog.value[props.version.version]
})

const all_sections = computed(() => versionSections(changes.value as ChangelogYamlVersion | string[]))

// Les lignes retenues par la recherche, `null` si elle ne retient rien de ce
// corps — la version est alors montrée entière, affiche et sujet forum compris.
const found_sections = computed(() => searchVersion(changes.value as ChangelogYamlVersion | string[], props.terms))

// Rien à surligner dans une version gardée pour son seul en-tête.
const marked_terms = computed(() => found_sections.value ? props.terms : [])

// Le HTML n'est bâti que pour les lignes affichées.
const sections = computed(() => (found_sections.value ?? all_sections.value).map((section: ChangelogSection) => ({
	index: section.index,
	changes: section.changes.map((c: string) => ({
		text: highlight(changeHtml(c, t('changelog.need_ai_change')), marked_terms.value),
		images: changeImages(c)
	}))
})))
</script>

<style lang="scss" scoped>
	$image-width: 1300px;
	$column-width: 800px;
	$column-gap: 40px;
	$wrapper-padding: 15px;
	// Ce qu'il faut au bloc pour tenir deux colonnes, retrait interne compris.
	$two-columns-width: $column-width * 2 + $column-gap + $wrapper-padding * 2;

	.version {
		background: rgba(100,100,100,0.1);
		// Le bloc se mesure à la place que lui laisse le panneau, pas à la
		// fenêtre : le menu et le panneau social prennent leur part.
		container-type: inline-size;
	}
	.sections {
		// Deux colonnes dès qu'il y a la place pour deux fois $column-width,
		// une seule en dessous.
		columns: $column-width 2;
		column-gap: $column-gap;
	}
	.change {
		padding: 0 10px;
		line-height: 20px;
		font-size: 15px;
		break-inside: avoid;
		:deep(.ai) {
			background: #00a3cc;
			padding: 0 4px;
			color: var(--white);
			border-radius: var(--radius);
			cursor: help;
		}
		:deep(code) {
			display: inline;
			background: var(--background-secondary);
			border: 1px solid var(--border);
			padding: 0 5px;
			border-radius: var(--radius-small);
			font-family: monospace;
			font-size: 0.9em;
			color: var(--text-color);
		}
		// Le surlignage porte sa propre couleur de texte : le fond reste jaune dans
		// les deux thèmes, celle du thème ne s'y lirait pas en sombre.
		// Aucun retrait horizontal : le terme trouvé est souvent collé à la suite du
		// mot (« arme » dans « armes »), un padding l'en écarterait pour de bon.
		:deep(mark) {
			background: #ffe27a;
			color: #202020;
			border-radius: var(--radius-small);
			padding: 1px 0;
		}
		.screenshot {
			color: var(--primary);
			cursor: pointer;
			margin: 0 4px;
			border-radius: var(--radius);
			font-size: 20px;
			vertical-align: top;
			display: inline-block;
			&:hover {
				color: var(--text-color);
				border-color: var(--text-color);
			}
		}
	}
	// Un jaune plus sourd en sombre, sinon la ligne surlignée éblouit.
	body.dark .change :deep(mark) {
		background: #d3ae35;
	}
	.image-menu {
		vertical-align: bottom;
		max-width: 700px;
		max-height: 600px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
	}
	.image {
		display: block;
		width: 100%;
		max-width: $image-width;
		margin: 0 auto;
		vertical-align: bottom;
	}
	.wrapper {
		// Une seule colonne : le bloc se borne à la largeur d'une colonne au
		// lieu de s'étaler sur tout le panneau.
		max-width: $column-width + $wrapper-padding * 2;
		margin: 0 auto;
		background: var(--background);
		padding: $wrapper-padding;
	}
	// Deux colonnes : le plafond saute, sinon elles ne rentreraient jamais.
	@container (min-width: #{$two-columns-width}) {
		.wrapper {
			max-width: none;
		}
	}
	h4 {
		margin-bottom: 10px;
		text-transform: uppercase;
		color: var(--text-color);
		font-size: 19px;
		break-after: avoid;
	}
	h4:not(.first) {
		margin-top: 10px;
	}
	.button {
		margin-top: 10px;
	}
</style>