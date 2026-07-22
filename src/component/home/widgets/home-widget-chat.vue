<template>
	<div class="chat-widget">
		<chat v-if="chatID" :id="chatID" class="chat-body" />
		<div v-else class="none">{{ t('chat_unavailable') }}</div>
	</div>
</template>

<script setup lang="ts">
	import { computed, defineAsyncComponent } from 'vue'
	import { useI18n } from 'vue-i18n'
	import { LeekWars } from '@/model/leekwars'
	import { store } from '@/model/store'
	import { useNamespacedT } from '@/model/i18n'

	defineOptions({
		name: 'HomeWidgetChat',
		components: { chat: defineAsyncComponent(() => import(/* webpackChunkName: "chat" */ '@/component/chat/chat.vue')) }
	})

	// Le canal choisi est stocké dans les paramètres du widget (params.chat), persistés en base.
	const props = defineProps<{ params?: { chat?: number } }>()

	const t = useNamespacedT('home')
	const { locale } = useI18n()

	// Chat de groupe imposé, sinon canal choisi dans les paramètres, sinon chat public de la langue.
	const chatID = computed<number | null>(() => {
		const farmer = store.state.farmer
		if (farmer?.group && farmer.group.chat && !farmer.public_chat_enabled) return farmer.group.chat
		if (!farmer?.public_chat_enabled) return null
		const chosen = props.params?.chat
		if (chosen && LeekWars.isPublicChat(chosen)) return chosen
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		return (LeekWars.languages as any)[locale.value].chat
	})
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
