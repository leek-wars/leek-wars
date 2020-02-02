<template>
	<v-menu :close-on-content-click="false" :min-width="280" :nudge-top="bottom ? 0 : 6" :open-delay="_open_delay" :close-delay="_close_delay" :top="!bottom" :bottom="bottom" transition="none" open-on-hover offset-y>
		<template v-slot:activator="{ on }">
			<slot :on="on"></slot>
		</template>
		<div class="card">
			<weapon-preview :weapon="weapon" />
		</div>
	</v-menu>
</template>

<script lang="ts">
	import WeaponPreview from '@/component/market/weapon-preview.vue'
	import { WeaponTemplate } from '@/model/weapon'
	import { Component, Prop, Vue, Watch } from 'vue-property-decorator'

	@Component({ components: { WeaponPreview } })
	export default class RichTooltipWeapon extends Vue {
		@Prop({required: true}) weapon!: WeaponTemplate
		@Prop() bottom!: boolean
		@Prop() instant!: boolean

		get _open_delay() {
			return this.instant ? 0 : 200
		}
		get _close_delay() {
			return this.instant ? 0 : 200
		}
	}
</script>

<style lang="scss" scoped>
	.card {
		width: 280px;
		background: #eee;
	}
</style>