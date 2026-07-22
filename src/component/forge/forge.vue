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
			<div v-if="component" class="cell cell8 active component removable" @click="clear">
				<!-- Anneau de charge : contour arrondi qui suit le carre central et se
				     remplit dans le sens horaire (#622). Deux traces : la charge actuelle,
				     puis en plus clair ce que la tentative ajouterait. -->
				<svg v-if="plan && (plan.ratioBefore > 0 || plan.ratioAfter > 0)" class="charge-ring" viewBox="0 0 100 100" preserveAspectRatio="none">
					<!-- Pas de rail de fond : seul l'arc de charge est visible. -->
					<!-- Ce que la tentative ajouterait, en semi-transparent derriere la charge. -->
					<path v-if="plan.ratioAfter > 0" class="fill preview" :class="'tier-' + tierAfter" :d="RING_PATH"
						:stroke-dasharray="ringLength" :stroke-dashoffset="ringLength * (1 - Math.min(1, plan.ratioAfter))" />
					<!-- La charge actuelle, dans la couleur de son palier. -->
					<path v-if="plan.ratioBefore > 0" class="fill" :class="'tier-' + tierBefore" :d="RING_PATH"
						:stroke-dasharray="ringLength" :stroke-dashoffset="ringLength * (1 - Math.min(1, plan.ratioBefore))" />
				</svg>
				<rich-tooltip-item v-slot="{ props }" :item="LeekWars.items[component.template]" :instance="component" :inventory="true">
					<div class="item" v-bind="props" :type="LeekWars.items[component.template].type">
						<!-- Silhouette coloree du palier si la piece porte deja de la charge (#622) ;
						     vide (donc aucune bordure) pour un composant neuf. -->
						<img :class="alteredClass(component, LeekWars.items[component.template].level as number)" :src="'/image/component/' + LeekWars.items[component.template].name + '.png'">
					</div>
				</rich-tooltip-item>
				<!-- Pourcentage de charge, en petit dans le coin bas droit de l'image (#622). -->
				<div v-if="plan && plan.ratioAfter > 0" class="charge-corner">{{ Math.round(plan.ratioAfter * 100) }}%</div>
				<!-- Nombre de pieces empilees a recycler d'un coup (#622). -->
				<div v-if="componentCount > 1" class="stack-count">×{{ componentCount }}</div>
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
			<!-- Effacer : croix, pas une fleche circulaire qui evoquerait "refaire". Coin HAUT droit. -->
			<v-btn v-if="scheme || component" class="corner-btn clear" icon variant="flat" size="small" @click="clear">
				<v-icon>mdi-close</v-icon>
				<v-tooltip activator="parent" location="top">{{ $t('main.clear') }}</v-tooltip>
			</v-btn>
			<!-- Recommencer : repose la derniere recette d'alteration (#622). Coin HAUT gauche. -->
			<v-btn v-if="component && lastRecipe && alterationCount === 0" class="corner-btn redo" icon variant="flat"
				size="small" @click="repeat">
				<v-icon color="primary">mdi-restore</v-icon>
				<v-tooltip activator="parent" location="top">{{ $t('main.alteration_repeat') }}</v-tooltip>
			</v-btn>
			<!-- Recyclage : coin BAS gauche, tant qu'aucune alteration n'est posee. -->
			<v-btn v-if="component && alterationCount === 0" class="corner-btn recycle" icon variant="flat"
				size="small" :loading="destroying" @click="destroy">
				<v-icon color="error">mdi-recycle</v-icon>
				<v-tooltip activator="parent" location="bottom">{{ $t('main.destroy') }}</v-tooltip>
			</v-btn>
			<!-- Alterer : coin BAS droit de la grille, sous la main du joueur. -->
			<v-btn v-if="component && alterationCount > 0" class="corner-btn fuse-btn" icon variant="flat"
				size="small" :loading="altering" :disabled="!plan || !plan.fits" @click="alter">
				<v-icon color="primary">mdi-flask</v-icon>
				<v-tooltip activator="parent" location="bottom">{{ $t('main.alteration_fuse') }}</v-tooltip>
			</v-btn>
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
				<b class="chance">{{ $filters.number(plan.habsCost) }}<span class="hab"></span></b>
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

		<!-- Confirmation avant de recycler une piece qui porte de la charge (#622). -->
		<popup v-model="confirmDestroy" :width="460" icon="mdi-recycle">
			<template #title>{{ $t('main.destroy_confirm_title') }}</template>
			<div class="destroy-confirm">{{ $t('main.destroy_confirm_message') }}</div>
			<template #actions>
				<v-btn variant="text" @click="confirmDestroy = false">{{ $t('main.cancel') }}</v-btn>
				<v-btn color="error" variant="flat" :loading="destroying" @click="doDestroy">
					<v-icon start>mdi-recycle</v-icon>{{ $t('main.destroy') }}
				</v-btn>
			</template>
		</popup>

	</div>
</template>

<script setup lang="ts">
	import { LeekWars } from '@/model/leekwars'
	import { ITEM_CATEGORY_NAME as ITEM_CATEGORY_NAME_TYPED, ItemType, itemImageUrl } from '@/model/item'
	import { InventoryItem } from '@/model/farmer'
	import { t } from '@/model/i18n'
	import { planAttempt, alterationTier, alteredClass, type AlterationRecipe } from '@/model/alteration'
	import { SchemeTemplate } from '@/model/scheme'
	import { store } from '@/model/store'
	import { emitter } from '@/model/vue'
	import { computed, defineAsyncComponent, onBeforeUnmount, onMounted, ref } from 'vue'
	import Breadcrumb from '../forum/breadcrumb.vue'
	import Popup from '@/component/popup.vue'
	const RichTooltipItem = defineAsyncComponent(() => import('@/component/rich-tooltip/rich-tooltip-item.vue'))

	defineOptions({ name: 'Forge' })

	type ForgeSlot = [number, number]

	const forge = ref<(ForgeSlot | null)[]>([null, null, null, null, null, null, null, null])
	/** Composant pose au centre pour etre altere (#622). */
	const component = ref<InventoryItem | null>(null)
	/** Nombre d'exemplaires du composant a recycler d'un coup, en mode destruction (#622). */
	const componentCount = ref(1)
	/** Onglet actif de l'atelier : seul le mode destruction empile les composants. */
	const mode = ref(localStorage.getItem('workshop/tab') || 'craft')
	const destroying = ref(false)
	const scheme = ref<SchemeTemplate | null>(null)
	const result = ref<number | null>(null)
	const building = ref(false)
	const built = ref(false)

	onMounted(() => {
		LeekWars.footer = false
		LeekWars.box = true
		emitter.on('alter', (item: InventoryItem) => {
			// En mode destruction, recliquer le meme composant (non altere) en empile
			// plusieurs pour les recycler d'un coup ; sinon on repose la piece (#622).
			if (mode.value === 'destroy' && component.value && component.value.template === item.template
				&& alterationCount.value === 0 && component.value.stats == null) {
				if (componentCount.value < item.quantity) componentCount.value++
				return
			}
			clear()
			component.value = item
			componentCount.value = 1
		})
		emitter.on('add-alteration', addAlteration)
		emitter.on('workshop-mode', (m: string) => { mode.value = m })
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
		componentCount.value = 1
		lastResult.value = null
		building.value = false
		built.value = false
	}

	const altering = ref(false)
	/** Derniere recette d'alteration lancee, pour le bouton Recommencer (#622). */
	const lastRecipe = ref<AlterationRecipe | null>(null)

	// Perimetre du rect arrondi (92x92, r=20) pour la jauge annulaire :
	// 4 cotes droits + 4 quarts de cercle = 4*(92-2*20) + 2*PI*20.
	// Rectangle arrondi parcouru en HORAIRE depuis le milieu du haut (12h), pour que la
	// jauge parte pile en haut. Un <rect> commence son trace a rx du coin gauche, d'ou
	// le depart decale et le glitch au coin ; un <path> explicite fixe le point de
	// depart exactement ou on veut.
	const RING_PATH = 'M50 4 H76 A20 20 0 0 1 96 24 V76 A20 20 0 0 1 76 96 H24 A20 20 0 0 1 4 76 V24 A20 20 0 0 1 24 4 Z'
	const ringLength = 4 * (92 - 40) + 2 * Math.PI * 20
	// Palier de rarete de la charge, pour colorer l'anneau (#622).
	const tierBefore = computed(() => plan.value ? (alterationTier(plan.value.ratioBefore)?.tier ?? 1) : 1)
	const tierAfter = computed(() => plan.value ? (alterationTier(plan.value.ratioAfter)?.tier ?? 1) : 1)

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
		const sent = { ...recipe.value }
		LeekWars.post<AlterResult>('component/alter', { component_id: item.id, alterations: JSON.stringify(sent) }).then(data => {
			lastRecipe.value = sent
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
			// L'historique des ameliorations montre la tentative aussitot (#622).
			emitter.emit('workshop-action', 2)
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
		// Alterer porte sur une seule piece : un empilement de destruction se defait.
		componentCount.value = 1
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

	/**
	 * Recommence : repose la derniere recette lancee sur ce composant. Chaque
	 * alteration n'est reposee que si le joueur en a encore, sinon on met ce qu'il a.
	 */
	function repeat() {
		if (!lastRecipe.value || !component.value) return
		clearIngredients()
		const alterations = LeekWars.alterations
		if (!alterations) return
		for (const id in lastRecipe.value) {
			const tpl = alterations.alterations[id]?.template
			if (!tpl) continue
			const owned = store.state.farmer?.alterations?.find(a => a.template === tpl)
			const want = lastRecipe.value[id]
			for (let n = 0; n < want && (owned ? n < owned.quantity : false); n++) {
				addAlteration({ id: tpl, template: tpl, quantity: owned!.quantity } as InventoryItem)
			}
		}
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
	/** Le composant pose porte-t-il de la charge (des alterations) ? */
	const componentHasCharge = computed(() => {
		const c = component.value
		return !!c && !!c.stats && Object.keys(c.stats).length > 0
	})
	/** Confirmation avant de recycler une piece chargee (#622). */
	const confirmDestroy = ref(false)

	function destroy() {
		if (!component.value || destroying.value) return
		// Recycler detruit la piece : si elle porte de la charge, on previent d'abord
		// que ses ameliorations investies seront perdues (#622).
		if (componentHasCharge.value) {
			confirmDestroy.value = true
			return
		}
		doDestroy()
	}

	function doDestroy() {
		confirmDestroy.value = false
		if (!component.value || destroying.value) return
		const item = component.value
		const count = componentCount.value
		destroying.value = true
		LeekWars.post<{ alterations: {[id: number]: number}, resources: {[id: number]: number}, count: number, destroyed: number }>('item/recycle', { item_id: item.id, count }).then(data => {
			const destroyed = data.destroyed ?? count
			store.commit('remove-inventory', { type: ItemType.COMPONENT, item_template: item.template, quantity: destroyed })
			const alterations = LeekWars.alterations
			for (const id in data.alterations) {
				const alteration = alterations ? alterations.alterations[id] : null
				if (!alteration) continue
				store.commit('add-inventory', { type: ItemType.ALTERATION, id: alteration.template,
					template: alteration.template, quantity: data.alterations[id], time: Date.now() / 1000 })
			}
			// Ressources rendues (~25 % de la recette), ajoutees a l'inventaire.
			for (const id in data.resources) {
				store.commit('add-inventory', { type: ItemType.RESOURCE, id: Number(id),
					template: Number(id), quantity: data.resources[id], time: Date.now() / 1000 })
			}
			LeekWars.toast(data.count > 0
				? t('main.destroy_result', [data.count])
				: t('main.destroy_nothing'))
			// L'historique des destructions montre le resultat aussitot (#622).
			emitter.emit('workshop-action', 3)
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
			// L'historique des fabrications montre le craft aussitot (#622).
			emitter.emit('workshop-action', 1)
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

// Anneau de charge autour de la cellule centrale : depasse legerement le carre pour
// l'entourer sans masquer l'image du composant.
.charge-ring {
	position: absolute;
	// Juste a l'exterieur du carre central (11px) : l'arc vient coller sa bordure
	// fine sans la recouvrir.
	top: -11px;
	left: -11px;
	width: calc(100% + 22px);
	height: calc(100% + 22px);
	pointer-events: none;
	z-index: 1;
	.fill {
		fill: none;
		stroke-width: 6;
		stroke-linecap: round;
		transition: stroke-dashoffset 0.3s ease;
		// Un rect arrondi commence deja son trace en haut et tourne dans le sens
		// horaire : pas de rotation a appliquer, contrairement a un cercle (sinon le
		// depart se decale sur un coin et l'arc semble detache).
	}
	// Couleur du palier, comme la silhouette de la vignette.
	.fill.tier-1 { stroke: #008800; }
	.fill.tier-2 { stroke: #0090ff; }
	.fill.tier-3 { stroke: #c21aff; }
	.fill.tier-4 { stroke: #f8ac00; }
	.fill.tier-5 { stroke: red; }
	// Ce que la tentative ajouterait : meme couleur de palier, mais estompe.
	.fill.preview { opacity: 0.4; }
}
// Pourcentage de charge, en petit dans le coin bas droit de l'image du composant.
.cell8.component .charge-corner {
	position: absolute;
	right: 3px;
	bottom: 2px;
	z-index: 3;
	font-size: 12px;
	font-weight: bold;
	color: #fff;
	// Liseré sombre : lisible sur n'importe quelle teinte d'image et dans les deux thèmes.
	text-shadow: 0 0 2px #000, 0 0 2px #000, 0 1px 1px #000;
	pointer-events: none;
}
// Compteur d'empilement pour le recyclage groupe (#622) : pastille sombre, coin bas droit.
.cell8.component .stack-count {
	position: absolute;
	right: 2px;
	bottom: 2px;
	z-index: 3;
	background: #000000b3;
	color: #fff;
	font-size: 14px;
	font-weight: bold;
	padding: 0 5px;
	border-radius: 4px;
	pointer-events: none;
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
// Les 4 boutons d'angle : meme pastille ronde, fond plein et fine bordure, pour
// qu'ils se detachent de la grille et se ressemblent (#622). La couleur porte sur
// l'icone (primary pour agir, error pour recycler), pas sur le fond.
.corner-btn.v-btn {
	position: absolute;
	z-index: 3;
	background-color: var(--background) !important;
	border: 1px solid var(--border);
	box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
}
// Recommencer : coin HAUT gauche de la grille.
.redo { left: -4px; top: -4px; }
// Effacer : coin HAUT droit, aligne sur les autres (etait a -5px, decale).
.clear { right: -4px; top: -4px; }
// Recyclage : coin BAS gauche.
.recycle { left: -4px; bottom: -4px; }
// Alterer : coin BAS droit, la ou tombe naturellement la main droite.
.fuse-btn { right: -4px; bottom: -4px; }
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
		&:not(.built):not(.component) .item {
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
// Corps du dialogue de confirmation de recyclage (#622).
.destroy-confirm {
	padding: 4px 4px 8px;
	font-size: 14px;
	line-height: 1.5;
}
// Icone habs a cote du cout : petite, calee sur le texte (#622).
.cost .hab {
	width: 14px;
	height: 14px;
	background-size: 14px;
	margin-left: 3px;
	vertical-align: -2px;
}
</style>