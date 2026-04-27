<template lang="html">
	<div>
		<template v-if="area == Area.SINGLE_CELL"></template>
		<i18n-t v-else-if="area == Area.LASER_LINE" keypath="effect.area_x">
			<template #area>
				<b>{{ $t('effect.line_until_obstacle') }}</b>
			</template>
		</i18n-t>
		<div v-else-if="area == Area.CIRCLE1 || area == Area.CIRCLE2 || area == Area.CIRCLE3">
			<range-view :min="0" :max="width" :type="7" />
			<i18n-t keypath="effect.area_x">
				<template #area>
					<b>{{ $t('effect.area_' + area) }}</b>
				</template>
			</i18n-t>
		</div>
		<div v-else-if="area == Area.PLUS_2 || area == Area.PLUS_3">
			<range-view :min="0" :max="width" :type="1" />
			<i18n-t keypath="effect.area_x">
				<template #area>
					<b>{{ $t('effect.area_' + area) }}</b>
				</template>
			</i18n-t>
		</div>
		<div v-else-if="area == Area.X_1 || area == Area.X_2 || area == Area.X_3">
			<range-view :min="0" :max="width" :type="9" />
			<i18n-t keypath="effect.area_x">
				<template #area>
					<b>{{ $t('effect.area_' + area) }}</b>
				</template>
			</i18n-t>
		</div>
		<div v-else-if="area === Area.SQUARE_1 || area === Area.SQUARE_2">
			<range-view :min="0" :max="width" :type="10" />
			<i18n-t keypath="effect.area_x">
				<template #area>
					<b>{{ $t('effect.area_' + area) }}</b>
				</template>
			</i18n-t>
		</div>
		<i18n-t v-else-if="area == Area.FIRST_INLINE" keypath="effect.area_x">
			<template #area>
				<b>{{ $t('effect.first_inline') }}</b>
			</template>
		</i18n-t>
		<i18n-t v-else-if="area == Area.ALLIES" keypath="effect.area_x">
			<template #area>
				<b>{{ $t('effect.allies') }}</b>
			</template>
		</i18n-t>
		<i18n-t v-else-if="area == Area.ENEMIES" keypath="effect.area_x">
			<template #area>
				<b>{{ $t('effect.enemies') }}</b>
			</template>
		</i18n-t>
		<div v-else>
			?
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import RangeView from '@/component/market/range-view.vue'
import { Area } from '@/model/area'

defineOptions({ name: 'area-view', components: { 'range-view': RangeView } })

const props = defineProps<{
	area: Area
}>()

const width = computed(() => {
	if (props.area === Area.CIRCLE1 || props.area === Area.SQUARE_1 || props.area === Area.X_1) return 1
	if (props.area === Area.CIRCLE2 || props.area === Area.X_2 || props.area === Area.PLUS_2 || props.area === Area.SQUARE_2) return 2
	if (props.area === Area.CIRCLE3 || props.area === Area.X_3 || props.area === Area.PLUS_3) return 3
	return 0
})
</script>