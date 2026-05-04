<template lang="html">
	<div>
		<h1>{{ $t('title') }}</h1>
		<panel class="first">
			<template v-if="state == 'change_password'">
				<div>
					{{ $t('enter_a_new_password') }}
				</div>
				<form @submit.prevent="submitResetForm">
					<br>
					<h4>{{ $t('new_password') }}</h4>
					<input v-model="password" name="password" type="password">

					<h4>{{ $t('confirm') }}</h4>
					<input v-model="password2" name="password2" type="password">

					<br>
					<br>
					<div class="center">
						<v-btn type="submit">{{ $t('change_password') }}</v-btn>
					</div>
					<br>
					<div class="error"></div>
				</form>
			</template>

			<template v-else-if="state == 'email_sent'">
				<div class="center">
					<img src="/image/map/nexus_block_small.png">
					<br>
					<br>
					<i18n-t keypath="mail_sent">
						<template #email>
							<b>{{ $route.params.email }}</b>
						</template>
					</i18n-t>
					<br>
					<br>
				</div>
			</template>

			<div v-else>
				<div>{{ $t('email_will_be_sent') }}</div>
				<form @submit.prevent="submitForm">
					<br>
					<h2>{{ $t('email_address') }}</h2>
					<input v-model="email" type="text" name="email">
					<br><br>
					<div class="center">
						<v-btn type="submit">{{ $t('ask_new_password') }}</v-btn>
					</div>
					<br>
					<div class="error"></div>
				</form>
			</div>
		</panel>
	</div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { LeekWars } from '@/model/leekwars'
import { mixins } from '@/model/i18n'

defineOptions({ name: 'forgot_password', i18n: {}, mixins: [...mixins] })

defineProps<{
	state?: string
}>()

const t = useNamespacedT('forgot_password')
const route = useRoute()
const router = useRouter()

const email = ref('')
const password = ref('')
const password2 = ref('')

LeekWars.setTitle(t('title'))

function submitForm() {
	LeekWars.post('farmer/forgot-password', {email: email.value}).then(() => {
		LeekWars.toast(t('mail_sent', {email: email.value}))
		router.push('/forgot-password/email-sent/' + email.value)
	}).catch((err: any) => {
		LeekWars.toast(t(err.error, err.params))
	})
	return false
}

function submitResetForm() {
	if (password.value !== password2.value) {
		LeekWars.toast(t('error_not_same_password'))
		return false
	}
	LeekWars.post('farmer/forgot-password-change', {farmer_id: route.params.id, new_password: password.value, code: route.params.code}).then(() => {
		LeekWars.toast(t('password_changed'))
		router.push('/login')
	}).catch((err: any) => {
		LeekWars.toast(t('error_' + err.error, err.params))
	})
	return false
}
</script>

<style lang="scss" scoped>
	form {
		text-align: left;
		width: 300px;
		margin: 0 auto;
	}
	form input[type="text"], form input[type="password"] {
		width: 100%;
		margin-top: 5px;
	}
	.error {
		color: red;
		text-align: center;
	}
</style>