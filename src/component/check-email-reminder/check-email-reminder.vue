<template lang="html">
	<popup v-model="show" :width="540" icon="mdi-email-fast" :title="t('title')" :persistent="false">
		<div class="intro">{{ t('intro') }}</div>

		<div class="rewards">
			<div class="reward">
				<div class="reward-icon"><img src="/image/fight-pack/fight_pack_50.png" alt="fights"></div>
				<div class="reward-text"><b>20</b> {{ t('reward_fights') }}</div>
			</div>
			<div class="reward">
				<div class="reward-icon"><img src="/image/resource/box_100k_habs.png" alt="habs"></div>
				<div class="reward-text"><b>10 000</b> {{ t('reward_habs') }}</div>
			</div>
			<div class="reward">
				<div class="reward-icon"><img src="/image/crystal.png" alt="crystal"></div>
				<div class="reward-text"><b>50</b> {{ t('reward_crystals') }}</div>
			</div>
			<div class="reward">
				<div class="reward-icon"><img src="/image/hat/cap.png" alt="cap"></div>
				<div class="reward-text">{{ t('reward_hat') }}</div>
			</div>
		</div>

		<div class="hint">
			<v-icon>mdi-folder-alert-outline</v-icon>
			<span>{{ t('check_spam') }}</span>
		</div>

		<template #actions>
			<div v-ripple class="action compact" @click="later">{{ t('later') }}</div>
			<div v-ripple class="action" :class="{ disabled: resending }" @click="resend">
				<v-icon>mdi-email-sync</v-icon>
				{{ t('resend') }}
			</div>
		</template>
	</popup>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { LeekWars } from '@/model/leekwars'
import { mixins, useNamespacedT } from '@/model/i18n'
import { store } from '@/model/store'
import Popup from '@/component/popup.vue'

defineOptions({ name: 'CheckEmailReminder', i18n: {}, mixins: [...mixins] })

const props = defineProps<{ modelValue: boolean, test?: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()

const t = useNamespacedT('check-email-reminder')

const show = ref(props.modelValue)
const resending = ref(false)

function logEvent(event: 'shown' | 'dismissed' | 'snoozed') {
	if (props.test) return
	LeekWars.post('farmer/log-reminder-event', { event })
}

onMounted(() => logEvent('shown'))

// Snooze exponentiel x2 (10min, 20min, 40min, 1h20, 2h40, …) plafonné à 24h.
// Empêche le harcèlement tout en gardant un rappel régulier tant que le farmer
// n'a pas validé son email.
const SNOOZE_BASE_MS = 10 * 60 * 1000
const SNOOZE_CAP_MS = 24 * 60 * 60 * 1000

function snoozeKey(suffix: 'until' | 'count'): string {
	const id = store.state.farmer?.id ?? 'anon'
	return `check-email-reminder-snoozed-${suffix}-${id}`
}

function close() {
	show.value = false
	emit('update:modelValue', false)
}

function later() {
	if (!props.test) {
		const count = parseInt(localStorage.getItem(snoozeKey('count')) || '0') + 1
		const delay = Math.min(SNOOZE_BASE_MS * Math.pow(2, count - 1), SNOOZE_CAP_MS)
		localStorage.setItem(snoozeKey('count'), String(count))
		localStorage.setItem(snoozeKey('until'), String(Date.now() + delay))
	}
	logEvent('snoozed')
	close()
}

function resend() {
	if (resending.value) return
	resending.value = true
	if (props.test) {
		LeekWars.toast(t('mail_resent'))
		logEvent('dismissed')
		close()
		resending.value = false
		return
	}
	LeekWars.post('farmer/resend-verify-mail', {}).then(() => {
		LeekWars.toast(t('mail_resent'))
		logEvent('dismissed')
		close()
	}).error(payload => {
		const code = typeof payload?.error === 'string' ? payload.error : 'unknown'
		LeekWars.toast(t('error_' + code) as string)
	}).finally(() => {
		resending.value = false
	})
}
</script>

<style lang="scss" scoped>
	.intro {
		text-align: center;
		padding: 4px 0 16px;
		color: var(--text-color-secondary);
	}
	.rewards {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 12px;
		margin-bottom: 16px;
	}
	.reward {
		display: flex;
		align-items: center;
		gap: 10px;
		background: var(--background-secondary);
		padding: 10px 12px;
		border-radius: 6px;
	}
	.reward-icon {
		flex-shrink: 0;
		width: 64px;
		height: 64px;
		display: flex;
		align-items: center;
		justify-content: center;
		img {
			max-width: 100%;
			max-height: 100%;
			object-fit: contain;
		}
	}
	.reward-text {
		font-size: 14px;
		b { font-size: 16px; }
	}
	.hint {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 10px 12px;
		background: rgba(255, 152, 0, 0.12);
		border-left: 3px solid #ff9800;
		border-radius: 4px;
		font-size: 13px;
		color: var(--text-color);
		.v-icon {
			color: #ff9800;
			font-size: 20px;
		}
	}
	body.dark .hint {
		background: rgba(255, 152, 0, 0.18);
	}
</style>
