<template lang="html">
	<v-list v-if="filterOptions === null && commands.length" dense>
		<v-list-item v-for="(command, c) of commands" :key="command.name" v-ripple class="command" :class="{selected: index === c}" @click="$emit('command', command.name)">
			<v-list-item-title>/{{ command.name }}</v-list-item-title>
			<v-list-item-subtitle>{{ command.description }}</v-list-item-subtitle>
		</v-list-item>
	</v-list>
	<v-list v-else-if="options.length" dense>
		<v-list-item v-for="option of options" :key="option.name" v-ripple class="command" @click="$emit('command', commands[0].name + ':' + option.name)">
			<v-list-item-title>/{{ commands[0].name }}:{{ option.name }}</v-list-item-title>
			<v-list-item-subtitle>{{ option.description }}</v-list-item-subtitle>
		</v-list-item>
	</v-list>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onMounted, getCurrentInstance } from 'vue'
import { type Command, Commands } from '@/model/commands'

defineOptions({ name: 'chat-commands' })

const props = defineProps<{
	filter?: string
}>()

const emit = defineEmits<{
	command: [name: string]
}>()

const commands = ref(Commands.commands)
const options = ref<any[]>([])
const filterOptions = ref<string | null>(null)
const index = ref(0)
const instance = getCurrentInstance()

onMounted(() => {
	Commands.init()
})

watch(() => props.filter, () => {
	const parts = (props.filter || '').toLowerCase().split(':')
	const filterCommand = parts[0]
	filterOptions.value = parts.length > 1 ? parts[1] : null
	options.value = []
	commands.value = Commands.commands.filter(command =>
		(parts.length === 1 && command.name.indexOf(filterCommand) === 0) || command.name === filterCommand
	)
	if (commands.value.length === 1) {
		const command = commands.value[0]
		if (command.options) {
			if (filterOptions.value === null) {
				options.value = command.options
			} else {
				options.value = command.options.filter(option => option.nameLower.indexOf(filterOptions.value || '') === 0)
			}
		}
	}
}, { immediate: true })

function getSelected(): Command {
	return commands.value[index.value]
}
function getSelectedOption() {
	return commands.value[index.value]?.options ? options.value[index.value] : null
}
function selectFirst() {
	if (!commands.value[index.value]) return
	let command = commands.value[index.value].name
	if (options.value.length) command += ':' + options.value[0].name
	emit('command', command)
}
function scrollToSelected() {
	nextTick(() => {
		const items = (instance?.proxy as any)?.$el?.parentElement?.querySelectorAll('.command')
		if (items) (items[index.value] as HTMLElement)?.scrollIntoView({ block: 'nearest' })
	})
}
function up() {
	index.value--
	if (index.value < 0) index.value = commands.value.length - 1
	scrollToSelected()
}
function down() {
	index.value = (index.value + 1) % commands.value.length
	scrollToSelected()
}

defineExpose({ getSelected, getSelectedOption, selectFirst, up, down })
</script>

<style lang="scss" scoped>
	.command.selected {
		background: var(--background);
	}
</style>