<template>
	<div class="forge">
		<div class="grid">
			<div v-for="(item, i) in forge" :key="i" class="cell" :class="{['cell' + i]: true, active: !!item, building: item && building, partial: slotStates[i] === 'partial', missing: slotStates[i] === 'missing'}">
				<rich-tooltip-item v-if="item" :key="item[0]" v-slot="{ props }" :item="LeekWars.items[item[0]]" :inventory="true" :quantity="item[1]">
					<div class="item" v-bind="props" :type="LeekWars.items[item[0]].type">
						<img :src="itemImageUrl(LeekWars.items[item[0]])">
						<div v-if="item[1] > 1" class="quantity">{{ $filters.number(item[1]) }}</div>
					</div>
				</rich-tooltip-item>
			</div>
			<div class="cell" :class="{cell8: true, active: !!result && !built && !impossible, built, impossible}" @click="craft">
				<rich-tooltip-item v-if="result && scheme" v-slot="{ props }" :item="LeekWars.items[result]" :inventory="true" :quantity="scheme.quantity" :open-delay="built ? 500 : 1000">
					<div v-ripple="possible || built" v-bind="props" class="item" :class="{building}" :type="LeekWars.items[result].type">
						<img :src="itemImageUrl(LeekWars.items[result])">
						<div v-if="scheme.quantity > 1" class="quantity">{{ $filters.number(scheme.quantity) }}</div>
					</div>
				</rich-tooltip-item>
				<v-icon v-if="result && !building && !built" :class="{disabled: impossible}">mdi-hammer-wrench</v-icon>
				<v-icon v-if="result && built">mdi-refresh</v-icon>
			</div>
			<v-icon v-if="scheme" class="clear" @click="clear">mdi-refresh</v-icon>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { LeekWars } from '@/model/leekwars'
	import { itemImageUrl } from '@/model/item'
	import { SchemeTemplate } from '@/model/scheme'
	import { store } from '@/model/store'
	import { emitter } from '@/model/emitter'
	import { t } from '@/model/i18n'
	import { computed, defineAsyncComponent, onBeforeUnmount, onMounted, ref } from 'vue'
	const RichTooltipItem = defineAsyncComponent(() => import('@/component/rich-tooltip/rich-tooltip-item.vue'))

	defineOptions({ name: 'Forge' })

	type ForgeSlot = [number, number]

	const forge = ref<(ForgeSlot | null)[]>([null, null, null, null, null, null, null, null])
	const scheme = ref<SchemeTemplate | null>(null)
	const result = ref<number | null>(null)
	const building = ref(false)
	const built = ref(false)

	// État de chaque ingrédient placé dans la forge : possédé en quantité suffisante,
	// en quantité insuffisante, ou pas du tout. La forge peut être remplie par un
	// schéma qu'on n'a pas les moyens de fabriquer (bouton Fabriquer du marché),
	// il faut donc montrer ce qui manque plutôt que laisser croire au craft.
	// Pendant l'animation de fabrication les ingrédients sont déjà retirés de l'inventaire
	// alors qu'ils sont encore affichés : ne rien signaler tant qu'elle tourne.
	const slotStates = computed(() => forge.value.map(slot => {
		if (!slot || building.value) return null
		const owned = store.getters.item_quantity(slot[0])
		return owned >= slot[1] ? 'present' : (owned > 0 ? 'partial' : 'missing')
	}))
	const possible = computed(() => !!scheme.value && store.getters.scheme_possible(scheme.value))
	const impossible = computed(() => !!result.value && !built.value && !building.value && !possible.value)

	onMounted(() => {
		LeekWars.footer = false
		LeekWars.box = true
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
		building.value = false
		built.value = false
	}

	onBeforeUnmount(() => {
		emitter.off('craft')
	})

	function craft() {
		if (!scheme.value || building.value) return
		if (!built.value && !possible.value) return
		if (built.value) {
			const s = scheme.value
			clear()
			emitter.emit('craft', s)
			return
		}
		// L'état « fabriqué » (et le bouton de recraft qui va avec) n'est acquis qu'à la
		// confirmation du serveur : sinon un refus (ressources déjà épuisées) jouerait quand
		// même l'animation et laisserait croire à des fabrications en série. L'animation de
		// 500 ms tourne pendant l'aller-retour ; on attend les deux avant de conclure.
		const s = scheme.value
		building.value = true
		const animation = new Promise(resolve => setTimeout(resolve, 500))
		LeekWars.post('item/craft', { scheme_id: s.id }).then(item => {
			const template = LeekWars.items[item.template]
			store.commit('add-inventory', { type: template.type, id: item.id, template: item.template, time: item.time, quantity: s.quantity })
			for (const ingredient of s.items) {
				if (ingredient === null) continue;
				if (ingredient[0] === 148) { // hab
					store.commit('update-habs', -ingredient[1])
				} else {
					const it = LeekWars.items[ingredient[0]]
					store.commit('remove-inventory', { type: it.type, item_template: ingredient[0], quantity: ingredient[1] })
				}
			}
			animation.then(() => {
				// La forge a pu être vidée ou re-remplie entre-temps (clear() a déjà remis l'état)
				if (scheme.value !== s) return
				building.value = false
				clearIngredients()
				built.value = true
			})
		}).catch(() => {
			LeekWars.toast(t('main.error_craft_not_enough_resources'))
			animation.then(() => {
				if (scheme.value !== s) return
				building.value = false
			})
		})
	}
</script>

<style lang="scss" scoped>

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
		&.partial {
			background: #f704;
		}
		&.missing {
			background: #f004;
			img {
				filter: grayscale(1);
				opacity: 0.6;
			}
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
		&.impossible {
			cursor: default;
			.item {
				filter: grayscale(1);
			}
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
			&.disabled {
				color: #999;
				background: var(--background-disabled);
			}
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