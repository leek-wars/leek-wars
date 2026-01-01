<template>
	<div class="page">
		<div class="page-header page-bar">
			<h1>{{ $t('main.inventory') }}</h1>
			<div class="tabs">
				<a href="https://leek-wars.myspreadshop.fr" target="_blank" rel="noopener">
					<div class="tab action" icon="cart-outline" link="https://leek-wars.myspreadshop.fr">
						<v-icon>mdi-cart-outline</v-icon>
						<span>{{ $t('main.shop') }}</span>
						<v-icon class="small">mdi-open-in-new</v-icon>
					</div>
				</a>
				<router-link v-if="env.BANK && $store.state.farmer?.bank_enabled" to="/bank">
					<div class="tab action" icon="account_balance" link="/bank">
						<v-icon>mdi-bank</v-icon>
						<span>{{ $t('main.bank') }}</span>
					</div>
				</router-link>
				<router-link to="/market">
					<div class="tab action" image="icon/market.png" link="/market">
						<img src="/image/icon/market.png">
						<span>{{ $t('main.market') }}</span>
					</div>
				</router-link>
				<div class="tab action active" icon="mdi-treasure-chest" link="/inventory">
					<v-icon>mdi-treasure-chest</v-icon>
					<span>{{ $t('main.inventory') }}</span>
				</div>
			</div>
		</div>
		<div class="column">
			<inventory />
			<panel class="bottom">
				<template #content>
					<div class="content">
						<!-- <workshop /> -->
						<div class="forge-wrapper">
							<forge></forge>
						</div>
						<div class="schemes">
							<scheme v-for="(scheme, s) in schemes" :key="s" class="scheme" :scheme="scheme" :show-result="true" :show-price="false"></scheme>
						</div>
					</div>
				</template>
			</panel>
		</div>
	</div>
</template>

<script lang="ts">
	import { mixins } from '@/model/i18n'
	import { LeekWars } from '@/model/leekwars'
	import { Options, Vue } from 'vue-property-decorator'
	import Inventory from './inventory.vue'
	import SchemeView from '../market/scheme.vue'
	import Forge from '../forge/forge.vue'
	import { store } from '@/model/store'

	enum Sort {
		DATE, PRICE, PRICE_LOT, QUANTITY, /*NAME, */ LEVEL, RARITY, INGREDIENT_COUNT
	}

	@Options({ name: 'inventory-page', i18n: {}, mixins: [...mixins], components: {
		Inventory,
		'scheme': SchemeView,
		'forge': Forge
	} })
	export default class InventoryPage extends Vue {

		sort: Sort = parseInt(localStorage.getItem('workshop/sort') || '0', 10) as Sort

		get schemes() {
			if (!store.state.farmer) return []
			// return store.state.farmer.schemes
			// 	.map(scheme => LeekWars.schemes[LeekWars.items[scheme.template].params])
			return Object.values(LeekWars.schemes)
				.filter(scheme => store.state.farmer?.schemes.find(s => LeekWars.items[s.template].params == scheme.id))
				.sort((a, b) => LeekWars.items[a.result].price! - LeekWars.items[b.result].price!)
		}

		created() {

		}

		mounted() {
			LeekWars.footer = false
			LeekWars.box = true
		}

		beforeUnmount() {
			LeekWars.footer = true
			LeekWars.box = false
		}
	}
</script>

<style lang="scss" scoped>
.column {
	display: flex;
	flex-direction: column;
	height: 100%;
	min-height: 0;
}
.bottom {
	flex-basis: 357px;
	// flex-basis: 800px;
	min-height: 0;
	.content {
		display: flex;
		padding: 0;
		height: 100%;
		.forge-wrapper {
			flex-basis: 350px;
			display: flex;
			align-items: center;
			justify-content: center;
		}
	}
}
#app.app .bottom {
	flex-basis: auto;
	flex: 1;
	.content {
		flex-direction: column;
		overflow-y: auto;
		.forge-wrapper {
			flex-basis: auto;
		}
	}
}
.schemes {
	overflow-y: auto;
	min-height: 0;
	height: 100%;
	flex: 1;
}
#app.app .schemes {
	overflow-y: visible;
}
</style>