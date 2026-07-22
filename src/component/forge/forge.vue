<template>
	<div class="forge">
		<div class="grid">
			<div v-for="(item, i) in forge" :key="i" class="cell" :class="{['cell' + i]: true, active: !!item, building: item && building, removable: !!item && !!component}" @click="component && removeAlteration(i)">
				<rich-tooltip-item v-if="item" :key="item[0]" v-slot="{ props }" :item="LeekWars.items[item[0]]" :inventory="true" :quantity="item[1]">
					<div class="item" v-bind="props" :type="LeekWars.items[item[0]].type">
						<img :src="itemImageUrl(LeekWars.items[item[0]])">
						<div v-if="item[1] > 1" class="quantity">{{ $filters.number(item[1]) }}</div>
					</div>
				</rich-tooltip-item>
			</div>
			<div v-if="component" class="cell cell8 active component">
				<rich-tooltip-item v-slot="{ props }" :item="LeekWars.items[component.template]" :instance="component" :inventory="true">
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
			<!-- Recyclage : coin bas gauche, et seulement tant qu'aucune alteration
			     n'est posee. Une fois qu'on en pose une, on vient alterer, pas detruire. -->
			<v-btn v-if="component && alterationCount === 0" class="recycle" icon variant="tonal" color="error"
				size="small" :loading="destroying" :title="$t('main.destroy')" @click="destroy">
				<v-icon>mdi-recycle</v-icon>
			</v-btn>
		</div>
		<!-- Le puits est un plafond dur : le joueur doit voir ce qu'il lui reste. -->
		<div v-if="component && plan" class="well">
			<div class="bar"><div class="fill" :style="{width: Math.min(100, plan.ratioBefore * 100) + '%'}"></div>
				<div class="fill preview" :style="{left: Math.min(100, plan.ratioBefore * 100) + '%', width: Math.max(0, Math.min(100 - plan.ratioBefore * 100, (plan.ratioAfter - plan.ratioBefore) * 100)) + '%'}"></div>
			</div>
			<span class="label">{{ $t('main.alteration_well') }} {{ Math.round(plan.ratioAfter * 100) }} %</span>
		</div>
		<div v-if="component && dose > 0" class="dose">
			{{ $t('main.alteration_dose') }} <b>{{ dose }}</b>
			<span class="count">{{ alterationCount }} / {{ maxItems }}</span>
		</div>
		<!-- Probabilite et risque AVANT de depenser : c'est la regle de la spec. -->
		<div v-if="component && plan && alterationCount > 0" class="preview">
			<div v-for="(roll, carac) in plan.rolls" :key="carac" class="row">
				<img class="ic" :src="'/image/charac/small/' + carac + '.png'">
				<span :class="'color-' + carac">+{{ roll.points }}</span>
				<b class="chance">{{ percent(roll.probability) }}</b>
			</div>
			<div v-if="plan.breakProbability > 0.0005" class="row risk">
				<v-icon size="16">mdi-alert</v-icon>
				<span>{{ $t('main.alteration_break_risk') }}</span>
				<b class="chance">{{ percent(plan.breakProbability) }}</b>
			</div>
			<div class="row cost">
				<span>{{ $t('main.alteration_cost') }}</span>
				<b class="chance">{{ $filters.number(plan.habsCost) }}</b>
			</div>
		</div>
		<!-- Resultat de la derniere tentative. -->
		<div v-if="lastResult" class="result">
			<div v-for="r in lastResult.results" :key="r.carac" class="row" :class="{ok: r.success}">
				<img class="ic" :src="'/image/charac/small/' + r.carac + '.png'">
				<span>{{ r.success ? '+' + r.points : $t('main.alteration_failed') }}</span>
			</div>
			<div v-if="lastResult.broken" class="row broken">
				<v-icon size="16">mdi-heart-broken</v-icon>
				<span>{{ $t('main.alteration_broken', [lastResult.broken.lost]) }}</span>
			</div>
			<div class="row metabolism">
				<span>{{ $t('main.alteration_metabolism') }} <b>{{ lastResult.metabolism }}</b></span>
				<span v-if="lastResult.synergy > 1" class="synergy" :class="'s' + lastResult.synergy">
					{{ lastResult.synergy === 3 ? $t('main.synergy_perfect') : $t('main.synergy_good') }}
				</span>
			</div>
		</div>
		<div v-if="component && alterationCount > 0" class="component-actions">
			<v-btn variant="flat" color="primary" size="small" :loading="altering" :disabled="!plan || !plan.fits" @click="alter">
				<v-icon start>mdi-flask</v-icon>
				{{ $t('main.alteration_fuse') }}
			</v-btn>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { LeekWars } from '@/model/leekwars'
	import { ITEM_CATEGORY_NAME as ITEM_CATEGORY_NAME_TYPED, ItemType, itemImageUrl } from '@/model/item'
	import { InventoryItem } from '@/model/farmer'
	import { t } from '@/model/i18n'
	import { planAttempt, type AlterationRecipe } from '@/model/alteration'
	import { SchemeTemplate } from '@/model/scheme'
	import { store } from '@/model/store'
	import { emitter } from '@/model/vue'
	import { computed, defineAsyncComponent, onBeforeUnmount, onMounted, ref } from 'vue'
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
		emitter.on('add-alteration', addAlteration)
		emitter.on('workshop-mode', () => clear())
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
		lastResult.value = null
		building.value = false
		built.value = false
	}

	const altering = ref(false)
	interface AlterResult {
		success: boolean
		results: { carac: string, success: boolean, points: number, probability: number }[]
		id?: number
		stats: { [carac: string]: number }
		well: { used: number, capacity: number }
		dose: number
		metabolism: number
		synergy: number
		broken: { carac: string, lost: number } | null
		habs_cost: number
	}
	const lastResult = ref<AlterResult | null>(null)

	/** Recette au format attendu par le moteur : [alteration_id => quantite]. */
	const recipe = computed(() => {
		const data = LeekWars.alterations
		const out: AlterationRecipe = {}
		if (!data) return out
		for (const slot of forge.value) {
			if (!slot) continue
			for (const id in data.alterations) {
				if (data.alterations[id].template === slot[0]) {
					out[Number(id)] = (out[Number(id)] || 0) + slot[1]
					break
				}
			}
		}
		return out
	})

	/**
	 * Previsualisation de la tentative, calculee en local a partir des memes regles
	 * que le serveur. Elle sert a MONTRER, jamais a decider : le serveur refait le
	 * calcul et c'est lui qui tire.
	 */
	const plan = computed(() => {
		const data = LeekWars.alterations
		const item = component.value
		if (!data || !item) return null
		const template = LeekWars.items[item.template]
		if (!template) return null
		const family = data.component_families[Number(template.params)]
		if (!family) return null
		const base = (LeekWars.components[Number(template.params)]?.stats ?? []) as [string, number][]
		return planAttempt(data, base, item.stats ?? {}, Number(template.level), family, recipe.value)
	})

	function percent(p: number): string {
		if (p <= 0) return '0 %'
		if (p >= 0.1) return Math.round(p * 100) + ' %'
		if (p >= 0.001) return (p * 100).toFixed(1) + ' %'
		return (p * 100).toFixed(3) + ' %'
	}

	/**
	 * Lance la tentative. Les alterations et les Habs sont consommes dans tous les
	 * cas : c'est le cout d'un essai, pas le prix d'un succes.
	 */
	function alter() {
		const item = component.value
		if (!item || altering.value || alterationCount.value === 0) return
		altering.value = true
		lastResult.value = null
		LeekWars.post<AlterResult>('component/alter', { component_id: item.id, alterations: JSON.stringify(recipe.value) }).then(data => {
			lastResult.value = data
			// Le composant porte desormais ses nouvelles stats. L'inventaire construit
			// des COPIES des items du store (spread dans son computed), donc ecrire sur
			// l'objet recu ne suffit pas : il faut retrouver l'original.
			item.stats = data.stats
			item.altered_power = data.well.used
			// Le serveur a pu DETACHER la piece d'un stack : dans ce cas elle a un
			// nouvel id, et l'ancienne ligne garde le reste de la pile.
			const newId = data.id
			const split = newId !== undefined && newId !== item.id
			const components = store.state.farmer?.components
			if (components) {
				const stored = components.find(c => c.id === item.id)
				if (split && stored) {
					stored.quantity--
					if (stored.quantity <= 0) components.splice(components.indexOf(stored), 1)
					components.push({ id: newId as number, template: item.template, quantity: 1,
						time: item.time, stats: data.stats, altered_power: data.well.used })
				} else if (stored) {
					stored.stats = data.stats
					stored.altered_power = data.well.used
				}
			}
			if (split) item.id = newId as number
			const alterations = LeekWars.alterations
			for (const id in recipe.value) {
				const alteration = alterations ? alterations.alterations[id] : null
				if (!alteration) continue
				store.commit('remove-inventory', { type: ItemType.ALTERATION, item_template: alteration.template, quantity: recipe.value[id] })
			}
			store.commit('update-habs', -data.habs_cost)
			clearIngredients()
		}).error(error => LeekWars.toast(error.error)).finally(() => { altering.value = false })
	}

	/** Nombre d'alterations posees, quantites comprises. */
	const alterationCount = computed(() => forge.value.reduce((n, slot) => n + (slot ? slot[1] : 0), 0))
	const maxItems = computed(() => LeekWars.alterations?.max_items ?? 8)

	/**
	 * Dosage de la tentative : somme des numeros publies des alterations posees.
	 * C'est lui que le joueur ajuste pour trouver le metabolisme du composant, donc
	 * il se met a jour a chaque ajout.
	 */
	const dose = computed(() => {
		const data = LeekWars.alterations
		if (!data) return 0
		let total = 0
		for (const slot of forge.value) {
			if (!slot) continue
			for (const id in data.alterations) {
				if (data.alterations[id].template === slot[0]) {
					total += data.alterations[id].number * slot[1]
					break
				}
			}
		}
		return total
	})

	/** Pose une alteration autour du composant, ou incremente sa pile. */
	function addAlteration(item: InventoryItem) {
		if (!component.value) {
			LeekWars.toast(t('main.alteration_needs_component'))
			return
		}
		if (alterationCount.value >= maxItems.value) {
			LeekWars.toast(t('main.alteration_too_many', [maxItems.value]))
			return
		}
		const existing = forge.value.find(slot => slot && slot[0] === item.template)
		const posed = existing ? existing[1] : 0
		if (posed >= item.quantity) {
			LeekWars.toast(t('main.alteration_not_enough'))
			return
		}
		if (existing) {
			existing[1]++
			return
		}
		const free = forge.value.indexOf(null)
		if (free === -1) {
			LeekWars.toast(t('main.alteration_too_many', [maxItems.value]))
			return
		}
		forge.value[free] = [item.template, 1]
	}

	/** Retire une alteration posee : un clic enleve un exemplaire. */
	function removeAlteration(index: number) {
		const slot = forge.value[index]
		if (!slot) return
		slot[1]--
		if (slot[1] <= 0) forge.value[index] = null
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
		emitter.off('add-alteration')
		emitter.off('workshop-mode')
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

.well {
	width: 100%;
	padding: 8px 4px 0;
	.bar {
		position: relative;
		height: 8px;
		border-radius: 4px;
		background: var(--background-secondary);
		overflow: hidden;
	}
	.fill {
		position: absolute;
		top: 0;
		bottom: 0;
		left: 0;
		background: var(--primary);
	}
	// Ce que la tentative ajouterait, en plus clair : le joueur voit ou il atterrit.
	.fill.preview { background: #9ccc65; }
	.label {
		display: block;
		text-align: center;
		font-size: 12px;
		color: var(--text-color-secondary);
		padding-top: 2px;
	}
}
.preview, .result {
	width: 100%;
	padding: 4px 0;
	.row {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 2px 4px;
		font-size: 13px;
	}
	.ic { width: 16px; height: 16px; }
	.chance { margin-left: auto; font-variant-numeric: tabular-nums; }
	.risk { color: #c62828; }
	.cost { color: var(--text-color-secondary); }
}
.result {
	border-top: 1px solid var(--border);
	.row { color: var(--text-color-secondary); }
	.row.ok { color: #2e7d32; font-weight: bold; }
	.row.broken { color: #c62828; }
	.synergy { margin-left: auto; font-weight: bold; }
	.synergy.s2 { color: #0097a7; }
	.synergy.s3 { color: #f9a825; }
}

.dose {
	text-align: center;
	padding-top: 6px;
	font-size: 15px;
	b { font-size: 19px; }
	.count {
		display: block;
		font-size: 12px;
		color: var(--text-color-secondary);
	}
}
.cell.removable { cursor: pointer; }
// Coin bas GAUCHE : `.clear` (réinitialiser) occupe déjà le coin bas droit et les deux
// boutons peuvent être affichés en même temps, ils se superposaient.
.recycle {
	position: absolute;
	left: -4px;
	bottom: -4px;
	z-index: 3;
}

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
	// En colonne : le dosage et les boutons se placent SOUS la grille. Sans ca ils
	// deviennent des colonnes flex a cote d'elle, ce qui la comprime en largeur et
	// etire toutes les cellules (#622).
	flex-direction: column;
	align-items: center;
	width: 260px;
	// La hauteur suit le contenu : 260 quand il n'y a que la grille, plus quand le
	// dosage et le bouton s'ajoutent.
	height: auto;
	flex-shrink: 0;
	padding: 10px;
	.grid {
		width: 240px;
		height: 240px;
		flex-shrink: 0;
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