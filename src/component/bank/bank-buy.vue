<template lang="html">
	<div class="page">
		<div class="page-header page-bar">
			<h1>
				<router-link to="/bank">{{ $t('title') }}</router-link> >
				<span v-if="data" v-html="$t('purshase_title_simple', [data.crystalCount])"></span>
			</h1>
		</div>
		<panel class="first center">

			<div class="container">
				<div v-if="data" class="pack card">
					<img :src="'/image/bank/crystals_' + data.packID + '.png'">
					<i18n tag="h2" path="main.pack_of_n_crystals">
						<b slot="crystals">{{ data.crystalCount }}</b>
					</i18n>
					<div class="buy">
						<span class="price">{{ data.price }}€</span>
						<div>
							<v-icon>mdi-credit-card-outline</v-icon> {{ $t('main.credit_card') }}
						</div>
						<div>
							<img :src="'/image/bank/paypal.png'">
						</div>
					</div>
				</div>
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
	import { Component, Vue } from 'vue-property-decorator'
	import { loadScript } from "@paypal/paypal-js"
	import { mixins } from '@/model/i18n'

	@Component({ name: 'bank-buy', i18n: {}, mixins: [...mixins] })
	export default class BankBuy extends Vue {
		pack!: number
		offer!: number
		data: any = null
		loading: boolean = false
		starPassLoading: boolean = false
		created() {
			this.pack = parseInt(this.$route.params.pack, 10)
			this.offer = parseInt(this.$route.params.offer, 10)
			LeekWars.get('bank/get-packs').then(data => {
				const pack = data.packs[this.pack]
				// const offer = pack.offers[this.offer]
				// const vendor = offer.vendor
				const crystalCount = pack.crystals
				const obj = {
					id: 0,
					// vendor,
					crystalCount,
					packID: this.pack,
					offerID: this.offer,
					price: pack.price
				}
				// if (vendor === 'StarPass') {
				// 	obj.id = LeekWars.LOCAL ? offer.id[1] : offer.id[0]
				// 	LeekWars.post('bank/begin-starpass-payment', {pack_id: this.pack, offer_id: this.offer}).then(() => {
				// 		this.data = obj
				// 		setTimeout(() => this.createStarPass())
				// 	}).error(error => {
				// 		LeekWars.toast(error)
				// 	})
				// } else {
					loadScript({
						// "client-id": "Acg3b4FoxUp3vXX-G4aQ01vc5rkev2DIio8e2_ApB7OVIVHocmuXu7RJcN5zZTHGCOpqf-a-ukdIELDy", // Sandbox
						"client-id": "AesWr04mqzJrZlvdiR99GWBSnvWya49kuhJm84d3bgg7Afq-Ekh7PbunWFL6UOFXdQFw0TGmwr_vzS74",
						currency: "EUR"
					}).then((paypal) => {
						paypal!.Buttons!({
							style: { layout: 'vertical', color: 'blue', shape: 'rect', label:  'paypal', tagline: false },
							// Order is created on the server and the order id is returned
							createOrder: (data, actions) => {
								return new Promise((resolve, reject) => {
									return LeekWars.post('bank/begin-paypal-payment', {pack_id: this.pack, offer_id: 1}).then(resolve)
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
					this.data = obj
				// }
				LeekWars.setTitle(this.$t('title'), this.$t('purshase_title_text', [crystalCount]))
			})
		}
		createStarPass() {
			const starpass = document.createElement('script')
			starpass.src = 'https://script.starpass.fr/script.php?idd=' + this.data.id + '&verif_en_php=1&datas='
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
	}
</script>

<style lang="scss" scoped>
.container {
	padding: 50px 10px;
	align-items: flex-start;
	gap: 25px;
}
.container > * {
	flex: 1;
}
.pack {
	padding: 10px;
	min-height: 90px;
	text-align: left;
	h2 {
		margin-bottom: 8px;
		margin-top: 3px;
		font-size: 20px;
	}
	> img {
		float: left;
		margin-right: 15px;
		margin-left: 3px;
		height: 80px;
		width: 85px;
		margin-top: 5px;
		object-fit: contain;
	}
	.buy {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		align-items: center;
		div {
			border-radius: 2px;
			padding: 5px 10px;
			margin: 5px 0;
			display: inline-flex;
			border: 1px solid #ccc;
			border-radius: 4px;
			display: flex;
			align-items: center;
			gap: 4px;
			i {
				font-size: 30px;
			}
		}
	}
	.price {
		font-weight: 400;
		font-size: 25px;
		color: #555;
		margin-right: 10px;
	}
	.buy img {
		vertical-align: middle;
		height: 30px;
	}
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