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
			</div>
		</div>
		<panel class="first">
			<div class="bank-description center" v-html="$t('description')"></div>

			<v-select v-model="LeekWars.currency" :items="Object.keys(LeekWars.currencies)" hide-details dense solo light>
				<template v-slot:selection>
					<flag :code="LeekWars.currencies[LeekWars.currency].flag" :clickable="false" />&nbsp;
					{{ LeekWars.currency }} &nbsp; <span class="symbol">{{ LeekWars.currencies[LeekWars.currency].symbol }}</span>
				</template>
				<template slot="item" slot-scope="data">
					<v-list-item-content>
						<v-list-item-title class="currency">
							<flag :code="LeekWars.currencies[data.item].flag" :clickable="false" />&nbsp;
							{{ data.item }} &nbsp; <span class="symbol">{{ LeekWars.currencies[data.item].symbol }}</span>
						</v-list-item-title>
					</v-list-item-content>
				</template>
			</v-select>

			<loader v-if="!packs" />
			<div v-else class="packs">
				<router-link v-for="(pack, p) in packs" :key="pack.crystals" :to="'/bank/buy/' + p" v-ripple>
					<bank-product :product="pack" />
				</router-link>
			</div>
		</panel>
		<div class="container grid">
			<panel v-if="!items">
				<loader />
			</panel>
			<template v-else>
				<panel v-for="(item, i) in items" :key="i" class="item-sample">
					<router-link slot="content"  :to="'/market/' + item.name.replace(/[a-z-]+_/, '')" v-ripple>
						<item :item="{template: item.id}" />
						<div class="info">
							<div class="name">{{ $t(item.name.replace('_', '.')) }}</div>
							<div class="price">
								{{ item.crystals | number }} <span class="crystal"></span>
							</div>
						</div>
					</router-link>
				</panel>
			</template>
		</div>
	</div>
</template>

<script lang="ts">
	import { mixins } from '@/model/i18n'
	import { LeekWars } from '@/model/leekwars'
	import { Component, Vue, Watch } from 'vue-property-decorator'
	import Item from '@/component/item.vue'
	import { locale } from '@/locale'
	import BankProduct from './bank-product.vue'

	@Component({ name: 'bank', i18n: {}, mixins: [...mixins], components: { Item, BankProduct } })
	export default class Bank extends Vue {
		packs: any = null
		items: any = null

		created() {
			LeekWars.setActions([
				{image: 'icon/market.png', click: () => this.$router.push('/market')},
				{icon: 'mdi-treasure-chest', click: () => this.$router.push('/inventory')},
			])
			LeekWars.get('bank/get-packs').then(data => {
				this.packs = data.packs
				this.items = data.items
				LeekWars.setTitle(this.$i18n.t('title'))
			})
			this.updateSubtitle()
		}

		updateSubtitle() {
			if (this.$store.state.farmer) {
				LeekWars.setSubTitle(this.$t('main.x_habs', [LeekWars.formatNumber(this.$store.state.farmer.habs)]) + " • " + this.$t('main.x_crystals', [LeekWars.formatNumber(this.$store.state.farmer.crystals)]))
			}
		}

		@Watch('LeekWars.currency')
		updateCurrency() {
			localStorage.setItem('currency', LeekWars.currency)
		}
	}
</script>

<style lang="scss" scoped>
.currency {
	display: flex;
	align-items: center;
}
.flag {
	max-width: 28px;
	max-height: 28px;
}
.v-select {
	margin-left: 10px;
	display: inline-block;
	::v-deep input {
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
		line-height: 26px;
		::v-deep .crystal {
			margin-bottom: -6px;
		}
	}
	#app.app .bank-description {
		padding: 5px 0;
	}
	.packs {
		display: grid;
		grid-gap: 10px;
		padding: 10px;
		grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
	}
	#app.app .packs {
		padding: 0;
		padding-top: 10px;
	}
	.pack {
		padding: 10px;
		min-height: 90px;
		h2 {
			margin-bottom: 8px;
			margin-top: 3px;
			font-size: 20px;
		}
		&:hover {
			background: #eee;
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
					font-size: 26px;
				}
			}
		}
		.price {
			font-weight: 400;
			font-size: 24px;
			margin-right: 10px;
			display: flex;
			align-items: center;
		}
		.buy img {
			vertical-align: middle;
			height: 25px;
		}
	}
	.item-sample {
		a {
			display: flex;
			gap: 10px;
			padding: 10px;
			color: #555;
		}
		::v-deep .item {
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