<template>
	<div ref="md" class="md" v-html="html"></div>
</template>

<script lang="ts">
	import { LeekWars } from '@/model/leekwars'
	import markdown from 'markdown-it'
	import { Component, Prop, Vue, Watch } from 'vue-property-decorator'

	@Component({ name: 'markdown' })
	export default class Markdown extends Vue {
		@Prop({required: true}) content!: string
		@Prop() wikiPages!: any
		markdown: any = new markdown()
		html: string = ''

		@Watch('content', {immediate: true})
		update() {
			this.html = this.links(this.markdown.render(this.content))
			// this.html = this.markdown(this.content)
			Vue.nextTick(() => {
				(this.$refs.md as HTMLElement).querySelectorAll('code').forEach((item) => {
					const content = ('' + item.textContent).trim()
					LeekWars.createCodeArea(content, item as HTMLElement)
				})
				;(this.$refs.md as HTMLElement).querySelectorAll('a').forEach((a: any) => {
					a.onclick = (e: Event) => {
						e.stopPropagation()
						e.preventDefault()
						this.$router.push(a.getAttribute('href'))
						return false
					}
				})
			})
		}

		links(html: string) {
			return html.replace(/\[\[(.*?)\]\]/g, (m, link) => {
				const clazz = (this.wikiPages && link in this.wikiPages) ? "" : "new"
				const text = link.replace(/_/g, ' ')
				return "<a href='/encyclopedia/" + link + "' class='" + clazz + "'>" + text + "</a>"
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
	.md /deep/ p {
		color: #252525;
		font-size: 16px;
		line-height: 1.6;
	}
	.md /deep/ h2 {
		color: #000;
		margin-top: 1em;
		padding-bottom: 6px;
		border-bottom: 1px solid #aaa;
	}
	.md /deep/ img {
		max-width: 100%;
	}
	.md /deep/ a {
		color: #0645ad;
	}
	.md /deep/ a.new {
		color: #ba0000;
	}
	.md /deep/ a:hover {
		text-decoration: underline;
	}
</style>