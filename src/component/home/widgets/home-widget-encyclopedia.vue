<template>
	<div class="encyclopedia-widget">
		<loader v-if="!loaded" />
		<div v-else-if="pages.length" ref="listEl" class="pages" :style="{ '--row-height': ROW_HEIGHT + 'px' }">
			<router-link v-for="(page, index) in visiblePages" :key="index" v-ripple :to="'/encyclopedia/' + (page.language ?? locale) + '/' + encodeURIComponent(page.title)" class="page">
				<!-- L'éditeur de la dernière version, comme la section
				     « Dernières pages modifiées » de l'encyclopédie. -->
				<img :src="LeekWars.getAvatar(page.id, page.avatar_changed)" class="avatar" loading="lazy">
				<div class="info">
					<div class="title-line">
						<flag v-if="LeekWars.languages[page.language ?? locale]" :code="LeekWars.languages[page.language ?? locale].country" :clickable="false" :title="LeekWars.languages[page.language ?? locale].name" class="flag" />
						<span class="title">{{ page.title }}</span>
					</div>
					<div class="meta">
						<span class="editor">{{ page.name }}</span>
						<span v-if="page.added !== undefined" class="diff">
							<span class="added">+{{ page.added }}</span>
							<span class="removed">−{{ page.removed }}</span>
						</span>
						<span class="date">{{ $filters.duration(page.time) }}</span>
					</div>
				</div>
			</router-link>
		</div>
		<div v-else class="none">{{ t('no_page') }}</div>
	</div>
</template>

<script setup lang="ts">
	import { computed, ref, watch } from 'vue'
	import { useI18n } from 'vue-i18n'
	import { LeekWars } from '@/model/leekwars'
	import { useNamespacedT } from '@/model/i18n'
	import { useFitCount } from '@/component/home/widgets/use-fit-count'

	defineOptions({ name: 'HomeWidgetEncyclopedia' })

	// Pages servies par la requête groupée, et hauteur naturelle d'une rangée :
	// celles retenues s'étirent pour remplir le panneau, leur hauteur rendue ne
	// peut donc plus dire combien il en tient.
	const PAGES = 12
	const ROW_HEIGHT = 31

	/**
	 * `id` et `name` sont ceux de l'ÉLEVEUR qui a signé la dernière version.
	 * `added` et `removed` (lignes, face à la version précédente) ne viennent que
	 * de la requête groupée, toutes langues confondues ; le repli n'a que la
	 * langue du lecteur et pas de diff. Sans `language`, la page est dans celle
	 * du lecteur : le drapeau s'affiche quand même.
	 */
	interface Page { id: number, avatar_changed: number, name: string, title: string, time: number, language?: string, added?: number, removed?: number }

	// Charge utile de la requête groupée de l'accueil (cf. home.vue) : `undefined`
	// tant qu'elle est en vol, `null` si ce widget n'en a rien tiré.
	const props = defineProps<{ data?: { pages: Page[] } | null }>()

	const t = useNamespacedT('home')
	const { locale } = useI18n()

	const loaded = ref(false)
	const pages = ref<Page[]>([])

	const listEl = ref<HTMLElement | null>(null)
	const pageCount = useFitCount(listEl, '.page', PAGES, 0, ROW_HEIGHT)
	const visiblePages = computed(() => pages.value.slice(0, pageCount.value))

	// Repli quand la requête groupée n'a rien pour nous : le service qui sert déjà
	// la section « Dernières pages modifiées » de l'encyclopédie.
	function load() {
		LeekWars.get<Page[]>('encyclopedia/get-last-pages/' + locale.value).then((data) => {
			pages.value = (data ?? []).slice(0, PAGES)
			loaded.value = true
		}).error(() => { loaded.value = true })
	}

	watch(() => props.data, (data) => {
		if (data === undefined) { loaded.value = false; return }
		if (data === null) { load(); return }
		pages.value = (data.pages ?? []).slice(0, PAGES)
		loaded.value = true
	}, { immediate: true })
</script>

<style lang="scss" scoped>
	// Les 15 px du `.content` du panneau, ramenés à 5 : les rangées ont déjà leur
	// propre marge intérieure, sur laquelle se dessine le survol.
	.encyclopedia-widget {
		display: flex;
		flex-direction: column;
		height: calc(100% + 20px);
		margin: -10px;
	}
	// La liste occupe toute la hauteur ; on n'affiche que les rangées entières
	// (useFitCount), overflow hidden en filet.
	.pages {
		display: flex;
		flex-direction: column;
		flex: 1 1 auto;
		min-height: 0;
		overflow: hidden;
	}
	// Les rangées retenues se partagent TOUTE la hauteur du panneau : pas de blanc
	// résiduel en bas, et c'est `--row-height`, leur hauteur naturelle, qui décide
	// combien il en tient.
	.page {
		display: flex;
		align-items: center;
		gap: 8px;
		flex: 1 1 auto;
		min-height: var(--row-height);
		padding: 1px 4px;
		border-radius: var(--radius);
		text-decoration: none;
		color: var(--text-color);
	}
	.page:hover {
		background: var(--background-secondary);
	}
	// En v3, `--background-secondary` EST la surface du panel : le survol v2
	// ci-dessus y est invisible. Vrais états, comme « Mes poireaux » : surface de
	// rangée au survol, liseré vert et enfoncement d'1 px au clic.
	body:not(.v2) {
		.page:hover {
			background: var(--background-row);
		}
		.page:active {
			box-shadow: inset 2px 0 0 var(--primary);
			> * {
				transform: translateY(1px);
			}
		}
	}
	.avatar {
		width: 26px;
		height: 26px;
		border-radius: var(--radius);
		flex-shrink: 0;
	}
	.info {
		display: flex;
		flex-direction: column;
		flex: 1 1 auto;
		min-width: 0;
	}
	.title-line {
		display: flex;
		align-items: center;
		gap: 5px;
		min-width: 0;
	}
	.title-line:deep(.flag) {
		height: 11px;
		flex-shrink: 0;
	}
	.title {
		min-width: 0;
		font-weight: bold;
		font-size: 13px;
		line-height: 16px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	// Une seule ligne, comme la raison du panneau « Joueurs remarquables » : sur un
	// panneau étroit, deux lignes casseraient l'homogénéité des rangées, que
	// useFitCount suppose.
	.meta {
		display: flex;
		align-items: baseline;
		gap: 6px;
		min-width: 0;
		font-size: 11px;
		line-height: 13px;
		color: var(--text-color-secondary);
	}
	.editor {
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.diff {
		display: flex;
		gap: 4px;
		flex-shrink: 0;
		font-weight: bold;
		font-variant-numeric: tabular-nums;
	}
	.added {
		color: #2e8b2e;
	}
	.removed {
		color: #c62828;
	}
	body.dark .added {
		color: #6fcf6f;
	}
	body.dark .removed {
		color: #ef6f6f;
	}
	.date {
		white-space: nowrap;
		flex-shrink: 0;
		margin-left: auto;
	}
	.none {
		color: var(--text-color-secondary);
		font-style: italic;
		padding: 8px;
	}
</style>
