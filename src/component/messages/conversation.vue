<template>
	<div v-if="chat" v-ripple class="conversation" :class="{unread: chat.unread}">
		<rich-tooltip-farmer :id="farmer ? farmer.id : 0" v-slot="{ on }">
			<avatar v-if="farmer" :farmer="farmer" :on="on" />
		</rich-tooltip-farmer>
		<div class="content">
			<div class="name">{{ farmer.name }}</div>
			<div class="last-message">
				<b v-if="chat.last_farmer && $store.state.farmer && chat.last_farmer.id === $store.state.farmer.id">{{ $t('main.me') }} ►</b>
				<span v-emojis v-text="chat.last_message"></span>
			</div>
			<div class="date">{{ LeekWars.formatDuration(chat.last_date) }}</div>
		</div>
	</div>
</template>

<script lang="ts">
	import { Chat } from '@/model/chat'
	import { Component, Prop, Vue } from 'vue-property-decorator'

	@Component({})
	export default class ConversationElement extends Vue {

		@Prop({required: true}) chat!: Chat

		created() {
			// console.log("chat", this.chat)
		}

		get farmer() {
			for (const farmer of this.chat.farmers) {
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
		white-space: nowrap;
		position: relative;
		&.unread {
			background-color: rgba(95, 173, 27, 0.15);
		}
	}
	.selected {
		background: #ddd;
		color: white;
	}
	.conversation:hover {
		background: #ddd;
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
		color: #555;
		font-size: 12px;
		top: 8px;
		right: 8px;
	}
</style>