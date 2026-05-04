<template lang="html">
	<div class="page">
		<div class="page-header page-bar">
			<h1>{{ $t('title') }}</h1>
			<div class="tabs">
				<a href="https://leek-wars.myspreadshop.fr" target="_blank" rel="noopener">
					<div class="tab action" icon="cart-outline" link="https://leek-wars.myspreadshop.fr">
						<v-icon>mdi-cart-outline</v-icon>
						<span>{{ $t('main.shop') }}</span>
						<v-icon class="small">mdi-open-in-new</v-icon>
					</div>
				</a>
				<div class="tab action active" icon="account_balance" link="/bank">
					<v-icon>mdi-bank</v-icon>
					<span>{{ $t('main.bank') }}</span>
				</div>
				<router-link to="/market">
					<div class="tab action" image="icon/market.png" link="/market">
						<img src="/image/icon/market.png">
						<span>{{ $t('main.market') }}</span>
					</div>
				</router-link>
				<router-link to="/inventory">
					<div class="tab action" icon="mdi-treasure-chest" link="/inventory">
						<v-icon>mdi-treasure-chest</v-icon>
						<span>{{ $t('main.inventory') }}</span>
					</div>
				</router-link>
				<!-- <router-link to="/workshop">
					<div class="tab action" icon="mdi-hammer-wrench" link="/workshop">
						<v-icon>mdi-hammer-wrench</v-icon>
						<span>{{ $t('main.workshop') }}</span>
					</div>
				</router-link> -->
			</div>
		</div>
		<panel class="first">
			<div class="bank-description center" v-html="$t('description')"></div>

			<v-select v-model="LeekWars.currency" :items="Object.keys(LeekWars.currencies)" hide-details density="compact" variant="solo">
				<template #selection>
					<flag :code="LeekWars.currencies[LeekWars.currency].flag" :clickable="false" />&nbsp;
					{{ LeekWars.currency }} &nbsp; <span class="symbol">{{ LeekWars.currencies[LeekWars.currency].symbol }}</span>
				</template>
				<template #item="{ props, item }">
					<v-list-item v-bind="props" class="currency">
						<template #prepend>
							<flag :code="LeekWars.currencies[item.value].flag" :clickable="false" />
						</template>
						<template #append>
							<span class="symbol">{{ LeekWars.currencies[item.value].symbol }}</span>
						</template>
					</v-list-item>
				</template>
			</v-select>

			<div v-if="firstPurchase" class="first-purchase-banner">
				<v-icon>mdi-gift</v-icon> {{ $t('first_purchase_banner') }}
			</div>

			<loader v-if="!packs" />
			<div v-else class="packs">
				<bank-product v-for="(pack, p) in packs" :key="pack.crystals" :product="pack" :index="Number(p)" :best="pack.bonus === bestBonus" :first-purchase="firstPurchase" />
			</div>
		</panel>
		<h1 v-if="items" class="items-title">{{ $t('items_title') }}</h1>
		<div class="container grid">
			<panel v-if="!items">
				<loader />
			</panel>
			<template v-else>
				<panel v-for="(item, i) in items" :key="i" class="item-sample">
					<template #content>
						<router-link :to="'/market/' + item.name.replace(/[a-z-]+_/, '')" v-ripple>
							<item :item="item" />
							<div class="info">
								<div class="name">{{ $t(item.name.replace('_', '.')) }}</div>
								<div class="price">
									{{ $filters.number(item.crystals) }} <span class="crystal"></span>
								</div>
							</div>
						</router-link>
					</template>
				</panel>
			</template>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { mixins , useNamespacedT } from '@/model/i18n'
import { LeekWars } from '@/model/leekwars'
import { store } from '@/model/store'
import Item from '@/component/item.vue'
import BankProduct from './bank-product.vue'

defineOptions({ name: 'bank', i18n: {}, mixins: [...mixins] })

const t = useNamespacedT('bank')
const router = useRouter()

const packs = ref<any>(null)
const items = ref<any>(null)
const firstPurchase = ref(false)

const bestBonus = computed(() => {
	if (!packs.value) return -1
	const max = Object.values(packs.value).reduce((a: number, p: any) => Math.max(a, p.bonus), 0)
	return max > 0 ? max : -1
})

LeekWars.setActions([
	{ image: 'icon/market.png', click: () => router.push('/market') },
	{ icon: 'mdi-treasure-chest', click: () => router.push('/inventory') },
])
LeekWars.get('bank/get-packs').then(data => {
	packs.value = data.packs
	items.value = data.items
	firstPurchase.value = data.first_purchase
	LeekWars.setTitle(t('title'))
})

if (store.state.farmer) {
	LeekWars.setSubTitle(t('main.x_habs', [LeekWars.formatNumber(store.state.farmer.habs)]) + ' • ' + t('main.x_crystals', [LeekWars.formatNumber(store.state.farmer.crystals)]))
}

watch(() => LeekWars.currency, () => {
	localStorage.setItem('currency', LeekWars.currency)
})
</script>

<style lang="scss" scoped>
.currency {
	display: flex;
	align-items: center;
}
.flag {
	max-width: 28px;
	max-height: 28px;
	margin-right: 8px;
}
.v-select {
	margin-left: 10px;
	display: inline-block;
	:deep(input) {
		border: none;
		width: 10px;
	}
}
#app.app .v-select {
	margin-left: 0;
}
	.bank-description {
		padding: 20px;
		font-size: 17px;
		text-align: justify;
		line-height: 1.5;
		:deep(.crystal) {
			margin-bottom: -6px;
		}
	}
	#app.app .bank-description {
		padding: 5px 0;
		font-size: 15px;
	}
	.first-purchase-banner {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 12px 16px;
		margin: 10px;
		font-size: 16px;
		font-weight: 600;
		border-radius: 4px;
		background: #7b1fa2;
		color: white;
	}
	.packs {
		display: grid;
		grid-gap: 10px;
		padding: 10px;
		grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
	}
	#app.app .first-purchase-banner {
		margin: 10px 0;
	}
	#app.app .packs {
		padding: 5px 0;
	}
	.items-title {
		background: #222;
		color: white;
		font-size: 17px;
		&::after {
			border-color: transparent transparent transparent #222;
		}
	}
	.item-sample {
		a {
			display: flex;
			gap: 10px;
			padding: 10px;
			color: var(--text-color-secondary);
		}
		:deep(.item) {
			width: 80px;
			height: 80px;
		}
		.name {
			font-size: 16px;
			margin-top: 10px;
		}
		.price {
			font-size: 20px;
			font-weight: 500;
			margin-top: 12px;
		}
	}
</style>