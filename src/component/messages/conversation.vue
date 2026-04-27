<template>
	<div v-if="chat" v-ripple class="conversation" :class="{unread: !chat.read}">
		<rich-tooltip-farmer :id="farmer ? farmer.id : 0" v-slot="{ props }">
			<avatar :farmer="farmer" v-bind="props" />
		</rich-tooltip-farmer>
		<div class="content">
			<div class="name">{{ farmer ? farmer.name : '?' }}</div>
			<div class="last-message">
				<b v-if="chat.last_farmer && $store.state.farmer && chat.last_farmer.id === $store.state.farmer.id">{{ $t('main.me') }} ►</b>
				<span v-html="formattedLastMessage"></span>
			</div>
			<div class="date">{{ LeekWars.formatDuration(chat.last_date || 0) }}</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Chat } from '@/model/chat'
import { formatChatPreview } from '@/model/chat-format'
import { store } from '@/model/store'
import RichTooltipFarmer from '@/component/rich-tooltip/rich-tooltip-farmer.vue'

defineOptions({ name: 'conversation' })

const props = defineProps<{
	chat: Chat
}>()

const farmer = computed(() => {
	for (const f of props.chat.farmers) {
		if (!store.state.farmer || f.id !== store.state.farmer.id) return f
	}
	return null
})

const formattedLastMessage = computed(() => formatChatPreview(props.chat.last_message || '', props.chat.last_farmer ? props.chat.last_farmer.name : ''))
</script>

<style lang="scss" scoped>
	.conversation {
		display: flex;
		cursor: pointer;
		height: 52px;
		white-space: nowrap;
		position: relative;
		&.unread {
			background-color: rgba(90, 194, 0, 0.20);
		}
	}
	.conversation:hover {
		background-color: var(--pure-white);
		box-shadow: 0px 2px 1px -1px rgba(0,0,0,0.2), 0px 1px 1px 0px rgba(0,0,0,0.14), 0px 1px 3px 0px rgba(0,0,0,0.12);
		&.unread {
			background-color: rgba(90, 194, 0, 0.25);
		}
	}
	.selected {
		background: #ddd;
		color: var(--pure-white);
	}
	.selected:hover {
		background: #999;
	}
	.content {
		flex: 1;
		min-width: 0;
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
		color: var(--text-color-secondary);
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
		color: var(--text-color-secondary);
		font-size: 12px;
		top: 8px;
		right: 8px;
	}
</style>