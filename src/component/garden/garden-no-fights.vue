<template lang="html">
	<div class="nofight">
		<img src="/image/notgood.png">
		<h4 class="next">{{ $t('no_more_fights') }}</h4>
		<div v-if="canbuy && $store.state.farmer?.buy_fights_enabled" class="buy-buttons">
			<v-btn class="buy-habs-button" :disabled="$store.state.farmer.habs_fights || $store.state.farmer.habs < habsPrice" :loading="buyingHabs" @click="buyHabs">
				<div class="buy-btn-content">
					<template v-if="$store.state.farmer.habs_fights">
						<div class="flex"><v-icon>mdi-sword-cross</v-icon> {{ $t('buy_50_fights') }}</div>
						<div class="buy-price">{{ $t('already_bought') }}</div>
					</template>
					<template v-else>
						<div class="flex"><v-icon>mdi-sword-cross</v-icon> {{ $t('buy_50_fights') }}</div>
						<div class="buy-price">{{ $filters.number(habsPrice) }} <span class="hab"></span></div>
					</template>
				</div>
			</v-btn>
			<v-btn class="buy-crystals-button" :loading="buyingCrystals" @click="buyCrystals">
				<div class="buy-btn-content">
					<div class="flex"><v-icon>mdi-sword-cross</v-icon> {{ $t('buy_100_fights') }}</div>
					<div class="buy-price">100 <span class="crystal"></span></div>
				</div>
			</v-btn>
		</div>
		<i18n-t v-if="canbuy" class="next" tag="div" keypath="next_fight_in">
			<template #fights>
				<b>{{ 50 }}</b>
			</template>
			<template #time>
				<b>{{ $filters.timeseconds(remainingTime) }}</b>
			</template>
		</i18n-t>
	</div>
</template>

<script lang="ts">
	import { mixins } from '@/model/i18n'
	import { LeekWars } from '@/model/leekwars'
	import { store } from '@/model/store'
	import { Options, Prop, Vue } from 'vue-property-decorator'

	@Options({ i18n: {}, mixins: [...mixins] })
	export default class GardenNoFights extends Vue {

		@Prop() canbuy!: boolean
		buyingHabs: boolean = false
		buyingCrystals: boolean = false

		get remainingTime() {
			const midnignt = new Date(LeekWars.timeSeconds * 1000)
			midnignt.setUTCHours(24 + this.getFranceOffset(), 0, 0, 0)
			return Math.round(midnignt.getTime() / 1000 - LeekWars.timeSeconds)
		}

		get habsPrice() {
			const x = store.state.farmer!.total_level
			return Math.round(10_000 + Math.pow((x - 1) / 1203, 1.5) * (5_000_000 - 10_000))
		}

		getFranceOffset() {
			const t1 = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Paris' }))
			const t2 = new Date(new Date().toLocaleString('en-US', { timeZone: 'GMT' }))
			return (t2.getTime() - t1.getTime()) / 1000 / 3600
		}

		buyHabs() {
			this.buyingHabs = true
			LeekWars.post('market/buy-habs-quantity', { item_id: '50fights', quantity: 1 }).then(data => {
				store.commit('update-habs', -this.habsPrice)
				store.commit('update-fights', data.fights)
				store.commit('update-bought-fights', data.fights)
				if (store.state.farmer) store.state.farmer.habs_fights = true
				LeekWars.toast(this.$t('fights_bought', [data.fights]))
				this.$emit('bought')
			}).error(error => {
				LeekWars.toast(this.$t('market.error_' + error.error) || error.error)
			}).finally(() => {
				this.buyingHabs = false
			})
		}

		buyCrystals() {
			if (this.$store.state.farmer && this.$store.state.farmer.crystals < 100) {
				this.$router.push('/bank?ref=garden_buy')
				return
			}
			this.buyingCrystals = true
			LeekWars.post('market/buy-crystals-quantity', { item_id: '100fights', quantity: 1 }).then(data => {
				store.commit('update-crystals', -100)
				store.commit('update-fights', data.fights)
				store.commit('update-bought-fights', data.fights)
				LeekWars.toast(this.$t('fights_bought', [data.fights]))
				this.$emit('bought')
			}).error(error => {
				LeekWars.toast(this.$t('market.error_' + error.error) || error.error)
			}).finally(() => {
				this.buyingCrystals = false
			})
		}
	}
</script>

<style lang="scss" scoped>
	.nofight {
		padding: 20px;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 10px;
		& > img {
			width: 100px;
			height: 100px;
		}
	}
	.buy, .next {
		padding: 6px;
	}
	a {
		color: #5fad1b;
		font-weight: 500;
	}
	.buy-buttons {
		display: flex;
		justify-content: center;
		gap: 8px;
		margin: 12px 0;
		flex-wrap: wrap;
	}
	.buy-habs-button, .buy-crystals-button {
		min-width: 200px;
		height: auto !important;
		padding: 8px 16px !important;
		display: flex;
		img {
			width: 22px;
		}
		.crystal {
    		margin-bottom: -12px;
			width: 15px;
		}
	}
	.buy-btn-content {
		display: flex;
		align-items: center;
		flex-direction: column;
		gap: 6px;
		.flex {
			gap: 4px;
			align-items: center;
		}
	}
	.buy-price {
		font-size: 17px;
	}
	.buy-crystals-button {
		background: #e91e9e;
		color: white;
	}
</style>