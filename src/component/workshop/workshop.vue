<template>
	<div>
		<div class="page-bar page-header">
			<h1>{{ $t('main.workshop') }}</h1>
			<div class="tabs">
				<router-link to="/bank">
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
				<div class="tab action active" icon="mdi-hammer-wrench" link="/workshop">
					<v-icon>mdi-treasure-chest</v-icon>
					<span>{{ $t('main.inventory') }}</span>
				</div>
			</div>
		</div>
		<div class="container">
			<panel class="first">
				<div class="forge">
					<div class="grid">
						<div v-for="(item, i) in forge" :key="i" class="cell" :class="{active: !!item}">
							<div v-if="item" v-ripple class="item" :quantity="item.quantity | number" :type="LeekWars.items[item.template].type" @click="remove(i, $event)">
								<img :src="'/image/' + LeekWars.items[item.template].name.replace('_', '/') + '.png'">
							</div>
						</div>
					</div>
					<div class="symbol">→</div>
					<div class="cell" :class="{active: !!scheme}">
						<div v-if="scheme" class="item" :quantity="1" :type="LeekWars.items[scheme.result].type">
							<img :src="'/image/' + LeekWars.items[scheme.result].name.replace('_', '/') + '.png'">
						</div>
					</div>
				</div>
			</panel>
			<panel icon="mdi-treasure-chest" class="inventory-panel">
				<template slot="title">
					Inventaire ({{ inventory.length }})
				</template>
				<template slot="actions">
					<span class="value" title="Valeur totale"><div class="hab"></div> {{ inventory.reduce((s, i) => s + LeekWars.items[i.template].price, 0) | number }}</span>
					<div class="button flat">
						<v-icon>mdi-sort</v-icon>
					</div>
					<div class="button flat">
						<v-icon>mdi-filter-outline</v-icon>
					</div>
				</template>
				<div slot="content" class="inventory-content">
					<inventory />
				</div>
			</panel>
		</div>
		<panel icon="mdi-script-outline" :title="'Schémas (' + (schemes ? schemes.length : '...') + ')'">
			<template slot="actions">
				<div class="button flat">
					<v-icon>mdi-sort</v-icon>
				</div>
				<div class="button flat">
					<v-icon>mdi-filter-outline</v-icon>
				</div>
			</template>
			<div slot="content" class="schemes">
				<div v-for="(scheme, s) in schemes" :key="s" class="scheme">
					<!-- <div class="use">
						<v-btn ><v-icon>mdi-arrow-right-thick</v-icon></v-btn>
					</div> -->
					<div v-ripple class="group result" @click="use(scheme)">
						<div class="item" :quantity="1" :title="'#' + scheme.result + ' ' + LeekWars.items[scheme.result].name">
							<img :src="'/image/' + LeekWars.items[scheme.result].name.replace('_', '/') + '.png'" :type="LeekWars.items[scheme.result].type">
							<div class="id">#{{ scheme.result }}</div>
						</div>
					</div>
					<div class="items">
						<template v-for="(group, i) in scheme.items">
							<div :key="'_' + i" class="symbol">{{ i === 0 ? " = " : " + " }}</div>
							<div :key="i" class="group">
								<template v-for="(item, i) in group">
									<div v-if="item[0] in LeekWars.items" :key="i" class="item" :quantity="item[1] | number" :title="'#' + item[0] + ' ' + LeekWars.items[item[0]].name">
										<img :src="'/image/' + LeekWars.items[item[0]].name.replace('_', '/') + '.png'" :type="LeekWars.items[item[0]].type">
										<div class="id">#{{ item[0] }}</div>
									</div>
									<div v-else :key="i" class="item">{{ item[0] }}</div>
									<div v-if="i < group.length - 1" :key="'_' + i" class="or">ou</div>
								</template>
							</div>
						</template>
					</div>
					<div class="space"></div>
				</div>
			</div>
		</panel>
	</div>
</template>

<script lang="ts">
import { ItemTemplate } from '@/model/item'
	import { LeekWars } from '@/model/leekwars'
import { store } from '@/model/store'
	import { Component, Vue, Watch } from 'vue-property-decorator'
