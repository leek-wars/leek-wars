<template lang="html">
	<div class="nofight">
		<img src="/image/notgood.png"><br>
		<h4 class="next">{{ $t('no_more_fights') }}</h4>
		<i18n v-if="canbuy" class="next" tag="div" path="next_fight_in">
			<b slot="fights">{{ 50 }}</b>
			<b slot="time">{{ remainingTime | time }}</b>
		</i18n>
		<i18n v-if="canbuy" class="buy" tag="div" path="buy_fights">
			<span slot="hab" class="hab"></span>
			<span slot="crystal" class="crystal"></span>
			<router-link slot="market" to="/market/fight_pack_100">{{ $t('main.market') }}</router-link>
		</i18n>
	</div>
</template>

<script lang="ts">
	import { mixins } from '@/model/i18n'
	import { LeekWars } from '@/model/leekwars'
	import { Component, Prop, Vue } from 'vue-property-decorator'

	@Component({ i18n: {}, mixins: [...mixins] })
	export default class GardenNoFights extends Vue {

		@Prop() canbuy!: boolean

		get remainingTime() {
			const midnignt = new Date(LeekWars.timeSeconds * 1000)
			midnignt.setUTCHours(24 + this.getFranceOffset(), 0, 0, 0)
			return Math.round(midnignt.getTime() / 1000 - LeekWars.timeSeconds)
		}

		getFranceOffset() {
			const t1 = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Paris' }))
			const t2 = new Date(new Date().toLocaleString('en-US', { timeZone: 'GMT' }))
			return (t2.getTime() - t1.getTime()) / 1000 / 3600
		}
	}
</script>

<style lang="scss" scoped>
	.nofight {
		padding: 20px;
	}
	.buy, .next {
		padding: 6px;
	}
	a {
		color: #5fad1b;
		font-weight: 500;
	}
</style>