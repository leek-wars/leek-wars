<template lang="html">
	<div>
		<h1>{{ $t('title') }}</h1>
		<panel class="first">
			<template v-if="state == 1">
				<div>
					{{ $t('enter_a_new_email') }}
				</div>
				<form @submit.prevent="submit">
					<br>
					<h4>{{ $t('new_email') }}</h4>
					<input v-model="email" name="email" type="email">
					<br><br>
					<h4>{{ $t('confirm') }}</h4>
					<input v-model="email2" name="email2" type="email">

					<br>
					<br>
					<div class="center">
						<v-btn type="submit">{{ $t('send_confirmation') }}</v-btn>
					</div>
					<br>
					<div class="error">{{ error }}</div>
				</form>
			</template>

			<template v-else-if="state == 2">
				<loader v-if="!error" />
				<div class="center" v-else>
					<img src="/image/notgood.png">
					<br><br>
					<div class="error">{{ error }}</div>
				</div>
			</template>

			<template v-else-if="state == 3">
				<div class="center">
					<img src="/image/map/nexus_block_small.png">
					<br>
					<br>
					<i18n-t keypath="email_sent">
						<template #email>
							<b>{{ email }}</b>
						</template>
					</i18n-t>
					<br>
					<br>
				</div>
			</template>

			<template v-else-if="state == 4">
				<div class="center">
					<img src="/image/map/nexus_block_small.png">
					<br>
					<br>
					{{ $t('email_changed_success') }}
					<br>
					<br>
					<v-btn color="primary">{{ $t('back_home') }}</v-btn>
				</div>
			</template>
		</panel>
	</div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { LeekWars } from '@/model/leekwars'
import { mixins } from '@/model/i18n'

defineOptions({ name: 'change_email', i18n: {}, mixins: [...mixins] })

const { t } = useI18n()
const route = useRoute()

const state = ref(parseInt(route.params.state as string, 10) || 0)
const email = ref('')
const email2 = ref('')
const error = ref<string | null>(null)

LeekWars.setTitle(t('title'))

if (state.value === 2) {
	LeekWars.post('farmer/change-email3', {token: route.params.token}).then(() => {
		LeekWars.toast(t('email_changed'))
		state.value = 4
	}).catch((err: any) => {
		error.value = err
		LeekWars.toast(err)
	})
}

function submit() {
	if (email.value !== email2.value) {
		LeekWars.toast(t('error_not_same_email'))
		return false
	}
	LeekWars.post('farmer/change-email2', {email: email.value, token: route.params.token}).then(() => {
		LeekWars.toast(t('email_sent', {email: email.value}))
		state.value = 3
	}).catch((err: any) => {
		error.value = err
		LeekWars.toast(err)
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
	form input[type="text"], form input[type="email"] {
		width: 100%;
		margin-top: 5px;
	}
	.error {
		color: red;
		text-align: center;
	}
</style>