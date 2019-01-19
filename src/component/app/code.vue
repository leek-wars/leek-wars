<template>
	<div></div>
</template>

<script lang="ts">
	import { LeekWars } from '@/model/leekwars'
	import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
	@Component({ name: 'lw-code' })
	export default class Code extends Vue {
		@Prop({required: true}) code!: string
		@Watch('code', {immediate: true})
		update() {
			this.$nextTick(() => {
				LeekWars.createCodeArea(this.code, this.$el as HTMLElement)
			})
		}
	}
</script>