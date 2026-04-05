<template lang="html">
	<div class="pack card" :class="{ best: best }">
		<span v-if="best" class="best-label notif-trophy">{{ $t('main.best_value') }}</span>
		<img :src="'/image/bank/crystals_' + product.id + '.png'">
		<div class="title-line">
			<i18n-t tag="h2" keypath="main.pack_of_n_crystals">
				<template #crystals>
					<b>{{ product.crystals }}</b>
				</template>
			</i18n-t>
			<span v-if="product.bonus" class="bonus-badge">+{{ product.bonus }} <span class="crystal"></span> {{ $t('main.offered') }}</span>
		</div>
		<v-btn :variant="preview ? 'outlined' : 'flat'" color="#1976d2" class="buy-button" :to="preview ? undefined : '/bank/buy/' + index" :disabled="preview">
			<v-icon>mdi-cart-outline</v-icon>
			<span v-if="LeekWars.currencies[LeekWars.currency].prefix"><span class="symbol">{{ LeekWars.currencies[LeekWars.currency].symbol }}</span>{{ format(product.prices[LeekWars.currency]) }}</span>
			<span v-else>{{ format(product.prices[LeekWars.currency]) }}&nbsp;<span class="symbol">{{ LeekWars.currencies[LeekWars.currency].symbol }}</span></span>
		</v-btn>
	</div>
</template>

<script lang="ts">
	import { Options, Prop, Vue } from 'vue-property-decorator'

	@Options({ name: 'bank-product' })
	export default class BankProduct extends Vue {

		@Prop({ required: true }) product!: any
		@Prop({ required: true }) index!: number
		@Prop() best!: boolean
		@Prop() preview!: boolean

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
	.title-line {
		display: flex;
		align-items: center;
		gap: 10px;
		justify-content: space-between;
		margin: 8px 0;
		flex-wrap: wrap;
	}
	h2 {
		font-size: 20px;
	}
	> img {
		float: left;
		margin-right: 20px;
		margin-left: 10px;
		height: 80px;
		width: 80px;
		margin-top: 5px;
		object-fit: contain;
	}
	.buy-button {
		font-size: 18px;
		font-weight: 500;
		gap: 6px;
		margin: 0;
		&:disabled {
			opacity: 1;
		}
	}
	.bonus-badge {
		color: #4caf50;
		border: 2px solid #4caf50;
		font-weight: 600;
		font-size: 14px;
		padding: 2px 8px;
		border-radius: 4px;
	}
	&.best {
		border: 2px solid #ffb430;
		position: relative;
	}
	.best-label {
		position: absolute;
		top: -8px;
		left: 50%;
		transform: translateX(-50%);
		font-weight: 500;
		font-size: 12px;
		padding: 2px 12px;
		white-space: nowrap;
	}
}
</style>