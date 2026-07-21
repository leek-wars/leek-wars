<template>
	<div class="forge">
		<div class="grid">
			<div v-for="(item, i) in forge" :key="i" class="cell" :class="{['cell' + i]: true, active: !!item, building: item && building}">
				<rich-tooltip-item v-if="item" :key="item[0]" v-slot="{ props }" :item="LeekWars.items[item[0]]" :inventory="true" :quantity="item[1]">
					<div class="item" v-bind="props" :type="LeekWars.items[item[0]].type">
						<img :src="itemImageUrl(LeekWars.items[item[0]])">
						<div v-if="item[1] > 1" class="quantity">{{ $filters.number(item[1]) }}</div>
					</div>
				</rich-tooltip-item>
			</div>
			<div v-if="component" class="cell cell8 active component">
				<rich-tooltip-item v-slot="{ props }" :item="LeekWars.items[component.template]" :inventory="true">
					<div class="item" v-bind="props" :type="LeekWars.items[component.template].type">
						<img :src="'/image/component/' + LeekWars.items[component.template].name + '.png'">
					</div>
				</rich-tooltip-item>
			</div>
			<div v-else class="cell" :class="{cell8: true, active: !!result && !built, built}" @click="craft">
				<rich-tooltip-item v-if="result && scheme" v-slot="{ props }" :item="LeekWars.items[result]" :inventory="true" :quantity="scheme.quantity" :open-delay="built ? 500 : 1000">
					<div v-ripple v-bind="props" class="item" :class="{building}" :type="LeekWars.items[result].type">
						<img :src="itemImageUrl(LeekWars.items[result])">
						<div v-if="scheme.quantity > 1" class="quantity">{{ $filters.number(scheme.quantity) }}</div>
					</div>
				</rich-tooltip-item>
				<v-icon v-if="result && !building && !built">mdi-hammer-wrench</v-icon>
				<v-icon v-if="result && built">mdi-refresh</v-icon>
			</div>
			<v-icon v-if="scheme || component" class="clear" @click="clear">mdi-refresh</v-icon>
		</div>
		<div v-if="component" class="component-actions">
			<v-btn variant="tonal" color="error" size="small" :loading="destroying" @click="destroy">
				<v-icon start>mdi-delete</v-icon>
				{{ $t('main.destroy') }}
			</v-btn>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { LeekWars } from '@/model/leekwars'
	import { ITEM_CATEGORY_NAME as ITEM_CATEGORY_NAME_TYPED, ItemType, itemImageUrl } from '@/model/item'
	import { InventoryItem } from '@/model/farmer'
	import { t } from '@/model/i18n'
	import { SchemeTemplate } from '@/model/scheme'
	import { store } from '@/model/store'
	import { emitter } from '@/model/vue'
	import { defineAsyncComponent, onBeforeUnmount, onMounted, ref } from 'vue'
	import Breadcrumb from '../forum/breadcrumb.vue'
	const RichTooltipItem = defineAsyncComponent(() => import('@/component/rich-tooltip/rich-tooltip-item.vue'))

	defineOptions({ name: 'Forge' })

	type ForgeSlot = [number, number]

	const forge = ref<(ForgeSlot | null)[]>([null, null, null, null, null, null, null, null])
	/** Composant pose au centre pour etre altere (#622). */
	const component = ref<InventoryItem | null>(null)
	const destroying = ref(false)
	const scheme = ref<SchemeTemplate | null>(null)
	const result = ref<number | null>(null)
	const building = ref(false)
	const built = ref(false)

	onMounted(() => {
		LeekWars.footer = false
		LeekWars.box = true
		emitter.on('alter', (item: InventoryItem) => {
			clear()
			component.value = item
		})
		emitter.on('craft', (s: SchemeTemplate) => {
			clear()
			scheme.value = s
			for (let i = 0; i < s.items.length; ++i) {
				forge.value[i] = s.items[i]
			}
			result.value = s.result
		})
	})

	function clearIngredients() {
		for (let i = 0; i < 8; ++i) {
			forge.value[i] = null
		}
	}
	function clear() {
		clearIngredients()
		result.value = null
		scheme.value = null
		component.value = null
		building.value = false
		built.value = false
	}

	/**
	 * Detruit le composant pose : il est recycle en alterations, dont la quantite
	 * depend de son niveau et la caracteristique de sa part de puissance (#622).
	 */
	function destroy() {
		if (!component.value || destroying.value) return
		const item = component.value
		destroying.value = true
		LeekWars.post<{ alterations: {[id: number]: number}, count: number }>('item/recycle', { item_id: item.id }).then(data => {
			store.commit('remove-inventory', { type: ItemType.COMPONENT, item_template: item.template, quantity: 1 })
			const alterations = LeekWars.alterations
			for (const id in data.alterations) {
				const alteration = alterations ? alterations.alterations[id] : null
				if (!alteration) continue
				store.commit('add-inventory', { type: ItemType.ALTERATION, id: alteration.template,
					template: alteration.template, quantity: data.alterations[id], time: Date.now() / 1000 })
			}
			LeekWars.toast(data.count > 0
				? t('main.destroy_result', [data.count])
				: t('main.destroy_nothing'))
			clear()
		}).error(error => LeekWars.toast(error.error)).finally(() => { destroying.value = false })
	}

	onBeforeUnmount(() => {
		emitter.off('craft')
		emitter.off('alter')
	})

	function craft() {
		if (!scheme.value) return
		if (built.value) {
			const s = scheme.value
			clear()
			emitter.emit('craft', s)
			return
		}
		LeekWars.post('item/craft', { scheme_id: scheme.value.id }).then(item => {
			const template = LeekWars.items[item.template]
			store.commit('add-inventory', { type: template.type, id: item.id, template: item.template, time: item.time, quantity: scheme.value!.quantity })
			for (const ingredient of scheme.value!.items) {
				if (ingredient === null) continue;
				if (ingredient[0] === 148) { // hab
					store.commit('update-habs', -ingredient[1])
				} else {
					const it = LeekWars.items[ingredient[0]]
					store.commit('remove-inventory', { type: it.type, item_template: ingredient[0], quantity: ingredient[1] })
				}
			}
		})

		building.value = true
		setTimeout(() => {
			building.value = false
			clearIngredients()
			built.value = true
		}, 500)
	}
