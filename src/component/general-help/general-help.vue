<template lang="html">

</template>

<script lang="ts">
	import { locale } from '@/locale'
	import { Options, Vue } from 'vue-property-decorator'

	@Options({ name: "general_help" })
	export default class GeneralHelp extends Vue {
		created() {
			this.$router.replace('/encyclopedia/' + locale + '/' + (this.$t('main.game_rules') as string).replace(/ /g, '_'))
		}
	}
</script>

<style lang="scss" scoped>

</style>