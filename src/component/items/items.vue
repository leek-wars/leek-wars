<template lang="html">
	<div class="page">
		<div class="page-bar page-header">
			<h1>
				<breadcrumb :items="breadcrumb_items" :raw="true" />
			</h1>
			<div class="tabs">
				<router-link to="/market">
					<div class="tab action" image="icon/market.png" link="/market">
						<img src="/image/icon/market.png">
						<span>{{ $t('main.market') }}</span>
					</div>
				</router-link>
			</div>
		</div>
		<panel class="first">
			<div slot="content" class="levels">
				<span v-for="(items, l) in levels" :key="l" class="level">
					<span class="title" :class="{bold: (l + 1) % 10 === 0}">{{ l + 1 }}</span>
					<template v-for="item in items">
						<div v-if="item.trophy && (!(item.trophy in trophies) || !trophies[item.trophy].unlocked)" :key="item.id" class="locked">?</div>
						<item v-else :key="item.id" :item="{template: item.id}" />
					</template>
				</span>
			</div>
		</panel>
	</div>
</template>

<script lang="ts">
	import { ItemTemplate, ItemType } from '@/model/item'
	import { LeekWars } from '@/model/leekwars'
	import { store } from '@/model/store'
	import { Component, Vue } from 'vue-property-decorator'
	import Breadcrumb from '../forum/breadcrumb.vue'
	import Item from '@/component/item.vue'

	@Component({ name: 'items', i18n: {}, components: { Breadcrumb, Item } })
	export default class Items extends Vue {

		trophies: any = {}

		created() {
			LeekWars.setTitle("Items")
		}
		mounted() {
			LeekWars.large = true
			if (store.state.connected) {
				LeekWars.get('trophy/my-trophies/' + this.$i18n.locale).then(data => {
					for (const trophy of data.trophies) {
						Vue.set(this.trophies, trophy.id, trophy)
					}
				})
			}
		}
		beforeDestroy() {
			LeekWars.large = false
		}
		get breadcrumb_items() {
			return [
				{name: this.$t('main.help'), link: '/help'},
				{name: "Items", link: '/help/items'}
			]
		}

		get levels() {
			const weaponsAdded = new Set<number>()
			const l = [] as ItemTemplate[][]
			for (let level = 1; level <= 301; ++level) {
				l[level - 1] = []
			}
			for (const item of this.items) {
				if (item.type === ItemType.WEAPON) {
					if (weaponsAdded.has(item.params)) { continue }
					weaponsAdded.add(item.params)
				}
				l[item.level - 1].push(item)
			}
			return l
		}

		get items() {
			return Object.values(LeekWars.items)
				.filter(i => i.type === ItemType.WEAPON || i.type === ItemType.CHIP)
				.sort((a, b) => a.level - b.level)
		}
	}
</script>

<style lang="scss" scoped>
	.levels {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(66px, 1fr));
		gap: 5px;
		padding: 8px;
	}
	.level {
		text-align: center;
	}
	.title {
		margin-bottom: 1px;
		display: block;
		&.bold {
			font-weight: bold;
		}
	}
	.levels ::v-deep .item {
		display: block;
		height: 67px;
		margin-bottom: 2px;
	}
	.locked {
		height: 67px;
		background: #ddd;
		border-radius: 4px;
		line-height: 67px;
		font-weight: bold;
		font-size: 30px;
		color: #888;
	}
</style>