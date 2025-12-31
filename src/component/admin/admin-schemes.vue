<template>
	<div class="page">
		<div class="page-header page-bar">
			<h1><router-link to="/admin">Administration</router-link> > Schémas ({{ schemes ? schemes.length : '...' }})</h1>
		</div>
		<panel class="first">
			<div class="content" slot="content">

				<div v-if="schemes" class="schemes">
					<!-- <div v-for="(scheme, s) in schemes" :key="s" class="scheme">
						<div v-ripple class="group result">
							<rich-tooltip-item v-slot="{ props }" :item="LeekWars.items[scheme.result]" :bottom="true" :inventory="true" @input="$emit('input', $event)">
								<div class="item" v-bind="props" :quantity="1" :class="{['rarity-border-' + LeekWars.items[scheme.result].rarity]: true}">
									<img :src="'/image/' + ITEM_CATEGORY_NAME[LeekWars.items[scheme.result].type] + '/' + LeekWars.items[scheme.result].name.replace('hat_', '').replace('potion_', '') + '.png'" :type="LeekWars.items[scheme.result].type">
									<div v-if="scheme.quantity > 1" class="quantity">{{ $filters.number(scheme.quantity) }}</div>
								</div>
							</rich-tooltip-item>
							<input :value="scheme.result" type="text">
						</div>
						<div :key="'__'" class="symbol">{{ " = " }}</div>
						<div class="items">
							<template v-for="(ingredient, i) in scheme.items">
								<div v-if="ingredient">
									<rich-tooltip-item v-if="LeekWars.items[ingredient[0]]" :key="i" v-slot="{ props }" :item="LeekWars.items[ingredient[0]]" :bottom="true" :inventory="true" :quantity="ingredient[1]" @input="$emit('input', $event)">
										<div class="item" v-bind="props" :class="{['rarity-border-' + LeekWars.items[ingredient[0]].rarity]: true}">
											<img :src="'/image/' + ITEM_CATEGORY_NAME[LeekWars.items[ingredient[0]].type] + '/' + LeekWars.items[ingredient[0]].name.replace('hat_', '').replace('potion_', '').replace('chip_', '') + '.png'" :type="LeekWars.items[ingredient[0]].type">
											<div v-if="ingredient[1] > 1" class="quantity">{{ $filters.number(ingredient[1]) }}</div>
										</div>
									</rich-tooltip-item>
									<div v-else class="item"></div>
									<input v-model="ingredient[0]" type="text">
									<input v-model="ingredient[1]" type="text">
								</div>
								<div v-if="ingredient && i < scheme.items.length - 1" :key="'_' + i" class="symbol">{{ " + " }}</div>
							</template>
						</div>
						<div class="spacer"></div>
						<div>
							<div>{{ $filters.number(scheme.quantity * LeekWars.items[scheme.result].price) }} <span class="hab"></span></div>
							<div :class="{wrong: Math.abs((scheme.quantity * LeekWars.items[scheme.result].price) / scheme.items.reduce((s, i) => s + (i && LeekWars.items[i[0]] ? i[1] * LeekWars.items[i[0]].price : 0), 0) - 1.1) > 0.02 }">{{ $filters.number(scheme.items.reduce((s, i) => s + (i && LeekWars.items[i[0]] ? i[1] * LeekWars.items[i[0]].price : 0), 0)) }} ({{ ((scheme.quantity * LeekWars.items[scheme.result].price) / scheme.items.reduce((s, i) => s + (i && LeekWars.items[i[0]] ? i[1] * LeekWars.items[i[0]].price : 0), 0)).toFixed(2) }}) <span class="hab"></span></div>
						</div>
					</div> -->

					<div v-for="(scheme, s) in schemes" :key="s" class="forge">
						<div class="grid">
							<div v-for="(_, i) in 9" :key="i" class="cell" :class="{['cell' + i]: true}">
								<rich-tooltip-item v-if="scheme.items[i] && LeekWars.items[scheme.items[i][0]]" :key="i" v-slot="{ props }" :item="LeekWars.items[scheme.items[i][0]]" :bottom="true" :inventory="true" :quantity="scheme.items[i][1]">
									<div class="item" v-bind="props" :type="LeekWars.items[scheme.items[i][0]].type">
										<img :src="'/image/' + ITEM_CATEGORY_NAME[LeekWars.items[scheme.items[i][0]].type] + '/' + LeekWars.items[scheme.items[i][0]].name.replace('hat_', '').replace('potion_', '').replace('chip_', '').replace('weapon_', '') + '.png'">
									</div>
								</rich-tooltip-item>
								<input v-model="scheme.items[i][0]" @keyup="updateScheme(scheme)" class="item-id">
								<input v-model="scheme.items[i][1]" @keyup="updateScheme(scheme)" class="quantity">
							</div>
							<div class="cell" :class="{cell8: true}">
								<rich-tooltip-item v-slot="{ props }" :item="LeekWars.items[scheme.result]" :bottom="true" :inventory="true" :quantity="scheme.quantity">
									<div v-bind="props" class="item" :type="LeekWars.items[scheme.result].type">
										<img :src="'/image/' + ITEM_CATEGORY_NAME[LeekWars.items[scheme.result].type] + '/' + LeekWars.items[scheme.result].name.replace('hat_', '').replace('potion_', '') + '.png'">
										<input v-model="scheme.quantity" @keyup="updateScheme(scheme)" class="quantity">
									</div>
								</rich-tooltip-item>
							</div>
						</div>
						<div>
							<div>{{ $filters.number(scheme.quantity * LeekWars.items[scheme.result].price) }} <span class="hab"></span></div>
							<div :class="{wrong: Math.abs((scheme.quantity * LeekWars.items[scheme.result].price) / scheme.items.reduce((s, i) => s + (i && LeekWars.items[i[0]] ? i[1] * LeekWars.items[i[0]].price : 0), 0) - 1.1) > 0.03 }">{{ $filters.number(scheme.items.reduce((s, i) => s + (i && LeekWars.items[i[0]] ? i[1] * LeekWars.items[i[0]].price : 0), 0)) }} ({{ ((scheme.quantity * LeekWars.items[scheme.result].price) / scheme.items.reduce((s, i) => s + (i && LeekWars.items[i[0]] ? i[1] * LeekWars.items[i[0]].price : 0), 0)).toFixed(2) }}) <span class="hab"></span></div>
						</div>
					</div>
				</div>
			</div>
		</panel>
	</div>
