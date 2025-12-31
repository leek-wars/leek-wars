<template>
	<div class="page">
		<div class="page-header page-bar">
			<h1>{{ $t('main.console') }}</h1>
		</div>
		<div>
			<console ref="console" />
		</div>
	</div>
</template>

<script lang="ts">
	import { mixins } from '@/model/i18n'
	import { LeekWars } from '@/model/leekwars'
	import { Options, Vue } from 'vue-property-decorator'
	import { store } from '@/model/store'
	import Console from '../app/console.vue'

	@Options({ name: 'console-page', components: {
		Console
	} })
	export default class ConsolePage extends Vue {

		created() {
			LeekWars.setTitle(this.$t('main.console'))
			LeekWars.setActions([
				{icon: 'mdi-weather-night', click: () => (this.$refs.console as any).toggleTheme()}
			])
		}
	}
</script>

<style lang="scss" scoped>

</style>