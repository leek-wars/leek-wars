<template lang="html">
	<div class="page">
		<div class="page-header page-bar">
			<h1>
				<router-link to="/bank">{{ $t('title') }}</router-link> >
				<span v-if="product" v-html="$t('purshase_title_simple', [product.crystals])"></span>
			</h1>
		</div>
		<panel class="first">

			<v-select v-model="LeekWars.currency" :items="Object.keys(LeekWars.currencies)" hide-details dense variant="solo">
				<template v-slot:selection>
					<flag :code="LeekWars.currencies[LeekWars.currency].flag" :clickable="false" />&nbsp;
					{{ LeekWars.currency }} &nbsp; <span class="symbol">{{ LeekWars.currencies[LeekWars.currency].symbol }}</span>
				</template>
				<template v-slot:item="{ props, item }">
					<v-list-item v-bind="props" class="currency">
						<template #prepend>
							<flag :code="LeekWars.currencies[item.value].flag" :clickable="false" />
						</template>
						<template #append>
							<span class="symbol">{{ LeekWars.currencies[item.value].symbol }}</span>
						</template>
					</v-list-item>
				</template>
			</v-select>

			<div class="container">
				<bank-product v-if="product" :product="product" />

				<!-- <div v-if="data.vendor === 'StarPass'">
					<br>
					<loader v-if="starPassLoading" />
					<div :id="'starpass_' + data.id" @DOMNodeInserted="starPassLoading = false"></div>
					<div ref="starpass"></div>
				</div>
				<div v-else-if="data.vendor === 'PayPal'"> -->
				<div>
					<!-- <br>
					<h4>{{ $t('paypal_message') }}</h4> -->
					<!-- <br> -->
					<div v-if="!loading" id="paypal-button-container"></div>
					<loader v-else />
				</div>
			</div>
		</panel>
	</div>
</template>

<script lang="ts">
	import { LeekWars } from '@/model/leekwars'
	import { Options, Vue, Watch } from 'vue-property-decorator'
	import { loadScript } from "@paypal/paypal-js"
	import { mixins } from '@/model/i18n'
	import { locale } from '@/locale'
	import BankProduct from './bank-product.vue'
	import { store } from '@/model/store'

	@Options({ name: 'bank-buy', i18n: {}, mixins: [...mixins], components: { BankProduct } })
	export default class BankBuy extends Vue {
		pack!: number
		offer!: number
		product: any = null
		loading: boolean = false
		starPassLoading: boolean = false

		created() {
			this.pack = parseInt(this.$route.params.pack, 10)
			this.offer = parseInt(this.$route.params.offer, 10)
			LeekWars.get('bank/get-packs').then(data => {
				const pack = data.packs[this.pack]
				// const offer = pack.offers[this.offer]
				// const vendor = offer.vendor
				this.product = pack
				this.loadPayPal()

				// if (vendor === 'StarPass') {
				// 	obj.id = LeekWars.LOCAL ? offer.id[1] : offer.id[0]
				// 	LeekWars.post('bank/begin-starpass-payment', {pack_id: this.pack, offer_id: this.offer}).then(() => {
				// 		this.data = obj
				// 		setTimeout(() => this.createStarPass())
				// 	}).error(error => {
				// 		LeekWars.toast(error)
				// 	})
				// }
				LeekWars.setTitle(this.$t('title'), this.$t('purshase_title_text_simple', [pack.crystals]))
			})
		}

		loadPayPal() {
			loadScript({
				"client-id": (LeekWars.LOCAL || store.state.farmer?.id === 1) ? "Acg3b4FoxUp3vXX-G4aQ01vc5rkev2DIio8e2_ApB7OVIVHocmuXu7RJcN5zZTHGCOpqf-a-ukdIELDy" : "AesWr04mqzJrZlvdiR99GWBSnvWya49kuhJm84d3bgg7Afq-Ekh7PbunWFL6UOFXdQFw0TGmwr_vzS74",
				currency: LeekWars.currency
			}).then((paypal) => {
				paypal!.Buttons!({
					style: { layout: 'vertical', color: 'blue', shape: 'rect', label:  'paypal', tagline: false },
					// Order is created on the server and the order id is returned
					createOrder: (data, actions) => {
						return new Promise((resolve, reject) => {
							return LeekWars.post('bank/begin-paypal-payment', {pack_id: this.pack, offer_id: 1, currency: LeekWars.currency}).then(resolve)
						})
					},
					// Finalize the transaction on the server after payer approval
					onApprove: (data, actions) => {
						return LeekWars.post('bank/execute-paypal-payment', {order_id: data.orderID}).then(data => {
							this.$store.commit('update-crystals', data.crystals)
							this.$router.replace('/bank/validate/success/' + data.crystals)
						}).error(error => {
							this.$router.replace('/bank/validate/failed/' + error.error)
						})
					}
				}).render('#paypal-button-container')
			})
			.catch((err) => {
				console.error("failed to load the PayPal JS SDK script", err)
			})
		}

		createStarPass() {
			const starpass = document.createElement('script')
			starpass.src = 'https://script.starpass.fr/script.php?idd=' + this.product.id + '&verif_en_php=1&datas='
			starpass.async = true
			const block = this.$refs.starpass as HTMLElement
			if (block) {
				block.appendChild(starpass)
			}
			this.starPassLoading = true
		}
		clickPayPal() {
			this.loading = true
			LeekWars.post('bank/begin-paypal-payment', {pack_id: this.pack, offer_id: this.offer}).then(data => {
				window.location.href = data.url
			})
		}
		@Watch('LeekWars.currency')
		updateCurrency() {
			localStorage.setItem('currency', LeekWars.currency)
			this.loadPayPal()
		}
	}
</script>

<style lang="scss" scoped>
.currency {
	display: flex;
	align-items: center;
}
.flag {
	max-width: 28px;
	max-height: 28px;
}
.first {
	padding: 25px 0;
}
.v-select {
	display: inline-block;
	::v-deep input {
		border: none;
		width: 10px;
	}
}
.container {
	padding: 10px 0px;
	align-items: flex-start;
	gap: 25px;
}
.container > * {
	flex: 1;
}

	.paypal-button {
		display: inline-flex;
		align-items: center;
		cursor: pointer;
		background: #ffc700;
		color: #00315b;
		padding: 12px 50px;
		border-radius: 2px;
		border: 1px solid #ff9500;
		user-select: none;
		margin: 15px 0;
		img {
			height: 22px;
			margin-left: 4px;
		}
	}
	.panel h3 {
		color: red;
	}
	.panel ::v-deep .sk-main-content h3:before {
		width: 0;
	}
	.panel ::v-deep .sk-main-content h3:after,
	.panel ::v-deep .sk-kit-header h1:after {
		border: none;
	}
</style>