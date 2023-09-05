<template lang="html">
	<v-list dense>
		<v-list-item v-for="(farmer, f) of farmers" :key="farmer.id" v-ripple class="command" :class="{selected: index === f}" @click="$emit('pseudo', farmer.name)">
			<avatar :farmer="farmer" />
			<v-list-item-title>@{{ farmer.name }}</v-list-item-title>
		</v-list-item>
	</v-list>
</template>

<script lang="ts">
	import { Farmer } from '@/model/farmer'
	import { LeekWars } from '@/model/leekwars'
	import { Component, Prop, Vue, Watch } from 'vue-property-decorator'

	@Component({ name: 'chat-pseudos' })
	export default class ChatPseudos extends Vue {

		@Prop({ required: true }) chat!: number
		@Prop() filter!: string
		farmers: Farmer[] = []
		index: number = 0

		@Watch('filter', {immediate: true})
		update() {
			LeekWars.post('message/complete-pseudo', { conversation_id: this.chat, pseudo: this.filter }).then(farmers => {
				this.farmers = farmers
				this.index = 0
			})
		}
		getSelected(): string | null {
			if (this.farmers.length) {
				return this.farmers[this.index].name
			} else {
				return null
			}
		}
		selectFirst() {
			this.$emit('pseudo', this.getSelected())
		}
		up() {
			this.index--
			if (this.index < 0) this.index = this.farmers.length - 1
		}
		down() {
			this.index = (this.index + 1) % this.farmers.length
		}
	}
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