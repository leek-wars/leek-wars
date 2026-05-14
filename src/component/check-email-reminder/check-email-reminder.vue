<template lang="html">
	<popup v-model="show" :width="540" icon="mdi-email-fast" :title="t('title')" :persistent="false" @update:model-value="onPopupChange">
		<div class="intro">{{ t('intro') }}</div>

		<verify-rewards class="popup-rewards" />

		<div class="hint">
			<v-icon>mdi-folder-alert-outline</v-icon>
			<span>{{ t('check_spam') }}</span>
		</div>

		<div class="oauth-section">
			<div class="separator"><span>{{ t('or') }}</span></div>
			<div class="oauth-buttons">
				<div v-ripple class="action oauth gh" :class="{ disabled: oauthLoading }" @click="useProvider('github')">
					<img src="/image/github_white.png" alt="GitHub"> {{ t('use_github') }}
				</div>
				<div v-ripple class="action oauth google" :class="{ disabled: oauthLoading }" @click="useProvider('google')">
					<img src="/image/google.svg" alt="Google"> {{ t('use_google') }}
				</div>
			</div>
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
import VerifyRewards from '@/component/verify-rewards/verify-rewards.vue'

type ReminderEvent = 'shown' | 'dismissed' | 'snoozed' | 'resend' | 'oauth_github' | 'oauth_google'

defineOptions({ name: 'CheckEmailReminder', i18n: {}, mixins: [...mixins] })

const props = defineProps<{ modelValue: boolean, test?: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()

const t = useNamespacedT('check-email-reminder')

const show = ref(props.modelValue)
const resending = ref(false)
const oauthLoading = ref(false)
let actionTaken = false // distingue "ferme sans action" (dismissed) vs "ferme après later/resend/oauth"

function logEvent(event: ReminderEvent) {
	if (props.test) return
	LeekWars.post('farmer/log-reminder-event', { event })
}

onMounted(() => logEvent('shown'))

const SNOOZE_BASE_MS = 10 * 60 * 1000
const SNOOZE_CAP_MS = 24 * 60 * 60 * 1000
const SNOOZE_MAX_COUNT = 5

function snoozeKey(suffix: 'until' | 'count' | 'final'): string {
	const id = store.state.farmer?.id ?? 'anon'
	return `check-email-reminder-snoozed-${suffix}-${id}`
}

function close() {
	show.value = false
	emit('update:modelValue', false)
}

// Le popup peut être fermé par click-outside / ESC. On ne log dismissed que dans
// ce cas, pas quand close() est appelé par later/resend/oauth qui ont leur propre event.
function onPopupChange(value: boolean) {
	if (!value && !actionTaken) {
		logEvent('dismissed')
	}
}

function later() {
	actionTaken = true
	if (!props.test) {
		const count = parseInt(localStorage.getItem(snoozeKey('count')) || '0') + 1
		localStorage.setItem(snoozeKey('count'), String(count))
		if (count >= SNOOZE_MAX_COUNT) {
			// Au-delà de SNOOZE_MAX_COUNT refus, on n'affiche plus jamais le dialog
			// sur cet appareil. Le bandeau header reste, le user peut toujours
			// revenir via /settings.
			localStorage.setItem(snoozeKey('final'), '1')
		} else {
			const delay = Math.min(SNOOZE_BASE_MS * Math.pow(2, count - 1), SNOOZE_CAP_MS)
			localStorage.setItem(snoozeKey('until'), String(Date.now() + delay))
		}
	}
	logEvent('snoozed')
	close()
}

function resend() {
	if (resending.value || oauthLoading.value) return
	resending.value = true
	if (props.test) {
		LeekWars.toast(t('mail_resent'))
		actionTaken = true
		logEvent('resend')
		close()
		resending.value = false
		return
	}
	LeekWars.post('farmer/resend-verify-mail', {}).then(() => {
		LeekWars.toast(t('mail_resent'))
		localStorage.removeItem(snoozeKey('count'))
		localStorage.removeItem(snoozeKey('until'))
		localStorage.removeItem(snoozeKey('final'))
		actionTaken = true
		logEvent('resend')
		close()
	}).error(payload => {
		const code = typeof payload?.error === 'string' ? payload.error : 'unknown'
		LeekWars.toast(t('error_' + code) as string)
	}).finally(() => {
		resending.value = false
	})
}

function useProvider(provider: 'github' | 'google') {
	if (oauthLoading.value || resending.value) return
	const farmer = store.state.farmer
	if (!farmer || !farmer.login) {
		LeekWars.toast(t('error_no_login'))
		return
	}
	oauthLoading.value = true
	actionTaken = true
	logEvent(provider === 'github' ? 'oauth_github' : 'oauth_google')
	if (props.test) {
		LeekWars.toast(t('use_' + provider) + ' (test)')
		close()
		oauthLoading.value = false
		return
	}
	LeekWars.post(`farmer/verify-${provider}`, { login: farmer.login, godfather: '' }).then(() => {
		document.location.href = LeekWars.API + `farmer/start-${provider}-login`
	}).error(payload => {
		oauthLoading.value = false
		actionTaken = false // permet de retenter ou snoozer normalement après échec
		if (Array.isArray(payload) && payload.length > 0 && Array.isArray(payload[0])) {
			LeekWars.toast(t('error_' + payload[0][1]) as string)
		} else {
			const code = typeof payload?.error === 'string' ? payload.error : 'unknown'
			LeekWars.toast(t('error_' + code) as string)
		}
	})
}
</script>

<style lang="scss" scoped>
	.intro {
		text-align: center;
		padding: 4px 0 16px;
		color: var(--text-color-secondary);
	}
	.popup-rewards {
		margin-bottom: 16px;
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
	.oauth-section {
		margin-top: 16px;
	}
	.separator {
		display: flex;
		align-items: center;
		gap: 10px;
		color: var(--text-color-secondary);
		font-size: 13px;
		margin: 8px 0 12px;
		&::before, &::after {
			content: '';
			flex: 1;
			height: 1px;
			background: var(--border);
		}
		span {
			text-transform: uppercase;
			letter-spacing: 0.5px;
		}
	}
	.oauth-buttons {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 8px;
	}
	.action.oauth {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		padding: 10px 16px;
		border-radius: 4px;
		cursor: pointer;
		font-weight: 500;
		font-size: 14px;
		img {
			height: 18px;
			width: 18px;
		}
		&.gh {
			background: #1f1f1f;
			color: #fff;
			&:hover { background: #2f2f2f; }
		}
		&.google {
			background: #fff;
			color: #444;
			border: 1px solid #dadce0;
			&:hover { background: #f7f7f7; }
		}
		&.disabled {
			opacity: 0.5;
			pointer-events: none;
		}
	}
</style>
