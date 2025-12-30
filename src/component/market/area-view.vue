<template lang="html">
	<div>
		<template v-if="area == Area.SINGLE_CELL"></template>
		<i18n-t v-else-if="area == Area.LASER_LINE" keypath="effect.area_x">
			<b slot="area">{{ $t('effect.line_until_obstacle') }}</b>
		</i18n-t>
		<div v-else-if="area == Area.CIRCLE1 || area == Area.CIRCLE2 || area == Area.CIRCLE3">
			<range-view :min="0" :max="width" :type="7" />
			<i18n-t keypath="effect.area_x">
				<b slot="area">{{ $t('effect.area_' + area) }}</b>
			</i18n-t>
		</div>
		<div v-else-if="area == Area.PLUS_2 || area == Area.PLUS_3">
			<range-view :min="0" :max="width" :type="1" />
			<i18n-t keypath="effect.area_x">
				<b slot="area">{{ $t('effect.area_' + area) }}</b>
			</i18n-t>
		</div>
		<div v-else-if="area == Area.X_1 || area == Area.X_2 || area == Area.X_3">
			<range-view :min="0" :max="width" :type="9" />
			<i18n-t keypath="effect.area_x">
				<b slot="area">{{ $t('effect.area_' + area) }}</b>
			</i18n-t>
		</div>
		<div v-else-if="area === Area.SQUARE_1 || area === Area.SQUARE_2">
			<range-view :min="0" :max="width" :type="10" />
			<i18n-t keypath="effect.area_x">
				<b slot="area">{{ $t('effect.area_' + area) }}</b>
			</i18n-t>
		</div>
		<i18n-t v-else-if="area == Area.FIRST_INLINE" keypath="effect.area_x">
			<b slot="area">{{ $t('effect.first_inline') }}</b>
		</i18n-t>
		<i18n-t v-else-if="area == Area.ALLIES" keypath="effect.area_x">
			<b slot="area">{{ $t('effect.allies') }}</b>
		</i18n-t>
		<i18n-t v-else-if="area == Area.ENEMIES" keypath="effect.area_x">
			<b slot="area">{{ $t('effect.enemies') }}</b>
		</i18n-t>
		<div v-else>
			?
		</div>
	</div>
</template>

<script lang="ts">
	import RangeView from '@/component/market/range-view.vue'
	import { Area } from '@/model/area'
	import { Component, Prop, Vue } from 'vue-property-decorator'
	@Component({
		name: 'area-view',
		components: { 'range-view': RangeView }
	})
	export default class AreaView extends Vue {
		@Prop() area!: Area
		Area = Area
		get width() {
			if (this.area === Area.CIRCLE1 || this.area === Area.SQUARE_1 || this.area === Area.X_1) { return 1 }
			if (this.area === Area.CIRCLE2 || this.area === Area.X_2 || this.area === Area.PLUS_2 || this.area === Area.SQUARE_2) { return 2 }
			if (this.area === Area.CIRCLE3 || this.area === Area.X_3 || this.area === Area.PLUS_3) { return 3 }
		}
	}
</script>