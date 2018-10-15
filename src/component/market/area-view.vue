<template lang="html">
	<div>
		<template v-if="area == Area.SINGLE_CELL"></template>
		<template v-else-if="area == Area.LASER_LINE">
			<div><b>{{ $t('effect.line_until_obstacle') }}</b></div>
		</template>
		<template v-else-if="area == Area.CIRCLE1 || area == Area.CIRCLE2 || area == Area.CIRCLE3">
			<range-view :min="0" :max="width" :type="1" />
		</template>
		<template v-else>
			<div>?</div>
		</template>
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
			if (this.area === Area.CIRCLE1) {
				return 1
			} else if (this.area === Area.CIRCLE2) {
				return 2
			}
			return 3
		}
	}
</script>