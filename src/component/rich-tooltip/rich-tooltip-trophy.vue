<template>
	<v-menu v-model="value" :close-on-content-click="false" :width="280" offset-overflow :nudge-top="0" :open-delay="_open_delay" :close-delay="_close_delay" :top="!bottom" transition="none" :bottom="bottom" :open-on-hover="!locked" offset-y>
		<template #activator="{ props: activatorProps }">
			<span v-bind="activatorProps">
				<slot :props="activatorProps"></slot>
			</span>
		</template>
		<div class="card" @mouseenter="mouse = true" @mouseleave="mouse = false">
			<trophy ref="preview" :trophy="trophy" @update:model-value="setParent" />
		</div>
	</v-menu>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import Trophy from '@/component/trophies/trophy.vue'

const props = defineProps<{
	trophy: any
	bottom?: boolean
	instant?: boolean
}>()

const emit = defineEmits<{
	'update:modelValue': [value: boolean]
}>()

const locked = ref(false)
const mouse = ref(false)
const value = ref(false)

const _open_delay = computed(() => props.instant ? 1 : 500)
const _close_delay = computed(() => props.instant ? 1 : 1)

function setParent(event: boolean) {
	locked.value = event
	if (!event && !mouse.value) {
		value.value = false
		emit('update:modelValue', false)
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