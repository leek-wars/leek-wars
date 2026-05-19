<template lang="html">
	<popup v-model="show" :width="540" icon="mdi-account-plus" :title="t('title')" :persistent="true">
		<div class="intro">{{ t('intro') }}</div>

		<verify-rewards class="popup-rewards" />

		<form class="verify-form" @submit.prevent="submit">
			<div class="field">
				<label>{{ t('login') }}</label>
				<input v-model="login" type="text" required maxlength="30" autocomplete="username">
				<div v-for="e in errors.login" :key="e" class="error-msg">{{ e }}</div>
			</div>

			<div class="oauth-section">
				<div class="oauth-buttons">
					<div v-ripple class="action oauth gh" :class="{ disabled: oauthLoading || submitting }" @click="useProvider('github')">
						<img src="/image/github_white.png" alt="GitHub"> {{ t('use_github') }}
					</div>
					<div v-ripple class="action oauth google" :class="{ disabled: oauthLoading || submitting }" @click="useProvider('google')">
						<img src="/image/google.svg" alt="Google"> {{ t('use_google') }}
					</div>
				</div>
				<div class="separator"><span>{{ t('or') }}</span></div>
			</div>

			<div class="field">
				<label>{{ t('email') }}</label>
				<input v-model="email" type="email" required autocomplete="email">
				<div v-for="e in errors.email" :key="e" class="error-msg">{{ e }}</div>
			</div>
			<div class="field">
				<label>{{ t('password') }}</label>
				<input v-model="password" type="password" required minlength="8" autocomplete="new-password">
				<div v-for="e in errors.password1" :key="e" class="error-msg">{{ e }}</div>
			</div>
		</form>

		<template #actions>
			<div v-ripple class="action compact" @click="later">{{ t('later') }}</div>
			<div v-ripple class="action green" :class="{ disabled: submitting || oauthLoading }" @click="submit">
				<v-icon>mdi-check</v-icon>
				{{ t('validate') }}
			</div>
		</template>
	</popup>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { LeekWars } from '@/model/leekwars'
import { mixins, useNamespacedT } from '@/model/i18n'
import { store } from '@/model/store'
import Popup from '@/component/popup.vue'
import VerifyRewards from '@/component/verify-rewards/verify-rewards.vue'

defineOptions({ name: 'VerifyPopup', i18n: {}, mixins: [...mixins] })

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()

const t = useNamespacedT('verify-popup')

const show = ref(props.modelValue)
// La croix du header de <popup> ferme via le v-model interne (show) sans passer
// par close(). On propage donc toute fermeture vers le parent, sinon app.vue
// croit le popup encore ouvert et le bouton de réouverture du bandeau reste sans
// effet (verifyPopupForced déjà à true).
watch(show, (v) => { if (!v) emit('update:modelValue', false) })
const submitting = ref(false)
const oauthLoading = ref(false)
const login = ref('')
const email = ref('')
const password = ref('')
const errors = ref<Record<string, string[]>>({})

function close() {
	show.value = false
	// l'emit est géré par le watch(show) ci-dessus
}

function later() {
	localStorage.setItem('verify-popup-snoozed-until', String(Date.now() + 24 * 60 * 60 * 1000))
	LeekWars.post('farmer/verify-modal-dismissed', {})
	if (store.state.farmer && !store.state.farmer.verify_modal_dismissed_at) {
		store.state.farmer.verify_modal_dismissed_at = LeekWars.time
	}
	close()
}

function submit() {
	if (submitting.value || oauthLoading.value) return
	errors.value = {}
	submitting.value = true
	LeekWars.post('farmer/verify', {
		login: login.value,
		email: email.value,
		password: password.value,
		godfather: '',
		source: 'popup',
	}).then(() => {
		LeekWars.toast(t('mail_sent'))
		close()
	}).error(errs => {
		for (const err of (errs as unknown as [number, string][])) {
			const field = ['login', 'leek', 'email', 'password1', 'password2', 'godfather'][err[0]] ?? 'login'
			if (!errors.value[field]) errors.value[field] = []
			errors.value[field].push(t('error_' + err[1]) as string || (err[1] as string))
		}
	}).finally(() => {
		submitting.value = false
	})
}

function useProvider(provider: 'github' | 'google') {
	if (oauthLoading.value || submitting.value) return
	errors.value = {}
	if (!login.value.trim()) {
		errors.value.login = [t('error_no_login') as string]
		return
	}
	oauthLoading.value = true
	LeekWars.post(`farmer/verify-${provider}`, { login: login.value, godfather: '' }).then(() => {
		document.location.href = LeekWars.API + `farmer/start-${provider}-login`
	}).error(errs => {
		oauthLoading.value = false
		if (Array.isArray(errs)) {
			for (const err of errs) {
				const field = ['login', 'leek', 'email', 'password1', 'password2', 'godfather'][err[0]] ?? 'login'
				if (!errors.value[field]) errors.value[field] = []
				errors.value[field].push(t('error_' + err[1]) as string || (err[1] as string))
			}
		} else {
			const code = typeof errs?.error === 'string' ? errs.error : 'unknown'
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
		margin-bottom: 20px;
	}
	.verify-form {
		display: flex;
		flex-direction: column;
		gap: 10px;
		margin-bottom: 8px;
	}
	.field {
		display: flex;
		flex-direction: column;
		gap: 6px;
		label {
			font-size: 14px;
			font-weight: 500;
			color: var(--text-color);
		}
		input {
			border: 1px solid var(--border);
			border-radius: 4px;
			padding: 10px 12px;
			background: #fff;
			color: #222;
			font-size: 15px;
			&:focus {
				border-color: var(--primary);
				outline: none;
			}
		}
	}
	.error-msg {
		color: #c0392b;
		font-size: 12px;
	}
	body.dark .error-msg {
		color: #e88;
	}
	.oauth-section {
		margin: 4px 0;
	}
	.oauth-buttons {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 8px;
	}
	.separator {
		display: flex;
		align-items: center;
		gap: 10px;
		color: var(--text-color-secondary);
		font-size: 13px;
		margin: 12px 0 6px;
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
