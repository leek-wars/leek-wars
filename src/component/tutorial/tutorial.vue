<template>
	<div class="page tutorial">

	</div>
</template>

<script lang="ts">
	import { locale } from '@/locale'
	import { Component, Vue } from 'vue-property-decorator'

	@Component({ name: 'tutorial', i18n: {} })
	export default class Tutorial extends Vue {
		created() {
			this.$router.replace('/encyclopedia/' + locale + '/' + (this.$t('main.tutorial') as string).replace(/ /g, '_'))
		}
	}
</script>

<style lang="scss" scoped>

</style>
