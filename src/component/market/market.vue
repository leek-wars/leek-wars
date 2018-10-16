<template lang="html">
	<div>
		<div class="page-header page-bar">
			<h1>{{ $t('title') }}</h1>
			<div class="tabs">
				<router-link to="/bank">
					<div class="tab action" icon="account_balance" link="/bank">
						<i class="material-icons">account_balance</i>
						<span>{{ $t('main.bank') }}</span>
					</div>
				</router-link>
			</div>
		</div>
		<div class="container">
			<div v-show="!LeekWars.mobile || !LeekWars.splitBack" class="column8">
				<div class="panel">
					<div class="header">
						<h2>{{ $t('fights') }}</h2>
					</div>
					<div class="content items">
						<loader v-if="!fight_packs.length" />
						<div class="center">
							<router-link v-ripple v-for="pack in fight_packs" :key="pack.id" :to="'/market/' + pack.name" class="item fights" :farmer-count="0" :leek-count="0" @click="selectItem(pack)">
								<img src="/image/market/fights.png">
								<div>{{ pack.title }}</div>
							</router-link>
						</div>
					</div>
				</div>
				<div class="panel">
					<div class="header">
						<h2>{{ $t('weapons') }}</h2>
					</div>
					<div class="content items weapons">
						<loader v-if="!weapons.length" />
						<div class="center">
							<router-link v-ripple v-for="weapon in weapons" :key="weapon.id" :to="'/market/' + weapon.name" :farmer-count="items[weapon.id].farmer_count" :leek-count="items[weapon.id].leek_count" class="item weapon">
								<img :src="'/image/weapon/' + weapon.name + '.png'">
							</router-link>
						</div>
					</div>
				</div>
				<div class="panel">
					<div class="header">
						<h2>{{ $t('chips') }}</h2>
						<div class="right">
							<div class="button flat" @click="updateChipMode">
								<i v-if="chipMode === 'type'" class="material-icons">view_module</i>
								<i v-else class="material-icons">sort</i>
							</div>
						</div>
					</div>
					<div v-if="!chips.length" class="content items">
						<loader />
					</div>
					<div v-else-if="chipMode === 'level'" class="content items chips">
						<router-link v-ripple v-for="chip in chips" :key="chip.id" :to="'/market/' + chip.name" :farmer-count="items[chip.id].farmer_count" :leek-count="items[chip.id].leek_count" class="item chip">
							<img :src="'/image/chip/small/' + chip.name + '.png'">
						</router-link>
					</div>
					<div v-else class="content chips items noflex">
						<div v-for="type in EffectTypeMarket" v-if="!isNaN(type)" :key="type">
							<h3>{{ $t('effect.effect_type_' + type) }}</h3>
							<br>
							<router-link v-ripple v-for="chip in chipsByType[type]" :key="chip.id" :to="'/market/' + chip.name" :farmer-count="items[chip.id].farmer_count" :leek-count="items[chip.id].leek_count" class="item chip">
								<img :src="'/image/chip/small/' + chip.name + '.png'">
							</router-link>
						</div>
					</div>
				</div>
				<div class="panel">
					<div class="header">
						<h2>{{ $t('potions') }}</h2>
					</div>
					<div class="content items">
						<loader v-if="!potions.length" />
						<router-link v-ripple v-for="potion in potions" :key="potion.id" :to="'/market/' + potion.name" :farmer-count="items[potion.id].farmer_count" :leek-count="items[potion.id].leek_count" class="item potion">
							<img :src="'/image/potion/' + potion.name + '.png'">
						</router-link>
					</div>
				</div>
				<div class="panel">
					<div class="header">
						<h2>{{ $t('hats') }}</h2>
					</div>
					<div class="content items">
						<loader v-if="!hats.length" />
						<router-link v-ripple v-for="hat in hats" :key="hat.id" :to="'/market/' + hat.name" :farmer-count="items[hat.id].farmer_count" :leek-count="items[hat.id].leek_count" class="item hat">
							<img :src="'/image/hat/' + hat.name + '.png'">
						</router-link>
					</div>
				</div>
			</div>
			<div v-show="!LeekWars.mobile || LeekWars.splitBack" class="column4">
				<div class="panel preview-panel">
					<div class="header">
						<h2>{{ $t('characteristics') }}</h2>
					</div>
					<div v-if="!selectedItem">
						<loader />
					</div>
					<div v-else class="content preview">
						<weapon-preview v-if="selectedItem.type == ItemType.WEAPON" :weapon="LeekWars.weapons[selectedItem.id]" />
						<chip-preview v-else-if="selectedItem.type == ItemType.CHIP" :chip="LeekWars.chips[selectedItem.id]" />
						<potion-preview v-else-if="selectedItem.type == ItemType.POTION" :potion="LeekWars.potions[selectedItem.id]" />
						<fight-pack-preview v-else-if="selectedItem.type == ItemType.FIGHT_PACK" :pack="selectedItem" />
						<hat-preview v-else-if="selectedItem.type == ItemType.HAT" :hat="LeekWars.hats[selectedItem.id]" />
						<div class="buy-buttons">
							<template v-if="selectedItem.price_habs > 0">
								<h4 class="buy-label">{{ $t('buy') }}</h4>&nbsp;
								<div :class="{disabled: $store.state.farmer.habs < selectedItem.price_habs}" class="button buy-button" @click="openBuyHabs">{{ selectedItem.price_habs | number }}<img src="/image/hab.png"></div>
							</template>
							<div v-if="selectedItem.price_crystals > 0">
								<h4 class="buy-label">{{ $t('buy') }}</h4>&nbsp;
								<div :class="{disabled: $store.state.farmer.crystals < selectedItem.price_crystals}" class="button buy-crystals-button" @click="openBuyCrystals">{{ selectedItem.price_crystals | number }}<img src="/image/crystal.png"></div>
							</div>
							<template v-if="selectedItem.sellable && selectedItem.farmer_count > 0">
								<div class="sell">
									<h4 class="buy-label">{{ $t('resell') }}</h4>&nbsp;
									<div class="button sell-button" @click="sellDialog = true">{{ selectedItem.sell_price | number }} <span class="hab"></span></div>
								</div>
							</template>
						</div>
						<template v-if="selectedItem.leek_objs.length">
							<div><b>{{ $t('equipped_on') }}</b></div>
							<div class="leeks">
								<router-link v-for="leek in selectedItem.leek_objs" :key="leek.id" :to="'/leek/' + leek.id">
									<span class="leek">{{ leek.name }}</span>
								</router-link>
							</div>
						</template>
					</div>
				</div>
			</div>
		</div>

		<v-dialog v-model="buyDialog" max-width="600">
			<div class="title">{{ $t('confirm_purchase') }}</div>
			<div v-if="selectedItem" class="content">
				{{ $t('are_you_sure_you_want_to_buy', [selectedItem.name]) }}
				<br><br>
				<b>{{ $t('price') }}</b> : {{ selectedItem.price_habs | number }} <span class="hab"></span>
				<br>
				<b>{{ $t('habs_before_purchase') }}</b> : {{ $store.state.farmer.habs | number }} <span class="hab"></span>
				<br>
				<b>{{ $t('habs_after_purchase') }}</b> : {{ $store.state.farmer.habs - selectedItem.price_habs | number }} <span class="hab"></span>
			</div>
			<div class="actions">
				<div class="dismiss" @click="buyDialog = false">{{ $t('cancel') }}</div>
				<div class="buy green" @click="buy('habs')">{{ $t('buy') }}</div>
			</div>
		</v-dialog>

		<v-dialog v-model="buyCrystalsDialog" max-width="600">
			<div class="title">{{ $t('confirm_purchase') }}</div>
			<div v-if="selectedItem" class="content">
				{{ $t('are_you_sure_you_want_to_buy', [selectedItem.name]) }}
				<br><br>
				<b>{{ $t('price') }}</b> : {{ selectedItem.price_crystals }}} <span class="crystal"></span>
				<br>
				<b>{{ $t('crystals_before_purchase') }}</b> : {{ $store.state.farmer.crystals | number }} <span class="crystal"></span>
				<br>
				<b>{{ $t('crystals_after_purchase') }}</b> : {{ $store.state.farmer.crystals - selectedItem.price_crystals | number }} <span class="crystal"></span>
			</div>
			<div class="actions">
				<div class="dismiss">{{ $t('cancel') }}</div>
				<div class="buy green" @click="buy('crystals')">{{ $t('buy') }}</div>
			</div>
		</v-dialog>
		
		<v-dialog v-model="sellDialog" max-width="600">
			<div class="title">{{ $t('confirm_sell') }}</div>
			<div v-if="selectedItem" class="content">
				{{ $t('are_you_sure_you_want_to_sell', [selectedItem.name]) }}
				<br><br>
				<b>{{ $t('price') }}</b> : {{ selectedItem.price | number }} <span class="hab"></span>
				<br>
				<b>{{ $t('habs_before_sell') }}</b> : {{ $store.state.farmer.habs | number }} <span class="hab"></span>
				<br>
				<b>{{ $t('habs_after_sell') }}</b> : {{ $store.state.farmer.habs + selectedItem.sell_price | number }} <span class="hab"></span>
			</div>
			<div class="actions">
				<div class="dismiss" @click="sellDialog = false">{{ $t('cancel') }}</div>
				<div class="sell green" @click="sell">{{ $t('sell') }}</div>
			</div>
		</v-dialog>
	</div>
