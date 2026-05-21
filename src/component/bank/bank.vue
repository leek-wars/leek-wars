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

			<router-link v-if="suggestion" :to="'/bank/buy/' + suggestion.pack.id" class="contextual-suggestion">
				<div v-if="suggestion.target === 'item' && suggestion.item" class="suggestion-icon">
					<item :item="suggestion.item" />
				</div>
				<div v-else class="suggestion-icon fights">
					<img src="/image/fight-pack/fight_pack_100.png" alt="fights">
				</div>
				<div class="suggestion-body">
					<div class="suggestion-target">
						<span class="target-name">{{ suggestion.target === 'fights' ? $t('suggestion_target_fights') : suggestionItemName }}</span>
						<span class="target-price">·&nbsp;{{ $filters.number(suggestion.neededCrystals) }}&nbsp;<span class="crystal"></span></span>
					</div>
					<div class="suggestion-arrow">
						<i18n-t v-if="suggestion.remainder > 0" tag="span" keypath="suggestion_with_remainder">
							<template #pack><b>{{ $filters.number(suggestion.pack.crystals) }}&nbsp;<span class="crystal"></span></b></template>
							<template #price><b>{{ suggestionPrice }}</b></template>
							<template #remainder><b>{{ $filters.number(suggestion.remainder) }}&nbsp;<span class="crystal"></span></b></template>
						</i18n-t>
						<i18n-t v-else tag="span" keypath="suggestion_exact">
							<template #pack><b>{{ $filters.number(suggestion.pack.crystals) }}&nbsp;<span class="crystal"></span></b></template>
							<template #price><b>{{ suggestionPrice }}</b></template>
						</i18n-t>
					</div>
				</div>
				<v-btn class="suggestion-cta" color="#1976d2" variant="flat" append-icon="mdi-arrow-right">{{ $t('suggestion_cta') }}</v-btn>
			</router-link>

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
						<div class="sample">
							<router-link v-ripple :to="'/market/' + item.name.replace(/[a-z-]+_/, '')" class="item-link">
								<item :item="item" />
							</router-link>
							<div class="info">
								<router-link :to="'/market/' + item.name.replace(/[a-z-]+_/, '')" class="name">{{ translateItemName(item) }}</router-link>
								<v-tooltip location="bottom">
									<template #activator="{ props: tprops }">
										<v-btn
											v-bind="tprops"
											class="buy-button"
											:class="{ 'not-enough': !hasEnough(item) }"
											:color="hasEnough(item) ? '#4caf50' : undefined"
											variant="flat"
											prepend-icon="mdi-cart-outline"
											@click="onBuyClick(item)">
											<span class="price">{{ $filters.number(item.crystals!) }}&nbsp;<span class="crystal"></span></span>
										</v-btn>
									</template>
									<span v-if="hasEnough(item)">{{ $t('buy_now') }}</span>
									<span v-else>{{ $t('missing_n_crystals', [$filters.number(item.crystals! - ($store.state.farmer?.crystals ?? 0))]) }}</span>
								</v-tooltip>
							</div>
						</div>
					</template>
				</panel>
			</template>
		</div>

		<popup v-model="buyDialog" :width="600">
			<template #icon><v-icon>mdi-cash-multiple</v-icon></template>
			<template #title><span>{{ $t('confirm_purchase') }}</span></template>
			<div v-if="buyItem && $store.state.farmer">
				<i18n-t tag="div" keypath="are_you_sure_you_want_to_buy">
					<template #item><b>{{ translateItemName(buyItem) }}</b></template>
				</i18n-t>
				<br>
				<b>{{ $t('price') }}</b> : {{ $filters.number(buyItem.crystals!) }} <span class="crystal"></span>
				<br>
				<b>{{ $t('crystals_before_purchase') }}</b> : {{ $filters.number($store.state.farmer.crystals) }} <span class="crystal"></span>
				<br>
				<b>{{ $t('crystals_after_purchase') }}</b> : {{ $filters.number($store.state.farmer.crystals - buyItem.crystals!) }} <span class="crystal"></span>
			</div>
			<template #actions>
				<div v-ripple @click="buyDialog = false">{{ $t('cancel') }}</div>
				<div v-ripple class="buy green" @click="confirmBuy">{{ $t('buy') }}</div>
			</template>
		</popup>
	</div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { i18n, mixins , useNamespacedT } from '@/model/i18n'