</script>

<style lang="scss" scoped>

.component-actions {
	display: flex;
	justify-content: center;
	padding-top: 6px;
}
.cell8.component .item img {
	max-width: 100%;
	max-height: 100%;
}

.forge {
	display: flex;
	align-items: center;
	width: 260px;
	height: 260px;
	flex-shrink: 0;
	padding: 10px;
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
		transition: all 0.3s ease;
		background: var(--background-secondary);
		position: absolute;
		padding: 0;
		&.active {
			background: var(--pure-white);
			box-shadow: 0px 2px 1px -1px rgba(0, 0, 0, 0.2), 0px 1px 1px 0px rgba(0, 0, 0, 0.14), 0px 1px 3px 0px rgba(0, 0, 0, 0.12);
		}
		&:not(.cell8) .item {
			animation: item-animation 0.5s ease 1;
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
		&.active {
			cursor: pointer;
		}
		&:not(.built) .item {
			opacity: 0.4;
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
		& :deep(.v-ripple__container) {
			border-radius: 20px;
		}
		.item.building {
			animation: hithere 0.7s ease 1;
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
		.quantity {
			position: absolute;
			bottom: 12%;
			right: 12%;
			background: #000b;
			border-radius: 4px;
			color: white;
			padding: 1.5px 4.5px;
			font-weight: 500;
			font-size: 14px;
		}
	}
}
.clear {
	position: absolute;
	bottom: -5px;
	right: -5px;
}
@keyframes item-animation {
	0% { transform: scale(1); }
	40% { transform: scale(1.25); }
	100% { transform: scale(1); }
}
@keyframes hithere {
	// 10% { transform: scale(1); opacity: 0.4; }
	// 40% { transform: scale(1.25); }
	// 100% { transform: scale(1); opacity: 1; }
	10% { transform: scale(1); opacity: 0.4; }
	30% { transform: rotate(-5deg) scale(1.25); }
	50% { transform: rotate(5deg) scale(1); }
	70% { transform: rotate(0deg) scale(1); }
	100% { transform: scale(1); opacity: 1; }
}
</style>