</template>

<script lang="ts">
	import { ChipTemplate } from '@/model/chip'
	import { EffectTypeMarket } from '@/model/effect'
	import { HatTemplate } from '@/model/hat'
	import { ItemTemplate, ItemType } from '@/model/item'
	import { LeekWars } from '@/model/leekwars'
	import { PotionTemplate } from '@/model/potion'
	import { WeaponTemplate } from '@/model/weapon'
	import { Component, Vue, Watch } from 'vue-property-decorator'
	import ChipPreview from './chip-preview.vue'
	import FightPackPreview from './fight-pack-preview.vue'
	import HatPreview from './hat-preview.vue'
	import PotionPreview from './potion-preview.vue'
	import WeaponPreview from './weapon-preview.vue'

	@Component({
		name: 'market', i18n: {},
		components: {
			'weapon-preview': WeaponPreview,
			'chip-preview': ChipPreview,
			'potion-preview': PotionPreview,
			'fight-pack-preview': FightPackPreview,
			'hat-preview': HatPreview
		}
	})
	export default class Market extends Vue {
		selectedItem: ItemTemplate | null = null
		items: {[key: string]: ItemTemplate} = {}
		weapons: WeaponTemplate[] = []
		chips: ChipTemplate[] = []
		chipsByType: ChipTemplate[][] = []
		potions: PotionTemplate[] = []
		hats: HatTemplate[] = []
		items_by_name: {[key: string]: ItemTemplate} = {}
		fight_packs: any[] = []
		ItemType = ItemType
		buyDialog: boolean = false
		buyCrystalsDialog: boolean = false
		sellDialog: boolean = false
		chipMode: string = localStorage.getItem('market/sort_mode') === 'type' ? 'type' : 'level'
		EffectTypeMarket = EffectTypeMarket

		created() {

			LeekWars.get<any>('market/get-item-templates/' + this.$store.state.token).then((res) => {
				if (!res.data.success) {
					// LW.error()
					return
				}
				const items = res.data.items as ItemTemplate[]
				for (const i in items) {
					if (items.hasOwnProperty(i)) {
						const item = items[i]
						this.items[item.id] = item
						if (item.type === ItemType.WEAPON) {
							this.weapons.push(LeekWars.weapons[item.id])
							this.items_by_name[LeekWars.weapons[item.id].name] = item
						} else if (item.type === ItemType.CHIP) {
							const chip = LeekWars.chips[item.id]
							this.chips.push(chip)
							this.items_by_name[LeekWars.chips[item.id].name] = item
							// Place the chip in the categories which correspond to its effects
							for (const effect of chip.effects) {
								if (this.chipsByType[effect.type] === undefined) {
									this.chipsByType[effect.type] = []
								}
								this.chipsByType[effect.type].push(chip)
								break
							}
						} else if (item.type === ItemType.POTION) {
							this.potions.push(LeekWars.potions[item.id])
							this.items_by_name[LeekWars.potions[item.id].name] = item
						} else if (item.type === ItemType.HAT) {
							this.hats.push(LeekWars.hats[item.id])
							this.items_by_name[LeekWars.hats[item.id].name] = item
						}
						item.leek_objs = []
						if (this.$store.getters.connected) {
							for (const leek of item.leeks) {
								if (leek in this.$store.state.farmer.leeks) {
									item.leek_objs.push(this.$store.state.farmer.leeks[leek])
								}
							}
						}
					}
				}
				const fights = [100, 200, 500, 1000]
				const costs = [1, 1.8, 4, 7]
				for (const p in fights) {
					if (fights.hasOwnProperty(p)) {
						const count = fights[p]
						const pack: ItemTemplate = {
							id: 1000000 + fights[p],
							name: count + '-fights',
							title: this.$t('n_fights', [count]),
							price_habs: p === '0' ? costs[p] * 1000000 : 0,
							price_crystals: costs[p] * 100,
							sellable: false,
							type: ItemType.FIGHT_PACK,
							description: this.$t('n_fights_desc', [count]),
							leeks: [],
							leek_objs: [],
							leek_count: 0,
							farmer_count: 0,
							sell_price: 0
						} as ItemTemplate
						this.fight_packs.push(pack)
						this.items[pack.id] = pack
						this.items_by_name[pack.name] = pack
					}
				}
				const itemName = this.$route.params.item
				if (itemName) {
					this.selectedItem = this.items_by_name[itemName]
				} else {
					this.selectedItem = this.items_by_name.pistol
				}
			})
			this.$root.$on('back', () => {
				this.$router.push('/market')
			})
		}
		@Watch('$route.params.item', {immediate: true})
		update() {
			const item = this.$route.params.item
			if (item) {
				this.selectedItem = this.items_by_name[item]
				LeekWars.setTitle(this.selectedItem.name)
				LeekWars.splitShowContent()
			} else {
				this.selectedItem = null
				LeekWars.setTitle(this.$t('market.title'))
				LeekWars.splitShowList()
			}
			LeekWars.setActions([{icon: 'account_balance', click: () => this.$router.push('/bank')}])
		}
		openBuyHabs() {
			if (this.selectedItem && this.selectedItem.price_habs < this.$store.state.farmer.habs) {
				this.buyDialog = true
			}
		}
		openBuyCrystals() {
			if (this.selectedItem && this.selectedItem.price_crystals < this.$store.state.farmer.crystals) {
				this.buyCrystalsDialog = true
			}
		}
		buy(currency: string) {
			if (!this.selectedItem) { return }
			const item = this.selectedItem
			const method = currency === 'habs' ? 'market/buy-habs' : 'market/buy-crystals'
			const id = item.type === ItemType.FIGHT_PACK ? (item.id - 1000000) + 'fights' : item.id
			LeekWars.post(method, {item_id: id}).then((data) => {
				if (data.data.success) {
					this.buyDialog = false
					this.buyCrystalsDialog = false
					// _.toast([
					// 	_.lang.get('market', 'weapon_bought'),
					// 	_.lang.get('market', 'chip_bought'),
					// 	_.lang.get('market', 'potion_bought'),
					// 	_.lang.get('market', 'hat_bought'),
					// 	_.lang.get('market', 'fights_bought')
					// ][type - 1])
					if (item.type !== ItemType.FIGHT_PACK) {
						item.farmer_count++
					}
					if (currency === 'habs') {
						this.$store.commit('update-habs', -item.price_habs)
					} else {
						this.$store.commit('update-crystals', -item.price_crystals)
					}
					if (item.type === ItemType.FIGHT_PACK) {
						this.$store.commit('update-fights', data.data.fights)
					}
					this.$store.commit('add-inventory', {type: item.type, item_id: data.data.item, item_template: id})
				} else {
					let error = data.data.error
					if (data.data.error === 'already_bought_fights_with_habs') {
						error = this.$t('market.' + data.data.error)
					}
					LeekWars.toast(error)
				}
			})
		}
		sell() {
			if (!this.selectedItem) { return }
			const item = this.selectedItem
			LeekWars.post('market/sell-habs', {item_id: item.id}).then((data) => {
				if (data.data.success) {
					this.sellDialog = false
					// _.toast([
					// 	_.lang.get('market', 'weapon_selled'),
					// 	_.lang.get('market', 'chip_selled'),
					// 	_.lang.get('market', 'potion_selled'),
					// 	_.lang.get('market', 'hat_selled')
					// ][type - 1])
					item.farmer_count--
					this.$store.commit('update-habs', item.sell_price)
					this.$store.commit('remove-inventory', {type: item.type, item_template: data.data.item})
				}
			})
		}
		updateChipMode() {
			this.chipMode = this.chipMode === 'level' ? 'type' : 'level'
			localStorage.setItem('market/sort_mode', this.chipMode)
		}
	}
