<template>
	<div ref="root" class="chat-widget">
		<chat v-if="chatID" :id="chatID" class="chat-body" />
		<div v-else class="none">{{ t('chat_unavailable') }}</div>
	</div>
</template>

<script setup lang="ts">
	import { computed, defineAsyncComponent, onMounted, ref } from 'vue'
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

	// v-autostopscroll (chat.vue) preventDefault la molette aux bords de la liste de
	// messages : voulu sur la page Chat dédiée (la page ne doit pas bouger), gênant
	// ici où un chat vide ou en butée gèle la molette. On coupe la propagation en
	// phase capture : son listener ne s'exécute pas, le défilement natif garde la
	// main (les messages défilent, puis la page prend le relais aux bords).
	const root = ref<HTMLElement | null>(null)
	onMounted(() => {
		root.value?.addEventListener('wheel', e => e.stopPropagation(), { capture: true })
	})

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
	// Pas de display ici : le composant chat est déjà une colonne flex, et
	// c'est sa zone de messages qui défile (le panel, lui, ne défile jamais).
	.chat-body {
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
