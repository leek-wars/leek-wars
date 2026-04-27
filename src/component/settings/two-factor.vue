<template>
	<!-- TODO Translation -->
	<div>
		<div class="content">
			<div class="step">
				<v-btn v-if="step === 0" @click="nextStep">Activate two factor authentication</v-btn>
			</div>
			<div v-if="step === 1" class="step">
				<div class="title">Step 1 / 3</div>
				<br>
				Download <b>Google Authenticator</b> app
				<br>
				<img width="100" src="/image/google_auth.png">
				<br>
				<a href="https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2" target="_blank" rel="noopener">Android</a>
				or <a href="https://itunes.apple.com/fr/app/google-authenticator/id388497605" target="_blank" rel="noopener">iOS</a>

				<div class="buttons">
					<div class="back" @click="previousStep">Back</div>
					<div class="next" @click="nextStep">Next</div>
				</div>
			</div>
			<div v-if="step === 2" class="step">
				<div class="title">Step 2 / 3</div>
				<br>
				Scan this <b>QR Code</b> from Google Authenticator app
				<br>
				<img :src="QRCode">
				<br>
				Or enter this <b>secret key</b> in the app:
				<div class="secret">{{ secret }}</div>
				(don't give it to anyone!)
				<div class="buttons">
					<div class="back" @click="previousStep">Back</div>
					<div class="next" @click="nextStep">Next</div>
				</div>
			</div>
			<div v-if="step === 3" class="step">
				<div class="title">Step 3 / 3</div>
				<br>
				Test a code to finish the activation:
				<br><br>
				<loader v-if="validating" :size="40" />
				<input v-else v-model="code" class="code" type="text" autocomplete="off" autocorrect="off" autocapitalize="off" placeholder="XXX XXX" @keydown.enter="validateCode">

				<div class="buttons">
					<div class="back" @click="previousStep">Back</div>
					<div class="back" @click="validateCode">Validate</div>
				</div>
			</div>
			<div v-if="step === 4" class="step final">
				Two factor authentication enabled! Congratulations!
				<br><br>
				<v-btn>Disable</v-btn>
			</div>
		</div>

		<popup v-model="twoFactorConfirmDialog" :width="750">
			<template #icon>
				<v-icon>mdi-security</v-icon>
			</template>
			<template #title>Enter your password to validate</template>
			Password : <input id="two-factor-confirm-password" type="password">
			<template #actions>
				<div v-ripple class="action dismiss">Cancel</div>
				<div v-ripple class="action green">Validate</div>
			</template>
		</popup>
	</div>
</template>

<script setup lang="ts">
import { LeekWars } from '@/model/leekwars'
import { ref } from 'vue'

defineOptions({ name: 'two-factor' })

const twoFactorConfirmDialog = ref(false)
const step = ref(0)
const code = ref('')
const QRCode = ref('')
const secret = ref('')
const validating = ref(false)

function nextStep() {
	step.value++
	if (step.value === 1) {
		LeekWars.post('farmer/enable-two-factor-authentication', {}).then(data => {
			QRCode.value = data.qrcode
			secret.value = data.secret
		})
	}
}

function previousStep() {
	step.value--
}

function validateCode() {
	validating.value = true
	;(LeekWars.post('farmer/confirm-enable-two-factor-authentication', {code: code.value}).then(_data => {
		validating.value = false
		nextStep()
	}) as any).error((_error: any) => {
		validating.value = false
		LeekWars.toast('Wrong code!')
	})
}
</script>

<style lang="scss" scoped>
	.title {
		margin-bottom: 15px;
	}
	.buttons {
		display: flex;
		padding: 0;
		margin-bottom: -15px;
		margin-left: -15px;
		margin-right: -15px;
		margin-top: 10px;
		div {
			flex: 1;
			cursor: pointer;
			padding: 8px 0;
			text-transform: uppercase;
			font-weight: bold;
		}
		div:hover {
			background: white;
		}
	}
	.step .title {
		background: #5fad1b;
		color: white;
		font-weight: bold;
		padding: 5px 10px;
		display: inline-block;
	}
	.code {
		font-size: 26px;
		padding: 5px 10px;
		max-width: 120px;
	}
	.code::-webkit-input-placeholder {
		color: #ddd;
	}
	.secret {
		margin: 5px 0;
	}
	.loader {
		margin: 0;
		padding: 1px 15px;
	}
</style>