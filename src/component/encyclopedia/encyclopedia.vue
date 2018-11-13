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
		<div class="first last panel">
			<div class="content encyclopedia">
				<markdown :content="content" :wiki-pages="wiki" />
			</div>
		</div>
	</div>
</template>

<script lang="ts">
	import { defaultWiki } from '@/locale'
	import { LeekWars } from '@/model/leekwars'
	import { Component, Vue, Watch } from 'vue-property-decorator'
	
	@Component({ name: 'encyclopedia', i18n: {} })
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