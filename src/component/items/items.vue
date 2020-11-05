<template lang="html">
	<div>
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
					<span class="title">{{ l + 1 }}</span>
					<item v-for="item in items" :key="item.id" :item="{template: item.id}" />
				</span>
			</div>
		</panel>
	</div>
</template>

<script lang="ts">
	import { locale } from '@/locale'
	import { ItemTemplate, ItemType } from '@/model/item'
	import { LeekWars } from '@/model/leekwars'
	import { Component, Vue } from 'vue-property-decorator'
	import Breadcrumb from '../forum/breadcrumb.vue'

	@Component({ name: 'items', i18n: {}, components: { Breadcrumb } })
	export default class Items extends Vue {

		created() {
			LeekWars.setTitle("Items")
		}
		mounted() {
			LeekWars.large = true
			LeekWars.footer = false
		}
		beforeDestroy() {
			LeekWars.large = false
			LeekWars.footer = true
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
	}
	.levels ::v-deep .item {
		display: block;
		height: 67px;
		margin-bottom: 2px;
	}
</style>