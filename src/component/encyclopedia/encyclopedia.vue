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
					<div v-if="LeekWars.encyclopedia[this.language] && Object.keys(LeekWars.encyclopedia[this.language]).length" ref="markdown" class="markdown" @scroll="markdownScroll">
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

							<div class="contributors">
								<v-icon>mdi-account-multiple</v-icon>
								<div v-html="$tc('n_contributors', page.contributors.length)"></div>
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
								<div class="fill"></div>
								<v-icon @click="statsExpanded = !statsExpanded">{{ statsExpanded ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
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
									{{ $tc('main.n_lines', page.content.split('\n').length) }}
									— {{ $tc('main.n_words', page.content.split(' ').length) }}
									— {{ $tc('main.n_characters', page.content.length) }}
								</div>
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

<script lang="ts">
	import type * as Monaco from 'monaco-editor'
	import Markdown from '@/component/encyclopedia/markdown.vue'
	import { locale } from '@/locale'
	import { i18n, mixins } from '@/model/i18n'
	import { LeekWars } from '@/model/leekwars'
	import { store } from '@/model/store'
	import { Options, Vue, Watch } from 'vue-property-decorator'
	import { Route } from 'vue-router'
	import Breadcrumb from '../forum/breadcrumb.vue'
	import RichTooltipFarmer from '@/component/rich-tooltip/rich-tooltip-farmer.vue'
	import { FUNCTIONS } from '@/model/functions'
	import { markRaw, nextTick } from 'vue'
	import { emitter } from '@/model/vue'

	@Options({ name: 'encyclopedia', i18n: {}, mixins: [...mixins], components: { Markdown, Breadcrumb, RichTooltipFarmer } })
	export default class Encyclopedia extends Vue {
		english: string = ''
		page: any = null
		edition: boolean = false
		editor: Monaco.editor.IStandaloneCodeEditor | null = null
		scrolling: boolean = false
		pages: any = {}
		modified: boolean = false
		initialVersionId: number = 0
		statsExpanded: boolean = false
		searchQuery: string = ''
		redirectedFrom: string | null = null
		boundBeforeUnload!: () => void
		actions = [
			{icon: 'mdi-information-variant', click: () => this.$router.push('/about')},
			{icon: 'mdi-pencil', click: () => this.editStart()},
		]

		get language() {
			return this.$route.params && this.$route.params.lang ? this.$route.params.lang : this.$i18n.locale
		}
		get code() {
			return 'page' in this.$route.params ? this.$route.params.page.replace(/_/g, ' ') : this.main_title
		}
		get lanuage_and_code() {
			return this.language + '/' + this.code
		}
		get title() {
			return this.page ? this.page.title : 'Encyclopedia'
		}
		get main_title() {
			return LeekWars.languages[this.language].encyclopedia
		}
		get breadcrumb_items() {
			if (this.page && !this.page.new) {
				return this.parents.map(p => {
					return {name: p.title, link: p.title === this.main_title ? (this.language === this.$i18n.locale ? '/encyclopedia' : '/encyclopedia/' + this.language + '/' + this.main_title) : '/encyclopedia/' + this.language + '/' + p.title.replace(/ /g, '_')}
				})
			} else {
				const parts = [
					{name: this.main_title, link: this.language === this.$i18n.locale ? '/encyclopedia' : '/encyclopedia/' + this.language + '/' + this.main_title }
				]
				if (this.code !== this.main_title) {
					parts.push({name: this.code, link: '/encyclopedia/' + this.language + '/' + this.code.replace(/ /g, '_')})
				}
				return parts
			}
		}
		get contributor() {
			return store.state.farmer ? store.state.farmer.contributor || store.state.farmer.moderator : false
		}
		get parents() {
			const parents = []
			const visited = new Set<number>()
			for (let current = this.page; current; current = LeekWars.encyclopediaById[this.language] ? LeekWars.encyclopediaById[this.language][current.parent] : null) {
				if (visited.has(current.id)) { break }
				visited.add(current.id)
				parents.push(current)
			}
			return parents.reverse()
		}
		get function_args() {
			for (const fun of FUNCTIONS) {
				if (fun.name === this.code) {
					let name = "("
					let i = 0
					for (const a in fun.arguments_names) {
						if (fun.optional[a]) name += "["
						name += '<span class="lstype">' + LeekWars.protect(this.$t("doc.arg_type_" + fun.arguments_types[a])) + '</span> '
						name += fun.arguments_names[a]
						if (fun.optional[a]) name += "]"
						if (i++ < fun.arguments_names.length - 1) {
							name += ", "
						}
					}
					name += ')'
					if (fun.return_type !== 0) {
						name += " → " + '<span class="lstype">' + LeekWars.protect(this.$t("doc.arg_type_" + fun.return_type)) + '</span> ' + fun.return_name
					}
					return name
				}
			}
		}
		get content() {
			let content = this.page ? this.page.content : ''
			if (this.function_args) {
				content = content.replace("# " + this.code, "# " + this.code + '<span>' + this.function_args + '</span>')
			}
			return content
		}

		beforeUnmount() {
			emitter.off('ctrlS')
			window.removeEventListener('beforeunload', this.boundBeforeUnload)
			LeekWars.large = false
			LeekWars.box = false
			LeekWars.footer = true

			if (this.editor) {
				this.editor.getModel()?.dispose()
				this.editor.dispose()
				this.editor = null
			}
			if (this.edition) {
				this.editEnd()
			}
		}

		async mounted() {
			// this.editStart()

			emitter.on('ctrlS', () => {
				this.save()
			})
			LeekWars.setActions(this.actions)

			this.boundBeforeUnload = this.onBeforeUnload.bind(this)
			window.addEventListener('beforeunload', this.boundBeforeUnload)

			const docMessages = await import(/* webpackChunkName: "[request]" */ /* webpackMode: "eager" */ `@/lang/doc.${locale}.lang`)
			i18n.global.mergeLocaleMessage(locale, { doc: docMessages.default })
		}

		@Watch('lanuage_and_code', {immediate: true})
		async update() {
			await LeekWars.loadEncyclopedia(this.language)

			if (this.code === 'Page au hasard') {
				const pages = Object.values(LeekWars.encyclopedia[this.$i18n.locale])
				this.$router.replace('/encyclopedia/' + this.$i18n.locale + '/' + pages[Math.random() * pages.length | 0].title)
				return
			}

			// Vérifier si c'est un alias
			const key = this.code.toLowerCase().replace(/_/g, ' ')
			const entry = LeekWars.encyclopedia[this.language]?.[key]
			if (entry?.alias) {
				this.$router.replace('/encyclopedia/' + this.language + '/' + entry.title.replace(/ /g, '_') + '?from=' + encodeURIComponent(this.code))
				return
			}

			this.redirectedFrom = this.$route.query.from as string || null

			LeekWars.get<any>('encyclopedia/get/' + this.language + '/' + this.code).then(page => {
				// Redirection alias côté serveur (fallback)
				if (page.redirect) {
					this.$router.replace('/encyclopedia/' + this.language + '/' + page.redirect.replace(/ /g, '_') + '?from=' + encodeURIComponent(this.code))
					return
				}
				if (this.edition) {
					// Previous page was in edition
					this.releasePage()
				}
				this.page = page
				if (this.edition) {
					this.editStart()
					this.setEditorContent()
				}
				LeekWars.setTitle(this.title)
				emitter.emit('loaded')
			})
			.error((result: any) => {
				// Pas de page
				let fun = null as any
				let args = ''
				let ret = ''
				let description = ''
				for (const funct of FUNCTIONS) {
					if (funct.name === this.code) {
						fun = funct
						description = this.$t('doc.func_' + fun.name) as string
						args = funct.arguments_names.map((a, i) => '- **' + a + '** : ' + (this.$t('doc.func_' + fun.name + '_arg_' + (i + 1)))).join('\n')
						if (fun.return_name) {
							ret = '#### Retour\n\n- **' + fun.return_name + '** : ' + (this.$t('doc.func_' + fun.name + '_return'))
						}
						break
					}
				}
				this.page = {
					new: true,
					id: 0,
					title: this.code,
					language: this.language,
					translations: result && result.translations ? result.translations : {},
					content: fun ?  `# ${this.code}
> Fonctions

${description}

#### Paramètres

${args}

${ret}


` : '# ' + this.code + '\n\n'
				}
				this.setEditorContent()
			})
		}

		editStart() {
			if (this.page.id === 0) { // Nouvelle page pas besoin de prendre un lock
				this.edition = true
				LeekWars.large = true
				LeekWars.box = true
				LeekWars.footer = false
				this.prepareEditor()
				return
			}
			LeekWars.post('encyclopedia/start-edition', {page_id: this.page.id}).then(() => {
				this.edition = true
				LeekWars.large = true
				LeekWars.box = true
				LeekWars.footer = false
				this.prepareEditor()
			}).error((result) => {
				LeekWars.toast("Verrouillé par " + result.locker)
			})
		}

		prepareEditor() {
			if (this.editor) {
				// Éditeur déjà prêt
				this.setEditorContent()
				return
			}
			nextTick(() => {
				import(/* webpackChunkName: "monaco" */ 'monaco-editor').then((monaco) => {
					const container = this.$refs.monacoContainer as HTMLElement
					if (!container) { return }
					this.editor = markRaw(monaco.editor.create(container, {
						value: this.page ? this.page.content : "",
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

					this.editor.onDidChangeModelContent(() => {
						this.modified = true
						this.page.content = this.editor!.getValue()
					})

					this.editor.onDidScrollChange((e) => {
						if (this.scrolling) { this.scrolling = false; return }
						const scrollTop = e.scrollTop
						const scrollHeight = e.scrollHeight
						const editorHeight = this.editor!.getLayoutInfo().height
						if (scrollHeight <= editorHeight) { return }
						const percent = scrollTop / (scrollHeight - editorHeight)

						this.scrolling = true
						const markdown = this.$refs.markdown as HTMLElement
						markdown.scrollTop = (markdown.scrollHeight - markdown.clientHeight) * percent
					})
					
					this.initialVersionId = this.editor.getModel()!.getAlternativeVersionId()
					this.modified = false
				})
			})
		}

		setEditorContent() {
			if (!this.page || !this.editor) { return }
			this.editor.setValue(this.page.content)
			this.initialVersionId = this.editor.getModel()!.getAlternativeVersionId()
			this.modified = false
		}

		editEnd() {
			this.edition = false
			LeekWars.large = false
			LeekWars.box = false
			LeekWars.footer = true
			if (this.editor) {
				this.editor.getModel()?.dispose()
				this.editor.dispose()
				this.editor = null
			}
			this.page.locker = null
			this.releasePage()
		}

		setPageLanguage(language: string) {
			this.page.language = language
			LeekWars.post('encyclopedia/set-language', {page_id: this.page.id, language })
		}

		releasePage() {
			LeekWars.post('encyclopedia/end-edition', {page_id: this.page.id})
		}

		onBeforeUnload() {
			if (this.edition && this.page && this.page.id !== 0) {
				const data = JSON.stringify({page_id: this.page.id})
				navigator.sendBeacon(LeekWars.API + 'encyclopedia/end-edition', new Blob([data], {type: 'application/json'}))
			}
		}

		markdownScroll(e: Event) {
			if (this.scrolling) { this.scrolling = false; return }
			const markdown = (this.$refs.markdown as HTMLElement)
			const percent = markdown.scrollTop / (markdown.scrollHeight - markdown.clientHeight)

			this.scrolling = true
			if (this.editor) {
				const scrollHeight = this.editor.getScrollHeight()
				const editorHeight = this.editor.getLayoutInfo().height
				this.editor.setScrollTop(Math.ceil((scrollHeight - editorHeight) * percent))
			}
		}

		beforeRouteUpdate(to: Route, from: Route, next: Function) {
			if (this.modified && !window.confirm('Page non sauvegardée, voulez-vous abandonner les modifications ?')) {
				next(false)
			} else {
				next()
			}
		}
		beforeRouteLeave(to: Route, from: Route, next: Function) {
			if (!next) { return !this.modified }
			if (this.modified && !window.confirm('Page non sauvegardée, voulez-vous abandonner les modifications ?')) {
				next(false)
			} else {
				next()
			}
		}

		save() {
			LeekWars.put('encyclopedia/update', {page_id: this.page.id, language: this.page.language, title: this.page.title, content: this.page.content, parent: this.page.parent || 1, reference: this.page.reference || 0}).then((result) => {
				LeekWars.toast("Sauvegardé !")
				if (this.page.id === 0) {
					this.page.new = false
					this.page.id = result.id
				}
			}).error(error => LeekWars.toast("Sauvegarde échouée : " + error.error))

			this.initialVersionId = this.editor!.getModel()!.getAlternativeVersionId()
			this.modified = false
			this.page.last_edition_time = Date.now() / 1000
			this.page.last_editor = store.state.farmer!.id
			this.page.last_editor_name = store.state.farmer!.name
		}

		comment(comment: Comment) {
			this.page.comments.push(comment)
		}

		search() {
			const query = this.searchQuery.replace(/ /g, '+')
			if (query) {
				this.$router.push('/encyclopedia-search?query=' + query)
			} else {
				this.$router.push('/encyclopedia-search')
			}
		}

		updateOfficial() {
			LeekWars.put('encyclopedia/official', {page_id: this.page.id, official: this.page.official}).then((result) => {

			}).error(error => LeekWars.toast("Sauvegarde échouée : " + error.error))
		}
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
	a {
		color: #5fad1b;
		font-weight: bold;
	}
	.contributors {
		display: flex;
		align-items: center;
		margin-bottom: 5px;
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