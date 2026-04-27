<template lang="html">
	<div class="pack card" :class="{ best: best }">
		<span v-if="best" class="best-label notif-trophy">{{ $t('best_value') }}</span>
		<span v-if="firstPurchase" class="x2-label">x2</span>
		<img :src="'/image/bank/crystals_' + product.id + '.png'">
		<div class="title-line">
			<i18n-t tag="h2" keypath="main.pack_of_n_crystals">
				<template #crystals>
					<b>{{ product.crystals }}</b><b v-if="firstPurchase" class="x2-crystals"> + {{ product.crystals }}</b>
				</template>
			</i18n-t>
			<span v-if="product.bonus" class="bonus-badge">{{ firstPurchase ? product.bonus * 2 : product.bonus }} <span class="crystal"></span> {{ $t('offered') }}</span>
		</div>
		<v-btn :variant="preview ? 'outlined' : 'flat'" color="#1976d2" class="buy-button" :to="preview ? undefined : '/bank/buy/' + index" :disabled="preview" prepend-icon="mdi-cart-outline">
			<span v-if="LeekWars.currencies[LeekWars.currency].prefix"><span class="symbol">{{ LeekWars.currencies[LeekWars.currency].symbol }}</span>{{ format(product.prices[LeekWars.currency]) }}</span>
			<span v-else>{{ format(product.prices[LeekWars.currency]) }}&nbsp;<span class="symbol">{{ LeekWars.currencies[LeekWars.currency].symbol }}</span></span>
		</v-btn>
	</div>
</template>

<script setup lang="ts">
import { mixins } from '@/model/i18n'

defineOptions({ name: 'bank-product', i18n: {}, mixins: [...mixins] })

defineProps<{
	product: any
	index: number
	best?: boolean
	preview?: boolean
	firstPurchase?: boolean
}>()

function format(n: number) {
	if (Math.floor(n) !== n) return n.toFixed(2)
	return n
}
</script>

<style lang="scss" scoped>
.pack {
	padding: 10px;
	min-height: 90px;
	text-align: left;
	position: relative;
	.title-line {
		display: flex;
		align-items: center;
		gap: 10px;
		justify-content: space-between;
		margin: 10px 0;
		flex-wrap: wrap;
	}
	h2 {
		font-size: 18px;
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
		border: 1px solid #4caf50;
		font-weight: 600;
		font-size: 14px;
		padding: 2px 8px;
		border-radius: 4px;
	}
	.x2-label {
		position: absolute;
		top: 8px;
		left: 8px;
		background: #7b1fa2;
		color: white;
		font-weight: 700;
		font-size: 14px;
		padding: 2px 8px;
		border-radius: 4px;
	}
	.x2-crystals {
		color: #7b1fa2;
	}
	&.best {
		border: 2px solid #ffb430;
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
body.dark .x2-crystals {
	color: #ab47bc;
}
</style>