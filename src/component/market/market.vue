<template lang="html">
	<div>
		<div class="page-header page-bar">
			<h1>{{ $t('title') }}</h1>
			<div class="tabs">
				<router-link v-if="env.BANK" to="/bank">
					<div class="tab action" icon="account_balance" link="/bank">
						<i class="material-icons">account_balance</i>
						<span>{{ $t('main.bank') }}</span>
					</div>
				</router-link>
			</div>
		</div>
		<div class="container">
			<div v-show="!LeekWars.mobile || !LeekWars.splitBack" class="column8">
				<panel :title="$t('fights')">
					<loader v-if="!fight_packs.length" slot="content" />
					<div v-else slot="content" class="items fights">
						<router-link v-ripple v-for="pack in fight_packs" :key="pack.id" :to="'/market/' + pack.name" :farmer-count="0" :leek-count="0" class="item fight-pack" @click="selectItem(pack)">
							<img src="/image/market/fights.png">
							<div>{{ pack.title }}</div>
						</router-link>
					</div>
				</panel>
				<panel :title="$t('weapons')">
					<loader v-if="!weapons.length" slot="content" />
					<div v-else slot="content" class="items weapons">
						<router-link v-ripple v-for="weapon in weapons" :key="weapon.id" :to="'/market/' + weapon.name" :farmer-count="items[weapon.id].farmer_count" :leek-count="items[weapon.id].leek_count" class="item weapon">
							<img :src="'/image/weapon/' + weapon.name + '.png'">
						</router-link>
					</div>
				</panel>
				<panel :title="$t('chips')">
					<div slot="actions" class="button flat" @click="updateChipMode">
						<i v-if="chipMode === 'type'" class="material-icons">view_module</i>
						<i v-else class="material-icons">sort</i>
					</div>
					<loader v-if="!chips.length" slot="content" />
					<div v-else-if="chipMode === 'level'" slot="content" class="items chips">
						<router-link v-ripple v-for="chip in chips" :key="chip.id" :to="'/market/' + chip.name" :farmer-count="items[chip.id].farmer_count" :leek-count="items[chip.id].leek_count" class="item chip">
							<img :src="'/image/chip/small/' + chip.name + '.png'">
						</router-link>
					</div>
					<div v-else slot="content">
						<div v-for="type in EffectTypeMarket" v-if="!isNaN(type)" :key="type">
							<h4 :class="{first: type === EffectTypeMarket.ATTACK}">{{ $t('effect.effect_type_' + type) }}</h4>
							<div class="items chips">
								<router-link v-ripple v-for="chip in chipsByType[type]" :key="chip.id" :to="'/market/' + chip.name" :farmer-count="items[chip.id].farmer_count" :leek-count="items[chip.id].leek_count" class="item chip">
									<img :src="'/image/chip/small/' + chip.name + '.png'">
								</router-link>
							</div>
						</div>
					</div>
				</panel>
				<panel :title="$t('potions')">
					<loader v-if="!potions.length" slot="content" />
					<div v-else slot="content" class="items potions">
						<router-link v-ripple v-for="potion in potions" :key="potion.id" :to="'/market/' + potion.name" :farmer-count="items[potion.id].farmer_count" :leek-count="items[potion.id].leek_count" class="item potion">
							<img :src="'/image/potion/' + potion.name + '.png'">
						</router-link>
					</div>
				</panel>
				<panel :title="$t('hats')" class="last">
					<loader v-if="!hats.length" slot="content" />
					<div v-else slot="content" class="items hats">
						<router-link v-ripple v-for="hat in hats" :key="hat.id" :to="'/market/' + hat.name" :farmer-count="items[hat.id].farmer_count" :leek-count="items[hat.id].leek_count" class="item hat">
							<img :src="'/image/hat/' + hat.name + '.png'">
						</router-link>
					</div>
				</panel>
			</div>
			<div v-show="!LeekWars.mobile || LeekWars.splitBack" class="column4">
				<panel :title="$t('characteristics')" class="last preview-panel">
					<loader v-if="!selectedItem" slot="content" />
					<div v-else slot="content" class="preview center">
						<weapon-preview v-if="selectedItem.type == ItemType.WEAPON" :weapon="LeekWars.weapons[selectedItem.id]" />
						<chip-preview v-else-if="selectedItem.type == ItemType.CHIP" :chip="LeekWars.chips[selectedItem.id]" />
						<potion-preview v-else-if="selectedItem.type == ItemType.POTION" :potion="LeekWars.potions[selectedItem.id]" />
						<fight-pack-preview v-else-if="selectedItem.type == ItemType.FIGHT_PACK" :pack="selectedItem" />
						<hat-preview v-else-if="selectedItem.type == ItemType.HAT" :hat="LeekWars.hats[selectedItem.id]" />
						<div class="buy-buttons">
							<div v-if="selectedItem.price_habs > 0">
								<h4 class="buy-label">{{ $t('buy') }}</h4>
								<v-btn :disabled="$store.state.farmer && $store.state.farmer.habs < selectedItem.price_habs" class="buy-button" @click="openBuyHabs">{{ selectedItem.price_habs | number }}<img src="/image/hab.png"></v-btn>
							</div>
							<div v-if="env.BANK && selectedItem.price_crystals > 0">
								<h4 class="buy-label">{{ $t('buy') }}</h4>
								<v-btn :disabled="$store.state.farmer && $store.state.farmer.crystals < selectedItem.price_crystals" class="buy-crystals-button" @click="openBuyCrystals">{{ selectedItem.price_crystals | number }}<img src="/image/crystal.png"></v-btn>
							</div>
							<template v-if="selectedItem.sellable && selectedItem.farmer_count > 0">
								<div class="sell">
									<h4 class="buy-label">{{ $t('resell') }}</h4>&nbsp;
									<v-btn class="sell-button" @click="sellDialog = true">{{ selectedItem.sell_price | number }} <img src="/image/hab.png"></v-btn>
								</div>
							</template>
						</div>
						<div v-if="selectedItem.leek_objs.length">
							<div><b>{{ $t('equipped_on') }}</b></div>
							<div class="leeks">
								<router-link v-for="leek in selectedItem.leek_objs" :key="leek.id" :to="'/leek/' + leek.id">
									<rich-tooltip-leek :id="leek.id" class="leek">{{ leek.name }}</rich-tooltip-leek>
								</router-link>
							</div>
						</div>
					</div>
				</panel>
			</div>
		</div>

		<popup v-model="buyDialog" :width="600">
			<span slot="title">{{ $t('confirm_purchase') }}</span>
			<div v-if="selectedItem && $store.state.farmer">
				<i18n tag="div" path="are_you_sure_you_want_to_buy">
					<b slot="item">{{ translateName(selectedItem) }}</b>
				</i18n>
				<br>
				<b>{{ $t('price') }}</b> : {{ selectedItem.price_habs | number }} <span class="hab"></span>
				<br>
				<b>{{ $t('habs_before_purchase') }}</b> : {{ $store.state.farmer.habs | number }} <span class="hab"></span>
				<br>
				<b>{{ $t('habs_after_purchase') }}</b> : {{ $store.state.farmer.habs - selectedItem.price_habs | number }} <span class="hab"></span>
			</div>
			<div slot="actions">
				<div @click="buyDialog = false">{{ $t('cancel') }}</div>
				<div class="buy green" @click="buy('habs')">{{ $t('buy') }}</div>
			</div>
		</popup>

		<popup v-model="buyCrystalsDialog" :width="600">
			<span slot="title">{{ $t('confirm_purchase') }}</span>
			<div v-if="selectedItem && $store.state.farmer">
				<i18n tag="div" path="are_you_sure_you_want_to_buy">
					<b slot="item">{{ translateName(selectedItem) }}</b>
				</i18n>
				<br>
				<b>{{ $t('price') }}</b> : {{ selectedItem.price_crystals }} <span class="crystal"></span>
				<br>
				<b>{{ $t('crystals_before_purchase') }}</b> : {{ $store.state.farmer.crystals | number }} <span class="crystal"></span>
				<br>
				<b>{{ $t('crystals_after_purchase') }}</b> : {{ $store.state.farmer.crystals - selectedItem.price_crystals | number }} <span class="crystal"></span>
			</div>
			<div slot="actions">
				<div @click="buyCrystalsDialog = false">{{ $t('cancel') }}</div>
				<div class="buy green" @click="buy('crystals')">{{ $t('buy') }}</div>
			</div>
		</popup>
		
		<popup v-model="sellDialog" :width="600">
			<span slot="title">{{ $t('confirm_sell') }}</span>
			<div v-if="selectedItem && $store.state.farmer">
				<i18n tag="div" path="are_you_sure_you_want_to_sell">
					<b slot="item">{{ translateName(selectedItem) }}</b>
				</i18n>
				<br>
				<b>{{ $t('price') }}</b> : {{ selectedItem.price | number }} <span class="hab"></span>
				<br>
				<b>{{ $t('habs_before_sell') }}</b> : {{ $store.state.farmer.habs | number }} <span class="hab"></span>
				<br>
				<b>{{ $t('habs_after_sell') }}</b> : {{ $store.state.farmer.habs + selectedItem.sell_price | number }} <span class="hab"></span>
			</div>
			<div slot="actions">
				<div @click="sellDialog = false">{{ $t('cancel') }}</div>
				<div class="sell green" @click="sell">{{ $t('sell') }}</div>
			</div>
		</popup>
	</div>
