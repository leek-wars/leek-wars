<template lang="html">
	<div>
		<h1>
			<router-link to="/bank">{{ $t('title') }}</router-link> > 
			<span v-html="$t('purshase_title', [data.crystalCount, data.vendor])"></span>
		</h1>
		<div class="panel">
			<div class="content">
				<div v-if="data.vendor == 'StarPass'">
					<br>
					<div :id="'starpass_' + data.id"></div>
					<div id="starpass-block"></div>
				</div>
				<div v-else-if="data.vendor == 'PayPal'">
					<br>
					<br>
					<h4>{{ $t('paypal_message') }}</h4>
					<br>
					<img v-if="!loading" class="paypal-button" src="/image/bank/paypal_buy.gif" @click="clickPayPal">
					<loader v-if="loading" />
				</div>
			</div>
		</div>
	</div>
</template>

<script lang="ts">
	import { LeekWars } from '@/model/leekwars'
	import { Component, Vue } from 'vue-property-decorator'

	@Component({ name: 'bank-buy', i18n: {} })
	export default class BankBuy extends Vue {
		pack!: number
		offer!: number
		data: any = {}
		loading: boolean = false
		created() {
			// var starpass = function(d,s,id){var js,fjs=d.getElementsByTagName(s)[0],
			// 	p=/^http:/.test(d.location)?'http':'https';
			// if(!d.getElementById(id)){
			// 	js=d.createElement(s);js.id=id;js.src=p+'://platform.twitter.com/widgets.js';
			// fjs.parentNode.insertBefore(js,fjs);}};
			// starpass(document, 'script', 'twitter-wjs');

			const starpass = document.createElement('script')
			starpass.src = 'https://script.starpass.fr/script.php?idd={data.id}&amp;verif_en_php=1&amp;datas='
			starpass.async = true
			const block = document.getElementById('starpass-block')
			if (block) {
				block.appendChild(starpass)
			}
			this.pack = parseInt(this.$route.params.pack, 10)
			this.offer = parseInt(this.$route.params.offer, 10)

			LeekWars.get('bank/get-packs').then((data: any) => {

				const pack = data.data.packs[this.pack]
				const offer = pack.offers[this.offer]
				const vendor = offer.vendor
				const crystalCount = pack.crystals
				const obj = {
					id: 0,
					vendor,
					crystalCount,
					packID: this.pack,
					offerID: this.offer
				}
				if (vendor === 'StarPass') {
					obj.id = LeekWars.local ? offer.id[1] : LeekWars.beta ? offer.id[2] : offer.id[0]
					LeekWars.post('bank/begin-starpass-payment', {pack_id: this.pack, offer_id: this.offer}).then(() => {
						if (data.data.success) {
							this.data = obj
						} else {
							// TODO
							// LeekWars.error()
						}
					})
				} else {
					this.data = obj
				}
			})
		}

		clickPayPal() {
			this.loading = true
			LeekWars.post('bank/begin-paypal-payment', {pack_id: this.pack, offer_id: this.offer}).then((data: any) => {
				if (data.data.success) {
					window.location.href = data.data.url
				}
			})
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