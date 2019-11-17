<template lang="html">
	<div>
		<template v-if="success">
			<div class="page-header page-bar">
				<h1 v-html="$t('payment_success', [vendor])"></h1>
			</div>
			<panel class="first center">
				<br>
				<div class="thank-you">{{ $t('thank_you') }}</div>
				<div class="thank-you-2">{{ $t('for_your_support') }}</div>
				<br><br>
				<h4>
					<i18n path="you_earn_n_crystals">
						<div slot="crystals" class="crystals card">
							{{ crystals }}
							<span class='crystal'></span>
						</div>
					</i18n>
				</h4>
				<br><br><br>
				<router-link to="/bank">
					<v-btn color="primary"><i class="material-icons">undo</i>&nbsp;{{ $t('back_to_bank') }}</v-btn>
				</router-link>
				<br><br>
			</panel>
		</template>
		<div v-else-if="error">
			<div class="page-header page-bar">
				<h1 v-html="$t('payment_fail', [vendor])"></h1>
			</div>
			<panel class="first center">
				<br>
				<img src="/image/notgood.png"><br><br>
				<h4>{{ $t('payment_fail_reason', [$t(reason)]) }}</h4>
				<br>
				<router-link to="/bank"><v-btn>{{ $t('back_to_bank') }}</v-btn></router-link>
			</panel>
		</div>
	</div>
</template>

<script lang="ts">
	import { LeekWars } from '@/model/leekwars'
	import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
	@Component({
		name: 'bank-validate', i18n: {},
		props: ['success']
	})
	export default class BankValidate extends Vue {
		@Prop() success!: boolean
		error: boolean = false
		reason: string | null = null
		crystals: number = 0
		vendor: string | null = null
		created() {
			this.update()
		}
		@Watch('$route')
		update() {
			this.reason = 'reason' in this.$route.params ? this.$route.params.reason : ''
			this.crystals = 'crystals' in this.$route.params ? parseInt(this.$route.params.crystals, 10) : 0
			this.vendor = 'vendor' in this.$route.params ? this.$route.params.vendor : ''
			LeekWars.setTitle(this.success ? this.$t('payment_success', [this.vendor]) : this.$t('payment_fail', [this.vendor]))
			if (this.success !== undefined) {
				this.error = true
				return
			}
			const url = document.location!.search
			if (LeekWars.objectSize(this.$route.query)) { // PayPal return url: /\?paymentId=(.*?)&token=(.*?)&PayerID=(.*?)$/
				const payment_id = this.$route.query.paymentId
				const token = this.$route.query.token
				const payer_id = this.$route.query.PayerID
				LeekWars.post('bank/execute-paypal-payment', {payment_id, paypal_token: token, payer_id}).then(data => {
					this.$store.commit('update-crystals', data.crystals)
					this.$router.replace('/bank/validate/success/' + data.crystals + '/PayPal')
				}).error(error => {
					this.$router.replace('/bank/validate/failed/PayPal/' + error.error)
					this.error = true
				})
			} else {
				LeekWars.post('bank/execute-starpass-payment', {code: (window as any).__STARPASS_CODE}).then(data => {
					this.$store.commit('update-crystals', data.crystals)
					this.$router.replace('/bank/validate/success/' + data.crystals + '/StarPass')
				}).error(error => {
					this.$router.replace('/bank/validate/failed/StarPass/' + error.error)
					this.error = true
				})
			}
		}
	}
</script>

<style lang="scss" scoped>
	.content h3 {
		color: red;
	}
	.crystals {
		display: inline-block;
		padding: 4px 8px;
		margin: 0 2px;
		color: black;
	}
	.thank-you {
		font-size: 30px;
		font-weight: 300;
		margin-bottom: 10px;
	}
	.thank-you-2 {
		font-size: 20px;
		color: #777;
	}
</style>