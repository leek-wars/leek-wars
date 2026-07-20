<template>
	<div class="chat-widget">
		<chat v-if="chatID" :id="chatID" class="chat-body" />
		<div v-else class="none">{{ t('chat_unavailable') }}</div>
	</div>
</template>

<script setup lang="ts">
	import { defineAsyncComponent, ref } from 'vue'
	import { useI18n } from 'vue-i18n'
	import { LeekWars } from '@/model/leekwars'
	import { store } from '@/model/store'
	import { useNamespacedT } from '@/model/i18n'

	defineOptions({
		name: 'HomeWidgetChat',
		components: { chat: defineAsyncComponent(() => import(/* webpackChunkName: "chat" */ '@/component/chat/chat.vue')) }
	})

	const t = useNamespacedT('home')
	const { locale } = useI18n()

	// Même résolution que chat-panel : chat de groupe imposé, sinon chat public de la langue
	// (mémorisé par navigateur), sinon rien.
	const chatID = ref<number | null>(null)
	const farmer = store.state.farmer
	if (farmer?.group && farmer.group.chat && !farmer.public_chat_enabled) {
		chatID.value = farmer.group.chat
	} else if (farmer?.public_chat_enabled) {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		chatID.value = parseInt(localStorage.getItem('chat-panel/home') || '0') || (LeekWars.languages as any)[locale.value].chat
	}
</script>

<style lang="scss" scoped>
	.chat-widget {
		margin: -15px;
		height: calc(100% + 30px);
		display: flex;
	}
	.chat-body {
		display: block;
		flex: 1 1 auto;
		min-height: 0;
		width: 100%;
	}
	.none {
		color: var(--text-color-secondary);
		font-style: italic;
		padding: 8px;
	}
</style>
