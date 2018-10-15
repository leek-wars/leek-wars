<template>
	<!-- TODO Translation -->
	<div>
		<div class="content">
			<div class="step">
				<div v-if="step === 0" class="button" @click="nextStep">Activate two factor authentication</div>
			</div>
			<div v-if="step === 1" class="step">
				<div class="title">Step 1 / 3</div>
				<br>
				Download <b>Google Authenticator</b> app
				<br>
				<img width="100" src="/image/google_auth.png">
				<br>
				<a href="https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2" target="_blank">Android</a>
				or <a href="https://itunes.apple.com/fr/app/google-authenticator/id388497605" target="_blank">iOS</a>

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
				<input v-else class="code" v-model="code" type="text" autocomplete="off" autocorrect="off" autocapitalize="off" placeholder="XXX XXX" @keydown.enter="validateCode">
			
				<div class="buttons">
					<div class="back" @click="previousStep">Back</div>
					<div class="back" @click="validateCode">Validate</div>
				</div>
			</div>
			<div v-if="step === 4" class="step final">
				Two factor authentication enabled! Congratulations!
				<br><br>
				<div class="button">Disable</div>
			</div>
		</div>

		<v-dialog v-model="twoFactorConfirmDialog" max-width="750">
			<div class="title">Enter your password to validate</div>
			<div class="content">Password : <input id="two-factor-confirm-password" type="password"></div>
			<div class="actions">
				<div class="action dismiss">Cancel</div>
				<div class="action green">Validate</div>
			</div>
		</v-dialog>
	</div>
</template>

<script lang="ts">
	import { LeekWars } from '@/model/leekwars'
	import { Component, Vue } from 'vue-property-decorator'

	@Component({ name: 'two-factor' })
	export default class TwoFactor extends Vue {
		twoFactorConfirmDialog: boolean = false
		step: number = 0
		code: string = ''
		QRCode: string = ''
		secret: string = ''
		validating: boolean = false

		nextStep() {
			this.step++
			if (this.step === 1) {
				LeekWars.post('farmer/enable-two-factor-authentication', {}).then((data) => {
					this.QRCode = data.data.qrcode
					this.secret = data.data.secret
				})
			}
		}
		previousStep() {
			this.step--
		}
		validateCode() {
			this.validating = true
			LeekWars.post('farmer/confirm-enable-two-factor-authentication', {code: this.code}).then((data) => {
				this.validating = false
				if (data.data.success) {
					this.nextStep()
				} else {
					LeekWars.toast('Wrong code!')
				}
			})
		}
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
		background: #5FAD1B;
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