<template lang="html">
	<div class="page">
		<div class="page-bar page-header">
			<div class="flex">
				<h1 :class="{small: breadcrumb_items.length >= 3}">
					<v-icon class="book">mdi-book-open-page-variant</v-icon>
					<breadcrumb :items="breadcrumb_items" :raw="true" />
					<v-icon v-if="modified" class="modified">mdi-record</v-icon>
				</h1>
				<div v-if="$store.getters.admin && page && page.language === 'fr'" class="info">
					<v-checkbox v-model="page.official" :hide-details="true" :dark="true" label="Officiel" @change="updateOfficial" />
				</div>
			</div>
			<div v-if="page" class="tabs">
				<v-menu v-if="contributor && edition" offset-y>
					<template #activator="{ props }">
						<div class="page-language info" v-bind="props">
							<flag :code="LeekWars.languages[page.language].country" :clickable="false" />
							<img width="10" src="/image/selector.png">
						</div>
					</template>
					<v-list :dense="true">
						<v-list-item v-for="(language, i) in LeekWars.languages" :key="i" class="language" @click="setPageLanguage(language.code)">
							<template #prepend>
								<flag :code="language.country" :clickable="false" />
							</template>
							<span class="name">{{ language.name }}</span>
						</v-list-item>
					</v-list>
				</v-menu>
				<div v-if="contributor && edition && modified" class="tab" @click="save">
					<v-icon>mdi-content-save</v-icon>
					{{ $t('main.save') }}
				</div>
				<div v-if="contributor && edition" class="tab" @click="editEnd">
					<v-icon>mdi-check</v-icon>
					{{ $t('end_edition') }}
				</div>
				<div v-else-if="page.locker" class="tab disabled">
					<v-icon>mdi-lock</v-icon>
					{{ $t('editing_by_x', [page.locker_name]) }}
				</div>
				<div v-if="contributor && !edition && (!page.locker || !$store.state.farmer || page.locker === $store.state.farmer.id)" class="tab action" @click="editStart">
					<v-icon>mdi-pencil-outline</v-icon>
					{{ $t('main.edit') }}
				</div>
				<div v-if="$store.getters.admin && !edition && page.id" class="tab action" @click="deletePage">
					<v-icon>mdi-delete</v-icon>
					{{ $t('main.delete') }}
				</div>
				<v-menu v-if="page && Object.values(page.translations).length" offset-y>
					<template #activator="{ props }">
						<div class="tab" v-bind="props"><v-icon>mdi-translate</v-icon></div>
					</template>
					<v-list :dense="true">
						<router-link v-for="(translation, l) in page.translations" :key="l" :to="'/encyclopedia/' + l + '/' + translation">
							<v-list-item class="language">
								<template #prepend>
									<flag :code="LeekWars.languages[l].country" :clickable="false" />
								</template>
								<span class="name">{{ translation }}</span>
							</v-list-item>
						</router-link>
					</v-list>
				</v-menu>
			</div>
		</div>
		<panel v-if="page" class="first encyclopedia last">
			<template #content>
				<div class="table">
					<div v-if="edition" ref="monacoContainer" class="monaco-container"></div>
					<div v-if="LeekWars.encyclopedia[language] && Object.keys(LeekWars.encyclopedia[language]).length" ref="markdown" class="markdown" @scroll="markdownScroll">
						<!-- {{ parents }} -->

						<div v-if="redirectedFrom" class="redirected-from">
							{{ $t('redirected_from', [redirectedFrom]) }}
						</div>

						<markdown :content="content" mode="encyclopedia" :class="{main: page.reference === 1 }" :locale="page.language" />

						<div v-if="page.new && !edition" class="nopage">
							<v-icon>mdi-book-open-page-variant</v-icon>
							<br><br>
							<i18n-t keypath="not_found" tag="div" class="message">
								<template #name>{{ code }}</template>
							</i18n-t>
							<div v-if="Object.keys(page.translations).length" class="available-translations">
								{{ $t('available_in') }}
								<router-link v-for="(title, lang) in page.translations" :key="lang" :to="'/encyclopedia/' + lang + '/' + title.replace(/ /g, '_')">
									<flag :code="LeekWars.languages[lang].country" :clickable="false" />
									{{ LeekWars.languages[lang].name }}
								</router-link>
							</div>
							<br>
							<div v-if="contributor">{{ $t('contributor_create') }}</div>
						</div>

						<div v-if="page.creator" class="stats">

							<div class="contributors" @click="toggleStats">
								<v-icon>mdi-account-multiple</v-icon>
								<div v-html="$t('n_contributors', page.contributors.length)"></div>
								<div class="avatars">
									<rich-tooltip-farmer v-for="contributor in page.contributors" :id="contributor.id" :key="contributor.id">
										<router-link :to="'/farmer/' + contributor.id">
											<avatar :farmer="contributor" />
										</router-link>
									</rich-tooltip-farmer>
								</div>
								<i18n-t tag="div" keypath="n_views" class="views">
									<template #v>
										<b>{{ $filters.number(page.views) }}</b>
									</template>
								</i18n-t>
								<div v-if="totalReferences > 0" class="references-count">
									— <b>{{ totalReferences }}</b> {{ $t('n_references', totalReferences) }}
								</div>
								<div class="fill"></div>
								<v-icon>{{ statsExpanded ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
							</div>

							<div v-if="statsExpanded" class="expanded-stats">
								<div>
									<i18n-t keypath="created_by_x_the_y">
										<template #farmer>
											<rich-tooltip-farmer :id="page.creator" v-slot="{ props }">
												<router-link :to="'/farmer/' + page.creator"><span v-bind="props">{{ page.creator_name }}</span></router-link>
											</rich-tooltip-farmer>
										</template>
										<template #date>{{ $filters.datetime(page.creation_time) }}</template>
									</i18n-t>

									<i18n-t keypath="edited_by_x_the_y" tag="div" v-if="page.last_editor">
										<template #farmer>
											<rich-tooltip-farmer :id="page.last_editor" v-slot="{ props }">
												<router-link :to="'/farmer/' + page.last_editor"><span v-bind="props">{{ page.last_editor_name }}</span></router-link>
											</rich-tooltip-farmer>
										</template>
										<template #date>{{ $filters.datetime(page.last_edition_time) }}</template>
									</i18n-t>
								</div>
								<div>
									<i18n-t tag="div" keypath="n_contributions">
										<template #n>
											<b>{{ $filters.number(page.contributions) }}</b>
										</template>
									</i18n-t>
									{{ $t('main.n_lines', page.content.split('\n').length) }}
									— {{ $t('main.n_words', page.content.split(' ').length) }}
									— {{ $t('main.n_characters', page.content.length) }}
								</div>
							</div>

							<div v-if="statsExpanded && referencedBy && totalReferences > 0" class="references-panel">
								<div v-if="referencedBy.children.length" class="ref-section">
									<v-icon>mdi-file-tree</v-icon>
									<span class="ref-label">{{ $t('child_pages') }} :</span>
									<template v-for="(child, i) in referencedBy.children" :key="child.id">
										<router-link :to="'/encyclopedia/' + child.language + '/' + child.title.replace(/ /g, '_')">{{ child.title }}</router-link><span v-if="i < referencedBy.children.length - 1">, </span>
									</template>
								</div>
								<div v-if="referencedBy.translations.length" class="ref-section">
									<span class="ref-label">{{ $t('referencing_translations') }} :</span>
									<template v-for="(t, i) in referencedBy.translations" :key="t.id">
										<router-link :to="'/encyclopedia/' + t.language + '/' + t.title.replace(/ /g, '_')">{{ t.title }}</router-link><span v-if="i < referencedBy.translations.length - 1">, </span>
									</template>
								</div>
								<div v-if="referencedBy.linked_from.length" class="ref-section">
									<v-icon>mdi-link-variant</v-icon>
									<span class="ref-label">{{ $t('linked_from') }} :</span>
									<template v-for="(link, i) in referencedBy.linked_from" :key="link.id">
										<router-link :to="'/encyclopedia/' + link.language + '/' + link.title.replace(/ /g, '_')">{{ link.title }}</router-link><span v-if="i < referencedBy.linked_from.length - 1">, </span>
									</template>
								</div>
							</div>

							<div v-if="statsExpanded && history" class="history-panel">
								<div class="history-list">
									<h4>{{ $t('history') }}</h4>
									<div v-for="(entry, i) in history" :key="entry.time" class="history-entry" :class="{active: selectedHistoryIndex === i}" @click="selectHistory(i)">
										<div class="history-info">
											<rich-tooltip-farmer :id="entry.author" v-slot="{ props }">
												<router-link :to="'/farmer/' + entry.author" v-bind="props">
													<avatar :farmer="{id: entry.author, avatar_changed: entry.avatar_changed}" />
												</router-link>
											</rich-tooltip-farmer>
											<div>
												<rich-tooltip-farmer :id="entry.author" v-slot="{ props }">
													<router-link :to="'/farmer/' + entry.author" :class="entry.color"><span v-bind="props">{{ entry.author_name }}</span></router-link>
												</rich-tooltip-farmer>
												<span class="history-date">{{ $filters.datetime(entry.time) }}</span>
											</div>
										</div>
										<div v-if="i < history.length - 1" class="history-diff-stats">
											<span class="additions">+{{ entry.additions }}</span>
											<span class="deletions">-{{ entry.deletions }}</span>
										</div>
										<div v-else class="history-diff-stats">
											<span class="additions">{{ $t('initial') }}</span>
										</div>
									</div>
								</div>
								<div v-if="selectedHistoryIndex !== null" ref="diffContainer" class="diff-container"></div>
							</div>
						</div>
					</div>
				</div>
			</template>
		</panel>

		<!-- <panel :title="'Notes des joueurs (' + page.comments.length + ')'">
			<comments :comments="page.comments" @comment="comment" />
		</panel> -->
	</div>
</template>

<script setup lang="ts">
	import type * as Monaco from 'monaco-editor'
	import Markdown from '@/component/encyclopedia/markdown.vue'
	import { locale } from '@/locale'
	import { i18n, mixins } from '@/model/i18n'
	import { LeekWars } from '@/model/leekwars'
	import { store } from '@/model/store'
	import Breadcrumb from '../forum/breadcrumb.vue'
	import RichTooltipFarmer from '@/component/rich-tooltip/rich-tooltip-farmer.vue'
	import { FUNCTIONS } from '@/model/functions'
	import { computed, markRaw, nextTick, onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from 'vue'
	import { useI18n } from 'vue-i18n'
	import { onBeforeRouteLeave, onBeforeRouteUpdate, useRoute, useRouter } from 'vue-router'
	import { emitter } from '@/model/vue'

	defineOptions({ name: 'encyclopedia', i18n: {}, mixins: [...mixins], components: { Markdown, Breadcrumb, RichTooltipFarmer } })

	const { t, locale: i18nLocale } = useI18n()
	const route = useRoute()
	const router = useRouter()
	const monacoContainer = useTemplateRef<HTMLElement>('monacoContainer')
	const markdownRef = useTemplateRef<HTMLElement>('markdown')
	const diffContainer = useTemplateRef<HTMLElement>('diffContainer')

	const english = ref('')
	const page = ref<any>(null)
	const edition = ref(false)
	const editor = ref<Monaco.editor.IStandaloneCodeEditor | null>(null)
	let scrolling = false
	const pages = ref<any>({})
	const modified = ref(false)
	let initialVersionId = 0
	const statsExpanded = ref(false)
	const searchQuery = ref('')
	const redirectedFrom = ref<string | null>(null)
	let boundBeforeUnload: () => void
	const actions = ref<any[]>([])
	const history = ref<any[] | null>(null)
	const selectedHistoryIndex = ref<number | null>(null)
	const diffEditor = ref<Monaco.editor.IStandaloneDiffEditor | null>(null)
	const referencedBy = ref<{ children: any[], translations: any[], linked_from: any[] } | null>(null)
	let destroyed = false

	const language = computed(() => {
		const lang = route.params && route.params.lang ? route.params.lang as string : i18nLocale.value as string
		return lang in LeekWars.languages ? lang : i18nLocale.value as string
	})
	const main_title = computed(() => LeekWars.languages[language.value].encyclopedia)
	const code = computed(() => 'page' in route.params ? (route.params.page as string).replace(/_/g, ' ') : main_title.value)
	const lanuage_and_code = computed(() => language.value + '/' + code.value)
	const title = computed(() => page.value ? page.value.title : 'Encyclopedia')
	const breadcrumb_items = computed(() => {
		if (page.value && !page.value.new) {
			return parents.value.map(p => {
				return {name: p.title, link: p.title === main_title.value ? (language.value === i18nLocale.value ? '/encyclopedia' : '/encyclopedia/' + language.value + '/' + main_title.value) : '/encyclopedia/' + language.value + '/' + p.title.replace(/ /g, '_')}
			})
		} else {
			const parts = [
				{name: main_title.value, link: language.value === i18nLocale.value ? '/encyclopedia' : '/encyclopedia/' + language.value + '/' + main_title.value }
			]
			if (code.value !== main_title.value) {
				parts.push({name: code.value, link: '/encyclopedia/' + language.value + '/' + code.value.replace(/ /g, '_')})
			}
			return parts
		}
	})
	const contributor = computed(() => store.state.farmer ? store.state.farmer.contributor || store.state.farmer.moderator : false)
	const parents = computed(() => {
		const list = []
		const visited = new Set<number>()
		for (let current = page.value; current; current = LeekWars.encyclopediaById[language.value] ? LeekWars.encyclopediaById[language.value][current.parent] : null) {
			if (visited.has(current.id)) { break }
			visited.add(current.id)
			list.push(current)
		}
		return list.reverse()
	})
	const function_args = computed(() => {
		for (const fun of FUNCTIONS as any[]) {
			if (fun.name === code.value) {
				let name = "("
				let i = 0
				for (const a in fun.arguments_names) {
					if (fun.optional[a]) name += "["
					name += '<span class="lstype">' + LeekWars.protect(t("doc.arg_type_" + fun.arguments_types[a])) + '</span> '
					name += fun.arguments_names[a]
					if (fun.optional[a]) name += "]"
					if (i++ < fun.arguments_names.length - 1) {
						name += ", "
					}
				}
				name += ')'
				if (fun.return_type !== 0) {
					name += " → " + '<span class="lstype">' + LeekWars.protect(t("doc.arg_type_" + fun.return_type)) + '</span> ' + fun.return_name
				}
				return name
			}
		}
	})
	const totalReferences = computed(() => {
		if (!referencedBy.value) return 0
		return referencedBy.value.children.length + referencedBy.value.translations.length + referencedBy.value.linked_from.length
	})
	const content = computed(() => {
		let c = page.value ? page.value.content : ''
		if (function_args.value) {
			c = c.replace("# " + code.value, "# " + code.value + '<span>' + function_args.value + '</span>')
		}
		return c
	})

	const onCtrlS = () => save()

	onBeforeUnmount(() => {
		destroyed = true
		emitter.off('ctrlS', onCtrlS)
		window.removeEventListener('beforeunload', boundBeforeUnload)
		LeekWars.large = false
		LeekWars.box = false
		LeekWars.footer = true

		destroyDiffEditor()
		if (editor.value) {
			editor.value.getModel()?.dispose()
			editor.value.dispose()
			editor.value = null
		}
		if (edition.value) {
			editEnd()
		}
	})

	onMounted(async () => {
		emitter.on('ctrlS', onCtrlS)
		actions.value = [
			{icon: 'mdi-information-variant', click: () => router.push('/about')},
			{icon: 'mdi-pencil', click: () => editStart()},
		]
		LeekWars.setActions(actions.value)

		boundBeforeUnload = onBeforeUnload
		window.addEventListener('beforeunload', boundBeforeUnload)

		const docMessages = await import(/* webpackChunkName: "[request]" */ /* webpackMode: "eager" */ `@/lang/doc.${locale}.lang`)
		i18n.global.mergeLocaleMessage(locale, { doc: docMessages.default })
	})

	watch(lanuage_and_code, async () => {
		await LeekWars.loadEncyclopedia(language.value)
		if (destroyed) { return }

		if (code.value === 'Page au hasard') {
			const ps = Object.values(LeekWars.encyclopedia[i18nLocale.value])
			router.replace('/encyclopedia/' + i18nLocale.value + '/' + (ps[Math.random() * ps.length | 0] as any).title)
			return
		}

		const key = code.value.toLowerCase().replace(/_/g, ' ')
		const entry = LeekWars.encyclopedia[language.value]?.[key]
		if (entry?.alias) {
			router.replace('/encyclopedia/' + language.value + '/' + entry.title.replace(/ /g, '_') + '?from=' + encodeURIComponent(code.value))
			return
		}

		redirectedFrom.value = route.query.from as string || null
		statsExpanded.value = false
		history.value = null
		selectedHistoryIndex.value = null
		referencedBy.value = null
		destroyDiffEditor()

		LeekWars.get<any>('encyclopedia/get/' + language.value + '/' + code.value).then(p => {
			if (p.redirect) {
				router.replace('/encyclopedia/' + language.value + '/' + p.redirect.replace(/ /g, '_') + '?from=' + encodeURIComponent(code.value))
				return
			}
			if (edition.value) {
				releasePage()
			}
			page.value = p
			if (edition.value) {
				editStart()
				setEditorContent()
			}
			LeekWars.setTitle(title.value)
			emitter.emit('loaded')
		})
		.error((result: any) => {
			let fun = null as any
			let args = ''
			let ret = ''
			let description = ''
			for (const funct of FUNCTIONS as any[]) {
				if (funct.name === code.value) {
					fun = funct
					description = t('doc.func_' + fun.name) as string
					args = funct.arguments_names.map((a: string, i: number) => '- **' + a + '** : ' + (t('doc.func_' + fun.name + '_arg_' + (i + 1)))).join('\n')
					if (fun.return_name) {
						ret = '#### Retour\n\n- **' + fun.return_name + '** : ' + (t('doc.func_' + fun.name + '_return'))
					}
					break
				}
			}
			page.value = {
				new: true,
				id: 0,
				title: code.value,
				language: language.value,
				translations: result && result.translations ? result.translations : {},
				content: fun ?  `# ${code.value}
> Fonctions

${description}

#### Paramètres

${args}

${ret}


` : '# ' + code.value + '\n\n'
			}
			setEditorContent()
		})
	}, { immediate: true })

	function editStart() {
		if (!page.value) { return }
		if (page.value.id === 0) {
			edition.value = true
			LeekWars.large = true
			LeekWars.box = true
			LeekWars.footer = false
			prepareEditor()
			return
		}
		LeekWars.post('encyclopedia/start-edition', {page_id: page.value.id}).then(() => {
			edition.value = true
			LeekWars.large = true
			LeekWars.box = true
			LeekWars.footer = false
			prepareEditor()
		}).error((result) => {
			LeekWars.toast("Verrouillé par " + result.locker)
		})
	}

	function prepareEditor() {
		if (editor.value) {
			setEditorContent()
			return
		}
		nextTick(() => {
			import(/* webpackChunkName: "monaco" */ 'monaco-editor').then((monaco) => {
				const container = monacoContainer.value
				if (!container) { return }
				editor.value = markRaw(monaco.editor.create(container, {
					value: page.value ? page.value.content : "",
					language: "markdown",
					automaticLayout: true,
					wordWrap: "on",
					fontSize: 14,
					lineHeight: 22,
					theme: "vs",
					tabSize: 4,
					insertSpaces: false,
					lineNumbers: "on",
					folding: true,
					minimap: { enabled: false },
					scrollBeyondLastLine: false,
					overviewRulerLanes: 0,
					overviewRulerBorder: false,
					renderLineHighlight: "line",
				}))

				editor.value.onDidChangeModelContent(() => {
					modified.value = true
					page.value.content = editor.value!.getValue()
				})

				editor.value.onDidScrollChange((e) => {
					if (scrolling) { scrolling = false; return }
					const scrollTop = e.scrollTop
					const scrollHeight = e.scrollHeight
					const editorHeight = editor.value!.getLayoutInfo().height
					if (scrollHeight <= editorHeight) { return }
					const percent = scrollTop / (scrollHeight - editorHeight)

					scrolling = true
					const md = markdownRef.value
					if (md) md.scrollTop = (md.scrollHeight - md.clientHeight) * percent
				})

				initialVersionId = editor.value.getModel()!.getAlternativeVersionId()
				modified.value = false
			})
		})
	}

	function setEditorContent() {
		if (!page.value || !editor.value) { return }
		editor.value.setValue(page.value.content)
		initialVersionId = editor.value.getModel()!.getAlternativeVersionId()
		modified.value = false
	}

	function editEnd() {
		edition.value = false
		LeekWars.large = false
		LeekWars.box = false
		LeekWars.footer = true
		if (editor.value) {
			editor.value.getModel()?.dispose()
			editor.value.dispose()
			editor.value = null
		}
		page.value.locker = null
		releasePage()
	}

	function setPageLanguage(lang: string) {
		page.value.language = lang
		LeekWars.post('encyclopedia/set-language', {page_id: page.value.id, language: lang })
	}

	function releasePage() {
		LeekWars.post('encyclopedia/end-edition', {page_id: page.value.id})
	}

	function onBeforeUnload() {
		if (edition.value && page.value && page.value.id !== 0) {
			const data = JSON.stringify({page_id: page.value.id})
			navigator.sendBeacon(LeekWars.API + 'encyclopedia/end-edition', new Blob([data], {type: 'application/json'}))
		}
	}

	function markdownScroll() {
		if (scrolling) { scrolling = false; return }
		const md = markdownRef.value
		if (!md) return
		const percent = md.scrollTop / (md.scrollHeight - md.clientHeight)

		scrolling = true
		if (editor.value) {
			const scrollHeight = editor.value.getScrollHeight()
			const editorHeight = editor.value.getLayoutInfo().height
			editor.value.setScrollTop(Math.ceil((scrollHeight - editorHeight) * percent))
		}
	}

	onBeforeRouteUpdate((to, from, next) => {
		if (modified.value && !window.confirm('Page non sauvegardée, voulez-vous abandonner les modifications ?')) {
			next(false)
		} else {
			next()
		}
	})
	onBeforeRouteLeave((to, from, next) => {
		if (modified.value && !window.confirm('Page non sauvegardée, voulez-vous abandonner les modifications ?')) {
			next(false)
		} else {
			next()
		}
	})

	function save() {
		LeekWars.put('encyclopedia/update', {page_id: page.value.id, language: page.value.language, title: page.value.title, content: page.value.content, parent: page.value.parent || 1, reference: page.value.reference || 0}).then((result) => {
			LeekWars.toast("Sauvegardé !")
			if (page.value.id === 0) {
				page.value.new = false
				page.value.id = result.id
			}
		}).error(error => {
			if (error.error === 'duplicate_reference') {
				LeekWars.toast("Sauvegarde échouée : la référence est déjà utilisée par la page \"" + error.page + "\" (#" + error.page_id + ")")
			} else {
				LeekWars.toast("Sauvegarde échouée : " + error.error)
			}
		})

		initialVersionId = editor.value!.getModel()!.getAlternativeVersionId()
		modified.value = false
		page.value.last_edition_time = Date.now() / 1000
		page.value.last_editor = store.state.farmer!.id
		page.value.last_editor_name = store.state.farmer!.name
	}

	function toggleStats() {
		statsExpanded.value = !statsExpanded.value
		if (statsExpanded.value) {
			if (!history.value) loadHistory()
			if (!referencedBy.value) loadReferencedBy()
		}
	}

	function loadHistory() {
		if (!page.value || page.value.id === 0) return
		LeekWars.get('encyclopedia/get-history/' + page.value.id).then((h: { content: string, author: number, author_name: string, time: number, additions?: number, deletions?: number }[]) => {
			for (let i = 0; i < h.length; i++) {
				if (i < h.length - 1) {
					const newLines = h[i].content.split('\n')
					const oldLines = h[i + 1].content.split('\n')
					let additions = 0
					let deletions = 0
					const maxLen = Math.max(newLines.length, oldLines.length)
					for (let j = 0; j < maxLen; j++) {
						if (j >= oldLines.length) { additions++; continue }
						if (j >= newLines.length) { deletions++; continue }
						if (newLines[j] !== oldLines[j]) { additions++; deletions++ }
					}
					h[i].additions = additions
					h[i].deletions = deletions
				}
			}
			history.value = h
			if (h.length > 1) {
				selectHistory(0)
			}
		})
	}

	function selectHistory(index: number) {
		if (selectedHistoryIndex.value === index) {
			selectedHistoryIndex.value = null
			destroyDiffEditor()
			return
		}
		selectedHistoryIndex.value = index
		nextTick(() => {
			createDiffEditor(index)
		})
	}

	function createDiffEditor(index: number) {
		if (!history.value) return
		destroyDiffEditor()

		const container = diffContainer.value
		if (!container) return

		const newContent = history.value[index].content
		const oldContent = index < history.value.length - 1 ? history.value[index + 1].content : ''
		const expectedIndex = selectedHistoryIndex.value

		import(/* webpackChunkName: "monaco" */ 'monaco-editor').then((monaco) => {
			if (selectedHistoryIndex.value !== expectedIndex) return
			diffEditor.value = markRaw(monaco.editor.createDiffEditor(container, {
				automaticLayout: true,
				readOnly: true,
				renderSideBySide: false,
				fontSize: 13,
				lineHeight: 20,
				minimap: { enabled: false },
				scrollBeyondLastLine: false,
				overviewRulerLanes: 0,
				overviewRulerBorder: false,
				renderOverviewRuler: false,
				wordWrap: 'on',
				hideUnchangedRegions: { enabled: true },
				theme: LeekWars.darkMode ? 'vs-dark' : 'vs',
			}))
			diffEditor.value.setModel({
				original: markRaw(monaco.editor.createModel(oldContent, 'markdown')),
				modified: markRaw(monaco.editor.createModel(newContent, 'markdown')),
			})
		})
	}

	function destroyDiffEditor() {
		if (diffEditor.value) {
			const model = diffEditor.value.getModel()
			diffEditor.value.dispose()
			model?.original.dispose()
			model?.modified.dispose()
			diffEditor.value = null
		}
	}

	function comment(c: any) {
		page.value.comments.push(c)
	}

	function search() {
		const query = searchQuery.value.replace(/ /g, '+')
		if (query) {
			router.push('/encyclopedia-search?query=' + query)
		} else {
			router.push('/encyclopedia-search')
		}
	}

	function loadReferencedBy() {
		if (!page.value || !page.value.id) return
		LeekWars.get('encyclopedia/get-referenced-by/' + page.value.id).then((result: any) => {
			referencedBy.value = result
		})
	}

	function deletePage() {
		if (!page.value || !page.value.id) return

		if (referencedBy.value && (referencedBy.value.children.length || referencedBy.value.linked_from.length)) {
			const children = referencedBy.value.children.length
			const linked = referencedBy.value.linked_from.length
			let msg = 'Impossible de supprimer cette page :\n'
			if (children) msg += `- ${children} page(s) enfant(s)\n`
			if (linked) msg += `- ${linked} page(s) contenant un lien vers cette page\n`
			msg += '\nSupprimez ou déplacez ces pages avant.'
			alert(msg)
			return
		}

		if (!window.confirm('Supprimer la page « ' + page.value.title + ' » (#' + page.value.id + ') ?\n\nCette action est irréversible.')) {
			return
		}

		LeekWars.delete('encyclopedia/delete', { page_id: page.value.id }).then(() => {
			LeekWars.toast('Page supprimée !')
			router.push('/encyclopedia')
		}).error((error: any) => {
			if (error.error === 'has_children') {
				LeekWars.toast('Impossible : ' + error.count + ' page(s) enfant(s)')
			} else if (error.error === 'has_links') {
				LeekWars.toast('Impossible : ' + error.count + ' page(s) contenant un lien vers cette page')
			} else {
				LeekWars.toast('Erreur : ' + error.error)
			}
		})
	}

	function updateOfficial() {
		LeekWars.put('encyclopedia/official', {page_id: page.value.id, official: page.value.official}).then(() => {
		}).error(error => LeekWars.toast("Sauvegarde échouée : " + error.error))
	}
</script>


<style lang="scss" scoped>
.page-bar {
	position: sticky;
    top: 0px;
    background: #484848;
    z-index: 2;
}
h1 {
	background: #222;
	font-size: 20px;
	display: inline-flex;
	&::after {
		border-color: transparent transparent transparent #222;
	}
	gap: 10px;
	.book {
		margin-right: 10px;
		font-size: 22px;
		margin: 6px 0;
	}
}
.page-header .flex {
	align-items: center;
}
.encyclopedia {
	min-height: 0;
	flex: 1;
}
.modified {
	margin-left: 4px;
	margin-bottom: 2px;
}

.markdown {
	overflow-y: auto;
}

.encyclopedia :deep(> .table) {
	display: flex;
	min-height: 0;
	flex: 1;
	& > * {
		flex: 1;
		height: 100%;
		min-height: 0;
		min-width: 0;
	}
}
.monaco-container {
	height: 100%;
	min-height: 0;
	overflow: hidden;
}

.stats {
	padding: 15px;
	border-top: 1px solid var(--border);
	color: var(--text-color-secondary);
	display: flex;
	flex-direction: column;
	gap: 10px;
	a {
		color: #5fad1b;
		font-weight: bold;
	}
	.contributors {
		display: flex;
		align-items: center;
		margin-bottom: 5px;
		cursor: pointer;
		& > * {
			margin: 0 3px;
		}
		.avatars {
			margin-left: 5px;
			a {
				display: inline-block;
			}
			.avatar {
				width: 34px;
				margin-left: 5px;
			}
		}
	}
	.views {
		margin-left: 10px;
	}
	.expanded-stats {
		display: flex;
		line-height: 1.3;
		& > * {
			flex: 1;
			&:first-child {
				border-right: 1px solid #ccc;
			}
			&:last-child {
				padding-left: 20px;
			}
		}
	}
}
.nopage {
	padding: 30px;
	padding-bottom: 60px;
	text-align: center;
	font-size: 16px;
	.message {
		font-size: 20px;
	}
	.v-icon {
		color: #ccc;
		font-size: 150px;
	}
	.available-translations {
		margin-top: 15px;
		font-size: 16px;
		a {
			display: inline-flex;
			align-items: center;
			gap: 5px;
			margin: 0 8px;
			color: #5fad1b;
			font-weight: bold;
			.flag {
				max-width: 25px;
				max-height: 16px;
			}
		}
	}
}
.redirected-from {
	padding: 15px;
	padding-bottom: 0;
	font-size: 13px;
	color: var(--text-color-secondary);
	font-style: italic;
}
.search-icon {
	cursor: pointer;
}
.history-panel {
	display: flex;
	border-top: 1px solid var(--border);
	height: 600px;
}
.history-list {
	width: 300px;
	min-width: 300px;
	overflow-y: auto;
	padding: 10px 0;
	h4 {
		margin-bottom: 8px;
	}
	.history-entry {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 6px 10px;
		cursor: pointer;
		&:hover {
			background: var(--background);
		}
		&.active {
			background: #5fad1b22;
			border-left: 3px solid #5fad1b;
			padding-left: 7px;
		}
		.history-info {
			display: flex;
			align-items: center;
			gap: 8px;
			.avatar {
				width: 32px;
				height: 32px;
				flex-shrink: 0;
			}
			a {
				font-weight: bold;
				&.admin { color: #df1500; }
				&.moderator { color: #ffa900; }
				&.contributor { color: #009c1d; }
			}
			.history-date {
				color: var(--text-color-secondary);
				font-size: 12px;
				display: block;
			}
		}
		.history-diff-stats {
			font-size: 13px;
			display: flex;
			gap: 8px;
			.additions {
				color: #4caf50;
			}
			.deletions {
				color: #f44336;
			}
		}
	}
}
.diff-container {
	flex: 1;
	min-width: 0;
	border-left: 1px solid var(--border);
}
.references-count {
	margin-left: 10px;
}
.references-panel {
	padding: 10px 0;
	line-height: 1.6;
	.ref-section {
		margin-bottom: 4px;
		&:last-child {
			margin-bottom: 0;
		}
		.v-icon {
			font-size: 16px;
			vertical-align: middle;
			margin-right: 2px;
		}
		.ref-label {
			color: var(--text-color-secondary);
			margin-right: 4px;
		}
		a {
			color: var(--link-color);
			font-weight: 500;
		}
	}
}
:deep(.md.main h1) {
	display: none;
}
.page-language {
	padding: 0 4px;
	cursor: pointer;
	margin-right: 15px;
	margin-left: 5px;
	display: inline-flex;
	gap: 6px;
	align-items: center;
	height: 100%;
	.flag {
		vertical-align: top;
		height: 20px;
	}
}
.flag {
	max-width: 30px;
	max-height: 20px;
}
.language .name {
	padding-left: 8px;
}
</style>