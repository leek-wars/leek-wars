<template>
	<div ref="md" class="md" v-html="html"></div>
</template>

<script lang="ts">
	import { LeekWars } from '@/model/leekwars'
	import { CHIP_BY_NAME } from '@/model/sorted_chips'
	import { vuetify } from '@/model/vue'
	import markdown from 'markdown-it'
	import DOMPurify from 'dompurify'
	import { Options, Prop, Vue, Watch } from 'vue-property-decorator'
	import LineOfSight from '../line-of-sight/line-of-sight.vue'
	import ItemPreview from '../market/item-preview.vue'
	import SearchBar from './search-bar.vue'
	import TutorialMenu from '../tutorial/tutorial-menu.vue'
	import TutorialProgress from '../tutorial/tutorial-progress.vue'
	import { VBtn, VCheckbox } from 'vuetify/components'
	import { tutorial_items } from '../tutorial/tutorial-items'
	import { store } from '@/model/store'
	import { i18n } from '@/model/i18n'
	import LeekImage from '../leek-image.vue'
	import { createApp, nextTick, ref, h, defineComponent } from 'vue'
	import LWLoader from '../app/loader.vue'
	import router from '@/router'

	@Options({ name: 'markdown' })
	export default class Markdown extends Vue {

		@Prop({required: true}) content!: string
		@Prop({required: true}) mode!: string
		@Prop() locale!: string

		markdown: any = new markdown({
			html: true,
			breaks: true,
			linkify: true,
		})
		html: string = ''
		summary: any = {}
		components: any[] = []

		encodeURL = (s: string) => s.trim().replace(/\s+/g, '_')
		encodeID = (s: string) => s.trim().replace(/\s+/g, '_').replace(/'/g, '~')

		get language() {
			return this.locale || this.$i18n.locale
		}

		@Watch('content', {immediate: true})
		update() {

			const re = /^((https:\/\/leekwars\.com)?\/image\/|https:\/\/(i\.)?imgur\.com\/|https:\/\/(i\.)?ibb\.co\/)/

			DOMPurify.addHook('uponSanitizeElement', (node, data) => {
				if (data.tagName === 'img' && node instanceof Element) {
					const src = node.getAttribute('src')
					if (src && !re.test(src)) {
						node.remove()
					}
				}
			})

			const sanitized = DOMPurify.sanitize(this.markdown.render(this.content), {
				ADD_TAGS: ['img', 'center'],
				ADD_ATTR: ['style', 'class', 'width', 'height', 'href', 'src', 'colspan', 'rowspan', 'alt', 'correct'],
				ALLOW_UNKNOWN_PROTOCOLS: false,
			})

			DOMPurify.removeHook('uponSanitizeElement')

			this.html = this.links(sanitized)

			this.summary = {children: []}
			const stack = [this.summary] as any[]

			nextTick(() => {
				const md = this.$refs.md as HTMLElement
				md.querySelectorAll('h1, h2, h3, h4, h5').forEach((item: any) => {
					const level = parseInt(item.tagName.substring(1), 10)
					if (level >= 2) {
						const node = {level, title: item.innerText, children: []}
						const parent = stack[level - 2] || this.summary
						stack[level - 1] = node
						parent.children.push(node)
					}
					item.id = this.encodeID(item.innerText)
				})
				md.querySelectorAll('.encyclopedia-summary').forEach((item) => {
					const depth = parseInt(item.getAttribute('depth') || '3', 10)
					item.innerHTML = this.generateSummary(depth)
				})
				md.querySelectorAll('pre code').forEach((item) => {
					const content = ('' + item.textContent).trim()
					item.classList.add('multi')
					if (LeekWars.darkMode) item.classList.add('theme-monokai')
					LeekWars.createCodeArea(content, item as HTMLElement)
				})
				md.querySelectorAll('code:not(.multi)').forEach((item) => {
					const content = ('' + item.textContent).trim()
					if (LeekWars.darkMode) item.classList.add('theme-monokai')
					LeekWars.createCodeAreaSimple(content, item as HTMLElement)
				})

				const linkify = (a: HTMLAnchorElement) => {
					a.onclick = (e: Event) => {
						let link = a.getAttribute('href')!
						if (link.startsWith('/') || link.startsWith(document.location.origin) || link.startsWith('https://leekwars.com/')) {
							if (link.startsWith('/encyclopedia/')) {
								link = link.replace(/ /g, '_')
							}
							this.$router.push(link.replace(document.location.origin, '').replace('https://leekwars.com/', ''))
							e.stopPropagation()
							e.preventDefault()
							return false
						}
					}
				}
				md.querySelectorAll('a').forEach(linkify)

				// Armes
				md.querySelectorAll('.encyclopedia-weapon').forEach((item) => {
					const weapon = LeekWars.weaponByName[item.getAttribute('weapon')!]
					if (weapon) {
						const app = createApp(ItemPreview, { item: LeekWars.items[weapon.item] })
						app.use(vuetify).use(i18n).use(store)
						app.mount(item)
						this.components.push({ $destroy: () => app.unmount() })
					}
				})
				// Puces
				md.querySelectorAll('.encyclopedia-chip').forEach((item) => {
					const chip = CHIP_BY_NAME[item.getAttribute('chip')!]
					if (chip) {
						const app = createApp(ItemPreview, { item: LeekWars.items[chip.id] })
						app.use(vuetify).use(i18n).use(store)
						app.mount(item)
						this.components.push({ $destroy: () => app.unmount() })
					}
				})
				// Potions
				md.querySelectorAll('.encyclopedia-potion').forEach((item) => {
					const potion = LeekWars.potionByName[item.getAttribute('potion')!]
					if (potion) {
						const app = createApp(ItemPreview, { item: LeekWars.items[potion.id] })
						app.use(vuetify).use(i18n).use(store)
						app.mount(item)
						this.components.push({ $destroy: () => app.unmount() })
					}
				})
				// Locked pages
				md.querySelectorAll('.encyclopedia-locked-pages').forEach((item) => {
					LeekWars.get<any[]>('encyclopedia/get-locked-pages').then(pages => {
						item.innerHTML = '<ul>' + pages.map(p => '<li><a href="/encyclopedia/' + this.language + '/' + p.title + '">' + p.title + '</a>, verrouillée par <b>' + p.name + '</b></li>').join('') + '</ul>'
						item.querySelectorAll('a').forEach(linkify)
					})
				})
				// Last edited pages
				md.querySelectorAll('.encyclopedia-last-modifications').forEach((item) => {
					LeekWars.get<any[]>('encyclopedia/get-last-pages/' + this.language).then(pages => {
						item.innerHTML = '<ul>' + pages.map(p => '<li><a href="/encyclopedia/' + this.language + '/' + p.title + '">' + p.title + '</a>, <b>' + p.name + '</b> ' + LeekWars.formatDuration(p.time) + '</li>').join('') + '</ul>'
						item.querySelectorAll('a').forEach(linkify)
					})
				})
				// LoS
				md.querySelectorAll('.encyclopedia-los').forEach((item) => {
					const app = createApp(LineOfSight)
					app.use(vuetify).use(i18n).use(store)
					app.mount(item)
					this.components.push({ $destroy: () => app.unmount() })
				})
				// Search bar
				md.querySelectorAll('.encyclopedia-search-bar').forEach((item) => {
					createApp(SearchBar).use(i18n).component('loader', LWLoader).use(router).mount(item)
				})
				// Tutorial menu
				md.querySelectorAll('.tutorial-menu').forEach((item) => {
					const app = createApp(TutorialMenu, { locale: this.locale })
					app.use(vuetify).use(i18n).use(store).use(router)
					app.mount(item)
					this.components.push({ $destroy: () => app.unmount() })
				})
				// Tutorial progress
				md.querySelectorAll('.tutorial-progress').forEach((item) => {
					const app = createApp(TutorialProgress, { locale: this.locale })
					app.use(vuetify).use(i18n).use(store).use(router)
					app.mount(item)
					this.components.push({ $destroy: () => app.unmount() })
				})
				// Tutorial quizz
				md.querySelectorAll('.quizz').forEach((item) => {
					let chapter = 0
					item.classList.forEach(c => {
						if (c.startsWith('chapter-')) {
							chapter = parseInt(c.substring(8))
						}
					})

					// Désactivé si pas le chapitre N + 1
					if (store.state.farmer && chapter !== store.state.farmer.tutorial_progress + 1) {
						item.querySelectorAll('ul').forEach((answers, q) => {
							[...answers.children].forEach(child => child.classList.add('disabled'))
						})
					}

					const completed = store.state.farmer && store.state.farmer.tutorial_progress >= chapter
					let submitContainer: HTMLElement | null = null
					const set_finished = () => {
						if (submitContainer) submitContainer.style.display = 'none'
						item.querySelectorAll('ul').forEach((answers, q) => {
							[...answers.children].forEach(child => child.classList.add('disabled'))
						})
						const lock = md.querySelector('.lock')
						if (lock) {
							lock.classList.remove('locked')
						}
					}

					const bravo = document.createElement('div')
					bravo.innerText = 'Bravo ! 🥳'
					item.append(bravo)
					bravo.style.display = 'none'

					let form = [] as boolean[][]
					const btnDisabled = ref(true)

					const updateBtnState = () => {
						btnDisabled.value = !form.every(q => q.some(a => a))
					}

					const handleSubmit = () => {
						let good = true
						const questions = item.querySelectorAll('ul')
						questions.forEach((answers, q) => {
							;[...answers.children].forEach((child, index) => {
								child.classList.remove('correct', 'wrong', 'missed')
								if (child.hasAttribute('correct') && form[q][index]) {
									child.classList.add('correct')
								}
								if (!child.hasAttribute('correct') && form[q][index]) {
									child.classList.add('wrong')
									good = false
								}
								if (child.hasAttribute('correct') && !form[q][index]) {
									child.classList.add('missed')
									good = false
								}
							})
						})
						// Submit answer
						const real_form = form.map((q, i) => {
							const result = [...q]
							q.forEach((a, j) => result[parseInt(questions[i].children[j].getAttribute('index')!)] = a)
							return result
						})
						LeekWars.post("tutorial/answer", { chapter, form: JSON.stringify(real_form), progress: good ? chapter : chapter - 1 })

						if (good) {
							bravo.style.display = 'block'
							set_finished()
							// Send new progression
							store.commit('set-tutorial-progress', chapter)
						}
					}

					// Create submit button using Vue 3 createApp with reactive disabled state
					submitContainer = document.createElement('div')
					item.append(submitContainer)
					const BtnWrapper = defineComponent({
						setup() {
							return () => h(VBtn, {
								color: 'primary',
								disabled: btnDisabled.value,
								onClick: handleSubmit
							}, () => i18n.t('main.validate'))
						}
					})
					const btnApp = createApp(BtnWrapper)
					btnApp.use(vuetify)
					btnApp.mount(submitContainer)
					this.components.push({ $destroy: () => btnApp.unmount() })

					item.querySelectorAll('ul').forEach(answers => {
						;[...answers.children].forEach((child, index) => {
							child.setAttribute('index', '' + index)
						})
						answers.append(...Array.from(answers.children).sort((a, b) => {
							return Math.random() - 0.5
						}))
						let answer = Array(answers.children.length).fill(false)
						form.push(answer)
						;[...answers.children].forEach((child, index) => {
							const letter = document.createElement('span')
							letter.innerText = String.fromCodePoint(65 + index) + ". "
							letter.classList.add("letter")
							child.prepend(letter)

							// Create Vuetify checkbox using a reactive wrapper component
							const checkboxContainer = document.createElement('span')
							checkboxContainer.className = 'quiz-checkbox'
							child.prepend(checkboxContainer)
							const initialValue = completed && child.hasAttribute('correct') ? true : false
							answer[index] = initialValue

							// Create a reactive ref for the checkbox value
							const checked = ref(initialValue)

							// Create a wrapper component that uses the reactive ref
							const CheckboxWrapper = defineComponent({
								setup() {
									return () => h(VCheckbox, {
										hideDetails: true,
										modelValue: checked.value,
										'onUpdate:modelValue': (newValue: boolean) => {
											checked.value = newValue
											answer[index] = newValue
											updateBtnState()
										}
									})
								}
							})

							const checkboxApp = createApp(CheckboxWrapper)
							checkboxApp.use(vuetify)
							checkboxApp.mount(checkboxContainer)
							this.components.push({ $destroy: () => checkboxApp.unmount() })

							checkboxContainer.addEventListener('click', (e: Event) => {
								e.stopPropagation()
							})
							child.addEventListener('click', () => {
								checked.value = !checked.value
								answer[index] = checked.value
								updateBtnState()
							})
						})
					})
					// Déjà réussi ?
					if (store.state.farmer && store.state.farmer.tutorial_progress >= chapter) {
						set_finished()
						item.querySelectorAll('ul').forEach((answers, q) => {
							[...answers.children].forEach(child => {
								if (child.hasAttribute('correct')) {
									child.classList.add('correct')
								}
							})
						})
					}
				})

				// Leeky
				md.querySelectorAll('.leeky').forEach((item) => {
					const app = createApp(LeekImage, { leek: { level: 10, face: 1 }, scale: 0.55 })
					app.use(vuetify).use(i18n).use(store)
					app.mount(item)
					this.components.push({ $destroy: () => app.unmount() })
				})
				// Domingo
				md.querySelectorAll('.domingo').forEach((item) => {
					const app = createApp(LeekImage, { leek: { level: 301, face: 2, metal: true, skin: 9 }, scale: 0.45 })
					app.use(vuetify).use(i18n).use(store)
					app.mount(item)
					this.components.push({ $destroy: () => app.unmount() })
				})
				// Aliases - affichage discret
				md.querySelectorAll('.aliases-display').forEach(el => el.remove())
				const aliasElements = md.querySelectorAll('.encyclopedia-alias')
				if (aliasElements.length > 0) {
					const aliases = Array.from(aliasElements).map(el => el.getAttribute('data-alias')!).filter(Boolean)
					if (aliases.length > 0) {
						const container = document.createElement('div')
						container.className = 'aliases-display'
						container.textContent = this.$parent!.$parent!.$i18n.t('aliases', [aliases.join(', ')]) as string
						// Insérer après le premier h1
						const h1 = md.querySelector('h1')
						if (h1 && h1.nextSibling) {
							h1.parentNode!.insertBefore(container, h1.nextSibling)
						} else {
							md.prepend(container)
						}
					}
				}
			})
		}

		links(html: string) {
			return html.replace(/\[\[(.*?)\]\]/g, (m, link) => {
				link = link.trim()
				const parts = link.split('|', 2)
				link = parts[0]
				const alias = parts.length === 2 ? parts[1] : link
				const page = LeekWars.encyclopedia[this.language] ? LeekWars.encyclopedia[this.language][link.toLowerCase().replace(/_/g, ' ')] : null
				const clazz = page ? "" : "new"
				const text = link.replace(/_/g, ' ').replace(/'/g, '&apos;')
				return "<a href='/encyclopedia/" + this.language + '/' + (page ? page.title.replace(/ /g, '_') : text) + "' class='" + clazz + "'>" + alias + "</a>"
			}).replace(/{{(.*?)}}/g, (m, tag) => {
				const originalTag = tag.trim()
				tag = originalTag.toLowerCase()
				if (tag.startsWith('summary')) {
					const parts = tag.split(':')
					const depth = parts.length >= 2 ? parseInt(parts[1] || '3', 10) : 3
					return "<div class='encyclopedia-summary' depth='" + depth + "'></div>"
				} else if (tag.startsWith('weapon')) {
					const parts = tag.split(':')
					if (parts.length > 1) {
						const weapon = parts[1].trim().toLowerCase()
						return "<div class='encyclopedia-weapon' weapon='" + weapon + "'></div>"
					}
				} else if (tag.startsWith('chip')) {
					const parts = tag.split(':')
					if (parts.length > 1) {
						const chip = parts[1].trim().toLowerCase()
						return "<div class='encyclopedia-chip' chip='" + chip + "'></div>"
					}
				} else if (tag.startsWith('potion')) {
					const parts = tag.split(':')
					if (parts.length > 1) {
						const potion = parts[1].trim().toLowerCase()
						return "<div class='encyclopedia-potion' potion='" + potion + "'></div>"
					}
				} else if (tag.startsWith('locked-pages')) {
					return "<div class='encyclopedia-locked-pages'></div>"
				} else if (tag.startsWith('last-modifications')) {
					return "<div class='encyclopedia-last-modifications'></div>"
				} else if (tag.startsWith('line-of-sight')) {
					return "<div class='encyclopedia-los'></div>"
				} else if (tag.startsWith('tutorial-menu')) {
					return "<div class='tutorial-menu'></div>"
				} else if (tag.startsWith('tutorial-progress')) {
					return "<div class='tutorial-progress'></div>"
				} else if (tag.startsWith('tutorial-score')) {
					return "<div>" + (store.state.farmer ? store.state.farmer.tutorial_progress : 0) + " / " + tutorial_items.length + "</div>"
				} else if (tag.startsWith('tutorial-lock')) {
					const parts = tag.split(':')
					if (parts.length > 1) {
						const chapter = parseInt(parts[1])
						const locked = (store.state.farmer ? store.state.farmer.tutorial_progress : 0) < chapter ? "locked": ""
						return "<div class='lock " + locked + "'>" + this.$parent!.$parent!.$i18n.t('locked') + "</div>"
					}
				} else if (tag.startsWith('alias')) {
					const parts = originalTag.split(':')
					if (parts.length > 1) {
						const alias = parts[1].trim()
						return "<span class='encyclopedia-alias' data-alias='" + alias.replace(/'/g, '&apos;') + "'></span>"
					}
				} else if (tag.startsWith('leeky')) {
					return "<div class='leeky'></div>"
				}
				return '{{ ' + tag + ' }}'
			})
		}

		generateSummary(depth: number) {
			const aux = (node: any, d: number) => {
				let r = '<li><a href="#' + this.encodeURL(node.title).replace(/"/g, "&quot;") + '">' + node.title + '</a></li>'
				if (d > 0 && node.children.length) {
					r += '<ul>' + node.children.map((n: any) => aux(n, d - 1)).join('') + '</ul>'
				}
				return r
			}
			return '<ul class="summary">'
				+ this.summary.children.map((n: any) => aux(n, depth - 2)).join('')
				+ '</ul>'
		}

		beforeUpdate() {
			for (const component of this.components) {
				component.$destroy()
			}
			this.components = []
		}
	}
</script>

<style lang="scss" scoped>
	.md {
		padding: 15px;
	}
	.md :deep(p), .md :deep(ul) {
		line-height: 1.6;
		margin-bottom: 16px;
		img {
			vertical-align: middle;
		}
	}
	.md :deep(li img) {
		vertical-align: middle;
	}
	.md :deep(h1:first-child) {
		border-bottom: 1px solid var(--border);
		display: block;
		background: none;
		text-shadow: none;
		font-size: 2.0em;
		margin-top: 10px;
		margin-bottom: 20px;
		padding: 0;
		height: auto;
		color: var(--text-color);
		&:after {
			display: none;
		}
	}
	.md :deep(h1:first-child + blockquote) {
		display: none;
	}
	.md :deep(h2) {
		// color: #000;
		&:not(:first-of-type) {
			margin-top: 1em;
		}
		padding-bottom: 6px;
		border-bottom: 1px solid var(--border);
		margin-bottom: 0.5em;
	}
	.md :deep(h4) {
		margin-bottom: 0.7em;
		line-height: 1.6;
		border-bottom: 1px solid var(--border);
	}
	.md :deep(img) {
		max-width: 100%;
	}
	.md :deep(a) {
		color: #0645ad;
		font-weight: 500;
	}
	body.dark .md :deep(a) {
		color: #4bbaff;
	}
	.md :deep(a.new) {
		color: #ba0000;
	}
	.md :deep(a:hover) {
		text-decoration: underline;
	}
	.md :deep(ul), .md :deep(ol) {
		line-height: 1.6;
	}
	.md :deep(blockquote) {
		padding: 0 1em;
		p {
			color: #777;
			padding: 4px 0;
		}
		border-left: .3em solid #aaa;
	}
	.md :deep(code) {
		background: var(--pure-white);
		padding: 0 4px;
	}
	.md :deep(pre code) {
		display: flex;
		background: none;
		border: none;
		padding: 0;
		margin-bottom: 1em;
	}
	.md :deep(table) {
		margin: 15px 0;
		td, th {
			padding: 10px;
		}
	}
	.md :deep(table), .md :deep(tr), .md :deep(td), .md :deep(th) {
		border: 1px solid var(--border);
	}
	.md :deep(a.card) {
		.v-icon {
			color: var(--text-color);
		}
		&:hover {
			background: var(--background-secondary);
		}
		&:active {
			background: var(--background-disabled);
		}
	}
	.md :deep(.summary) {
		// border: 1px solid #aaa;
		box-shadow: 0px 2px 1px -1px rgba(0,0,0,0.2), 0px 1px 1px 0px rgba(0,0,0,0.14), 0px 1px 3px 0px rgba(0,0,0,0.12);
		display: inline-block;
		background: var(--pure-white);
		margin: 5px 0;
		padding-top: 5px;
		padding-bottom: 5px;
		padding-right: 20px;
		border-radius: 4px;
		ul {
			margin: 0;
		}
	}
	.md :deep(.item-preview) {
		width: 350px;
		display: inline-block;
		box-shadow: 0px 2px 1px -1px rgba(0,0,0,0.2), 0px 1px 1px 0px rgba(0,0,0,0.14), 0px 1px 3px 0px rgba(0,0,0,0.12);
		h2 {
			border-bottom: none;
			padding: 0;
			margin: 0;
		}
		table {
			border: none;
			td {
				padding: 0;
				border: none;
			}
		}
		.area {
			margin: 3px auto;
		}
		.raw {
			padding: 4px 0;
			background: none;
		}
	}
	.md :deep(.quizz) {
		h5 {
			font-size: 17px;
			font-weight: 500;
			margin: 20px 0;
		}
		ul {
			display: grid;
			gap: 10px;
			list-style-type: none;
			grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
			padding-inline-start: 0;
			li {
				background: var(--pure-white);
				box-shadow: 0px 2px 1px -1px rgba(0,0,0,0.2), 0px 1px 1px 0px rgba(0,0,0,0.14), 0px 1px 3px 0px rgba(0,0,0,0.12);
				padding: 15px;
				border-radius: 4px;
				cursor: pointer;
				display: flex;
				gap: 4px;
				&:hover {
					background: var(--background-secondary);
				}
				&.correct {
					background: #5fad1b;
				}
				&.wrong {
					background: red;
				}
				&.missed {
					background: orange;
				}
				&.correct, &.wrong, &.missed {
					color: white;
					pre {
						color: black;
					}
					.letter {
						color: white;
					}
					.v-icon {
						color: white !important;
					}
				}
				&.disabled {
					pointer-events: none;
				}
				.letter {
					font-weight: 500;
					color: #777;
				}
				.v-input {
					display: inline-block;
					color: var(--text-color);
				}
				.quiz-checkbox {
					display: inline-flex;
					align-items: center;
					.v-input {
						flex: none;
					}
				}
				code {
					pre {
						padding: 0;
						padding-left: 6px;
						border: 0;
					}
					.line-number {
						padding: 0;
					}
				}
			}
		}
	}
	.md :deep(.lock) {
		font-weight: 500;
		&.locked ~ pre {
			display: none;
		}
		&:not(.locked) {
			display: none;
		}
	}
	.md :deep(.tip) {
		display: flex;
		align-items: center;
		gap: 10px;
		margin-bottom: 16px;
		svg {
			flex-shrink: 0;
		}
		p {
			background: var(--pure-white);
			box-shadow: 0px 2px 1px -1px rgba(0,0,0,0.2), 0px 1px 1px 0px rgba(0,0,0,0.14), 0px 1px 3px 0px rgba(0,0,0,0.12);
			padding: 10px 15px;
			border-radius: 4px;
			margin: 0;
		}
	}
	.md :deep(.lstype) {
		color: var(--type-color);
		font-weight: bold;
	}
	.md :deep(.encyclopedia-alias) {
		display: none;
	}
	.md :deep(.aliases-display) {
		font-size: 13px;
		color: var(--text-color-secondary);
		font-style: italic;
		margin-bottom: 10px;
	}
</style>