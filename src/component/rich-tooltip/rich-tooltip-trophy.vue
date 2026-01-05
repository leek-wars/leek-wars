<template>
	<v-menu v-model="value" :close-on-content-click="false" :width="280" offset-overflow :nudge-top="0" :open-delay="_open_delay" :close-delay="_close_delay" :top="!bottom" transition="none" :bottom="bottom" :open-on-hover="!locked" offset-y>
		<template v-slot:activator="{ props }">
			<span v-bind="props">
				<slot></slot>
			</span>
		</template>
		<div class="card" @mouseenter="mouse = true" @mouseleave="mouse = false">
			<trophy ref="preview" :trophy="trophy" @update:model-value="setParent" />
		</div>
	</v-menu>
</template>

<script lang="ts">
	import Trophy from '@/component/trophies/trophy.vue'
	import { Options, Prop, Vue } from 'vue-property-decorator'

	@Options({ components: { Trophy } })
	export default class RichTooltipTrophy extends Vue {
		@Prop({required: true}) trophy!: any
		@Prop() bottom!: boolean
		@Prop() instant!: boolean
		locked: boolean = false
		mouse: boolean = false
		value: boolean = false

		get _open_delay() {
			return this.instant ? 0 : 500
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
	.card {
		width: 280px;
	}
	.trophy {
		display: block;
	}
</style>