import { Item } from '../editor/editor-item'

	class Scheme {
		items!: number[][][]
		result!: any
	}

	@Component({ name: 'workshop', i18n: {} })
	export default class Workshop extends Vue {
		schemes: any = null
		scheme: any = null
		forge: any[] = [null, null, null, null, null, null, null, null, null]


		created() {
			// console.log("LeekWars.items", LeekWars.items)
			LeekWars.get('scheme/get-all').then(schemes => this.schemes = schemes)
		}
		mounted() {
			LeekWars.footer = false
			LeekWars.box = true
		}
		destroyed() {
			LeekWars.footer = true
			LeekWars.box = false
		}

		use(scheme: any) {
			this.scheme = scheme
			for (let i = 0; i < 9; ++i) {
				Vue.set(this.forge, i, null)
			}
			for (let i = 0; i < scheme.items.length; ++i) {
				Vue.set(this.forge, i, {template: scheme.items[i][0][0], quantity: scheme.items[i][0][1]})
			}
		}

		/**
		 * Sélection d'un item de l'inventaire vers la forge
		 */
		pick(item: any, position: number, event: MouseEvent) {
			const all = event.ctrlKey
			const added_quantity = all ? item.quantity : 1
			let forgePosition = -1
			let quantity = added_quantity
			// Existe déjà ?
			for (let i = 0; i < 9; ++i) {
				if (this.forge[i] && this.forge[i].template === item.template) {
					forgePosition = i
					quantity += this.forge[i].quantity
					break
				}
			}
			if (forgePosition === -1) {
				for (let i = 0; i < 9; ++i) {
					if (this.forge[i] == null) {
						forgePosition = i
						break
					}
				}
			}
			// Ajout à la première place dispo
			Vue.set(this.forge, forgePosition, {template: item.template, quantity})
			this.removeInventory(position, added_quantity)
		}

		removeInventory(position: number, quantity: number) {
			// this.inventory[position].quantity -= quantity
			// if (this.inventory[position].quantity === 0) {
			// 	this.inventory.splice(position, 1)
			// }
		}

		/**
		 * Supprime un item de la forge
		 */
		remove(i: number, event: MouseEvent) {
			const all = event.ctrlKey
			if (this.forge[i].quantity === 1 || all) {
				this.addInventory(this.forge[i].template, this.forge[i].quantity)
				Vue.set(this.forge, i, null)
			} else {
				const quantity = all ? this.forge[i].quantity : 1
				this.addInventory(this.forge[i].template, quantity)
				Vue.set(this.forge, i, {template: this.forge[i].template, quantity: this.forge[i].quantity - quantity})
			}
		}

		addInventory(template: number, quantity: number) {
			// for (let i = 0; i < this.inventory.length; ++i) {
			// 	if (this.inventory[i].template === template) {
			// 		this.inventory[i].quantity += quantity
			// 		return
			// 	}
			// }
			// this.inventory.push({template, quantity})
		}

		@Watch('forge')
		resolveScheme() {
			console.log("forge updated")
			this.scheme = null
			for (const scheme of this.schemes) {
				if (this.match(scheme)) {
					this.scheme = scheme
				}
			}
		}

		match(scheme: Scheme) {
			const items = this.forge

			let forge_items = 0
			for (const item of this.forge) {
				if (item) { forge_items++ }
			}
			if (forge_items !== scheme.items.length) { return false }

			for (let i = 0; i < this.forge.length; ++i) {
				if (!this.forge[i]) continue
				// console.log("find item", this.forge[i].template)
				const forge_template = this.forge[i].template
				if (i >= scheme.items.length) { return false }
				const group = scheme.items[i]
				if (!group.find(item => item[0] === forge_template)) {
					return false
				}
			}
			return true
		}
	}
</script>

<style lang="scss" scoped>
.panel {
	min-height: 0;
}
.forge {
	display: flex;
	align-items: center;
	.cell {
		width: 76px;
		height: 76px;
	}
	.item {
		cursor: pointer;
		height: 100%;
	}
}
.grid {
	display: grid;
	width: 250px;
	grid-template-columns: 1fr 1fr 1fr;
	gap: 8px;
}
.cell {
	background: #e8e8e8;
	padding: 3px;
	&:not(.active) {
		border: 2px inset white;
		padding: 0;
	}
	&.active {
		background: white;
		box-shadow: 0px 2px 1px -1px rgba(0, 0, 0, 0.2), 0px 1px 1px 0px rgba(0, 0, 0, 0.14), 0px 1px 3px 0px rgba(0, 0, 0, 0.12);
	}
}

.schemes {
	overflow-y: auto;
}

.scheme {
	display: flex;
	align-items: center;
	margin: 8px 0;
	padding: 0 8px;
	&:nth-child(2n) {
		background: #e5e5e5;
	}
	.space {
		flex: 1;
	}
	.items {
		display: flex;
		align-items: center;
	}
	.item {
		width: 70px;
		height: 70px;
	}
	.group {
		display: flex;
		align-items: center;
		background: white;
		box-shadow: 0px 2px 1px -1px rgba(0, 0, 0, 0.2), 0px 1px 1px 0px rgba(0, 0, 0, 0.14), 0px 1px 3px 0px rgba(0, 0, 0, 0.12);

		.or {
			width: 35px;
			text-align: center;
			color: #555;
		}
	}
	.result {
		cursor: pointer;
		&:hover {
			background: #eee;
		}
	}
}

.symbol {
	font-size: 27px;
	font-family: monospace;
	padding: 10px;
	width: 35px;
}
</style>