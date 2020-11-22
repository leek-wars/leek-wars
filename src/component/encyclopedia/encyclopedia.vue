<template lang="html">
	<div>
		<div class="page-bar page-header">
			<h1 :class="{small: breadcrumb_items.length >= 3}">
				<v-icon class="book">mdi-book-open-page-variant</v-icon>
				<breadcrumb :items="breadcrumb_items" :raw="true" />
				<v-icon v-if="modified" class="modified">mdi-record</v-icon>
			</h1>
			<div v-if="page && contributor" class="tabs">
				<!-- <router-link :to="'/encyclopedia/' + english">
					<div class="tab">English</div>
				</router-link> -->
				<div v-if="edition && modified" class="tab" @click="save">
					<v-icon>mdi-content-save</v-icon>
					Sauvegarder
				</div>
				<div v-if="edition" class="tab" @click="editEnd">
					<v-icon>mdi-check</v-icon>
					Terminer l'édition
				</div>
				<div v-else-if="page.locker && (!$store.state.farmer || page.locker !== $store.state.farmer.id)" class="tab disabled">
					<v-icon>mdi-lock</v-icon>
					En cours d'édition par {{ page.locker_name }}
				</div>
				<div v-else class="tab" @click="editStart">
					<v-icon>mdi-pencil-outline</v-icon>
					Modifier
				</div>
			</div>
		</div>
		<panel v-if="page" class="first encyclopedia" :class="{last: LeekWars.mobile}">
			<div slot="content" class="table">
				<div v-if="edition" ref="codemirror" class="codemirror" :style="{lineHeight: 1.6, fontSize: 14}"></div>
				<div ref="markdown" class="markdown" @scroll="markdownScroll">
					<!-- {{ parents }} -->
					<markdown :content="page.content" :pages="pages" />

					<div v-if="page.new && !edition" class="nopage">
						<v-icon>mdi-book-open-page-variant</v-icon>
						<br><br>
						<div class="message">La page « {{ code }} » est inexistante sur l'encyclopédie.</div>
						<br>
						<div v-if="contributor">Vous êtes un contributeur 😎 Cliquez sur <b>Modifier</b> pour commencer la rédaction de cette page</div>
					</div>

					<div v-if="page.creator" class="stats">

						<div class="contributors">
							<v-icon>mdi-account-multiple</v-icon>
							<div v-html="$tc('n_contributors', page.contributors.length)"></div>
							<div class="avatars">
								<rich-tooltip-farmer v-for="contributor in page.contributors" :id="contributor.id" :key="contributor.id" v-slot="{ on }">
									<router-link :to="'/farmer/' + contributor.id">
										<avatar :farmer="contributor" :on="on" />
									</router-link>
								</rich-tooltip-farmer>
							</div>
							<div class="fill"></div>
							<v-icon @click="statsExpanded = !statsExpanded">{{ statsExpanded ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
						</div>

						<div v-if="statsExpanded" class="expanded-stats">
							<div>
								Créée par <rich-tooltip-farmer :id="page.creator" v-slot="{ on }">
									<router-link :to="'/farmer/' + page.creator"><span v-on="on">{{ page.creator_name }}</span></router-link>
								</rich-tooltip-farmer>
								le {{ page.creation_time | datetime }}

								<div v-if="page.last_editor">
									Éditée par <rich-tooltip-farmer :id="page.last_editor" v-slot="{ on }">
										<router-link :to="'/farmer/' + page.last_editor"><span v-on="on">{{ page.last_editor_name }}</span></router-link>
									</rich-tooltip-farmer>
									le {{ page.last_edition_time | datetime }}
								</div>
							</div>
							<div>
								<b>{{ page.contributions | number }}</b> modifications
								<br>
								<b>{{ page.content.split('\n').length }}</b> lignes — <b>{{ page.content.split(' ').length }}</b> mots — <b>{{ page.content.length }}</b> caractères
							</div>
						</div>
					</div>
				</div>
			</div>
		</panel>

		<!-- <panel :title="'Notes des joueurs (' + page.comments.length + ')'">
			<comments :comments="page.comments" @comment="comment" />
		</panel> -->
	</div>
</template>

<script lang="ts">
	import Markdown from '@/component/encyclopedia/markdown.vue'
	import { mixins } from '@/model/i18n'
	import { Leek } from '@/model/leek'
	import { LeekWars } from '@/model/leekwars'
	import { store } from '@/model/store'
	import { Component, Vue, Watch } from 'vue-property-decorator'
	import { Route } from 'vue-router'
	import Breadcrumb from '../forum/breadcrumb.vue'

	@Component({ name: 'encyclopedia', i18n: {}, mixins, components: { Markdown, Breadcrumb } })
	export default class Encyclopedia extends Vue {
		content: string = ''
		english: string = ''
		page: any = null
		edition: boolean = false
		codemirror: any = null
		editor: CodeMirror.Editor | null = null
		scrolling: boolean = false
		pages: any = {}
		modified: boolean = false
		initialGeneration: number = 0
		statsExpanded: boolean = false

		get code() {
			return this.$route.params.page ? this.$route.params.page.replace(/_/g, ' ') : 'Encyclopédie'
		}
		get title() {
			return this.page ? this.page.title : 'Encyclopedia'
		}
		get breadcrumb_items() {
			if (this.page && !this.page.new) {
				return this.parents.map(p => {
					return {name: p.title, link: p.title === 'Encyclopédie' ? '/encyclopedia' : '/encyclopedia/' + p.title}
				})
			} else {
				const parts = [
					{name: 'Encyclopédie', link: '/encyclopedia'}
				]
				if (this.code !== 'Encyclopédie') {
					parts.push({name: this.code, link: '/encyclopedia/' + this.code})
				}
				return parts;
			}
		}
		get contributor() {
			return store.state.farmer ? store.state.farmer.contributor || store.state.farmer.moderator : false
		}
		get parents() {
			let parents = []
			let current = this.page
			let visited = new Set<number>()
			for (let current = this.page; current; current = LeekWars.encyclopediaById[current.parent]) {
				if (visited.has(current.id)) { break }
				visited.add(current.id)
				parents.push(current)
			}
			return parents.reverse()
		}

		created() {
		}
		beforeDestroy() {
			this.$root.$off('ctrlS')
			LeekWars.large = false
			LeekWars.box = false
			LeekWars.footer = true

			if (this.edition) {
				this.editEnd()
			}
		}

		mounted() {
			// this.editStart()
			LeekWars.post('encyclopedia/get-all').then(pages => {
				LeekWars.encyclopedia = pages
				for (const page in pages) {
					Vue.set(LeekWars.encyclopediaById, pages[page].id, pages[page])
				}
			})

			this.$root.$on('ctrlS', () => {
				this.save()
			})
		}

		@Watch('code', {immediate: true})
		update() {
			LeekWars.setTitle(this.title)

			LeekWars.get<any>('encyclopedia/get/' + this.code).then(page => {
				if (this.edition) {
					// Previous page was in edition
					this.releasePage()
				}
				this.page = page
				if (this.edition) {
					this.editStart()
					this.setEditorContent()
				}
			})
			.error(() => {
				// Pas de page
				this.page = {
					new: true,
					id: 0,
					title: this.code,
					content: '# ' + this.code + '\n\n'
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
			Vue.nextTick(() => {
				const codeMirrorElement = this.$refs.codemirror as any
				import(/* webpackChunkName: "codemirror-markdown" */ "@/component/encyclopedia/codemirror-markdown").then(wrapper => {
					// console.log("CM", wrapper)
					this.codemirror = wrapper.CodeMirror
					this.editor = wrapper.CodeMirror(codeMirrorElement, {
						value: "",
						mode: "markdown",
						theme: "leekwars",
						tabSize: 4,
						indentUnit: 4,
						indentWithTabs: true,
						highlightSelectionMatches: true,
						matchBrackets: true,
						lineNumbers: true,
						lineWrapping: true,
						continueComments: true,
						undoDepth: 200,
						autofocus: true,
						smartIndent: true,
						cursorHeight: 1,
						foldGutter: true,
						gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"]
					} as any)

					// console.log(this.editor)

					this.setEditorContent()

					this.editor.on('change', (editor, changes) => {
						this.page.content = editor.getValue()

						const generation = (editor.getDoc() as any).history.generation
						// console.log("generation", generation, this.editor.doc)
						this.modified = generation != this.initialGeneration

						Vue.nextTick(() => {
							const title = (this.$refs.markdown as HTMLElement).querySelector('h1')
							if (title) {
								const text = title.innerText.trim()
								this.page.title = text
							}
							const parent = (this.$refs.markdown as HTMLElement).querySelector('blockquote')
							if (parent) {
								const text = parent.innerText.trim()
								// console.log(parent, text, LeekWars.encyclopedia)
								if (text in LeekWars.encyclopedia) {
									this.page.parent = LeekWars.encyclopedia[text].id
								} else {
									this.page.parent = 1
								}
							}
						})
						this.scrolling = true
					})

					this.editor.on('scroll', (editor) => {
						// console.log('scroll editor')
						if (this.scrolling) { this.scrolling = false; return }
						const doc = editor.getDoc() as any
						const percent = doc.scrollTop / (doc.height - (this.editor as any).display.lastWrapHeight)

						this.scrolling = true
						const markdown = this.$refs.markdown as HTMLElement
						markdown.scrollTop = (markdown.scrollHeight - markdown.clientHeight) * percent
					})
				})
			})
		}

		setEditorContent() {
			if (!this.page || !this.editor) { return }
			this.editor.setValue(this.page.content)
			this.editor.getDoc().clearHistory()
			this.initialGeneration = (this.editor as any).doc.history.generation
			// console.log("initial generation", this.initialGeneration)
			this.modified = false
			// console.log(this.editor)
		}

		editEnd() {
			this.edition = false
			LeekWars.large = false
			LeekWars.box = false
			LeekWars.footer = true
			this.editor = null
			this.releasePage()
		}

		releasePage() {
			LeekWars.post('encyclopedia/end-edition', {page_id: this.page.id})
		}

		markdownScroll(e: Event) {
			// console.log("scroll markdown", e)
			if (this.scrolling) { this.scrolling = false; return }
			// console.log(e)
			const markdown = (this.$refs.markdown as HTMLElement)
			const percent = markdown.scrollTop / (markdown.scrollHeight - markdown.clientHeight)

			this.scrolling = true
			// console.log(percent, this.editor)
			if (this.editor) {
				this.editor.scrollTo(0, Math.ceil(((this.editor.getDoc() as any).height - (this.editor as any).display.lastWrapHeight) * percent))
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

			console.log("Save", {title: this.page.title, parent: this.page.parent})
			LeekWars.post('encyclopedia/update', {page_id: this.page.id, title: this.page.title, content: this.page.content, parent: this.page.parent || 1}).then((result) => {
				LeekWars.toast("Sauvegardé !")
				if (this.page.id === 0) {
					this.page.id = result.id
				}
			})

			this.initialGeneration = (this.editor as any).doc.history.generation
			// console.log("initial generation", this.initialGeneration)
			this.modified = false
			this.page.last_edition_time = Date.now() / 1000
			this.page.last_editor = store.state.farmer!.id
			this.page.last_editor_name = store.state.farmer!.name
		}

		comment(comment: Comment) {
			this.page.comments.push(comment)
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
	.book {
		margin-right: 10px;
		font-size: 23px;
		margin-bottom: 5px;
	}
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

.encyclopedia ::v-deep > .table {
	display: flex;
	min-height: 0;
	flex: 1;
	& > * {
		flex: 1;
		height: 100%;
		min-height: 0;
		min-width: 0;
	}
	.codemirror .CodeMirror {
		height: 100%;
	}
}

.stats {
	padding: 15px;
	border-top: 1px solid #ccc;
	color: #777;
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
}

</style>