</template>

<script lang="ts">
	import { ChipTemplate } from '@/model/chip'
	import { EffectTypeMarket } from '@/model/effect'
	import { Farmer } from '@/model/farmer'
	import { HatTemplate } from '@/model/hat'
	import { ItemTemplate, ItemType } from '@/model/item'
	import { LeekWars } from '@/model/leekwars'
	import { PotionTemplate } from '@/model/potion'
	import { store } from '@/model/store'
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
		actions: any

		created() {
			this.actions = [{icon: 'account_balance', click: () => this.$router.push('/bank')}]
			LeekWars.get('market/get-item-templates').then(res => {
				const items = res.items as ItemTemplate[]
				for (const i in items) {
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
					if (this.$store.state.farmer) {
						for (const leek of item.leeks) {
							if (leek in this.$store.state.farmer.leeks) {
								item.leek_objs.push(this.$store.state.farmer.leeks[leek])
							}
						}
					}
				}
				this.createFightPacks()
				if (store.state.farmer) { this.setFightPackPrice(store.state.farmer) }
				else { this.$root.$on('connected', (farmer: Farmer) => this.setFightPackPrice(farmer)) }
				this.update()
			})
			this.$root.$on('back', () => {
				this.$router.push('/market')
			})
			LeekWars.setActions(this.actions)
		}
		@Watch('$route.params.item')
		update() {
			const item = this.$route.params.item
			if (item) {
				this.selectedItem = this.items_by_name[item]
				LeekWars.setTitle(this.translateName(this.selectedItem))
				LeekWars.splitShowContent()
			} else if (!LeekWars.mobile) {
				this.$router.replace('/market/pistol')
			} else {
				this.selectedItem = null
				LeekWars.setTitle(this.$t('market.title'))
				LeekWars.splitShowList()
			}
			this.updateSubtitle()
			LeekWars.setActions(this.actions)
		}
		updateSubtitle() {
			LeekWars.setSubTitle(this.$t('main.x_habs', [LeekWars.formatNumber(this.$store.state.farmer.habs)]) + " • " + this.$t('main.x_crystals', [LeekWars.formatNumber(this.$store.state.farmer.crystals)]))
		}
		translateName(item: ItemTemplate) {
			if (item.type === ItemType.FIGHT_PACK) {
				return this.$t('n_fights', [item.id - 1000000])
			}
			const type = ['weapon', 'chip', 'potion', 'hat'][item.type - 1]
			return this.$t(type + '.' + item.name.replace(type + '_', ''))
		}
		openBuyHabs() {
			if (this.selectedItem && this.selectedItem.price_habs <= this.$store.state.farmer.habs) {
				this.buyDialog = true
			}
		}
		openBuyCrystals() {
			if (this.selectedItem && this.selectedItem.price_crystals <= this.$store.state.farmer.crystals) {
				this.buyCrystalsDialog = true
			}
		}
		buy(currency: string) {
			if (!this.selectedItem) { return }
			const item = this.selectedItem
			const method = currency === 'habs' ? 'market/buy-habs' : 'market/buy-crystals'
			const id = item.type === ItemType.FIGHT_PACK ? (item.id - 1000000) + 'fights' : item.id
			LeekWars.post(method, {item_id: id}).then(data => {
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
					this.$store.commit('update-fights', data.fights)
				}
				this.$store.commit('add-inventory', {type: item.type, item_id: data.item, item_template: id})
				this.updateSubtitle()
			}).error(error => {
				let e = error.error
				if (error.error === 'already_bought_fights_with_habs') {
					e = this.$t('market.' + error.error)
				}
				LeekWars.toast(e)
			})
		}
		sell() {
			if (!this.selectedItem) { return }
			const item = this.selectedItem
			LeekWars.post('market/sell-habs', {item_id: item.id}).then(data => {
				this.sellDialog = false
				// _.toast([
				// 	_.lang.get('market', 'weapon_selled'),
				// 	_.lang.get('market', 'chip_selled'),
				// 	_.lang.get('market', 'potion_selled'),
				// 	_.lang.get('market', 'hat_selled')
				// ][type - 1])
				item.farmer_count--
				this.$store.commit('update-habs', item.sell_price)
				this.$store.commit('remove-inventory', {type: item.type, item_template: data.item})
				this.updateSubtitle()
			})
		}
		updateChipMode() {
			this.chipMode = this.chipMode === 'level' ? 'type' : 'level'
			localStorage.setItem('market/sort_mode', this.chipMode)
		}
		createFightPacks() {
			const fights = [100, 200, 500, 1000]
			const costs = [1, 1.8, 4, 7]
			for (const p in fights) {
				const count = fights[p]
				const pack: ItemTemplate = {
					id: 1000000 + fights[p],
					name: count + '-fights',
					title: this.$t('market.n_fights', [count]),
					price_habs: p === '0' ? 100000 : 0,
					price_crystals: costs[p] * 100,
					sellable: false,
					type: ItemType.FIGHT_PACK,
					description: this.$t('market.n_fights_desc', [count]),
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
		setFightPackPrice(farmer: Farmer) {
			const ratio = store.state.farmer!.total_level / 1204
			const priceHabs = Math.round(100000 + Math.pow(ratio, 3) * 4900000)
			this.items_by_name['100-fights'].price_habs = priceHabs
		}
	}
</script>

<style lang="scss" scoped>
	#app.app .column8 {
		height: calc(100vh - 56px);
		overflow-y: auto;
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
		display: grid;
		grid-gap: 8px;
		padding: 8px;
	}
	.items.potions {
		grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
	}
	.items.chips {
		grid-template-columns: repeat(auto-fill, minmax(76px, 1fr));
	}
	.items.weapons {
		grid-template-columns: repeat(auto-fill, minmax(165px, 1fr));
	}
	.items.fights {
		grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
	}
	.items.hats {
		grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
	}
	.item {
		border: 1px solid #ddd;
		cursor: pointer;
		position: relative;
		text-align: center;
	}
	.item.router-link-active {
		background: white;
		box-shadow: 0px 2px 1px -1px rgba(0,0,0,0.2), 0px 1px 1px 0px rgba(0,0,0,0.14), 0px 1px 3px 0px rgba(0,0,0,0.12);
	}
	.buy-label {
		display: inline-block;
	}
	.items .item:not([leek-count="0"]):before {
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
	.items .item:not([farmer-count="0"]):after {
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
	.items .item:not([farmer-count="0"]):not([leek-count="0"]):before {
		border-radius: 20px 0 0 20px;
		right: 16px;
	}
	.items .item:not([farmer-count="0"]):not([leek-count="0"]):after {
		border-radius: 0 20px 20px 0;
	}
	.items .item.too-expensive img {
		opacity: 0.4;
	}
	.fight-pack {
		padding: 10px;
		font-size: 18px;
		color: #777;
	}
	.fights img {
		width: 60px;
	}
	.weapons .weapon {
		padding: 10px;
		height: 50px;
	}
	.weapons .weapon img {
		max-height: 52px;
		max-width: 150px;
		position: absolute;
		top: 0;
		bottom: 0;
		left: 0;
		right: 0;
		margin: auto;
	}
	.chips .chip {
		padding: 6px;
	}
	.chips .chip img {
		width: 62px;
		vertical-align: bottom;
	}
	.panel h4 {
		margin: 0;
		margin-left: 8px;
		margin-bottom: 0;
		font-size: 15px;
		&.first {
			margin-top: 8px;
		}
	}
	.potion {
		padding: 6px 0;
	}
	.potion img {
		width: 80px;
	}
	.hat {
		height: 70px;
		padding: 6px;
	}
	.hat img {
		max-width: 92px;
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
		button {
			margin-bottom: 5px;
			margin-left: 8px;
			img {
				vertical-align: top;
				margin-left: 5px;
			}
		}
	}
	.buy-crystals-button img {
		vertical-align: middle;
		margin-top: -15px;
		margin-bottom: -15px;
		margin-left: 5px;
		height: 40px;
	}
</style>
