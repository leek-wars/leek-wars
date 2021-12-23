<template>
	<v-menu v-model="value" :close-on-content-click="false" :min-width="280" offset-overflow :nudge-top="0" :open-delay="_open_delay" :close-delay="_close_delay" :top="!bottom" :bottom="bottom" transition="none" :open-on-hover="!locked" offset-y :nudge-right="nodge ? 20 : 0" @input="$emit('input', $event)">
		<template v-slot:activator="{ on }">
			<slot :on="on"></slot>
		</template>
		<div class="card" @mouseenter="mouse = true" @mouseleave="mouse = false">
			<item-preview :item="item" :quantity="quantity" :inventory="inventory" @input="setParent" />
		</div>
	</v-menu>
</template>

<script lang="ts">
	import { Component, Prop, Vue } from 'vue-property-decorator'
	import ItemPreview from '@/component/market/item-preview.vue'
import { LeekWars } from '@/model/leekwars'

	@Component({ components: { ItemPreview } })
	export default class RichTooltipItem extends Vue {
		@Prop() item!: any
		@Prop() quantity!: number
		@Prop() bottom!: boolean
		@Prop() instant!: boolean
		@Prop() nodge!: boolean
		@Prop() inventory!: boolean
		locked: boolean = false
		mouse: boolean = false
		value: boolean = false

		get _open_delay() {
			return this.instant || LeekWars.mobile ? 0 : 500
		}
		get _close_delay() {
			return this.instant ? 0 : 0
		}

		setParent(event: boolean) {
			this.locked = event
			if (!event && !this.mouse) {
				this.value = false
				this.$emit('input', false)
			}
		}
	}
</script>

<style lang="scss" scoped>
.v-menu__content.theme--light {
	background: none;
}
.card {
	width: 280px;
	background: none;
}
.stats {
	text-align: center;
}
.stats > div {
	padding: 4px;
}
.stats > div:nth-child(2n+1) {
	background-color: white;
}
.stats > div:nth-child(2n) {
	background-color: #f2f2f2;
}
</style>