<template>
	<div ref="md" class="md" v-html="html"></div>
</template>

<script lang="ts" setup>
	import { LeekWars } from '@/model/leekwars'
	import { CHIP_BY_NAME } from '@/model/sorted_chips'
	import { mdiIcons } from '@/model/mdi-icons'
	import { Latex } from '@/model/latex'
	import { createSubApp } from '@/model/vue'
	import { resolveCodeThemeClass } from '@/component/editor/code-theme'
	import markdown from 'markdown-it'
	import DOMPurify from 'dompurify'
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
	import { computed, defineComponent, h, nextTick, onBeforeUnmount, onBeforeUpdate, ref, useTemplateRef, watch } from 'vue'
	import { useI18n } from 'vue-i18n'
	import { useRoute, useRouter } from 'vue-router'
	import { scroll_to_hash } from '@/router-functions'
	import LWLoader from '../app/loader.vue'

	defineOptions({ name: 'Markdown' })

	const props = defineProps<{
		content: string
		mode: string
		locale?: string
	}>()
	const emit = defineEmits<{ rendered: [] }>()

	const { t, locale: i18nLocale } = useI18n()
	const route = useRoute()
	const router = useRouter()
	const md = useTemplateRef<HTMLElement>('md')

	interface SummaryNode { level: number; title: string; children: SummaryNode[] }
	interface MountedComponent { $destroy: () => void }

	const markdownInstance = new markdown({
		html: true,
		breaks: true,
		linkify: true,
	})
	const html = ref('')
	let summary: { children: SummaryNode[] } = { children: [] }
	let components: MountedComponent[] = []

	const encodeURL = (s: string) => s.trim().replace(/\s+/g, '_')
	const encodeID = (s: string) => s.trim().replace(/\s+/g, '_').replace(/'/g, '~')

	const language = computed(() => props.locale || i18nLocale.value)

	function update() {

			const re = /^((https:\/\/leekwars\.com)?\/image\/|https:\/\/(i\.)?imgur\.com\/|https:\/\/(i\.)?ibb\.co\/)/

			DOMPurify.addHook('uponSanitizeElement', (node, data) => {
				if (data.tagName === 'img' && node instanceof Element) {
					const src = node.getAttribute('src')
					if (src && !re.test(src)) {
						node.remove()
					}
				}
			})

			const sanitized = DOMPurify.sanitize(markdownInstance.render(props.content), {
				ADD_TAGS: ['img', 'center'],
				ADD_ATTR: ['style', 'class', 'width', 'height', 'href', 'src', 'colspan', 'rowspan', 'alt', 'correct'],
				ALLOW_UNKNOWN_PROTOCOLS: false,
			})

			DOMPurify.removeHook('uponSanitizeElement')

			const newHtml = links(sanitized)
			// HTML identique (édit sans effet sur le rendu, ex. espace en fin de ligne) :
			// le v-html ne recrée pas le DOM, re-traiter formaterait une seconde fois
			// les blocs déjà formatés et re-monterait les sous-composants.
			if (newHtml === html.value) { return }
			html.value = newHtml

			summary = { children: [] }
			const stack: (SummaryNode | { children: SummaryNode[] })[] = [summary]

			nextTick(() => {
				const mdEl = md.value!
				// Rendu LaTeX inline ($...$) — fait avant la transformation des blocs
				// de code pour que le contenu des <code>/<pre> reste intact.
				renderMath(mdEl)
				mdEl.querySelectorAll('h1, h2, h3, h4, h5').forEach((item) => {
					const el = item as HTMLHeadingElement
					const level = parseInt(el.tagName.substring(1), 10)
					if (level >= 2) {
						const node: SummaryNode = { level, title: el.innerText, children: [] }
						const parent = stack[level - 2] || summary
						stack[level - 1] = node
						parent.children.push(node)
					}
					el.id = encodeID(el.innerText)
					if (level >= 2 && !item.querySelector('.heading-anchor')) {
						const anchor = document.createElement('a')
						anchor.className = 'heading-anchor'
						anchor.href = '#' + item.id
						const label = t('main.copy_section_link') as string
						anchor.setAttribute('aria-label', label)
						anchor.title = label
						anchor.textContent = '#'
						anchor.addEventListener('click', (e: MouseEvent) => {
							e.preventDefault()
							history.replaceState(null, '', '#' + item.id)
							scroll_to_hash('#' + item.id, route)
							if (navigator.clipboard) {
								const url = window.location.origin + window.location.pathname + '#' + item.id
								navigator.clipboard.writeText(url).catch(() => {})
							}
						})
						item.appendChild(anchor)
					}
				})
				mdEl.querySelectorAll('.encyclopedia-summary').forEach((item) => {
					const depth = parseInt(item.getAttribute('depth') || '3', 10)
					item.innerHTML = generateSummary(depth)
				})
				// Convertir les balises font MDI héritées (ancienne syntaxe) en SVG
				mdEl.querySelectorAll('i.mdi').forEach((item: Element) => {
					const iconClass = Array.from(item.classList).find(c => c !== 'mdi' && c.startsWith('mdi-'))
					if (!iconClass) return
					const path = mdiIcons[iconClass]
					if (!path) return
					const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
					svg.setAttribute('class', 'md-mdi-icon')
					svg.setAttribute('viewBox', '0 0 24 24')
					svg.setAttribute('aria-hidden', 'true')
					const style = (item as HTMLElement).getAttribute('style')
					if (style) svg.setAttribute('style', style)
					const pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path')
					pathEl.setAttribute('d', path)
					svg.appendChild(pathEl)
					item.replaceWith(svg)
				})
				mdEl.querySelectorAll('pre code').forEach((item) => {
					const content = ('' + item.textContent).trim()
					item.classList.add('multi')
					item.classList.add(resolveCodeThemeClass())
					// markdown-it pose une classe language-<lang> sur les blocs ```lang
					const langClass = Array.from(item.classList).find((c) => c.startsWith('language-'))
					const language = langClass ? langClass.slice('language-'.length) : undefined
					LeekWars.createCodeArea(content, item as HTMLElement, language)
				})
				mdEl.querySelectorAll('code:not(.multi)').forEach((item) => {
					const content = ('' + item.textContent).trim()
					item.classList.add(resolveCodeThemeClass())
					LeekWars.createCodeAreaSimple(content, item as HTMLElement)
				})

				const linkify = (a: HTMLAnchorElement) => {
					a.onclick = (e: Event) => {
						let link = a.getAttribute('href')
						if (!link) return
						if (link.startsWith('/') || link.startsWith(document.location.origin) || link.startsWith('https://leekwars.com/')) {
							if (link.startsWith('/encyclopedia/')) {
								link = link.replace(/ /g, '_')
							}
							router.push(link.replace(document.location.origin, '').replace('https://leekwars.com/', ''))
							e.stopPropagation()
							e.preventDefault()
							return false
						}
					}
				}
				mdEl.querySelectorAll('a').forEach(linkify)

				// Armes
				mdEl.querySelectorAll('.encyclopedia-weapon').forEach((item) => {
					const weapon = LeekWars.weaponByName[item.getAttribute('weapon')!]
					const weaponItem = weapon ? LeekWars.items[weapon.item] : null
					if (weaponItem) {
						const app = createSubApp(ItemPreview, { item: weaponItem }, 'encyclopedia-weapon')
						app.mount(item)
						components.push({ $destroy: () => app.unmount() })
					}
				})
				// Puces
				mdEl.querySelectorAll('.encyclopedia-chip').forEach((item) => {
					const chip = CHIP_BY_NAME[item.getAttribute('chip')!]
					const chipItem = chip ? LeekWars.items[chip.id] : null
					if (chipItem) {
						const app = createSubApp(ItemPreview, { item: chipItem }, 'encyclopedia-chip')
						app.mount(item)
						components.push({ $destroy: () => app.unmount() })
					}
				})
				// Potions
				mdEl.querySelectorAll('.encyclopedia-potion').forEach((item) => {
					const potion = LeekWars.potionByName[item.getAttribute('potion')!]
					const potionItem = potion ? LeekWars.items[potion.id] : null
					if (potionItem) {
						const app = createSubApp(ItemPreview, { item: potionItem }, 'encyclopedia-potion')
						app.mount(item)
						components.push({ $destroy: () => app.unmount() })
					}
				})
				const pageLink = (p: { title: string }) => '<a href="/encyclopedia/' + language.value + '/' + encodeURIComponent(p.title) + '">' + LeekWars.protect(p.title) + '</a>'
				const renderPageList = (selector: string, endpoint: string, tag: 'ul' | 'ol', row: (p: { title: string, name?: string, time?: number, views?: number }) => string) => {
					mdEl.querySelectorAll(selector).forEach((item) => {
						LeekWars.get<{ title: string, name?: string, time?: number, views?: number }[]>(endpoint).then(pages => {
							item.innerHTML = '<' + tag + '>' + pages.map(row).join('') + '</' + tag + '>'
							item.querySelectorAll('a').forEach(linkify)
						})
					})
				}
				renderPageList('.encyclopedia-locked-pages', 'encyclopedia/get-locked-pages', 'ul',
					p => '<li>' + pageLink(p) + ', verrouillée par <b>' + LeekWars.protect(p.name ?? '') + '</b></li>')
				renderPageList('.encyclopedia-last-modifications', 'encyclopedia/get-last-pages/' + language.value, 'ul',
					p => '<li>' + pageLink(p) + ', <b>' + LeekWars.protect(p.name ?? '') + '</b> ' + LeekWars.formatDuration(p.time ?? 0) + '</li>')
				renderPageList('.encyclopedia-most-viewed', 'encyclopedia/get-most-viewed/' + language.value, 'ol',
					p => '<li>' + pageLink(p) + ' — ' + LeekWars.formatNumber(p.views ?? 0) + ' views</li>')
				// LoS
				mdEl.querySelectorAll('.encyclopedia-los').forEach((item) => {
					const app = createSubApp(LineOfSight, undefined, 'encyclopedia-los')
					app.mount(item)
					components.push({ $destroy: () => app.unmount() })
				})
				// Search bar
				mdEl.querySelectorAll('.encyclopedia-search-bar').forEach((item) => {
					const app = createSubApp(SearchBar, undefined, 'encyclopedia-search-bar').component('loader', LWLoader)
					app.mount(item)
					components.push({ $destroy: () => app.unmount() })
				})
				// Tutorial menu
				mdEl.querySelectorAll('.tutorial-menu').forEach((item) => {
					const app = createSubApp(TutorialMenu, { locale: props.locale }, 'tutorial-menu')
					app.mount(item)
					components.push({ $destroy: () => app.unmount() })
				})
				// Tutorial progress
				mdEl.querySelectorAll('.tutorial-progress').forEach((item) => {
					const app = createSubApp(TutorialProgress, { locale: props.locale }, 'tutorial-progress')
					app.mount(item)
					components.push({ $destroy: () => app.unmount() })
				})
				// Tutorial quizz
				mdEl.querySelectorAll('.quizz').forEach((item) => {
					let chapter = 0
					item.classList.forEach(c => {
						if (c.startsWith('chapter-')) {
							chapter = parseInt(c.substring(8))
						}
					})

					// Désactivé si pas le chapitre N + 1
					if (store.state.farmer && chapter !== store.state.farmer.tutorial_progress + 1) {
						item.querySelectorAll('ul').forEach((answers) => {
							[...answers.children].forEach(child => child.classList.add('disabled'))
						})
					}

					const completed = store.state.farmer && store.state.farmer.tutorial_progress >= chapter
					let submitContainer: HTMLElement | null = null
					const set_finished = () => {
						if (submitContainer) submitContainer.style.display = 'none'
						item.querySelectorAll('ul').forEach((answers) => {
							[...answers.children].forEach(child => child.classList.add('disabled'))
						})
						const lock = mdEl.querySelector('.lock')
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
					const btnApp = createSubApp(BtnWrapper, undefined, 'tutorial-quiz-btn')
					btnApp.mount(submitContainer)
					components.push({ $destroy: () => btnApp.unmount() })

					item.querySelectorAll('ul').forEach(answers => {
						;[...answers.children].forEach((child, index) => {
							child.setAttribute('index', '' + index)
						})
						answers.append(...Array.from(answers.children).sort((_a, _b) => {
							return Math.random() - 0.5
						}))
						let answer = Array(answers.children.length).fill(false)
						form.push(answer)
						;[...answers.children].forEach((child, index) => {
							const letter = document.createElement('span')
							letter.innerText = String.fromCodePoint(65 + index) + ". "
							letter.classList.add("letter")
							child.prepend(letter)

							const checkboxContainer = document.createElement('span')
							checkboxContainer.className = 'quiz-checkbox'
							child.prepend(checkboxContainer)
							answer[index] = completed && child.hasAttribute('correct')
							const checked = ref(answer[index])

							const CheckboxWrapper = defineComponent({
								setup() {
									// eslint-disable-next-line @typescript-eslint/no-explicit-any
							return () => h(VCheckbox as any, {
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

							const checkboxApp = createSubApp(CheckboxWrapper, undefined, 'tutorial-quiz-checkbox')
							checkboxApp.mount(checkboxContainer)
							components.push({ $destroy: () => checkboxApp.unmount() })

							child.addEventListener('click', (e: Event) => {
								if (checkboxContainer.contains(e.target as Node)) return
								checked.value = !checked.value
								answer[index] = checked.value
								updateBtnState()
							})
						})
					})
					// Déjà réussi ?
					if (store.state.farmer && store.state.farmer.tutorial_progress >= chapter) {
						set_finished()
						item.querySelectorAll('ul').forEach((answers) => {
							[...answers.children].forEach(child => {
								if (child.hasAttribute('correct')) {
									child.classList.add('correct')
								}
							})
						})
					}
				})

				// Leeky
				mdEl.querySelectorAll('.leeky').forEach((item) => {
					const app = createSubApp(LeekImage, { leek: { level: 10, face: 1 }, scale: 0.55 }, 'md-leeky')
					app.mount(item)
					components.push({ $destroy: () => app.unmount() })
				})
				// Domingo
				mdEl.querySelectorAll('.domingo').forEach((item) => {
					const app = createSubApp(LeekImage, { leek: { level: 301, face: 2, metal: true, skin: 9 }, scale: 0.45 }, 'md-domingo')
					app.mount(item)
					components.push({ $destroy: () => app.unmount() })
				})
				// Aliases - affichage discret
				mdEl.querySelectorAll('.aliases-display').forEach(el => el.remove())
				const aliasElements = mdEl.querySelectorAll('.encyclopedia-alias')
				if (aliasElements.length > 0) {
					const aliases = Array.from(aliasElements).map(el => el.getAttribute('data-alias')!).filter(Boolean)
					if (aliases.length > 0) {
						const container = document.createElement('div')
						container.className = 'aliases-display'
						container.textContent = i18n.t('encyclopedia.aliases', [aliases.join(', ')]) as string
						const h1 = mdEl.querySelector('h1')
						if (h1 && h1.nextSibling) {
							h1.parentNode!.insertBefore(container, h1.nextSibling)
						} else {
							mdEl.prepend(container)
						}
					}
				}
				emit('rendered')
			})
		}

	watch(() => props.content, update, { immediate: true })

	function links(html: string) {
			// links() runs on HTML already cleaned by DOMPurify and its output goes
			// straight to v-html, so every user-controlled substring injected here
			// must be HTML-escaped (for text nodes) or strictly validated
			// (for attribute values / known lookups).
			const itemName = /^[a-z0-9_]+$/
			return html.replace(/\[\[(.*?)\]\]/g, (_m, link) => {
				link = link.trim()
				const parts = link.split('|', 2)
				link = parts[0]
				const alias = parts.length === 2 ? parts[1] : link
				const page = LeekWars.encyclopedia[language.value] ? LeekWars.encyclopedia[language.value][link.toLowerCase().replace(/_/g, ' ')] : null
				const clazz = page ? "" : "new"
				const target = page ? page.title.replace(/ /g, '_') : link.replace(/_/g, ' ')
				const href = '/encyclopedia/' + language.value + '/' + encodeURIComponent(target)
				return "<a href='" + href + "' class='" + clazz + "'>" + LeekWars.protect(alias) + "</a>"
			}).replace(/{{(.*?)}}/g, (_m, tag) => {
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
						if (!itemName.test(weapon)) return '{{ ' + tag + ' }}'
						return "<div class='encyclopedia-weapon' weapon='" + weapon + "'></div>"
					}
				} else if (tag.startsWith('chip')) {
					const parts = tag.split(':')
					if (parts.length > 1) {
						const chip = parts[1].trim().toLowerCase()
						if (!itemName.test(chip)) return '{{ ' + tag + ' }}'
						return "<div class='encyclopedia-chip' chip='" + chip + "'></div>"
					}
				} else if (tag.startsWith('potion')) {
					const parts = tag.split(':')
					if (parts.length > 1) {
						const potion = parts[1].trim().toLowerCase()
						if (!itemName.test(potion)) return '{{ ' + tag + ' }}'
						return "<div class='encyclopedia-potion' potion='" + potion + "'></div>"
					}
				} else if (tag.startsWith('locked-pages')) {
					return "<div class='encyclopedia-locked-pages'></div>"
				} else if (tag.startsWith('last-modifications')) {
					return "<div class='encyclopedia-last-modifications'></div>"
				} else if (tag.startsWith('most-viewed')) {
					return "<div class='encyclopedia-most-viewed'></div>"
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
						return "<div class='lock " + locked + "'>" + i18n.t('encyclopedia.locked') + "</div>"
					}
				} else if (tag.startsWith('alias')) {
					const parts = originalTag.split(':')
					if (parts.length > 1) {
						const alias = parts[1].trim()
						return "<span class='encyclopedia-alias' data-alias='" + LeekWars.protect(alias) + "'></span>"
					}
				} else if (tag.startsWith('leeky')) {
					return "<div class='leeky'></div>"
				}
				return '{{ ' + tag + ' }}'
			})
		}

	// Rend les expressions LaTeX inline délimitées par des $ ($x^2$), en
	// n'opérant que sur les nœuds texte (les listeners et sous-composants déjà
	// montés ne sont jamais touchés) et en ignorant le contenu des blocs de code.
	// On écrit $$ pour afficher un $ littéral (utile pour documenter la syntaxe).
	const MATH_RE = /\$\$|\$([^$\s](?:[^$]*[^$\s])?)\$/g
	function renderMath(root: HTMLElement) {
		const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
			acceptNode(node) {
				let p = node.parentElement
				while (p && p !== root) {
					const tag = p.tagName
					if (tag === 'CODE' || tag === 'PRE' || tag === 'LATEX') return NodeFilter.FILTER_REJECT
					p = p.parentElement
				}
				return (node.nodeValue && node.nodeValue.indexOf('$') !== -1) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT
			}
		})
		const targets: Text[] = []
		let n: Node | null
		while ((n = walker.nextNode())) targets.push(n as Text)

		for (const textNode of targets) {
			const text = textNode.nodeValue || ''
			MATH_RE.lastIndex = 0
			const frag = document.createDocumentFragment()
			let last = 0
			let m: RegExpExecArray | null
			while ((m = MATH_RE.exec(text)) !== null) {
				if (m.index > last) frag.appendChild(document.createTextNode(text.slice(last, m.index)))
				if (m[0] === '$$') {
					frag.appendChild(document.createTextNode('$'))
				} else {
					const el = document.createElement('latex')
					el.textContent = m[1]
					frag.appendChild(el)
					Latex.latexify('$' + m[1] + '$').then(result => { el.innerHTML = result })
				}
				last = m.index + m[0].length
			}
			if (last === 0) continue // aucune correspondance : on laisse le nœud texte intact
			if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)))
			textNode.parentNode!.replaceChild(frag, textNode)
		}
	}

	function generateSummary(depth: number) {
		const aux = (node: SummaryNode, d: number): string => {
			let r = '<li><a href="#' + encodeURIComponent(encodeURL(node.title)) + '">' + LeekWars.protect(node.title) + '</a></li>'
			if (d > 0 && node.children.length) {
				r += '<ul>' + node.children.map((n: SummaryNode) => aux(n, d - 1)).join('') + '</ul>'
			}
			return r
		}
		return '<ul class="summary">'
			+ summary.children.map((n: SummaryNode) => aux(n, depth - 2)).join('')
			+ '</ul>'
	}

	function destroyComponents() {
		for (const component of components) {
			component.$destroy()
		}
		components = []
	}

	onBeforeUpdate(destroyComponents)
	onBeforeUnmount(destroyComponents)
</script>

<style lang="scss" scoped>
	.md {
		padding: 15px;
	}
	.md :deep(.md-mdi-icon) {
		width: 1em;
		height: 1em;
		fill: currentColor;
		vertical-align: middle;
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
		color: var(--link-color);
		font-weight: 500;
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
			color: var(--text-color-secondary);
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
					color: var(--text-color-secondary);
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
	.md :deep(h1), .md :deep(h2), .md :deep(h3), .md :deep(h4), .md :deep(h5) {
		.heading-anchor {
			display: inline-block;
			margin-left: 6px;
			color: var(--text-color-secondary);
			font-weight: normal;
			opacity: 0;
			transition: opacity 0.15s;
			text-decoration: none;
			cursor: pointer;
		}
		&:hover .heading-anchor {
			opacity: 0.6;
		}
		.heading-anchor:hover {
			opacity: 1;
			text-decoration: none;
			color: var(--link-color);
		}
	}
	.md :deep(.aliases-display) {
		font-size: 13px;
		color: var(--text-color-secondary);
		font-style: italic;
		margin-bottom: 10px;
	}
</style>