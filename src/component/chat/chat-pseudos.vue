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

<script lang="ts">
	import { Farmer } from '@/model/farmer'
	import { LeekWars } from '@/model/leekwars'
	import { nextTick } from 'vue'
	import { Options, Prop, Vue, Watch } from 'vue-property-decorator'

	@Options({ name: 'chat-pseudos', emits: ['pseudo'] })
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
			this.scrollToSelected()
		}
		down() {
			this.index = (this.index + 1) % this.farmers.length
			this.scrollToSelected()
		}
		scrollToSelected() {
			nextTick(() => {
				const items = (this as any).$el?.parentElement?.querySelectorAll('.command')
				if (items) (items[this.index] as HTMLElement)?.scrollIntoView({ block: 'nearest' })
			})
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