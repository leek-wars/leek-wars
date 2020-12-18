<template>
	<div ref="md" class="md" v-html="html"></div>
</template>

<script lang="ts">
	import { i18n } from '@/model/i18n'
	import { LeekWars } from '@/model/leekwars'
	import { Weapon } from '@/model/weapon'
	import markdown from 'markdown-it'
	import sanitizeHtml from 'sanitize-html'
	import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
	import ChipPreview from '../market/chip-preview.vue'
	import PotionPreview from '../market/potion-preview.vue'
	import WeaponPreview from '../market/weapon-preview.vue'

	@Component({ name: 'markdown' })
	export default class Markdown extends Vue {
		@Prop({required: true}) content!: string
		markdown: any = new markdown({
			html: true,
			breaks: true,
			linkify: true,
		})
		html: string = ''
		summary: any = {}

		encodeURL = (s: string) => s.trim().replace(/\s+/g, '_')
		encodeID = (s: string) => s.trim().replace(/\s+/g, '_').replace(/'/g, '~')

		@Watch('content', {immediate: true})
		update() {

			sanitizeHtml.defaults.allowedAttributes['*'] = ['style', 'class']
			this.html = this.links(sanitizeHtml(this.markdown.render(this.content), {
				allowedTags: sanitizeHtml.defaults.allowedTags.concat([ 'img', 'center' ])
			}))

			this.summary = {children: []}
			const stack = [this.summary] as any[]

			Vue.nextTick(() => {
				const markdown = this.$refs.md as HTMLElement
				markdown.querySelectorAll('h1, h2, h3, h4, h5').forEach((item: any) => {
					const level = parseInt(item.tagName.substring(1), 10)
					if (level >= 2) {
						// console.log("element", level, item)
						const node = {level: level, title: item.innerText, children: []}
						const parent = stack[level - 2] || this.summary
						stack[level - 1] = node
						parent.children.push(node)
					}
					item.id = this.encodeID(item.innerText)
				})
				markdown.querySelectorAll('.encyclopedia-summary').forEach((item) => {
					const depth = parseInt(item.getAttribute('depth') || '3', 10)
					item.innerHTML = this.generateSummary(depth)
				})
				markdown.querySelectorAll('pre code').forEach((item) => {
					const content = ('' + item.textContent).trim()
					item.classList.add('multi')
					LeekWars.createCodeArea(content, item as HTMLElement)
				})
				markdown.querySelectorAll('code:not(.multi)').forEach((item) => {
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
				markdown.querySelectorAll('a').forEach(linkify)

				// Armes
				markdown.querySelectorAll('.encyclopedia-weapon').forEach((item) => {
					const weapon = LeekWars.weaponByName[item.getAttribute('weapon')!]
					if (weapon) {
						new WeaponPreview({ propsData: { weapon }, i18n }).$mount(item)
					}
				})
				// Puces
				markdown.querySelectorAll('.encyclopedia-chip').forEach((item) => {
					const chip = LeekWars.chipByName[item.getAttribute('chip')!]
					if (chip) {
						new ChipPreview({ propsData: { chip }, i18n }).$mount(item)
					}
				})
				// Potions
				markdown.querySelectorAll('.encyclopedia-potion').forEach((item) => {
					const potion = LeekWars.potionByName[item.getAttribute('potion')!]
					if (potion) {
						new PotionPreview({ propsData: { potion }, i18n }).$mount(item)
					}
				})
				// Locked pages
				markdown.querySelectorAll('.encyclopedia-locked-pages').forEach((item) => {
					LeekWars.post<any[]>('encyclopedia/get-locked-pages').then(pages => {
						item.innerHTML = '<ul>' + pages.map(p => '<li><a href="/encyclopedia/' + p.title + '">' + p.title + '</a>, verrouillée par <b>' + p.name + '</b></li>').join('') + '</ul>'
						item.querySelectorAll('a').forEach(linkify)
					})
				})
				// Last edited pages
				markdown.querySelectorAll('.encyclopedia-last-modifications').forEach((item) => {
					LeekWars.post<any[]>('encyclopedia/get-last-pages').then(pages => {
						item.innerHTML = '<ul>' + pages.map(p => '<li><a href="/encyclopedia/' + p.title + '">' + p.title + '</a>, par <b>' + p.name + '</b> ' + LeekWars.formatDuration(p.time) + '</li>').join('') + '</ul>'
						item.querySelectorAll('a').forEach(linkify)
					})
				})
			})
		}

		links(html: string) {
			return html.replace(/\[\[(.*?)\]\]/g, (m, link) => {
				link = link.trim()
				const clazz = (LeekWars.isEmptyObj(LeekWars.encyclopedia) || (link in LeekWars.encyclopedia)) ? "" : "new"
				const text = link.replace(/_/g, ' ')
				return "<a href='/encyclopedia/" + link.replace(/ /g, '_') + "' class='" + clazz + "'>" + text + "</a>"
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
	}
</script>

<style lang="scss" scoped>
	.md {
		padding: 15px;
	}
	.md ::v-deep p {
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
	.md ::v-deep ul {
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
</style>