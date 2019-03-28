<template lang="html">
	<div>
		<template v-if="success">
			<div class="page-header page-bar">
				<h1 v-html="$t('payment_success', [vendor])"></h1>
			</div>
			<panel class="center">
				<br>
				<h4 v-html="$t('you_earn_n_crystals', [crystals])"></h4>
				<br>
			</panel>
		</template>
		<div v-else>
			<div class="page-header page-bar">
				<h1 v-html="$t('payment_fail', [vendor])"></h1>
			</div>
			<panel class="center">
				<br>
				<img src="/image/notgood.png"><br><br>
				<h4>{{ $t('payment_fail_reason', [reason]) }}</h4> 
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
				return
			}
			const url = document.location!.search
			const match = url.match(/\?paymentId=(.*?)&token=(.*?)&PayerID=(.*?)$/)
			if (match) {
				const payment_id = match[1]
				const token = match[2]
				const payer_id = match[3]
				LeekWars.post('bank/execute-paypal-payment', {payment_id, paypal_token: token, payer_id}).then(data => {
					this.$store.commit('update-crystals', data.crystals)
					this.$router.replace('/bank/validate/success/' + data.crystals + '/PayPal')
				}).error(error => {
					this.$router.replace('/bank/validate/failed/PayPal/' + error)
				})
			} else {
				LeekWars.post('bank/execute-starpass-payment', {code: (window as any).__STARPASS_CODE}).then(data => {
					this.$store.commit('update-crystals', data.crystals)
					this.$router.replace('/bank/validate/success/' + data.crystals + '/StarPass')
				}).error(error => {
					this.$router.replace('/bank/validate/failed/StarPass/' + error)
				})
			}
		}
	}
</script>

<style lang="scss" scoped>
	.paypal-button {
		cursor: pointer;
	}
	.content h3 {
		color: red;
	}
</style>