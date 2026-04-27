<template lang="html">
	<v-list dense>
		<v-list-item v-for="(farmer, f) of farmers" :key="farmer.id" v-ripple class="command" :class="{selected: index === f}" @click="$emit('pseudo', farmer.name)">
			<template #prepend>
				<avatar :farmer="farmer" />
			</template>
			<v-list-item-title>@{{ farmer.name }}</v-list-item-title>
		</v-list-item>
	</v-list>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, getCurrentInstance } from 'vue'
import type { Farmer } from '@/model/farmer'
import { LeekWars } from '@/model/leekwars'

defineOptions({ name: 'chat-pseudos' })

const props = defineProps<{
	chat: number
	filter?: string
}>()

const emit = defineEmits<{
	pseudo: [pseudo: string | null]
}>()

const farmers = ref<Farmer[]>([])
const index = ref(0)
const instance = getCurrentInstance()

watch(() => props.filter, () => {
	LeekWars.post('message/complete-pseudo', { conversation_id: props.chat, pseudo: props.filter }).then(data => {
		farmers.value = data
		index.value = 0
	})
}, { immediate: true })

function getSelected(): string | null {
	return farmers.value.length ? farmers.value[index.value].name : null
}
function selectFirst() {
	emit('pseudo', getSelected())
}
function scrollToSelected() {
	nextTick(() => {
		const items = (instance?.proxy as any)?.$el?.parentElement?.querySelectorAll('.command')
		if (items) (items[index.value] as HTMLElement)?.scrollIntoView({ block: 'nearest' })
	})
}
function up() {
	index.value--
	if (index.value < 0) index.value = farmers.value.length - 1
	scrollToSelected()
}
function down() {
	index.value = (index.value + 1) % farmers.value.length
	scrollToSelected()
}

defineExpose({ getSelected, selectFirst, up, down })
</script>

<style lang="scss" scoped>
	.command {
		min-height: 32px;
	}
	.command.selected {
		background: var(--background);
	}
	.avatar {
		width: 32px;
		height: 32px;
		margin-right: 10px;
	}
</style>