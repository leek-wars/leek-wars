<template>
	<div class="collection-widget">
		<loader v-if="!loaded" />
		<template v-else>
			<div class="overall">
				<div class="overall-head">
					<span class="count">{{ totalOwned }} / {{ totalCount }}</span>
					<span class="pct">{{ percent(totalOwned, totalCount) }}%</span>
				</div>
				<div class="bar"><div class="fill" :class="{ complete: totalOwned === totalCount && totalCount > 0 }" :style="{ width: percent(totalOwned, totalCount) + '%' }"></div></div>
			</div>
			<div class="cats-grid">
				<div v-for="c in stats" :key="c.type" class="cat" :class="{ complete: c.owned === c.total }">
					<v-progress-circular :model-value="percent(c.owned, c.total)" :size="54" :width="4" class="ring">
						<v-icon class="cat-icon">{{ icons[c.type] }}</v-icon>
					</v-progress-circular>
					<span class="cat-count">{{ c.owned }}/{{ c.total }}</span>
				</div>
			</div>
		</template>
	</div>
</template>

<script setup lang="ts">
	import { computed, ref } from 'vue'
	import { LeekWars } from '@/model/leekwars'
	import { store } from '@/model/store'
	import { type ItemTemplate, ItemType, ITEM_TYPE_ICONS } from '@/model/item'

	defineOptions({ name: 'HomeWidgetCollection' })

	const icons = ITEM_TYPE_ICONS

	// Mêmes règles que la page Collection : catégories complétables et items obtenables.
	const CATEGORY_ORDER = [ItemType.WEAPON, ItemType.CHIP, ItemType.HAT, ItemType.POMP, ItemType.POTION, ItemType.RESOURCE, ItemType.COMPONENT, ItemType.SCHEME]
	const EXCLUDED_ITEMS = new Set([148, 149, 176, 58])

	function isCollectable(item: ItemTemplate): boolean {
		if (item.public === false) return false
		if (EXCLUDED_ITEMS.has(item.id)) return false
		if ((item.type === ItemType.WEAPON || item.type === ItemType.CHIP) && !item.buyable && !item.buyable_crystals && !item.sellable && !item.market) return false
		return true
	}

	const loaded = ref(false)
	const owned = ref<Set<number>>(new Set())

	const allByType = computed(() => {
		const map = new Map<ItemType, ItemTemplate[]>()
		for (const type of CATEGORY_ORDER) map.set(type, [])
		for (const item of Object.values(LeekWars.items) as ItemTemplate[]) {
			if (!isCollectable(item)) continue
			map.get(item.type)?.push(item)
		}
		return map
	})

	const stats = computed(() => CATEGORY_ORDER
		.map((type) => {
			const items = allByType.value.get(type) ?? []
			const ownedCount = items.reduce((sum, item) => sum + (owned.value.has(item.id) ? 1 : 0), 0)
			return { type, total: items.length, owned: ownedCount }
		})
		.filter((c) => c.total > 0))

	const totalCount = computed(() => stats.value.reduce((s, c) => s + c.total, 0))
	const totalOwned = computed(() => stats.value.reduce((s, c) => s + c.owned, 0))

	function percent(o: number, t: number): number {
		return t ? Math.floor(o / t * 100) : 0
	}

	// Source de vérité serveur (items possédés un jour), avec repli sur l'inventaire local.
	LeekWars.get<{ templates: number[] }>('item/get-collection').then((res) => {
		owned.value = new Set(res.templates)
		loaded.value = true
	}).error(() => {
		const f = store.state.farmer
		if (f) {
			const set = new Set<number>()
			for (const list of [f.weapons, f.chips, f.hats, f.pomps, f.potions]) {
				for (const it of (list ?? [])) set.add((it as { template: number }).template)
			}
			owned.value = set
		}
		loaded.value = true
	})
</script>

<style lang="scss" scoped>
	.collection-widget {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
	.overall-head {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		margin-bottom: 4px;
	}
	.overall-head .count {
		font-size: 20px;
		font-weight: bold;
	}
	.overall-head .pct {
		color: var(--primary);
		font-weight: bold;
	}
	.bar {
		background: var(--background-secondary);
		border-radius: 4px;
		height: 10px;
		overflow: hidden;
	}
	.bar .fill {
		height: 100%;
		background: var(--primary);
		transition: width 0.3s;
	}
	.fill.complete {
		background: #f1c40f;
	}
	.cats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(70px, 1fr));
		gap: 12px;
		justify-items: center;
	}
	.cat {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 4px;
	}
	// Anneau de progression : primaire en cours, doré une fois complété.
	.cat:deep(.v-progress-circular) {
		color: var(--primary);
	}
	.cat.complete:deep(.v-progress-circular) {
		color: #f1c40f;
	}
	.cat-icon {
		color: var(--text-color-secondary);
		font-size: 22px;
	}
	.cat.complete .cat-icon {
		color: #f1c40f;
	}
	.cat-count {
		font-size: 12px;
		color: var(--text-color-secondary);
	}
</style>
