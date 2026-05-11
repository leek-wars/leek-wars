<template lang="html">
	<popup v-model="show" :width="540" icon="mdi-shield-check" :title="t('title')" :persistent="true">
		<div class="intro">{{ t('intro') }}</div>

		<div class="rewards">
			<div class="reward">
				<v-icon size="32" color="primary">mdi-sword-cross</v-icon>
				<div class="reward-text"><b>20</b> {{ t('reward_fights') }}</div>
			</div>
			<div class="reward">
				<v-icon size="32" color="#dba00b">mdi-cash-multiple</v-icon>
				<div class="reward-text"><b>100 000</b> {{ t('reward_habs') }}</div>
			</div>
			<div class="reward">
				<v-icon size="32" color="#9b59b6">mdi-diamond-stone</v-icon>
				<div class="reward-text"><b>10</b> {{ t('reward_crystals') }}</div>
			</div>
			<div class="reward">
				<img src="/image/hat/cap.png" width="48" alt="cap" class="cap">
				<div class="reward-text">{{ t('reward_hat') }}</div>
			</div>
		</div>

		<form class="verify-form" @submit.prevent="submit">
			<div class="field">
				<label>{{ t('login') }}</label>
				<input v-model="login" type="text" required maxlength="30" autocomplete="username">
				<div v-for="e in errors.login" :key="e" class="error-msg">{{ e }}</div>
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
			<v-btn variant="text" :disabled="submitting" @click="later">{{ t('later') }}</v-btn>
			<v-btn color="primary" :loading="submitting" @click="submit">{{ t('validate') }}</v-btn>
		</template>
	</popup>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { LeekWars } from '@/model/leekwars'
import { useNamespacedT } from '@/model/i18n'
import Popup from '@/component/popup.vue'

defineOptions({ name: 'VerifyPopup' })

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()

const t = useNamespacedT('verify-popup')

const show = ref(props.modelValue)
const submitting = ref(false)
const login = ref('')
const email = ref('')
const password = ref('')
const errors = ref<Record<string, string[]>>({})

function close() {
	show.value = false
	emit('update:modelValue', false)
}

function later() {
	// Cooldown 24h avant nouvelle apparition
	localStorage.setItem('verify-popup-snoozed-until', String(Date.now() + 24 * 60 * 60 * 1000))
	close()
}

function submit() {
	errors.value = {}
	submitting.value = true
	LeekWars.post('farmer/verify', {
		login: login.value,
		email: email.value,
		password: password.value,
		godfather: '',
	}).then(() => {
		LeekWars.toast(t('mail_sent'))
		close()
	}).error(errs => {
		for (const err of errs) {
			const field = ['login', 'leek', 'email', 'password1', 'password2', 'godfather'][err[0]] ?? 'login'
			if (!errors.value[field]) errors.value[field] = []
			errors.value[field].push(t('error_' + err[1]) as string || (err[1] as string))
		}
	}).finally(() => {
		submitting.value = false
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
		margin-bottom: 20px;
	}
	.reward {
		display: flex;
		align-items: center;
		gap: 10px;
		background: var(--background-secondary);
		padding: 10px 12px;
		border-radius: 6px;
	}
	.reward-text {
		font-size: 14px;
		b { font-size: 16px; }
	}
	.cap {
		flex-shrink: 0;
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
		gap: 4px;
		label {
			font-size: 13px;
			color: var(--text-color-secondary);
		}
		input {
			border: 1px solid var(--border);
			border-radius: 4px;
			padding: 8px 10px;
			background: var(--background);
			color: var(--text-color);
		}
	}
	.error-msg {
		color: #c0392b;
		font-size: 12px;
	}
</style>
