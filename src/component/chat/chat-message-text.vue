<template lang="html">
	<div v-if="message.censored" class="censored">{{ $t('main.censored_by', [message.censored_by?.name]) }}</div>
	<div v-else v-chat-code-latex class="text" :class="{'leek-wars': message.farmer.id === 0, 'large-emojis': message.only_emojis}" v-html="message.content"></div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, getCurrentInstance, type App } from 'vue'
import { store } from '@/model/store'
import { createSubApp } from '@/model/vue'
import Pseudo from '../app/pseudo.vue'
import 'katex/dist/katex.min.css'
import type { ChatMessage } from '@/model/chat'
import Loader from '@/component/app/loader.vue'
import Avatar from '../avatar.vue'
import Flag from '../flag.vue'
import Emblem from '../emblem.vue'
import Talent from '../talent.vue'
import RankingBadge from '../ranking-badge.vue'
import BrInvite from './br-invite.vue'

defineOptions({ name: 'ChatMessageText' })

defineProps<{
	message: ChatMessage
}>()

const subApps: App[] = []
const instance = getCurrentInstance()

onMounted(() => {
	const el = (instance?.proxy as any)?.$el
	if (!el) return
	el.querySelectorAll('.pseudo').forEach((c: HTMLElement) => {
		const name = c.innerText
		const farmer = store.state.farmer_by_name[name]
		if (farmer) {
			const app = createSubApp(Pseudo, { farmer }, 'chat-pseudo')
			app.component('loader', Loader)
			app.component('avatar', Avatar)
			app.component('emblem', Emblem)
			app.component('flag', Flag)
			app.component('talent', Talent)
			app.component('ranking-badge', RankingBadge)
			app.mount(c)
			subApps.push(app)
		}
	})
	el.querySelectorAll('.br-invite').forEach((c: HTMLElement) => {
		const level = parseInt(c.dataset.level || '', 10) || 0
		const label = c.dataset.label || undefined
		const modeStr = c.dataset.mode
		const mode = modeStr !== undefined ? parseInt(modeStr, 10) : undefined
		const app = createSubApp(BrInvite, { level, label, mode }, 'chat-br-invite')
		app.mount(c)
		subApps.push(app)
	})
})

onBeforeUnmount(() => {
	for (const app of subApps) app.unmount()
})
</script>

<style lang="scss" scoped>
	.text:deep(a) {
		color: #5fad1b;
		&.lw {
			border: 1px solid var(--border);
			border-radius: 4px;
			padding: 0 4px;
			&:hover {
				border: 1px solid #5fad1b;
			}
		}
	}
	.text:deep(.v-icon) {
		color: #5fad1b;
		font-size: 18px;
		margin-right: 4px;
		vertical-align: baseline;
	}
	.censored {
		font-size: 15px;
		color: #777;
		font-style: italic;
	}
</style>