</template>

<script lang="ts">
	import { ITEM_CATEGORY_NAME } from '@/model/item'
	import { LeekWars } from '@/model/leekwars'
	import { Options, Vue, Watch } from 'vue-property-decorator'
	import RichTooltipFarmer from '@/component/rich-tooltip/rich-tooltip-farmer.vue'
	import { SchemeTemplate } from '@/model/scheme'
	const RichTooltipItem = () => import('@/component/rich-tooltip/rich-tooltip-item.vue')

	@Options({ components: { RichTooltipFarmer, RichTooltipItem } })
	export default class AdminSchemes extends Vue {
		ITEM_CATEGORY_NAME = ITEM_CATEGORY_NAME
		data: any = null
		sources: any = null
		last: any = null
		loading: boolean = false
		schemes: SchemeTemplate[] | null = null

		created() {
			if (!this.$store.getters.admin) this.$router.replace('/')
			LeekWars.setTitle("Admin Schémas")

			LeekWars.get<{[key: number]: SchemeTemplate}>("scheme/get-all").then(schemes => {
				this.schemes = Object.values(schemes)
					.sort((a, b) => LeekWars.items[a.result].price! - LeekWars.items[b.result].price!)
					.map(s => {
						const items = [...s.items] as any
						for (let i = 0; i < 9; ++i) { if (!items[i]) items[i] = ['', ''] }
						return { ...s, items }
					})
			})
		}
		mounted() {
			LeekWars.large = true
		}
		beforeDestroy() {
			LeekWars.large = false
		}

		updateScheme(scheme: SchemeTemplate) {
			const items = scheme.items.map(i => i && i[0] ? i.map(j => parseInt(j as any)) : null)
			LeekWars.put("scheme/set-ingredients", { scheme_id: scheme.id, ingredients: JSON.stringify(items) })
		}
	}
</script>

