<template>
	<v-menu :close-on-content-click="false" :min-width="300" offset-overflow :nudge-top="bottom ? 0 : 6" :open-delay="_open_delay" :close-delay="_close_delay" :top="!bottom" :bottom="bottom" transition="none" open-on-hover offset-y :nudge-right="0" @input="$emit('input', $event)">
		<template v-slot:activator="{ on }">
			<slot :on="on"></slot>
		</template>
		<div class="card">
			<hat-preview :hat="hat" />
		</div>
	</v-menu>
</template>

<script lang="ts">
	import HatPreview from '@/component/market/hat-preview.vue'
	import { HatTemplate } from '@/model/hat'
	import { Component, Prop, Vue, Watch } from 'vue-property-decorator'

	@Component({ components: { HatPreview } })
	export default class RichTooltipPotion extends Vue {
		@Prop({required: true}) hat!: HatTemplate
		@Prop() bottom!: boolean
		@Prop() instant!: boolean

		get _open_delay() {
			return this.instant ? 0 : 500
		}
		get _close_delay() {
			return this.instant ? 0 : 0
		}

	}
</script>

<style lang="scss" scoped>
	.card {
		width: 300px;
		background: #eee;
	}
</style>