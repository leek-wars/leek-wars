<template lang="html">
	<div class="pack card">
		<img :src="'/image/bank/crystals_' + product.id + '.png'">
		<i18n tag="h2" path="main.pack_of_n_crystals">
			<b slot="crystals">{{ product.crystals }}</b>
		</i18n>
		<div class="buy">
			<span v-if="LeekWars.currencies[LeekWars.currency].prefix" class="price"><span class="symbol">{{ LeekWars.currencies[LeekWars.currency].symbol }}</span>{{ format(product.prices[LeekWars.currency]) }}</span>
			<span v-else class="price">{{ format(product.prices[LeekWars.currency]) }}&nbsp;<span class="symbol">{{ LeekWars.currencies[LeekWars.currency].symbol }}</span></span>
			<div>
				<v-icon>mdi-credit-card-outline</v-icon> {{ $t('main.credit_card') }}
			</div>
			<div>
				<img :src="'/image/bank/paypal.png'">
			</div>
		</div>
	</div>
</template>

<script lang="ts">
	import { Component, Prop, Vue } from 'vue-property-decorator'
	import { mixins } from '@/model/i18n'

	@Component({ name: 'bank-product' })
	export default class BankProduct extends Vue {

		@Prop({ required: true }) product!: any

		format(n: number) {
			if (Math.floor(n) !== n) {
				return n.toFixed(2)
			}
			return n
		}
	}
</script>

<style lang="scss" scoped>
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
		width: 80px;
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
			padding: 5px 8px;
			margin: 5px 0;
			display: inline-flex;
			border: 1px solid #ccc;
			border-radius: 4px;
			display: flex;
			align-items: center;
			gap: 4px;
			i {
				font-size: 25px;
			}
		}
	}
	.price {
		font-weight: 400;
		font-size: 24px;
		margin-right: 8px;
	}
	.buy img {
		vertical-align: middle;
		height: 25px;
	}
}
</style>