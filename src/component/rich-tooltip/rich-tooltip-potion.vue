<template>
	<v-menu :close-on-content-click="false" :min-width="280" offset-overflow :nudge-top="bottom ? 0 : 6" :open-delay="_open_delay" :close-delay="_close_delay" :top="!bottom" :bottom="bottom" transition="none" open-on-hover offset-y :nudge-right="0" @input="$emit('input', $event)">
		<template v-slot:activator="{ on }">
			<slot :on="on"></slot>
		</template>
		<div class="card">
			<potion-preview :potion="potion" />
		</div>
	</v-menu>
</template>

<script lang="ts">
	import PotionPreview from '@/component/market/potion-preview.vue'
	import { PotionTemplate } from '@/model/potion'
	import { Component, Prop, Vue, Watch } from 'vue-property-decorator'

	@Component({ components: { PotionPreview } })
	export default class RichTooltipPotion extends Vue {
		@Prop({required: true}) potion!: PotionTemplate
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
		width: 280px;
		// background: #eee;
	}
</style>