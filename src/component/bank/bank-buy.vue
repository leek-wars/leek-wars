<template lang="html">
	<div>
		<div class="page-header page-bar">
			<h1>
				<router-link to="/bank">{{ $t('title') }}</router-link> > 
				<span v-html="$t('purshase_title', [data.crystalCount, data.vendor])"></span>
			</h1>
		</div>
		<panel class="first last center">
			<div v-if="data.vendor === 'StarPass'">
				<br>
				<loader v-if="starPassLoading" />
				<div :id="'starpass_' + data.id" @DOMNodeInserted="starPassLoading = false"></div>
				<div ref="starpass"></div>
			</div>
			<div v-else-if="data.vendor === 'PayPal'">
				<br>
				<h4>{{ $t('paypal_message') }}</h4>
				<br>
				<img v-if="!loading" class="paypal-button" src="/image/bank/paypal_buy.gif" @click="clickPayPal">
				<loader v-if="loading" />
			</div>
		</panel>
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
		starPassLoading: boolean = false
		created() {			
			this.pack = parseInt(this.$route.params.pack, 10)
			this.offer = parseInt(this.$route.params.offer, 10)
			LeekWars.get('bank/get-packs').then(data => {
				const pack = data.packs[this.pack]
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
					obj.id = LeekWars.local ? offer.id[1] : offer.id[0]
					LeekWars.post('bank/begin-starpass-payment', {pack_id: this.pack, offer_id: this.offer}).then(() => {
						this.data = obj
						setTimeout(() => this.createStarPass())
					}).error(error => {
						LeekWars.toast(error)
					})
				} else {
					this.data = obj
				}
				LeekWars.setTitle(this.$t('bank.title'), this.$t('bank.purshase_title_text', [crystalCount, vendor]))
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
	.paypal-button {
		cursor: pointer;
	}
	.panel h3 {
		color: red;
	}
	.panel /deep/ .sk-main-content h3:before {
		width: 0;
	}
	.panel /deep/ .sk-main-content h3:after,
	.panel /deep/ .sk-kit-header h1:after {
		border: none;
	}
</style>