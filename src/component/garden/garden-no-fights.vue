<template lang="html">
	<div class="nofight">
		<img src="/image/notgood.png"><br>
		<h4 class="next">{{ $t('no_more_fights') }}</h4>
		<i18n class="next" tag="div" path="next_fight_in">
			<b slot="fights">{{ 50 }}</b>
			<b slot="time">{{ remainingTime }}</b>
		</i18n>
		<i18n class="buy" tag="div" path="buy_fights">
			<span slot="hab" class="hab"></span>
			<span slot="crystal" class="crystal"></span>
			<router-link slot="market" to="/market/100-fights">{{ $t('main.market') }}</router-link>
		</i18n>
	</div>
</template>

<script lang="ts">
	import { mixins } from '@/model/i18n'
	import { LeekWars } from '@/model/leekwars'
	import { Component, Prop, Vue } from 'vue-property-decorator'
	@Component({ mixins })
	export default class GardenNoFights extends Vue {

		get remainingTime() {
			const midnignt = new Date(LeekWars.timeSeconds * 1000)
			midnignt.setUTCHours(23, 0, 0, 0)
			return LeekWars.formatTimeSeconds(Math.round(midnignt.getTime() / 1000 - LeekWars.timeSeconds))
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