<style lang="scss" scoped>
.schemes {
	display: grid;
	gap: 10px;
	grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
}
.scheme {
	display: flex;
	align-items: center;
	padding: 0 4px;
	position: relative;
	input {
		width: 35px;
	}
	&:nth-child(2n) {
		background: var(--background-secondary);
	}
	.space {
		flex: 1;
	}
	.items {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
	}
	.item {
		position: relative;
		padding: 4px;
		height: 50px;
		background: var(--pure-white);
		box-shadow: 0px 2px 1px -1px rgba(0, 0, 0, 0.2), 0px 1px 1px 0px rgba(0, 0, 0, 0.14), 0px 1px 3px 0px rgba(0, 0, 0, 0.12);
		img {
			width: 42px;
			height: 42px;
			object-fit: scale-down;
			vertical-align: bottom;
		}
		.quantity {
			position: absolute;
			bottom: 0;
			right: 0;
			background: #000b;
			border-top-left-radius: 4px;
			color: white;
			padding: 1.5px 4.5px;
			font-weight: 500;
			font-size: 14px;
		}
		// &.present {
		// 	background: #5fad1b44;
		// }
		&.partial {
			background: #f704;
		}
		&.missing {
			background: #f004;
		}
	}
	// .group {
	// 	display: flex;
	// 	align-items: center;

	// 	.or {
	// 		width: 35px;
	// 		text-align: center;
	// 	}
	// }
	.result {
		cursor: pointer;
		&:hover {
			background: var(--background-secondary);
		}
	}
}
.symbol {
	font-size: 22px;
	font-family: monospace;
	text-align: center;
	line-height: 24px;
	flex-shrink: 0;
	width: 26px;
	height: 26px;
	margin: -2px;
	z-index: 2;
	background: var(--pure-white);
	border: 1px solid #aaa;
	border-radius: 100%;
	box-shadow: 0px 2px 1px -1px rgb(0 0 0 / 20%), 0px 1px 1px 0px rgb(0 0 0 / 14%), 0px 1px 3px 0px rgb(0 0 0 / 12%);
	&.arrow {
		margin: 14px;
		margin-right: 18px;
		width: 40px;
		height: 40px;
		line-height: 35px;
		font-size: 30px;
	}
}
.wrong {
	color: red;
	font-weight: bold;
}

.forge {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 5px;
	width: 260px;
	height: 305px;
	flex-shrink: 0;
	.grid {
		width: 100%;
		height: 100%;
		position: relative;
	}
	.cell {
		width: 28.5714285714%;
		height: 28.5714285714%;
		border: 1px solid var(--background-disabled);
		border-radius: 2px;
		background: var(--background-secondary);
		position: absolute;
		padding: 0;
		&.active {
			background: var(--pure-white);
			box-shadow: 0px 2px 1px -1px rgba(0, 0, 0, 0.2), 0px 1px 1px 0px rgba(0, 0, 0, 0.14), 0px 1px 3px 0px rgba(0, 0, 0, 0.12);
		}
	}
	.cell0 {
		top: calc(7.14285714286% + 2px);
		left: calc(7.14285714286% + 2px);
	}
	.cell1 {
		top: 2px;
		left: 35.7142857143%;
		z-index: 1;
	}
	.cell2 {
		top: calc(7.14285714286% + 2px);
		left: calc(64.2857142857% - 2px);
	}
	.cell3 {
		top: 35.7142857143%;
		left: 2px;
		z-index: 1;
	}
	.cell4 {
		top: 35.7142857143%;
		left: calc(71.4285714286% - 2px);
		z-index: 1;
	}
	.cell5 {
		top: calc(64.2857142857% - 2px);
		left: calc(7.14285714286% + 2px);
	}
	.cell6 {
		top: calc(71.4285714286% - 2px);
		left: 35.7142857143%;
		z-index: 1;
	}
	.cell7 {
		top: calc(64.2857142857% - 2px);
		left: calc(64.2857142857% - 2px);
	}
	.cell8 {
		width: 42.857142857%;
		height: 42.857142857%;
		top: 28.5714285714%;
		left: 28.5714285714%;
		z-index: 2;
		border-radius: 20px;
		border: 2px solid var(--background-disabled);
		&:hover {
			background: var(--background-secondary);
		}
		.v-icon {
			position: absolute;
			top: calc(50% - 20px);
			left: calc(50% - 20px);
			width: 40px;
			height: 40px;
			padding: 5px;
			font-size: 30px;
			background: var(--pure-white);
			border-radius: 50%;
			pointer-events: none;
			box-shadow: 0px 2px 1px -1px rgba(0, 0, 0, 0.2), 0px 1px 1px 0px rgba(0, 0, 0, 0.14), 0px 1px 3px 0px rgba(0, 0, 0, 0.12);
		}
	}
	.cell.building {
		left: 35.7142857143%;
		top: 35.7142857143%;
		bottom: auto;
		right: auto;
	}
	.item {
		padding: 10%;
		width: 100%;
		height: 100%;
		position: relative;
		img {
			width: 100%;
			height: 100%;
			object-fit: scale-down;
		}
	}
	.item-id {
		position: absolute;
		bottom: 0;
		left: 0;
		background: #7775;
		padding: 2px;
		font-size: 13px;
		z-index: 5;
	}
	.quantity {
		position: absolute;
		bottom: 0;
		right: 0;
		background: #7775;
		padding: 2px;
		font-size: 13px;
		z-index: 5;
	}
}
.clear {
	position: absolute;
	bottom: -5px;
	right: -5px;
}
input {
	width: 36px;
}
</style>