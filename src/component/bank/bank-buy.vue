<template lang="html">
	<div>
		<div class="page-header page-bar">
			<h1>
				<router-link to="/bank">{{ $t('title') }}</router-link> > 
				<span v-html="$t('purshase_title', [data.crystalCount, data.vendor])"></span>
			</h1>
		</div>
		<div class="panel first last">
			<div class="content">
				<div v-if="data.vendor === 'StarPass'">
					<br>
					<loader v-if="starPassLoading" />
					<div :id="'starpass_' + data.id" @DOMNodeInserted="starPassLoading = false"></div>
					<div ref="starpass"></div>
				</div>
				<div v-else-if="data.vendor === 'PayPal'">
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
		starPassLoading: boolean = false
		created() {			
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
					obj.id = LeekWars.local ? offer.id[1] : offer.id[0]
					LeekWars.post('bank/begin-starpass-payment', {pack_id: this.pack, offer_id: this.offer}).then(() => {
						if (data.data.success) {
							this.data = obj
							setTimeout(() => this.createStarPass())
						} else {
							LeekWars.toast(data.data.error)
						}
					})
				} else {
					this.data = obj
				}
				LeekWars.setTitle(this.$t('bank.title'), this.$t('bank.purshase_title_text', [crystalCount, vendor]))
			})
		}
		createStarPass() {
			const starpass = document.createElement('script')
			starpass.src = 'https://script.starpass.fr/script.php?idd=' + this.data.id + '&amp;verif_en_php=1&amp;datas='
			starpass.async = true
			const block = this.$refs.starpass as HTMLElement
			if (block) {
				block.appendChild(starpass)
			}
			this.starPassLoading = true
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
	.content /deep/ .sk-main-content h3:before {
		width: 0;
	}
	.content /deep/ .sk-main-content h3:after,
	.content /deep/ .sk-kit-header h1:after {
		border: none;
	}
</style>