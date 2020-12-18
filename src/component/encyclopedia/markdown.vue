<template>
	<div ref="md" class="md" v-html="html"></div>
</template>

<script lang="ts">
	import { LeekWars } from '@/model/leekwars'
	import markdown from 'markdown-it'
	import sanitizeHtml from 'sanitize-html'
	import { Component, Prop, Vue, Watch } from 'vue-property-decorator'

	@Component({ name: 'markdown' })
	export default class Markdown extends Vue {
		@Prop({required: true}) content!: string
		markdown: any = new markdown({
			html: true,
			breaks: true,
			linkify: true,
		})
		html: string = ''

		@Watch('content', {immediate: true})
		update() {

			sanitizeHtml.defaults.allowedAttributes['*'] = ['style', 'class']
			this.html = this.links(sanitizeHtml(this.markdown.render(this.content), {
				allowedTags: sanitizeHtml.defaults.allowedTags.concat([ 'img', 'center' ])
			}))

			Vue.nextTick(() => {
				(this.$refs.md as HTMLElement).querySelectorAll('pre code').forEach((item) => {
					const content = ('' + item.textContent).trim()
					item.classList.add('multi')
					LeekWars.createCodeArea(content, item as HTMLElement)
				})
				;(this.$refs.md as HTMLElement).querySelectorAll('code:not(.multi)').forEach((item) => {
					const content = ('' + item.textContent).trim()
					LeekWars.createCodeAreaSimple(content, item as HTMLElement)
				})
				;(this.$refs.md as HTMLElement).querySelectorAll('a').forEach((a: any) => {
					a.onclick = (e: Event) => {
						let link = a.getAttribute('href')
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
				})
			})
		}

		links(html: string) {
			return html.replace(/\[\[(.*?)\]\]/g, (m, link) => {
				link = link.trim()
				const clazz = (LeekWars.isEmptyObj(LeekWars.encyclopedia) || (link in LeekWars.encyclopedia)) ? "" : "new"
				const text = link.replace(/_/g, ' ')
				return "<a href='/encyclopedia/" + link.replace(/ /g, '_') + "' class='" + clazz + "'>" + text + "</a>"
			})
		}

		// markdown(text: string) {
		// 	text = text.replace(/^\w*(#+)(.*?)$/gm, (m, hash, title) => {
		// 		const l = hash.length
		// 		return '<h' + l + '>' + title + '</h' + l + '>'
		// 	})
		// 	text = text.replace(/\n/gm, '<br>')
		// 	return text
		// }
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
	.md ::v-deep h1:first-child {
		display: none;
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
</style>