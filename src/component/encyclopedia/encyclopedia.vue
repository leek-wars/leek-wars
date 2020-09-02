<template lang="html">
	<div>
		<div class="page-bar page-header">
			<h1>{{ title }}</h1>
			<div class="tabs">
				<router-link :to="'/encyclopedia/' + english">
					<div class="tab">English</div>
				</router-link>
			</div>
		</div>
		<panel class="first encyclopedia">
			<markdown :content="content" :wiki-pages="wiki" />
		</panel>
	</div>
</template>

<script lang="ts">
	import Markdown from '@/component/encyclopedia/markdown.vue'
	import { defaultWiki } from '@/locale'
	import { LeekWars } from '@/model/leekwars'
	import { Component, Vue, Watch } from 'vue-property-decorator'

	@Component({ name: 'encyclopedia', i18n: {}, components: { Markdown } })
	export default class Encyclopedia extends Vue {
		wiki = defaultWiki
		content: string = ''
		english: string = ''
		get title() {
			return this.$route.params.page.replace(/_/g, ' ')
		}
		@Watch('$route.params.page', {immediate: true})
		upadte() {
			LeekWars.setTitle(this.title)
			const page = this.$route.params.page
			if (page in defaultWiki) {
				this.content = defaultWiki[page].content
				this.english = defaultWiki[page].versions.en
			}
		}
	}
</script>

<style lang="scss" scoped>

</style>