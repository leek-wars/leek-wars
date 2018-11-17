<template>
	<div v-ripple v-if="conversation" class="conversation">
		<avatar v-if="farmer" :farmer="farmer" />
		<div class="content">
			<div v-if="farmer" class="name">{{ farmer.name }}</div>
			<div class="last-message">
				<b v-if="$store.state.farmer && conversation.last_farmer_id === $store.state.farmer.id">{{ $t('messages.me') }} ►</b>
				<span v-emojis v-text="conversation.last_message"></span>
			</div>
			<div class="date">{{ LeekWars.formatDuration(conversation.last_date) }}</div>
		</div>
	</div>
</template>

<script lang="ts">
	import { Conversation } from '@/model/conversation'
	import { LeekWars } from '@/model/leekwars'
	import { Component, Prop, Vue } from 'vue-property-decorator'

	@Component({})
	export default class ConversationElement extends Vue {
		@Prop({required: true}) conversation!: Conversation
		get farmer() {
			for (const farmer of this.conversation.farmers) {
				if (!this.$store.state.farmer || farmer.id !== this.$store.state.farmer.id) {
					return farmer
				}
			}
		}
	}
</script>

<style lang="scss" scoped>
	.conversation {
		cursor: pointer;
		height: 52px;
		margin-bottom: 3px;
		white-space: nowrap;
		position: relative;
	}
	.selected {
		background: #ddd;
		color: white;
	}
	.conversation:hover {
		background: white;
		box-shadow: 0px 2px 1px -1px rgba(0,0,0,0.2), 0px 1px 1px 0px rgba(0,0,0,0.14), 0px 1px 3px 0px rgba(0,0,0,0.12);
	}
	.selected:hover {
		background: #999;
	}
	.content {
		display: inline-block;
		vertical-align: top;
		padding: 5px;
	}
	.avatar {
		width: 48px;
		height: 48px;
		margin: 2px;
	}
	.last-message {
		font-size: 13px;
		color: #777;
		text-overflow: ellipsis;
		white-space: nowrap;
		overflow: hidden;
		max-width: 100%;
	}
	.selected .last-message {
		color: #333;
	}
	.name {
		margin-bottom: 4px;
		margin-top: 2px;
	}
	.date {
		position: absolute;
		color: #777;
		font-size: 12px;
		top: 8px;
		right: 8px;
	}
</style>