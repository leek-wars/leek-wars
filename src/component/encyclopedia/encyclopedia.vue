<template lang="html">
	<div>
		<div class="page-bar page-header">
			<h1>{{ page }}</h1>
		</div>
		<div class="first panel">
			<div class="content">
				{{ content }}
			</div>
		</div>
	</div>
</template>

<script lang="ts">
	import { LeekWars } from '@/model/leekwars'
	import ENCYCLOPEDIA from '@/wiki/index.wiki'
	import { Component, Vue, Watch } from 'vue-property-decorator'
	
	@Component({ name: 'encyclopedia', i18n: {} })
	export default class Encyclopedia extends Vue {
		content: string = ''
		get page() {
			return this.$route.params.page
		}
		@Watch('page')
		created() {
			LeekWars.setTitle(this.page)
			this.content = ENCYCLOPEDIA[this.page]
		}
	}
</script>

<style lang="scss" scoped>

</style>