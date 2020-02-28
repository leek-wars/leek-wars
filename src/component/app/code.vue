<template>
	<div></div>
</template>

<script lang="ts">
	import { LeekWars } from '@/model/leekwars'
	import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
	@Component({ name: 'lw-code' })
	export default class Code extends Vue {
		@Prop({required: true}) code!: string
		@Prop() single!: boolean
		@Watch('code', {immediate: true})
		@Watch('simple', {immediate: true})
		update() {
			this.$nextTick(() => {
				if (this.single) {
					LeekWars.createCodeAreaSimple(this.code, this.$el as HTMLElement)
				} else {
					LeekWars.createCodeArea(this.code, this.$el as HTMLElement)
				}
			})
		}
	}
</script>