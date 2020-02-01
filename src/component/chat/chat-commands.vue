<template lang="html">
	<v-list v-if="filterOptions === null">
		<v-list-tile v-for="command of commands" :key="command.name" v-ripple class="command" @click="$emit('command', command.name)">
			<v-list-tile-content>
				<v-list-tile-title>/{{ command.name }}</v-list-tile-title>
				<v-list-tile-sub-title>{{ command.description }}</v-list-tile-sub-title>
			</v-list-tile-content>
		</v-list-tile>
	</v-list>
	<v-list v-else-if="options.length">
		<v-list-tile v-for="option of options" :key="option.name" v-ripple class="command" @click="$emit('command', commands[0].name + ':' + option.name)">
			<v-list-tile-content>
				<v-list-tile-title>/{{ commands[0].name }}:{{ option.name }}</v-list-tile-title>
				<v-list-tile-sub-title>{{ option.description }}</v-list-tile-sub-title>
			</v-list-tile-content>
		</v-list-tile>
	</v-list>
</template>

<script lang="ts">
	import { Command, Commands } from '@/model/commands'
	import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
	
	@Component({ name: 'chat-commands' })
	export default class ChatCommands extends Vue {
		@Prop() filter!: string
		commands = Commands.commands
		options: any[] = []
		filterOptions: string | null = null

		@Watch('filter')
		update() {
			const parts = this.filter.toLowerCase().split(':')
			const filterCommand = parts[0]
			this.filterOptions = parts.length > 1 ? parts[1] : null
			this.options = []
			this.commands = Commands.commands.filter(command => 
				(parts.length === 1 && command.name.indexOf(filterCommand) === 0) || command.name === filterCommand
			)
			if (this.commands.length === 1) {
				const command = this.commands[0]
				if (command.options) {
					if (this.filterOptions === null) {
						this.options = command.options
					} else {
						this.options = command.options.filter(option => option.nameLower.indexOf(this.filterOptions || '') === 0)
					}
				}
			}
		}
		getSelected(): Command {
			return this.commands[0]
		}
		selectFirst() {
			let command = this.commands[0].name
			if (this.options.length) {
				command += ':' + this.options[0].name
			}
			this.$emit('command', command)
		}
	}
</script>

<style lang="scss" scoped>
	.command:first-child {
		background: #eee;
	}
</style>