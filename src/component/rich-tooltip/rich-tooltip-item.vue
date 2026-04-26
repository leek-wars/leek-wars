<template>
	<v-menu v-model="value" :close-on-content-click="false" :min-width="280" :max-height="maxHeight" :location="openBottom ? 'bottom' : 'top'" :origin="openBottom ? 'top' : 'bottom'" :offset="nodge ? [0, 20] : 0" :open-delay="_open_delay" :close-delay="_close_delay" :transition="instant ? 'none' : 'scale-transition'" :open-on-hover="!locked" :disabled="disabled" :content-class="'rich-item-tooltip-menu'" :content-props="{ style: 'max-height:' + maxHeight + 'px' }" @update:model-value="onToggle">
		<template #activator="{ props: activatorProps }">
			<span v-bind="activatorProps" @pointerenter="onHover" @mouseenter="onHover" @focus="onHover">
				<slot :props="activatorProps"></slot>
			</span>
		</template>
		<div class="card" :style="{ maxHeight: maxHeight + 'px' }" @mouseenter="mouse = true" @mouseleave="mouse = false">
			<item-preview :item="item" :quantity="quantity" :inventory="inventory" :leek="leek" :craft-cost="craftCost" @update:modelValue="setParent" @retrieve="$emit('retrieve', $event)" />
		</div>
	</v-menu>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import ItemPreview from '@/component/market/item-preview.vue'
import { LeekWars } from '@/model/leekwars'
import type { Leek } from '@/model/leek'
import { emitter } from '@/model/vue'

defineOptions({ name: 'rich-tooltip-item' })

const props = withDefaults(defineProps<{
	item: any
	quantity?: number
	bottom?: boolean
	instant?: boolean
	nodge?: boolean
	inventory?: boolean
	openDelay?: number
	leek?: Leek
	craftCost?: number
}>(), {
	craftCost: 0,
})

const emit = defineEmits<{
	'update:modelValue': [value: boolean]
	'retrieve': [event: any]
}>()

const locked = ref(false)
const mouse = ref(false)
const value = ref(false)
const disabled = ref(false)
const maxHeight = ref(600)
const openBottom = ref(true)
const activatorEl = ref<HTMLElement | null>(null)

const _open_delay = computed(() => props.instant || LeekWars.mobile ? 1 : (props.openDelay || 500))
const _close_delay = computed(() => 1)

function onHover(e: Event) {
	const el = e.currentTarget as HTMLElement | null
	if (el) activatorEl.value = el
	computeBounds()
}

function computeBounds() {
	const el = activatorEl.value
	if (!el) return
	const rect = el.getBoundingClientRect()
	const vh = window.innerHeight
	const padding = 16
	const spaceBelow = vh - rect.bottom - padding
	const spaceAbove = rect.top - padding
	const preferBottom = props.bottom !== false
	const prefSpace = preferBottom ? spaceBelow : spaceAbove
	const altSpace = preferBottom ? spaceAbove : spaceBelow
	if (prefSpace >= 300 || prefSpace >= altSpace) {
		openBottom.value = preferBottom
		maxHeight.value = Math.max(200, prefSpace)
	} else {
		openBottom.value = !preferBottom
		maxHeight.value = Math.max(200, altSpace)
	}
}

function onToggle(opened: boolean) {
	if (opened) computeBounds()
}

function setParent(event: boolean) {
	locked.value = event
	if (!event && !mouse.value) {
		value.value = false
		emit('update:modelValue', false)
	}
}

function close() {
	value.value = false
	locked.value = false
	disabled.value = true
	setTimeout(() => disabled.value = false, 500)
}

onMounted(() => {
	emitter.on('craft', close)
	emitter.on('clover-used', close)
})
onBeforeUnmount(() => {
	emitter.off('craft', close)
	emitter.off('clover-used', close)
})
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