<template lang="html">
	<div>
		<template v-if="success">
			<h1 v-html="$t('payment_success', [vendor])"></h1>
			<div class="panel">
				<div class="content center">
					<br>
					<h4 v-html="$t('you_earn_n_crystals', [crystals])"></h4>
					<br>
				</div>
			</div>
		</template>
		<div v-else>
			<h1 v-html="$t('payment_fail', [vendor])"></h1>
			<div class="panel">
				<div class="content center">
					<br>
					<img src="/image/notgood.png"><br><br>
					<h4>{{ $t('payment_fail_reason', [reason]) }}</h4> 
					<br>
					<a href="/bank"><div class="button">{{ $t('back_to_bank') }}</div></a>
				</div>
			</div>
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
			if (this.success !== undefined) {
				return
			}
			const url = document.location.search
			if (url.length) {
				const match = url.match(/\?paymentId=(.*?)&token=(.*?)&PayerID=(.*?)$/)
				if (match) {
					const payment_id = match[1]
					const token = match[2]
					const payer_id = match[3]
					LeekWars.post('bank/execute-paypal-payment', {payment_id, paypal_token: token, payer_id}).then((data) => {
						if (data.data.success) {
							this.$store.commit('update-crystals', data.data.crystals)
							this.$router.replace('/bank/validate/success/' + data.data.crystals + '/PayPal')
						} else {
							this.$router.replace('/bank/validate/failed/PayPal/' + data.data.error)
						}
					})
				} else {
					this.$router.replace('/bank/validate/failed/PayPal/cancelled')
				}
			} else {
				// TODO
				const STARPASS_CODE = ''
				LeekWars.post('bank/execute-starpass-payment', {code: STARPASS_CODE}).then((data) => {
					if (data.data.success) {
						this.$store.commit('update-crystals', data.data.crystals)
						this.$router.replace('/bank/validate/success/' + data.data.crystals + '/StarPass')
					} else {
						this.$router.replace('/bank/validate/failed/StarPass/' + data.data.error)
					}
				})
			}
		}
	}
</script>

<style lang="scss" scoped>
	.content {
		text-align: center;
	}
	.paypal-button {
		cursor: pointer;
	}
	.content h3 {
		color: red;
	}
	#sk-kit h3:before {
		width: 0;
	}
	#sk-kit h3:after, #sk-kit h1:after {
		border: none;
	}
</style>