import { LeekWars } from '@/model/leekwars'
import { store } from '@/model/store'
import { ITEM_CATEGORY_NAME, ItemType, type ItemTemplate } from '@/model/item'
import Item from '@/component/item.vue'
import BankProduct from './bank-product.vue'
import Popup from '@/component/popup.vue'

interface Pack { id: number; crystals: number; bonus: number; prices: Record<string, number> }

defineOptions({ name: 'Bank', i18n: {}, mixins: [...mixins] })

const t = useNamespacedT('bank')
const router = useRouter()
const route = useRoute()

const packs = ref<Record<string, Pack> | null>(null)
const items = ref<Record<string, ItemTemplate> | null>(null)
const firstPurchase = ref(false)
const buyDialog = ref(false)
const buyItem = ref<ItemTemplate | null>(null)

const bestBonus = computed(() => {
	if (!packs.value) return -1
	const max = Object.values(packs.value).reduce((a: number, p: Pack) => Math.max(a, p.bonus), 0)
	return max > 0 ? max : -1
})

// Suggestion contextuelle : si l'utilisateur arrive depuis le marché avec un
// item précis en tête (ref=market_buy:X ou market_not_enough:X), on lui propose
// le pack le plus adapté pour cet achat. Pareil pour garden_buy (acheter des
// combats journaliers depuis le potager).
function findItemByRefName(refName: string): ItemTemplate | null {
	const list = Object.values(LeekWars.items) as ItemTemplate[]
	// Match direct
	let found = list.find(i => i.name === refName)
	if (found) return found
	// Préfixes possibles selon le type (hat_, fight-pack_, etc.)
	for (const prefix of Object.values(ITEM_CATEGORY_NAME)) {
		found = list.find(i => i.name === prefix + '_' + refName)
		if (found) return found
	}
	// Fight-pack a un préfixe composé
	found = list.find(i => i.name === 'fight-pack_' + refName)
	if (found) return found
	return null
}

const suggestion = computed(() => {
	if (!packs.value) return null
	const ref = (route.query.ref as string | undefined) ?? ''
	let targetItem: ItemTemplate | null = null
	let target: 'fights' | 'item' | null = null

	if (ref.startsWith('market_buy:') || ref.startsWith('market_not_enough:')) {
		const itemName = ref.split(':').slice(1).join(':')
		targetItem = findItemByRefName(itemName)
		if (targetItem) target = 'item'
	} else if (ref === 'garden_buy') {
		// 100 cristaux = 100 combats supplémentaires achetés depuis le potager
		target = 'fights'
	}
	if (!target) return null

	const neededCrystals = target === 'item' ? (targetItem?.crystals ?? 0) : 100
	if (!neededCrystals) return null

	// Plus petit pack qui couvre le besoin, sinon le plus gros disponible.
	const sorted = (Object.values(packs.value) as Pack[]).sort((a, b) => a.crystals - b.crystals)
	const recommended = sorted.find(p => p.crystals >= neededCrystals) ?? sorted[sorted.length - 1]
	if (!recommended) return null

	const remainder = Math.max(0, recommended.crystals - neededCrystals)
	return {
		target,
		item: targetItem,
		neededCrystals,
		pack: recommended,
		remainder,
	}
})

function translateItemName(item: ItemTemplate): string {
	const type = ITEM_CATEGORY_NAME[item.type]
	const shortName = item.name.replace(type + '_', '').replace('fight-pack_', '')
	const key = type + '.' + shortName
	const translated = i18n.t(key)
	return translated && translated !== key ? translated : shortName.replace(/_/g, ' ')
}

const suggestionItemName = computed(() => {
	const s = suggestion.value
	if (!s || s.target !== 'item' || !s.item) return ''
	return translateItemName(s.item)
})

function hasEnough(item: ItemTemplate): boolean {
	if (!store.state.farmer) return false
	return store.state.farmer.crystals >= (item.crystals ?? 0)
}

function onBuyClick(item: ItemTemplate) {
	if (!store.state.farmer) return
	if (hasEnough(item)) {
		buyItem.value = item
		buyDialog.value = true
	} else {
		const refName = item.name.replace(/^[a-z-]+_/, '')
		router.replace({ path: '/bank', query: { ref: 'market_not_enough:' + refName } })
		window.scrollTo({ top: 0, behavior: 'smooth' })
	}
}

