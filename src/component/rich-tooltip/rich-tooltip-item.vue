<template>
	<v-menu v-model="value" :close-on-content-click="false" :min-width="280" :max-height="maxHeight" :location="openBottom ? 'bottom' : 'top'" :origin="openBottom ? 'top' : 'bottom'" :offset="nodge ? [0, 20] : 0" :open-delay="_open_delay" :close-delay="_close_delay" :transition="instant ? 'none' : 'scale-transition'" :open-on-hover="!locked" :disabled="disabled" :content-class="'rich-item-tooltip-menu'" :content-props="{ style: 'max-height:' + maxHeight + 'px' }" @update:model-value="onToggle">
		<template #activator="{ props }">
			<span v-bind="props" @pointerenter="onHover" @mouseenter="onHover" @focus="onHover">
				<slot></slot>
			</span>
		</template>
		<div class="card" :style="{ maxHeight: maxHeight + 'px' }" @mouseenter="mouse = true" @mouseleave="mouse = false">
			<item-preview :item="item" :quantity="quantity" :inventory="inventory" :leek="leek" :craft-cost="craftCost" @update:modelValue="setParent" @retrieve="$emit('retrieve', $event)" />
		</div>
	</v-menu>
</template>

<script lang="ts">
	import { Options, Prop, Vue } from 'vue-property-decorator'
	import ItemPreview from '@/component/market/item-preview.vue'
	import { LeekWars } from '@/model/leekwars'
	import { Leek } from '@/model/leek'
	import { emitter } from '@/model/vue'

	@Options({ name: 'rich-tooltip-item', components: {
		'item-preview': ItemPreview
	}, emits: ['update:modelValue', 'retrieve'] })
	export default class RichTooltipItem extends Vue {
		@Prop() item!: any
		@Prop() quantity!: number
		@Prop() bottom!: boolean
		@Prop() instant!: boolean
		@Prop() nodge!: boolean
		@Prop() inventory!: boolean
		@Prop() openDelay!: number
		@Prop() leek!: Leek
		@Prop({ default: 0 }) craftCost!: number
		locked: boolean = false
		mouse: boolean = false
		value: boolean = false
		disabled: boolean = false
		maxHeight: number = 600
		openBottom: boolean = true
		activatorEl: HTMLElement | null = null

		get _open_delay() {
			return this.instant || LeekWars.mobile ? 1 : (this.openDelay || 500)
		}
		get _close_delay() {
			return 1
		}

		onHover(e: Event) {
			const el = e.currentTarget as HTMLElement | null
			if (el) this.activatorEl = el
			this.computeBounds()
		}

		computeBounds() {
			const el = this.activatorEl
			if (!el) return
			const rect = el.getBoundingClientRect()
			const vh = window.innerHeight
			const padding = 16
			const spaceBelow = vh - rect.bottom - padding
			const spaceAbove = rect.top - padding
			const preferBottom = this.bottom !== false
			const prefSpace = preferBottom ? spaceBelow : spaceAbove
			const altSpace = preferBottom ? spaceAbove : spaceBelow
			if (prefSpace >= 300 || prefSpace >= altSpace) {
				this.openBottom = preferBottom
				this.maxHeight = Math.max(200, prefSpace)
			} else {
				this.openBottom = !preferBottom
				this.maxHeight = Math.max(200, altSpace)
			}
		}

		onToggle(opened: boolean) {
			if (opened) this.computeBounds()
		}

		setParent(event: boolean) {
			this.locked = event
			if (!event && !this.mouse) {
				this.value = false
				this.$emit('update:modelValue', false)
			}
		}

		close() {
			this.value = false
			this.locked = false
			this.disabled = true
			setTimeout(() => this.disabled = false, 500)
		}

		mounted() {
			emitter.on('craft', this.close)
			emitter.on('clover-used', this.close)
		}
		beforeUnmount() {
			emitter.off('craft', this.close)
			emitter.off('clover-used', this.close)
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
	overflow-y: auto;
	overscroll-behavior: contain;
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