</script>

<style lang="scss" scoped>
	.loader {
		padding: 20px 0;
	}
	.preview-panel .loader {
		padding: 80px 0;
	}
	.column4 {
		position: sticky;
		top: 15px;
	}
	.preview.content {
		text-align: center;
		padding: 0;
	}
	.content.items {
		padding: 0px;
		display: flex;
		flex-wrap: wrap;
	}
	.content.items.noflex {
		display: block;
	}
	.preview .leeks {
		padding: 6px 0;
	}
	.preview .leek {
		background: #5fad1b;
		color: white;
		padding: 4px 8px;
		border-radius: 3px;
		margin: 3px 1px;
		display: inline-block;
	}
	.items {
		padding-bottom: 50px;
	}
	.item {
		border: 1px solid #ddd;
	}
	.item.router-link-active {
		background: white;
		box-shadow: 0px 2px 1px -1px rgba(0,0,0,0.2), 0px 1px 1px 0px rgba(0,0,0,0.14), 0px 1px 3px 0px rgba(0,0,0,0.12);
	}
	.buy-label {
		display: inline-block;
	}
	.items .item {
		position: relative;
	}
	.items .item:not([leek-count='0']):before {
		position: absolute;
		bottom: -5px;
		right: -5px;
		width: 20px;
		height: 20px;
		content: attr(leek-count);
		text-align: center;
		color: #eee;
		border-radius: 20px;
		background-color: #5fad1b;
		font-weight: bold;
	}
	.items .item:not([farmer-count='0']):after {
		position: absolute;
		bottom: -5px;
		right: -5px;
		width: 20px;
		height: 20px;
		content: attr(farmer-count);
		text-align: center;
		color: #eee;
		border-radius: 20px;
		font-weight: bold;
		background-color: #777;
	}
	.items .item:not([farmer-count='0']):not([leek-count='0']):before {
		border-radius: 20px 0 0 20px;
		right: 16px;
	}
	.items .item:not([farmer-count='0']):not([leek-count='0']):after {
		border-radius: 0 20px 20px 0;
	}
	.items .item.too-expensive img {
		opacity: 0.4;
	}
	.fights {
		width: 140px;
		display: inline-block;
		margin: 10px 5px;
		padding: 10px;
		font-size: 18px;
		color: #777;
		cursor: pointer;
	}
	.fights img {
		width: 60px;
	}
	.weapons .weapon {
		padding: 10px;
		width: 178px;
		height: 50px;
		display: inline-block;
		position: relative;
		cursor: pointer;
		text-align: center;
		vertical-align: bottom;
		margin: 8px;
	}
	#app.app .weapons .weapon {
		width: 150px;
		margin: 5px;
	}
	.weapons .weapon img {
		max-height: 52px;
		max-width: 160px;
		position: absolute;
		top: 0;
		bottom: 0;
		left: 0;
		right: 0;
		margin: auto;
	}
	.chips {
		padding: 0 10px;
	}
	.chips[sort-mode='level'] {
		text-align: center;
	}
	.chips .chip {
		width: 73px;
		padding: 6px;
		display: inline-block;
		position: relative;
		cursor: pointer;
		text-align: center;
		margin: 6px;
	}
	#app.app .chips .chip {
		width: 50px;
		margin: 3px;
	}
	.chips .chip img {
		height: 68px;
		vertical-align: bottom;
	}
	#app.app .chips .chip img {
		height: 50px;
	}
	.chips h3 {
		margin: 0;
		margin-top: 8px;
		margin-left: -10px;
	}
	.potion {
		width: 90px;
		padding: 5px 3px;
		display: inline-block;
		position: relative;
		cursor: pointer;
		text-align: center;
		margin: 8px;
	}
	.potion img {
		width: 90px;
	}
	.hat {
		width: 110px;
		height: 80px;
		padding: 5px 3px;
		display: inline-block;
		position: relative;
		cursor: pointer;
		text-align: center;
		vertical-align: bottom;
		margin: 8px;
	}
	#app.app .hat {
		margin: 4px;
	}
	.hat img {
		max-width: 100px;
		max-height: 70px;
		position: absolute;
		top: 0;
		bottom: 0;
		left: 0;
		right: 0;
		margin: auto;
	}
	.buy-buttons {
		padding-top: 10px;
		padding-bottom: 10px;
	}
	.buy-button img {
		vertical-align: top;
		margin-top: 1px;
		margin-left: 5px;
	}
	.buy-crystals-button img {
		vertical-align: middle;
		margin-top: -15px;
		margin-bottom: -15px;
		margin-left: 5px;
	}
</style>
