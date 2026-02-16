<template lang="html">
	<div class="nofight">
		<img src="/image/notgood.png"><br>
		<h4 class="next">{{ $t('no_more_fights') }}</h4>
		<i18n-t v-if="canbuy" class="next" tag="div" keypath="next_fight_in">
			<template #fights>
				<b>{{ 50 }}</b>
			</template>
			<template #time>
				<b>{{ $filters.timeseconds(remainingTime) }}</b>
			</template>
		</i18n-t>
		<i18n-t v-if="canbuy" class="buy" tag="div" keypath="buy_fights">
			<template #hab>
				<span class="hab"></span>
			</template>
			<template #crystal>
				<span class="crystal"></span>
			</template>
			<template #market>
				<router-link to="/market/fight_pack_100">{{ $t('main.market') }}</router-link>
			</template>
		</i18n-t>
	</div>
</template>

<script lang="ts">
	import { mixins } from '@/model/i18n'
	import { LeekWars } from '@/model/leekwars'
	import { Options, Prop, Vue } from 'vue-property-decorator'

	@Options({ i18n: {}, mixins: [...mixins] })
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