function confirmBuy() {
	const item = buyItem.value
	if (!item || !store.state.farmer) return
	if (store.state.farmer.crystals < (item.crystals ?? 0)) {
		LeekWars.toast(i18n.t('market.error_not_enough_crystals'))
		buyDialog.value = false
		return
	}
	const id = item.type === ItemType.FIGHT_PACK ? (item.id - 1000000) + 'fights' : item.id
	LeekWars.post('market/buy-crystals-quantity', { item_id: id, quantity: 1 }).then((data: any) => {
		store.commit('update-crystals', -(item.crystals ?? 0))
		if (item.type === ItemType.FIGHT_PACK) {
			store.commit('update-fights', data.fights)
			store.commit('update-bought-fights', data.fights)
		}
		store.commit('add-inventory', { type: item.type, id: data.item, template: id, quantity: 1, time: Date.now() / 1000 })
		if (store.state.farmer) {
			LeekWars.setSubTitle(t('main.x_habs', [LeekWars.formatNumber(store.state.farmer.habs)]) + ' • ' + t('main.x_crystals', [LeekWars.formatNumber(store.state.farmer.crystals)]))
		}
	})
	.error((error: any) => LeekWars.toast(i18n.t('market.error_' + error.error, error.params)))
	buyDialog.value = false
}

const suggestionPrice = computed(() => {
	const s = suggestion.value
	if (!s) return ''
	const price = s.pack.prices[LeekWars.currency]
	if (price === undefined) return ''
	const cur = LeekWars.currencies[LeekWars.currency]
	const formatted = Number.isInteger(price) ? String(price) : price.toFixed(2)
	return cur.prefix ? cur.symbol + formatted : formatted + ' ' + cur.symbol
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
	.contextual-suggestion {
		display: flex;
		align-items: center;
		gap: 16px;
		padding: 12px 16px;
		margin: 10px;
		border-radius: 6px;
		background: var(--background-secondary);
		border: 1px solid var(--border);
		color: var(--text-color);
		text-decoration: none;
		transition: background 120ms ease, border-color 120ms ease, transform 120ms ease;
		&:hover {
			background: var(--background);
			border-color: #1976d2;
			transform: translateY(-1px);
		}
		.suggestion-icon {
			flex-shrink: 0;
			width: 56px;
			height: 56px;
			display: flex;
			align-items: center;
			justify-content: center;
			:deep(.item) {
				width: 56px;
				height: 56px;
			}
			img {
				max-width: 100%;
				max-height: 100%;
				object-fit: contain;
			}
		}
		.suggestion-body {
			flex: 1;
			min-width: 0;
			display: flex;
			flex-direction: column;
			gap: 4px;
		}
		.suggestion-target {
			display: flex;
			align-items: baseline;
			gap: 6px;
			flex-wrap: wrap;
			font-size: 16px;
			font-weight: 600;
			.target-name {
				white-space: nowrap;
				overflow: hidden;
				text-overflow: ellipsis;
			}
			.target-price {
				color: var(--text-color-secondary);
				font-weight: 500;
			}
		}
		.suggestion-arrow {
			font-size: 14px;
			color: var(--text-color-secondary);
			line-height: 1.4;
			b {
				color: var(--text-color);
				font-weight: 600;
				white-space: nowrap;
			}
		}
		:deep(.crystal) {
			width: 10px;
			height: 20px;
			margin: 0;
			vertical-align: -4px;
			background-size: contain;
		}
		.suggestion-cta {
			flex-shrink: 0;
			text-transform: none;
			letter-spacing: 0;
		}
	}
	#app.app .contextual-suggestion {
		margin: 10px 0;
		flex-wrap: wrap;
		.suggestion-cta {
			width: 100%;
		}
	}
	body.dark .contextual-suggestion {
		&:hover {
			border-color: #42a5f5;
		}
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
		.sample {
			display: flex;
			align-items: center;
			gap: 10px;
			padding: 10px;
		}
		.item-link {
			flex-shrink: 0;
			display: flex;
			text-decoration: none;
		}
		.info {
			flex: 1;
			min-width: 0;
			display: flex;
			flex-direction: column;
			gap: 8px;
			align-items: flex-start;
		}
		:deep(.item) {
			width: 80px;
			height: 80px;
			flex-shrink: 0;
		}
		.name {
			font-size: 16px;
			color: var(--text-color);
			text-decoration: none;
		}
		.buy-button {
			text-transform: none;
			letter-spacing: 0;
			font-weight: 600;
			font-size: 15px;
			&.not-enough {
				background: var(--background-disabled) !important;
				color: var(--text-color-secondary) !important;
				box-shadow: none !important;
				opacity: 0.85;
				&:hover {
					opacity: 1;
				}
			}
		}
	}
</style>