<template>
	<div ref="md" class="md" v-html="html"></div>
</template>

<script lang="ts">
	import { LeekWars } from '@/model/leekwars'
	import { CHIP_BY_NAME } from '@/model/sorted_chips'
	import { vueMain, vuetify } from '@/model/vue'
	import markdown from 'markdown-it'
	import sanitizeHtml from 'sanitize-html'
	import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
	import LineOfSight from '../line-of-sight/line-of-sight.vue'
	import ItemPreview from '../market/item-preview.vue'
	import SearchBar from './search-bar.vue'
	import TutorialMenu from '../tutorial/tutorial-menu.vue'
	import TutorialProgress from '../tutorial/tutorial-progress.vue'
	import { VBtn, VCheckbox } from 'vuetify/lib/components'
	import { tutorial_items } from '../tutorial/tutorial-items'
	import { store } from '@/model/store'
	import { i18n } from '@/model/i18n'
	import LeekImage from '../leek-image.vue'

	@Component({ name: 'markdown' })
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

			const re = /^((https:\/\/leekwars\.com)?\/image\/|https:\/\/(i\.)?imgur\.com\/|https:\/\/(i\.)?ibb.co\/)/
			const options = this.mode === 'encyclopedia' ? {
				allowedTags: sanitizeHtml.defaults.allowedTags.concat([ 'img', 'center' ]),
				allowedAttributes: {
					'*': ['style', 'class', 'width', 'height', 'href', 'src'],
					'li': ['correct'],
				},
				exclusiveFilter: function(frame: any) {
					return frame.tag === 'img' && !re.test(frame.attribs.src)
				}
			} : {
				allowedTags: sanitizeHtml.defaults.allowedTags.concat([ 'img', 'center' ]),
				allowedAttributes: { '*': ['style', 'class', 'width', 'height', 'href', 'src'] },
				exclusiveFilter: function(frame: any) {
					return frame.tag === 'img' && !re.test(frame.attribs.src)
				},
				allowedStyles: {
					'*': {
						'padding': [/^.*$/],
						'margin': [/^.*$/],
						'color': [/^.*$/],
						'background': [/^.*$/],
						'border': [/^.*$/],
						'text-align': [/^.*$/],
						'font-size': [/^.*$/],
						'font-weight': [/^.*$/],
						'width': [/^.*$/],
						'height': [/^.*$/],
					}
				}
			}
			this.html = this.links(sanitizeHtml(this.markdown.render(this.content), options))

			this.summary = {children: []}
			const stack = [this.summary] as any[]

			Vue.nextTick(() => {
				const md = this.$refs.md as HTMLElement
				md.querySelectorAll('h1, h2, h3, h4, h5').forEach((item: any) => {
					const level = parseInt(item.tagName.substring(1), 10)
					if (level >= 2) {
						// console.log("element", level, item)
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
					LeekWars.createCodeArea(content, item as HTMLElement)
				})
				md.querySelectorAll('code:not(.multi)').forEach((item) => {
					const content = ('' + item.textContent).trim()
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
						new ItemPreview({ propsData: { item: LeekWars.items[weapon.item] }, parent: vueMain }).$mount(item)
					}
				})
				// Puces
				md.querySelectorAll('.encyclopedia-chip').forEach((item) => {
					const chip = CHIP_BY_NAME[item.getAttribute('chip')!]
					if (chip) {
						new ItemPreview({ propsData: { item: LeekWars.items[chip.id] }, parent: vueMain }).$mount(item)
					}
				})
				// Potions
				md.querySelectorAll('.encyclopedia-potion').forEach((item) => {
					const potion = LeekWars.potionByName[item.getAttribute('potion')!]
					if (potion) {
						new ItemPreview({ propsData: { item: LeekWars.items[potion.id] }, parent: vueMain }).$mount(item)
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
					LeekWars.get<any[]>('encyclopedia/get-last-pages').then(pages => {
						item.innerHTML = '<ul>' + pages.map(p => '<li><a href="/encyclopedia/' + this.language + '/' + p.title + '">' + p.title + '</a>, <b>' + p.name + '</b> ' + LeekWars.formatDuration(p.time) + '</li>').join('') + '</ul>'
						item.querySelectorAll('a').forEach(linkify)
					})
				})
				// LoS
				md.querySelectorAll('.encyclopedia-los').forEach((item) => {
					new LineOfSight({ propsData: { }, parent: vueMain }).$mount(item)
				})
				// Search bar
				md.querySelectorAll('.encyclopedia-search-bar').forEach((item) => {
					new SearchBar({ propsData: { }, parent: vueMain }).$mount(item)
				})
				// Tutorial menu
				md.querySelectorAll('.tutorial-menu').forEach((item) => {
					new TutorialMenu({ propsData: { locale: this.locale }, parent: vueMain }).$mount(item)
				})
				// Tutorial progress
				md.querySelectorAll('.tutorial-progress').forEach((item) => {
					this.components.push(new TutorialProgress({ propsData: { locale: this.locale }, parent: vueMain }).$mount(item))
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
					const set_finished = () => {
						;(vbtn.$el as HTMLElement).style.display = 'none'
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

					const submit = document.createElement('div')
					item.append(submit)
					const vbtn = new VBtn({ vuetify: vuetify, propsData: { color: 'primary' } }).$mount(submit)
					vbtn.$el.innerHTML = i18n.t('main.validate') as string
					vbtn.$el.classList.add('v-btn--disabled')

					let form = [] as boolean[][]
					vbtn.$on('click', () => {
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
					})
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
							const checkbox = document.createElement('span')
							child.prepend(checkbox)
							const value = completed && child.hasAttribute('correct') ? true : false
							const vcheckbox = new VCheckbox({ vuetify: vuetify, propsData: { hideDetails: true, inputValue: value } }).$mount(checkbox)
							vcheckbox.$on('change', (a: any) => {
								answer[index] = a
								vcheckbox.$props.inputValue = a
								vbtn.$el.classList.toggle('v-btn--disabled', !form.every(q => q.some(a => a)))
							})
							vcheckbox.$el.addEventListener('click', (e) => {
								e.stopPropagation()
							})
							child.addEventListener('click', () => {
								answer[index] = !answer[index]
								vcheckbox.$props.inputValue = answer[index]
								vbtn.$el.classList.toggle('v-btn--disabled', !form.every(q => q.some(a => a)))
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
					this.components.push(new LeekImage({ propsData: { leek: { level: 10, face: 1 }, scale: 0.55 }, parent: vueMain }).$mount(item))
				})
				// Domingo
				md.querySelectorAll('.domingo').forEach((item) => {
					this.components.push(new LeekImage({ propsData: { leek: { level: 301, face: 2, metal: true, skin: 9 }, scale: 0.45 }, parent: vueMain }).$mount(item))
				})
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
				tag = tag.trim().toLowerCase()
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
	.md ::v-deep p, .md ::v-deep ul {
		color: #252525;
		font-size: 16px;
		line-height: 1.6;
		margin-bottom: 16px;
		img {
			vertical-align: middle;
		}
	}
	.md ::v-deep li img {
		vertical-align: middle;
	}
	.md ::v-deep h1:first-child {
		border-bottom: 1px solid #aaa;
		display: block;
		background: none;
		text-shadow: none;
		color: #222;
		font-size: 2.0em;
		line-height: 0.8;
		margin-top: 10px;
		margin-bottom: 20px;
		padding: 0;
		&:after {
			display: none;
		}
	}
	.md ::v-deep h1:first-child + blockquote {
		display: none;
	}
	.md ::v-deep h2 {
		color: #000;
		&:not(:first-of-type) {
			margin-top: 1em;
		}
		padding-bottom: 6px;
		border-bottom: 1px solid #aaa;
		margin-bottom: 0.5em;
	}
	.md ::v-deep h4 {
		margin-bottom: 0.7em;
		line-height: 1.6;
		border-bottom: 1px solid #aaa;
	}
	.md ::v-deep img {
		max-width: 100%;
	}
	.md ::v-deep a {
		color: #0645ad;
		font-weight: 500;
	}
	.md ::v-deep a.new {
		color: #ba0000;
	}
	.md ::v-deep a:hover {
		text-decoration: underline;
	}
	.md ::v-deep ul, .md ::v-deep ol {
		line-height: 1.6;
	}
	.md ::v-deep blockquote {
		padding: 0 1em;
		p {
			color: #777;
			padding: 4px 0;
		}
		border-left: .3em solid #aaa;
	}
	.md ::v-deep code {
		background: white;
		padding: 0 4px;
	}
	.md ::v-deep pre code {
		display: flex;
		background: none;
		border: none;
		padding: 0;
		margin-bottom: 1em;
	}
	.md ::v-deep table {
		margin: 15px 0;
		td, th {
			padding: 10px;
		}
	}
	.md ::v-deep table, .md ::v-deep tr, .md ::v-deep td, .md ::v-deep th {
		border: 1px solid #aaa;
	}
	.md ::v-deep a.card {
		&:hover {
			background: #ddd;
		}
		&:active {
			background: #bbb;
		}
	}
	.md ::v-deep .summary {
		// border: 1px solid #aaa;
		box-shadow: 0px 2px 1px -1px rgba(0,0,0,0.2), 0px 1px 1px 0px rgba(0,0,0,0.14), 0px 1px 3px 0px rgba(0,0,0,0.12);
		display: inline-block;
		background: white;
		margin: 5px 0;
		padding-top: 5px;
		padding-bottom: 5px;
		padding-right: 20px;
		border-radius: 4px;
		ul {
			margin: 0;
		}
	}
	.md ::v-deep .item-preview {
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
	.md ::v-deep .quizz {
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
				background: white;
				box-shadow: 0px 2px 1px -1px rgba(0,0,0,0.2), 0px 1px 1px 0px rgba(0,0,0,0.14), 0px 1px 3px 0px rgba(0,0,0,0.12);
				padding: 15px;
				border-radius: 4px;
				cursor: pointer;
				display: flex;
				gap: 4px;
				&:hover {
					background: #ddd;
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
	.md ::v-deep .lock {
		font-weight: 500;
		&.locked ~ pre {
			display: none;
		}
		&:not(.locked) {
			display: none;
		}
	}
	.md ::v-deep .tip {
		display: flex;
		align-items: center;
		gap: 10px;
		margin-bottom: 16px;
		svg {
			flex-shrink: 0;
		}
		p {
			background: white;
			box-shadow: 0px 2px 1px -1px rgba(0,0,0,0.2), 0px 1px 1px 0px rgba(0,0,0,0.14), 0px 1px 3px 0px rgba(0,0,0,0.12);
			padding: 10px 15px;
			border-radius: 4px;
			margin: 0;
		}
	}
	.md ::v-deep .lstype {
		color: #0000D0;
		font-weight: bold;
	}
</style>