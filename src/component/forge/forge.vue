<template>
	<div class="forge">
		<!-- Dosage, gains, risque et cout ne sont plus ici mais sous les stats de la piece,
		     dans la colonne des caracteristiques (forge-stats) : la forge garde ainsi la
		     meme hauteur qu'on pose ou non des alterations (demande de Pierre). -->
		<div ref="gridEl" class="grid">
			<div v-for="(item, i) in forge" :key="i" class="cell" :class="{['cell' + i]: true, active: !!item, building: item && building, partial: slotStates[i] === 'partial', missing: slotStates[i] === 'missing', removable: !!item && !!component, fusing: fusing && !!item}" :style="cellVars(i)" @click="component && removeAlteration(i)">
				<!-- Les quantites affichees sont celles du LOT (x1 ou x10) : c'est ce que le
				     clic va reellement consommer, et c'est sur elles que se calcule le manque. -->
				<rich-tooltip-item v-if="item" :key="item[0]" v-slot="{ props }" :item="LeekWars.items[item[0]]" :inventory="true" :quantity="item[1] * craftBatch">
					<div class="item" v-bind="props" :type="LeekWars.items[item[0]].type">
						<img :src="itemImageUrl(LeekWars.items[item[0]])">
						<!-- Numero de dosage, en haut a gauche comme dans la palette (#622). -->
						<span v-if="slotNumber(item) !== null" class="alt-number">{{ slotNumber(item) }}</span>
						<!-- La cle sur la quantite fait rejouer le petit rebond a chaque ajout. -->
						<div v-if="item[1] * craftBatch > 1" :key="item[1] * craftBatch" class="quantity">{{ $filters.number(item[1] * craftBatch) }}</div>
					</div>
				</rich-tooltip-item>
			</div>
			<div v-if="component" class="cell cell8 active component removable" :class="[outcome ? 'outcome-' + outcome : '', { shattering }]" @click="clear">
				<!-- Anneau de charge : contour carre qui suit la vignette du composant et se
				     remplit dans le sens horaire (#622). Deux traces : la charge actuelle,
				     puis en plus clair ce que la tentative ajouterait. -->
				<!-- Charge negative comprise (casse) : l'arc se remplit en valeur absolue,
				     c'est sa couleur de palier qui dit s'il s'agit d'un gain ou d'un trou. -->
				<svg v-if="plan && (chargeBefore !== 0 || chargeAfter !== 0)" class="charge-ring" viewBox="0 0 100 100" preserveAspectRatio="none">
					<!-- Tooltip natif au survol de l'arc : charge investie / capacite (#622). -->
					<title>{{ chargeTitle }}</title>
					<!-- Pas de rail de fond : seul l'arc de charge est visible. -->
					<!-- Ce que la tentative ajouterait, en semi-transparent derriere la charge. -->
					<path v-if="chargeAfter !== 0" class="fill preview" :class="['tier-' + tierAfter, { reverse: chargeAfter < 0 }]" :d="RING_PATH"
						:stroke-dasharray="ringLength" :stroke-dashoffset="ringLength * (1 - Math.min(1, Math.abs(chargeAfter)))" />
					<!-- La charge actuelle, dans la couleur de son palier. -->
					<path v-if="chargeBefore !== 0" class="fill" :class="['tier-' + tierBefore, { reverse: chargeBefore < 0 }]" :d="RING_PATH"
						:stroke-dasharray="ringLength" :stroke-dashoffset="ringLength * (1 - Math.min(1, Math.abs(chargeBefore)))" />
				</svg>
				<rich-tooltip-item v-slot="{ props }" :item="LeekWars.items[component.template]" :instance="component" :inventory="true">
					<div class="item" v-bind="props" :type="LeekWars.items[component.template].type">
						<!-- Silhouette coloree du palier si la piece porte deja de la charge (#622) ;
						     vide (donc aucune bordure) pour un composant neuf. -->
						<img :key="component.id" :class="alteredClass(component, LeekWars.componentCapacity(component.template), LeekWars.alterations?.weights)" :src="'/image/component/' + LeekWars.items[component.template].name + '.png'">
					</div>
				</rich-tooltip-item>
				<!-- Pourcentage de charge, en petit dans le coin bas droit de l'image (#622). -->
				<!-- Charge BUDGETAIRE, comme la jauge de l'inventaire : c'est elle qui dit s'il
				     reste de la place. Le brut comptait les deficits au tarif plein et affichait
				     77 % sur une piece pourtant pleine, qui n'acceptait plus rien (#622). -->
				<div v-if="plan && chargeAfter !== 0" class="charge-corner" :class="{ over: plan.overfilled, deficit: chargeAfter < 0 }" :title="chargeTitle">{{ Math.round(chargeAfter * 100) }}%</div>
				<!-- Nombre de pieces empilees a recycler d'un coup (#622). -->
				<div v-if="componentCount > 1" class="stack-count">×{{ componentCount }}</div>
				<!-- Destruction : 8 copies de l'image, chacune decoupee en part de pizza,
				     qui s'eparpillent le long de leur bissectrice (#622). -->
				<div v-if="shattering" class="shatter">
					<img v-for="(s, i) in SHARDS" :key="'s' + i" :src="componentImage"
						:style="{ clipPath: s.clip, '--tx': s.tx + 'px', '--ty': s.ty + 'px', '--rot': s.rot + 'deg', animationDelay: i * 0.012 + 's' }">
				</div>
			</div>
			<div v-else class="cell" :class="{cell8: true, active: !!result && !built && !impossible, built, impossible}" @click="craft">
				<rich-tooltip-item v-if="result && scheme" v-slot="{ props }" :item="LeekWars.items[result]" :inventory="true" :quantity="scheme.quantity * craftBatch" :open-delay="built ? 500 : 1000">
					<div v-ripple="possible || built" v-bind="props" class="item" :class="{building}" :type="LeekWars.items[result].type">
						<img :src="itemImageUrl(LeekWars.items[result])">
						<div v-if="scheme.quantity * craftBatch > 1" class="quantity">{{ $filters.number(scheme.quantity * craftBatch) }}</div>
					</div>
				</rich-tooltip-item>
				<v-icon v-if="result && !building && !built" :class="{disabled: impossible}">mdi-hammer-wrench</v-icon>
				<v-icon v-if="result && built">mdi-refresh</v-icon>
			</div>
			<!-- Flux de particules vers le composant, au-dessus des cases pour rester
			     visible sur tout le trajet (#622).
			     Les particules sont montees des qu'une alteration est posee, mais le flux
			     ne s'ALLUME qu'une fois la tentative connue possible : elles demarrent en
			     cours de vol (delai negatif), donc les faire apparaitre d'un coup se voyait
			     comme un a-coup. C'est l'opacite de la couche qui ouvre et coupe le flux,
			     en fondu (retour de Pierre). -->
			<div v-if="particles.length" class="particles" :class="{ flowing }">
				<span v-for="p in particles" :key="p.key" class="particle" :class="'color-' + p.carac"
					:style="{ left: p.left + '%', top: p.top + '%',
						width: p.size + 'px', height: p.size + 'px',
						marginLeft: -p.size / 2 + 'px', marginTop: -p.size / 2 + 'px',
						'--sx': p.sx + 'px', '--sy': p.sy + 'px',
						'--q1x': p.q1x + 'px', '--q1y': p.q1y + 'px',
						'--mx': p.mx + 'px', '--my': p.my + 'px',
						'--q3x': p.q3x + 'px', '--q3y': p.q3y + 'px',
						'--dx': p.dx + 'px', '--dy': p.dy + 'px',
						animationDuration: p.duration + 's', animationDelay: -p.delay + 's' }"></span>
			</div>
			<!-- Effacer : croix, pas une fleche circulaire qui evoquerait "refaire". Coin HAUT droit. -->
			<v-btn v-if="scheme || component" class="corner-btn clear" icon variant="flat" size="small" @click="clear">
				<v-icon>mdi-close</v-icon>
				<v-tooltip activator="parent" location="top">{{ $t('main.clear') }}</v-tooltip>
			</v-btn>
			<!-- Vider les alterations SANS reposer le composant (demande de Pierre) : c'est
			     le geste courant entre deux essais de dosage, alors que la croix d'en face
			     emporte aussi la piece, qu'il faut ensuite retrouver dans l'inventaire.
			     Coin HAUT gauche, en miroir de la croix. -->
			<v-btn v-if="component && alterationCount > 0" class="corner-btn sweep" icon variant="flat"
				size="small" @click="clearIngredients">
				<v-icon>mdi-broom</v-icon>
				<v-tooltip activator="parent" location="top">{{ $t('main.alteration_clear') }}</v-tooltip>
			</v-btn>
			<!-- Recommencer : repose la derniere recette d'alteration (#622). Coin BAS droit,
			     la ou se trouve Fusionner : les deux ne coexistent jamais. Jamais dans Detruire :
			     rien n'y sera altere, et le coin bas droit y porte desormais le bouton
			     Detruire (demande de Pierre). -->
			<v-btn v-if="component && lastForge && alterationCount === 0 && mode !== 'destroy'" class="corner-btn redo" icon variant="flat"
				size="small" @click="repeat">
				<v-icon color="primary">mdi-restore</v-icon>
				<!-- Vers le bas : le bouton est au coin BAS de la grille, une infobulle
				     au-dessus vient recouvrir les cases (demande de Pierre). -->
				<v-tooltip activator="parent" location="bottom">{{ $t('main.alteration_repeat') }}</v-tooltip>
			</v-btn>
			<!-- Taille du lot : coin BAS gauche, ×1 ou ×10, dans Fabriquer comme dans
			     Detruire (demande de Pierre). Un clic bascule, et le choix est retenu d'une
			     visite a l'autre. Sur Detruire il ne s'affiche que si la pile a de quoi en
			     detruire plusieurs. -->
			<v-btn v-if="batchVisible" class="corner-btn batch" icon variant="flat"
				size="small" @click="toggleBatch">
				<span class="batch-label">×{{ batch }}</span>
				<v-tooltip activator="parent" location="bottom">{{ $t('main.craft_quantity') }}</v-tooltip>
			</v-btn>
			<!-- Recyclage : coin BAS DROIT (la ou tombe la main droite, comme Alterer dans
			     l'onglet d'a cote, demande de Pierre), tant qu'aucune alteration n'est posee, et
			     SEULEMENT dans l'onglet Detruire (demande de Pierre) : sur Ameliorer, une
			     piece posee avant sa premiere alteration pouvait partir au recyclage par
			     erreur, alors que le joueur venait justement de la choisir pour la monter. -->
			<v-btn v-if="component && alterationCount === 0 && mode === 'destroy'" class="corner-btn recycle" icon variant="flat"
				size="small" :loading="destroying" @click="destroy">
				<v-icon color="white">mdi-recycle</v-icon>
				<v-tooltip activator="parent" location="bottom">{{ $t('main.destroy') }}</v-tooltip>
			</v-btn>
			<!-- Recommencer une destruction : la forge se vide une fois la piece en eclats,
			     et il fallait retourner la chercher dans l'inventaire pour en detruire
			     d'autres. Le bouton prend EXACTEMENT la place de Detruire (demande de
			     Pierre) : le geste ne bouge pas d'un recyclage au suivant. Il ne s'affiche
			     que s'il reste une piece a reposer. -->
			<v-btn v-if="mode === 'destroy' && !component && repeatDestroyItem" class="corner-btn redo-destroy" icon variant="flat"
				size="small" @click="repeatDestroy">
				<v-icon color="primary">mdi-restore</v-icon>
				<v-tooltip activator="parent" location="bottom">{{ $t('main.alteration_repeat') }}</v-tooltip>
			</v-btn>
			<!-- Alterer : coin BAS droit de la grille, sous la main du joueur. -->
			<v-btn v-if="component && alterationCount > 0" class="corner-btn fuse-btn" icon variant="flat"
				size="small" :loading="altering" :disabled="!plan || !plan.fits" @click="alter">
				<!-- Pas de blanc force sur l'aplat de marque : l'encre du jeton suit
				     le theme (sombre sur le vert vif, cf. lot 28), le blanc n'y tenait
				     pas (retour de Pierre sur le contraste). -->
				<v-icon class="fuse-icon">mdi-flask</v-icon>
				<v-tooltip activator="parent" location="bottom">{{ $t('main.alteration_fuse') }}</v-tooltip>
			</v-btn>
		</div>

		<!-- Confirmation avant de recycler une piece qui porte de la charge (#622). -->
		<popup v-model="confirmDestroy" :width="460" icon="mdi-recycle">
			<template #title>{{ $t('main.destroy_confirm_title') }}</template>
			<div class="destroy-confirm">{{ $t('main.destroy_confirm_message') }}</div>
			<!-- La barre d'actions du popup attend des <div> : elle les etale en boutons
			     pleine largeur, avec .red pour l'action destructrice. -->
			<template #actions>
				<div @click="confirmDestroy = false">{{ $t('main.cancel') }}</div>
				<div class="red" @click="doDestroy">
					<v-icon>mdi-recycle</v-icon>{{ $t('main.destroy') }}
				</div>
			</template>
		</popup>

		<!-- Butin en vol de la forge vers l'historique. Teleporte dans le body et en
		     position fixe : le trajet traverse deux composants et sort de la forge (#622). -->
		<Teleport to="body">
			<div v-if="flyers.length" class="loot-flight">
				<img v-for="f in flyers" :key="f.key" class="loot" :src="f.src"
					:style="{ left: f.x + 'px', top: f.y + 'px', '--tx': f.tx + 'px', '--ty': f.ty + 'px', animationDelay: f.delay + 's' }">
			</div>
		</Teleport>

	</div>
</template>

<script setup lang="ts">
	import { LeekWars } from '@/model/leekwars'
	import { ITEM_CATEGORY_NAME as ITEM_CATEGORY_NAME_TYPED, ItemType, itemImageUrl } from '@/model/item'
	import { InventoryItem } from '@/model/farmer'
	import { planAttempt, alterationTier, alteredClass, componentFamily, isIndivisibleWrongFamily, type AlterationRecipe } from '@/model/alteration'
	import { SchemeTemplate } from '@/model/scheme'
	import { store } from '@/model/store'
	import { t } from '@/model/i18n'
	import type { ApiError } from '@/model/api-error'
	import { emitter } from '@/model/emitter'
	import { forgeComponent, forgePendingPower, forgeCharge, forgePreview } from '@/model/forge-state'
	import { computed, defineAsyncComponent, onBeforeUnmount, onMounted, ref, watch, watchEffect } from 'vue'
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

	// --- Lot (x1 / x10) ---
	/** Taille du lot demandee par le joueur, retenue d'une visite a l'autre. */
	const batch = ref(localStorage.getItem('workshop/batch') === '10' ? 10 : 1)
	/**
	 * Lot REELLEMENT applique a la fabrication : 1 tant qu'aucun schema n'est pose, pour
	 * que les cases d'alteration (memes cases, autre onglet) ne soient jamais multipliees.
	 */
	const craftBatch = computed(() => scheme.value ? batch.value : 1)
	/**
	 * Detruire n'a besoin du lot que si la pile en contient plusieurs ; une piece unique
	 * (ou alteree, donc forcement seule) n'en tirerait rien.
	 */
	const batchVisible = computed(() => {
		if (mode.value === 'craft') return !!scheme.value
		if (mode.value === 'destroy') return !!component.value && alterationCount.value === 0 && component.value.quantity > 1
		return false
	})
	function toggleBatch() {
		batch.value = batch.value === 1 ? 10 : 1
		localStorage.setItem('workshop/batch', String(batch.value))
		// En destruction, le lot pilote directement la pile a recycler (plafonnee a ce que
		// le joueur possede) : le compteur de la case doit suivre le bouton.
		if (mode.value === 'destroy' && component.value) {
			componentCount.value = Math.min(batch.value, component.value.quantity)
		}
	}

	// --- Animations de fusion (#622) ---
	/** Duree du vol des alterations vers le composant, en ms (calee sur fuse-travel). */
	const FUSE_DURATION = 240
	/**
	 * Vecteur (px) du centre de chaque case vers le centre de la grille de 240 px :
	 * les cases font 28,57 % et le centre est a 50 %, d'ou 68,6 px en diagonale et
	 * 85,7 px en ligne droite. Sert aux particules et au vol de fusion.
	 */
	const CELL_VECTORS: [number, number][] = [
		[68.6, 68.6], [0, 85.7], [-68.6, 68.6],
		[85.7, 0], [-85.7, 0],
		[68.6, -68.6], [0, -85.7], [-68.6, -68.6],
	]
	/** Centre de chaque case, en % de la grille : point de depart des particules. */
	const CELL_CENTERS: [number, number][] = [
		[21.43, 21.43], [50, 14.29], [78.57, 21.43],
		[14.29, 50], [85.71, 50],
		[21.43, 78.57], [50, 85.71], [78.57, 78.57],
	]
	/**
	 * Variables de trajet d'une case. Une recette peut compter plus d'entrees que la
	 * grille n'a de cases (les Habs occupent un emplacement d'ingredient), donc l'index
	 * peut sortir du tableau : sans garde, tout le rendu de la forge plante.
	 */
	function cellVars(i: number) {
		const v = CELL_VECTORS[i]
		return v ? { '--dx': v[0] + 'px', '--dy': v[1] + 'px' } : {}
	}
	/** Vrai pendant que les alterations filent vers le composant. */
	const fusing = ref(false)
	/** Issue a animer juste apres la fusion : success | fail | broken. */
	const outcome = ref<string | null>(null)
	let outcomeTimer = 0

	// --- Animation de destruction (#622) ---
	/** Duree de l'eclatement du composant en parts, en ms. */
	const SHATTER_DURATION = 620
	/** Le butin sort avec l'explosion : juste quand les parts commencent a se separer. */
	const LOOT_DELAY = 90
	/**
	 * Les 8 parts facon pizza : chacune est un triangle du centre vers deux points
	 * consecutifs du bord du carre (milieux de cotes et coins en alternance), decoupe
	 * par clip-path dans une copie de l'image. Chaque part part le long de sa
	 * bissectrice, en tournant.
	 */
	const SHARDS = ([
		['50% 0%', '100% 0%'], ['100% 0%', '100% 50%'],
		['100% 50%', '100% 100%'], ['100% 100%', '50% 100%'],
		['50% 100%', '0% 100%'], ['0% 100%', '0% 50%'],
		['0% 50%', '0% 0%'], ['0% 0%', '50% 0%'],
	] as [string, string][]).map((pts, i) => {
		const angle = (-90 + 22.5 + i * 45) * Math.PI / 180
		return {
			clip: `polygon(50% 50%, ${pts[0]}, ${pts[1]})`,
			tx: Math.round(Math.cos(angle) * 72),
			ty: Math.round(Math.sin(angle) * 72),
			rot: (i % 2 === 0 ? 1 : -1) * (30 + i * 6),
		}
	})
	/** Vrai pendant que le composant vole en eclats. */
	const shattering = ref(false)
	/** Image du composant pose, reprise par chaque part. */
	const componentImage = computed(() => {
		const c = component.value
		if (!c) return ''
		const tpl = LeekWars.items[c.template]
		return tpl ? '/image/component/' + tpl.name + '.png' : ''
	})
	/** Butin en vol entre la forge et l'historique. */
	interface Flyer { key: string, src: string, x: number, y: number, tx: number, ty: number, delay: number }
	const flyers = ref<Flyer[]>([])
	const gridEl = ref<HTMLElement | null>(null)
	let flyersTimer = 0
	const scheme = ref<SchemeTemplate | null>(null)
	const result = ref<number | null>(null)
	const building = ref(false)
	const built = ref(false)
	/** Piece qui vient d'etre fabriquee, pour la reprendre telle quelle dans les autres onglets (#622). */
	const crafted = ref<InventoryItem | null>(null)

	// Manque de chaque ingrédient placé dans la forge : quantité insuffisante ('partial'),
	// aucun exemplaire ('missing'), rien à signaler sinon. La forge peut être remplie par un
	// schéma qu'on n'a pas les moyens de fabriquer (bouton Fabriquer du marché),
	// il faut donc montrer ce qui manque plutôt que laisser croire au craft.
	// Pendant l'animation de fabrication les ingrédients sont déjà retirés de l'inventaire
	// alors qu'ils sont encore affichés : ne rien signaler tant qu'elle tourne.
	const slotStates = computed(() => forge.value.map(slot => {
		if (!slot || building.value) return null
		const owned = store.getters.item_quantity(slot[0])
		const needed = slot[1] * craftBatch.value
		return owned >= needed ? null : (owned > 0 ? 'partial' : 'missing')
	}))
	// Le lot est TOUT OU RIEN : un ×10 a moitie finance n'est pas fabricable, et la forge
	// le dit en peignant les cases en manque. Le compte se refait donc ici plutot que par
	// le getter scheme_possible du store, qui ne connait que la recette a l'unite.
	const possible = computed(() => !!scheme.value && scheme.value.items.every(item =>
		item === null || store.getters.item_quantity(item[0]) >= item[1] * craftBatch.value))
	const impossible = computed(() => !!result.value && !built.value && !building.value && !possible.value)

	// Jeton d'invalidation des retours en vol : vider ou re-remplir la forge le périme.
	// L'identité de l'objet schéma ne suffirait pas, le marché émet toujours le même
	// singleton LeekWars.schemes[id].
	let craftToken = 0

	// Les gestionnaires d'evenements sont NOMMES pour pouvoir etre retires un par un :
	// emitter.off(type) sans reference vide toute la liste du type, y compris les
	// gestionnaires des AUTRES composants. La forge etant demontee des que l'atelier est
	// replie, elle emportait ainsi ceux de la page d'inventaire (#622).
	function onCraft(s: SchemeTemplate) {
		clear()
		scheme.value = s
		for (let i = 0; i < s.items.length; ++i) {
			forge.value[i] = s.items[i]
		}
		result.value = s.result
	}

	function onAlter(item: InventoryItem) {
		// En mode destruction, recliquer le meme composant (non altere) en empile
		// plusieurs pour les recycler d'un coup ; sinon on repose la piece (#622).
		if (mode.value === 'destroy' && component.value && component.value.template === item.template
			&& alterationCount.value === 0 && component.value.stats == null) {
			if (componentCount.value < item.quantity) componentCount.value++
			return
		}
		clear()
		component.value = item
		// Le lot choisi s'applique des la pose, plafonne a la pile reellement possedee :
		// en ×10, poser une piece prepare la destruction de dix d'un coup.
		componentCount.value = mode.value === 'destroy' ? Math.min(batch.value, item.quantity) : 1
	}

	function onWorkshopMode(m: string) {
		const from = mode.value
		mode.value = m
		// On quitte Fabriquer juste apres un craft : la piece fabriquee descend dans la
		// forge comme un composant ordinaire. Rester en mode « recommencer » n'a pas de
		// sens dans Ameliorer ni Detruire, qui travaillent sur une piece et pas sur une
		// recette, et obligeait a aller la rechercher dans l'inventaire (#622).
		if (from === 'craft' && m !== 'craft' && built.value && crafted.value) {
			const item = crafted.value
			clear()
			component.value = item
			componentCount.value = 1
		}
		// Le lot vaut aussi pour une piece deja posee qu'on amene sur Detruire : sinon le
		// bouton affichait ×10 et le clic n'en detruisait qu'une.
		if (m === 'destroy' && component.value && alterationCount.value === 0) {
			componentCount.value = Math.min(batch.value, component.value.quantity)
		}
	}

	onMounted(() => {
		LeekWars.footer = false
		LeekWars.box = true
		emitter.on('craft', onCraft)
		emitter.on('alter', onAlter)
		emitter.on('add-alteration', addAlteration)
		emitter.on('replay-recipe', onReplayRecipe)
		emitter.on('workshop-mode', onWorkshopMode)
	})

	function clearIngredients() {
		for (let i = 0; i < 8; ++i) {
			forge.value[i] = null
		}
	}
	function clear() {
		craftToken++
		clearIngredients()
		result.value = null
		scheme.value = null
		component.value = null
		componentCount.value = 1
		building.value = false
		built.value = false
		crafted.value = null
	}

	const altering = ref(false)
	/**
	 * Disposition exacte de la derniere recette lancee : les 8 cases telles que le joueur
	 * les avait garnies. La recette seule ne suffit pas a la rejouer a l'identique, elle
	 * ne dit pas QUELLE case portait quoi, et « Recommencer » reconstituait donc un
	 * agencement different du sien (#622).
	 */
	const lastForge = ref<(ForgeSlot | null)[] | null>(null)

	// Jauge annulaire : carre de 92x92, a angles vifs, parcouru en HORAIRE depuis le
	// milieu du haut (12h) pour que le remplissage parte pile en haut. Un <rect>
	// commence son trace au coin et pas au milieu d'un cote, d'ou le depart decale et
	// le glitch dans l'angle ; un <path> explicite fixe le point de depart ou on veut.
	// Perimetre = 4 x 92, sans quart de cercle a retrancher depuis que les coins sont
	// carres : la jauge suit la vignette du composant, qui est carree elle aussi.
	const RING_PATH = 'M50 4 H96 V96 H4 V4 Z'
	const ringLength = 4 * 92
	// Palier de rarete de la charge, pour colorer l'anneau (#622).
	// Meme regle que la jauge de l'inventaire (cf. displayRatio) : le budget au-dessus de
	// zero, parce que c'est lui qui dit s'il reste de la place, et le brut en dessous, parce
	// qu'il dit l'ampleur reelle des degats (#622).
	const chargeBefore = computed(() => !plan.value ? 0
		: (plan.value.ratioBefore >= 0 ? plan.value.ratioBefore : plan.value.rawRatioBefore))
	const chargeAfter = computed(() => !plan.value ? 0
		: (plan.value.ratioAfter >= 0 ? plan.value.ratioAfter : plan.value.rawRatioAfter))
	const tierBefore = computed(() => alterationTier(chargeBefore.value)?.tier ?? 1)
	const tierAfter = computed(() => alterationTier(chargeAfter.value)?.tier ?? 1)

	interface AlterResult {
		success: boolean
		probability: number
		results: { carac: string, success: boolean, points: number }[]
		id?: number
		/** Date remontee par le serveur quand les stats ont change (tri par date, #622). */
		time?: number
		stats: { [carac: string]: number }
		capacity: { used: number, total: number }
		dose: number
		metabolism: number
		/** Casse : points perdus par carac, la perte s'etalant sur plusieurs stats (#622). */
		broken: { [carac: string]: number } | null
		habs_cost: number
	}

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
		// Capacité forcée du composant (colonne, ex. le RGB) pour que l'aperçu colle au serveur.
		const capacity = LeekWars.components[Number(template.params)]?.capacity
		return planAttempt(data, base, item.stats ?? {}, Number(template.level), family, recipe.value, capacity)
	})


	/** Infobulle de la charge : puissance investie sur capacite du puits (#622). */
	const chargeTitle = computed(() => {
		const p = plan.value
		if (!p) return ''
		return t('main.alteration_charge') + ' ' + LeekWars.formatNumber(Math.round(p.ratioAfter * p.capacity))
			+ ' / ' + LeekWars.formatNumber(Math.round(p.capacity))
	})

	/**
	 * Lance la tentative. Les alterations et les Habs sont consommes dans tous les
	 * cas : c'est le cout d'un essai, pas le prix d'un succes.
	 */
	function alter() {
		const item = component.value
		if (!item || altering.value || alterationCount.value === 0) return
		altering.value = true
		outcome.value = null
		// Les alterations filent vers le composant pendant que le serveur tranche (#622).
		fusing.value = true
		const started = Date.now()
		const sent = { ...recipe.value }
		LeekWars.post<AlterResult>('component/alter', { component_id: item.id, alterations: JSON.stringify(sent) }).then(data => {
			// On laisse le vol des alterations finir avant de reveler l'issue : sinon un
			// serveur rapide escamote l'animation.
			window.setTimeout(() => {
				lastForge.value = forge.value.map(slot => slot ? [slot[0], slot[1]] as ForgeSlot : null)
				// Le composant porte desormais ses nouvelles stats. L'inventaire construit
				// des COPIES des items du store (spread dans son computed), donc ecrire sur
				// l'objet recu ne suffit pas : il faut retrouver l'original.
				item.stats = data.stats
				item.altered_power = data.capacity.used
				// Le serveur remonte la date quand les stats ont bouge : on la reporte pour
				// que la piece passe en tete de l'inventaire trie par date tout de suite (#622).
				if (data.time !== undefined) item.time = data.time
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
							time: item.time, stats: data.stats, altered_power: data.capacity.used })
					} else if (stored) {
						stored.stats = data.stats
						stored.altered_power = data.capacity.used
						// La date aussi, sinon l'inventaire trie par date ne reordonne pas :
						// il lit le store, pas l'objet que la forge a en main (#622).
						if (data.time !== undefined) stored.time = data.time
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
				fusing.value = false
				// Issue jouee sur le composant : reussite, echec sec, ou casse.
				// `broken` est une map carac => points : une casse peut n'avoir rien trouve a
				// creuser (piece au plancher), auquel cas la map est vide (#622).
				const broke = !!data.broken && Object.keys(data.broken).length > 0
				outcome.value = broke ? 'broken' : (data.results.some(r => r.success) ? 'success' : 'fail')
				clearTimeout(outcomeTimer)
				outcomeTimer = window.setTimeout(() => { outcome.value = null }, 1400)
				// L'historique des ameliorations montre la tentative aussitot (#622).
				emitter.emit('workshop-action', 2)
				altering.value = false
			}, Math.max(0, FUSE_DURATION - (Date.now() - started)))
		}).error(error => {
			fusing.value = false
			altering.value = false
			const message = forgeErrorMessage(error)
			if (message) LeekWars.toast(message)
		})
	}

	/**
	 * Libelle d'une erreur de forge (alteration, recyclage, fabrication) : chaque code du
	 * serveur a sa traduction, le code brut ne sort qu'en dernier recours. Null pour
	 * too_many_requests, deja signale par la couche requete.
	 */
	function forgeErrorMessage(error: ApiError): string | null {
		const code = error?.error
		switch (code) {
			case 'too_many_requests': return null
			case 'duplicate_exception_stat': return t('main.error_duplicate_exception_stat', [t('characteristic.' + (error as { carac?: string }).carac)])
			case 'well_overflow': return t('main.error_well_overflow')
			case 'component_changed': return t('main.error_component_changed')
			case 'item_changed': return t('main.error_item_changed')
			case 'indivisible_wrong_family': return t('main.alteration_wrong_family')
			case 'not_enough_alterations': return t('main.alteration_not_enough')
			case 'too_many_alterations': return t('main.alteration_too_many', [maxItems.value])
			case 'not_enough_habs': return t('market.error_not_enough_habs')
			case 'craft_failed': return t('main.error_craft_failed')
			default: return t('main.error_x', [code])
		}
	}

	/** Nombre d'alterations posees, quantites comprises. */
	const alterationCount = computed(() => forge.value.reduce((n, slot) => n + (slot ? slot[1] : 0), 0))
	const maxItems = computed(() => LeekWars.alterations?.max_items ?? 8)

	// Vraie probabilite (gate du metabolisme inclus), recuperee par XHR debounce a chaque
	// changement de recette. Le metabolisme reste cache : seul le serveur applique le gate,
	// et le rate-limit global (releve en LW+) freine sa reconstruction par sondage (#622).
	// Pendant le calcul serveur on montre un loader, pas la proba locale (qui serait le
	// plafond, trompeur). Le token ignore les reponses obsoletes (recette changee).
	interface ServerPreview { rolls: { [carac: string]: { points: number } }, probability: number, break_probability: number, fits: boolean }
	const serverPreview = ref<ServerPreview | null>(null)
	const loadingPreview = ref(false)
	let previewTimer: ReturnType<typeof setTimeout> | undefined
	let previewToken = 0
	watch(() => (component.value && alterationCount.value > 0) ? JSON.stringify(recipe.value) : null, (key) => {
		clearTimeout(previewTimer)
		const token = ++previewToken
		serverPreview.value = null
		const item = component.value
		if (!key || !item) { loadingPreview.value = false; return }
		loadingPreview.value = true
		previewTimer = setTimeout(() => {
			LeekWars.post<ServerPreview>('component/alteration-preview', { component_id: item.id, alterations: key })
				.then(data => { if (token === previewToken) { serverPreview.value = data; loadingPreview.value = false } })
				.catch(() => { if (token === previewToken) loadingPreview.value = false })
		}, 300)
	})
	/** Proba UNIQUE de la tentative : la vraie (serveur) si connue, sinon la base locale. */
	const previewProbability = computed(() => serverPreview.value?.probability ?? plan.value?.probability ?? 0)
	// Le risque affiché est celui de la fusion entière : la casse n'etant tiree qu'apres
	// un echec, c'est (1 - reussite) x P(casse), que le serveur renvoie deja calculé (#622).
	const previewBreak = computed(() => serverPreview.value?.break_probability ?? plan.value?.breakRisk ?? 0)

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

	/** Numero de dosage publie de l'alteration posee dans cette case. */
	function slotNumber(slot: ForgeSlot | null): number | null {
		const data = LeekWars.alterations
		if (!data || !slot) return null
		for (const id in data.alterations) {
			if (data.alterations[id].template === slot[0]) return data.alterations[id].number
		}
		return null
	}

	/** Caracteristique visee par l'alteration posee dans cette case, pour teinter ses particules. */
	function slotCarac(slot: ForgeSlot | null): string {
		const data = LeekWars.alterations
		if (!data || !slot) return ''
		for (const id in data.alterations) {
			if (data.alterations[id].template === slot[0]) return data.alterations[id].carac
		}
		return ''
	}

	/**
	 * Flux de particules, case par case. Il est rendu dans une couche AU-DESSUS de la
	 * cellule centrale : posees dans leur case, les particules passaient derriere le
	 * composant et la moitie du trajet disparaissait (#622).
	 */
	const PARTICLES_PER_SLOT = 6
	/**
	 * Bruit deterministe 0..1. Deux particules voisines tirent des valeurs differentes,
	 * mais une meme particule retire toujours la meme : avec Math.random le flux se
	 * re-tirerait a chaque recalcul de la forge et sauterait sous les yeux du joueur.
	 */
	function noise(seed: number): number {
		const x = Math.sin(seed * 127.1) * 43758.5453
		return x - Math.floor(x)
	}
	/**
	 * Le flux coule-t-il ? Rien ne coule vers une piece qui ne peut pas prendre : il
	 * promet une alteration en cours, il serait mensonger sur une tentative impossible
	 * (#622). Et tant que le serveur calcule, on ne SAIT pas : la proba locale n'est qu'un
	 * plafond que le gate du metabolisme peut ramener a zero.
	 *
	 * Les particules restent montees dans les deux cas, c'est l'opacite de leur couche qui
	 * suit ce booleen : elles volent deja quand le flux s'allume (leur delai d'animation
	 * est negatif), donc les monter d'un coup se voyait comme un a-coup (retour de Pierre).
	 */
	const flowing = computed(() => !loadingPreview.value && previewProbability.value > 0)

	const particles = computed(() => {
		const out: { key: string, carac: string, left: number, top: number, size: number,
			sx: number, sy: number, q1x: number, q1y: number, mx: number, my: number,
			q3x: number, q3y: number, dx: number, dy: number,
			duration: number, delay: number }[] = []
		if (!component.value || fusing.value) return out
		forge.value.forEach((slot, i) => {
			// Meme garde que cellVars : une recette peut deborder de la grille.
			const center = CELL_CENTERS[i]
			const vec = CELL_VECTORS[i]
			if (!slot || !center || !vec) return
			const carac = slotCarac(slot)
			for (let p = 0; p < PARTICLES_PER_SLOT; p++) {
				const seed = i * 37 + p * 101
				// Depart disperse autour du centre de la case, arrivee legerement dispersee
				// sur le composant : sans cela toutes suivent la meme droite.
				const sx = (noise(seed) - 0.5) * 13
				const sy = (noise(seed + 1) - 0.5) * 13
				const dx = vec[0] + (noise(seed + 2) - 0.5) * 9
				const dy = vec[1] + (noise(seed + 3) - 0.5) * 9
				// Point milieu decale perpendiculairement : la trajectoire s'incurve d'un
				// cote ou de l'autre selon le tirage.
				// Courbe de Bezier quadratique : point de controle decale perpendiculairement.
				// Le decalage au milieu vaut la moitie de celui du controle, d'ou le x2.
				// On echantillonne a 1/4, 1/2 et 3/4 : avec un seul point milieu la
				// trajectoire ferait deux segments droits et un coude bien visible.
				const len = Math.hypot(dx - sx, dy - sy) || 1
				const curve = (noise(seed + 4) - 0.5) * 30
				const cx = sx + (dx - sx) * 0.5 - ((dy - sy) / len) * curve * 2
				const cy = sy + (dy - sy) * 0.5 + ((dx - sx) / len) * curve * 2
				const bez = (t: number, a: number, c: number, b: number) =>
					(1 - t) * (1 - t) * a + 2 * (1 - t) * t * c + t * t * b
				const q1x = bez(0.25, sx, cx, dx), q1y = bez(0.25, sy, cy, dy)
				const mx = bez(0.5, sx, cx, dx), my = bez(0.5, sy, cy, dy)
				const q3x = bez(0.75, sx, cx, dx), q3y = bez(0.75, sy, cy, dy)
				const duration = 0.85 + noise(seed + 5) * 1.05
				out.push({ key: i + '-' + p, carac,
					left: center[0], top: center[1],
					size: 4 + noise(seed + 6) * 4.5,
					sx, sy, q1x, q1y, mx, my, q3x, q3y, dx, dy,
					// Delai negatif : chaque particule demarre deja en cours de vol, sinon
					// elles partent toutes ensemble a la pose.
					duration, delay: noise(seed + 7) * duration })
			}
		})
		return out
	})

	// La palette d'alterations et la colonne de stats lisent la piece posee : on publie sa
	// famille, son niveau, son template et ses stats des qu'elle change (les stats bougent
	// aussi apres une tentative reussie, d'ou le suivi de component.stats) (#622).
	//
	// A defaut de piece posee, on publie la piece VISEE par le schema de fabrication : la
	// colonne de stats montre ainsi ce qu'on est en train de fabriquer, et existe donc
	// dans les trois onglets (#622).
	watch([component, () => component.value?.stats, result], () => {
		const c = component.value
		const template = c ? c.template : result.value
		const tpl = template ? LeekWars.items[template] : null
		forgeComponent.value = (tpl && tpl.type === ItemType.COMPONENT)
			? { component: Number(tpl.params), level: Number(tpl.level), template: template as number, stats: c?.stats ?? null }
			: null
	}, { immediate: true })

	// Ce que la recette en cours AJOUTE a la charge, projete par planAttempt (et non sa
	// puissance brute) : reboucher un deficit creuse par la casse ne rend que
	// DEFICIT_REFUND de sa puissance, l'addition lineaire annoncait 136 pour 103
	// reellement livres (remontee d'un coeur perdu, #622).
	watch(() => plan.value ? Math.round(plan.value.ratioAfter * plan.value.capacity) - Math.round(plan.value.ratioBefore * plan.value.capacity) : 0,
		delta => { forgePendingPower.value = delta }, { immediate: true })
	// Charge deja investie : la palette s'en sert pour griser ce qui ne rentre plus (#622).
	watch(() => plan.value ? plan.value.ratioBefore * plan.value.capacity : 0,
		charge => { forgeCharge.value = charge }, { immediate: true })

	// Aperçu de la tentative, publie pour la colonne des caracteristiques, qui l'affiche
	// sous les stats de la piece (demande de Pierre).
	watchEffect(() => {
		const p = plan.value
		forgePreview.value = (component.value && p && alterationCount.value > 0)
			? { dose: dose.value, rolls: p.rolls, probability: previewProbability.value,
				loading: loadingPreview.value, breakRisk: previewBreak.value, habsCost: p.habsCost }
			: null
	})

	onBeforeUnmount(() => {
		forgeComponent.value = null
		forgePendingPower.value = 0
		forgeCharge.value = 0
		forgePreview.value = null
	})

	/** Pose une alteration autour du composant, ou incremente sa pile. */
	function addAlteration(item: InventoryItem) {
		if (!component.value) {
			LeekWars.toast(t('main.alteration_needs_component'))
			return
		}
		// Une indivisible (PT, PM, coeurs, memoire) hors de sa famille ne peut rien poser :
		// l'API refuse la recette entiere. La palette la grise deja, mais elle peut aussi
		// arriver par l'inventaire, donc le refus est ici, sur le seul chemin d'ajout (#622).
		const data = LeekWars.alterations
		const comp = forgeComponent.value
		const alteration = data && Object.values(data.alterations).find(a => a.template === item.template)
		if (data && comp && alteration && isIndivisibleWrongFamily(data, alteration, componentFamily(data, comp.component))) {
			LeekWars.toast(t('main.alteration_wrong_family'))
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
		if (!lastForge.value || !component.value) return
		clearIngredients()
		// Case par case, dans l'agencement exact de la derniere tentative : c'est ce que
		// le joueur veut rejouer, et le dosage total en depend (#622).
		const posed: { [template: number]: number } = {}
		lastForge.value.forEach((slot, index) => {
			if (!slot) return
			const [template, wanted] = slot
			const owned = store.state.farmer?.alterations?.find(a => a.template === template)
			// On ne repose que ce qu'il reste en stock, le compte tenant sur toutes les cases
			// puisqu'une meme alteration peut en occuper plusieurs.
			const left = (owned ? owned.quantity : 0) - (posed[template] ?? 0)
			const quantity = Math.min(wanted, Math.max(0, left))
			if (quantity <= 0) return
			forge.value[index] = [template, quantity]
			posed[template] = (posed[template] ?? 0) + quantity
		})
	}

	/**
	 * Repose la recette d'une tentative de l'historique, donnee par ids d'alteration
	 * (demande de Pierre) : l'historique est ce qu'on relit pour retrouver un dosage, et
	 * le rejouer se faisait jusqu'ici alteration par alteration.
	 *
	 * Meme discipline que « Recommencer » : on ne repose que ce qui reste en stock, et
	 * jamais plus que la grille n'accepte. Une case par alteration, avec sa quantite,
	 * comme le fait la pose au clic.
	 */
	function onReplayRecipe(payload: { recipe: AlterationRecipe, item: number | null }) {
		const { recipe } = payload
		// Forge vide : on y repose la piece de la tentative, pour que le clic suffise
		// (demande de Pierre). Elle peut avoir disparu depuis — recyclee, vendue, ou
		// detachee sous un autre id — auquel cas il n'y a rien a poser.
		if (!component.value && payload.item !== null) {
			const stored = store.state.farmer?.components?.find(c => c.id === payload.item)
			if (stored) component.value = stored as InventoryItem
		}
		if (!component.value) {
			LeekWars.toast(t('main.alteration_needs_component'))
			return
		}
		const data = LeekWars.alterations
		if (!data) return
		// Rejouer porte sur une seule piece : un empilement de destruction se defait.
		componentCount.value = 1
		clearIngredients()
		let posed = 0
		for (const id in recipe) {
			const alteration = data.alterations[id]
			if (!alteration) continue
			const free = forge.value.indexOf(null)
			if (free === -1) break
			const owned = store.state.farmer?.alterations?.find(a => a.template === alteration.template)
			const quantity = Math.min(recipe[id], owned ? owned.quantity : 0, maxItems.value - posed)
			if (quantity <= 0) continue
			forge.value[free] = [alteration.template, quantity]
			posed += quantity
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

	/**
	 * Derniere destruction, pour la rejouer d'un clic : la forge se vide apres le
	 * recyclage, et il fallait sinon retourner chercher la meme piece dans l'inventaire
	 * (demande de Pierre). Pendant du bouton de recraft de l'onglet Fabriquer.
	 */
	const lastDestroy = ref<{ template: number, count: number } | null>(null)
	/**
	 * La piece a reposer pour recommencer : la MEME s'il en reste. Une pile neuve
	 * d'abord, c'est ce que le joueur vient de detruire ; a defaut n'importe quel
	 * exemplaire. Rien s'il n'en a plus : le bouton disparait alors tout seul.
	 */
	const repeatDestroyItem = computed(() => {
		const last = lastDestroy.value
		if (!last) return null
		const components = store.state.farmer?.components as InventoryItem[] | undefined
		if (!components) return null
		return components.find(c => c.template === last.template && c.stats == null && c.quantity > 0)
			?? components.find(c => c.template === last.template && c.quantity > 0)
			?? null
	})
	function repeatDestroy() {
		const item = repeatDestroyItem.value
		const last = lastDestroy.value
		if (!item || !last) return
		clear()
		component.value = item
		// Le meme nombre que la fois d'avant, plafonne a ce qu'il reste.
		componentCount.value = Math.min(last.count, item.quantity)
	}

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
			// Par id : la piece recyclee peut etre une instance alteree qui cohabite avec la
			// pile de ses jumelles neuves (#622).
			store.commit('remove-inventory', { type: ItemType.COMPONENT, id: item.id, item_template: item.template, quantity: destroyed })
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
			// Pas de toast pour le compte : le butin qui s'envole vers l'historique le
			// montre deja. On ne parle que du cas ou la piece n'a rien rendu (#622).
			if (data.count === 0) LeekWars.toast(t('main.destroy_nothing'))
			// L'historique des destructions montre le resultat aussitot (#622). On bascule
			// d'abord : le vol du butin a besoin que l'historique existe pour viser.
			emitter.emit('workshop-action', 3)
			// 1. Le composant vole en eclats.
			shattering.value = true
			// 2. Le butin jaillit avec l'explosion, des que les parts se separent.
			window.setTimeout(() => launchLoot(data.alterations, data.resources), LOOT_DELAY)
			// 3. La forge se vide une fois les parts dispersees.
			window.setTimeout(() => {
				shattering.value = false
				clear()
				destroying.value = false
				// Apres clear(), qui remet la forge a zero : c'est ce souvenir qui fait
				// apparaitre « Recommencer » a la place du bouton Detruire.
				lastDestroy.value = { template: item.template, count: destroyed }
			}, SHATTER_DURATION)
		}).error(error => {
			destroying.value = false
			const message = forgeErrorMessage(error)
			if (message) LeekWars.toast(message)
		})
	}

	/**
	 * Envoie le butin de la forge vers l'historique, un objet apres l'autre. Le vol
	 * traverse deux composants, d'où un calque fixe teleporte dans le body : on mesure
	 * la forge et l'historique a l'ecran au moment du depart (#622).
	 */
	function launchLoot(altis: {[id: number]: number}, resources: {[id: number]: number}) {
		const grid = gridEl.value
		if (!grid) return
		const g = grid.getBoundingClientRect()
		const startX = g.left + g.width / 2
		const startY = g.top + g.height / 2
		// Cible : le haut de l'historique, ou a defaut un point sur sa droite.
		const historyEl = document.querySelector('.item-history')
		let targetX = startX + 320
		let targetY = startY
		if (historyEl) {
			const h = historyEl.getBoundingClientRect()
			targetX = h.left + Math.min(90, h.width / 2)
			targetY = h.top + 46
		}
		const data = LeekWars.alterations
		const list: Flyer[] = []
		for (const id in altis) {
			const alteration = data ? data.alterations[id] : null
			if (!alteration) continue
			list.push({ key: 'a' + id, src: '/image/alteration/' + alteration.name + '.png',
				x: startX, y: startY, tx: targetX - startX, ty: targetY - startY, delay: 0 })
		}
		for (const id in resources) {
			const tpl = LeekWars.items[Number(id)]
			if (!tpl) continue
			list.push({ key: 'r' + id, src: '/image/resource/' + tpl.name + '.png',
				x: startX, y: startY, tx: targetX - startX, ty: targetY - startY, delay: 0 })
		}
		list.forEach((f, i) => { f.delay = i * 0.07 })
		flyers.value = list
		clearTimeout(flyersTimer)
		flyersTimer = window.setTimeout(() => { flyers.value = [] }, 700 + list.length * 70)
	}

	onBeforeUnmount(() => {
		// off ciblé : sans le handler, mitt retirerait aussi les écouteurs des autres
		// composants (le scrollToForge de la page inventaire)
		emitter.off('craft', onCraft)
		emitter.off('alter', onAlter)
		emitter.off('add-alteration', addAlteration)
		emitter.off('replay-recipe', onReplayRecipe)
		emitter.off('workshop-mode', onWorkshopMode)
	})

	function craft() {
		if (!scheme.value || building.value || impossible.value) return
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
		const token = craftToken
		const count = craftBatch.value
		building.value = true
		const animation = new Promise(resolve => setTimeout(resolve, 500))
		// Forme à deux arguments : une exception du handler de succès ne doit pas être
		// prise pour un refus du serveur (le craft a alors bien eu lieu).
		const outcome = LeekWars.post<{ id: number, template: number, time: number, crafted?: number }>('item/craft', { scheme_id: s.id, count }).then(item => {
			const template = LeekWars.items[item.template]
			// Le lot REELLEMENT fabrique vient du serveur : c'est lui qui borne le paquet,
			// et l'inventaire doit bouger de ce qu'il a consomme, pas de ce qu'on a demande.
			const made = item.crafted ?? 1
			store.commit('add-inventory', { type: template.type, id: item.id, template: item.template, time: item.time, quantity: s.quantity * made })
			// On retient la piece fabriquee pour la reposer dans la forge si le joueur passe
			// a Ameliorer ou Detruire. L'objet du store est prefere a une copie : la forge
			// ecrit dessus (stats, altered_power) apres une fusion (#622).
			if (template.type === ItemType.COMPONENT) {
				const stored = store.state.farmer?.components?.find(c => c.id === item.id)
				crafted.value = (stored as InventoryItem | undefined)
					?? { id: item.id, template: item.template, quantity: 1, time: item.time }
			}
			for (const ingredient of s.items) {
				if (ingredient === null) continue;
				if (ingredient[0] === 148) { // hab
					store.commit('update-habs', -ingredient[1] * made)
				} else {
					const it = LeekWars.items[ingredient[0]]
					store.commit('remove-inventory', { type: it.type, item_template: ingredient[0], quantity: ingredient[1] * made })
				}
			}
			// L'historique des fabrications montre le craft aussitot (#622).
			emitter.emit('workshop-action', 1)
			return true
		}, error => {
			const code = (error as ApiError).error
			const insufficient = code === 'not_enough_habs' || code === 'no_such_item_or_not_enough_quantity'
			const message = insufficient ? t('main.error_craft_not_enough_resources') : forgeErrorMessage(error as ApiError)
			if (message) LeekWars.toast(message)
			return false
		})
		Promise.all([outcome, animation]).then(([success]) => {
			// La forge a pu être vidée ou re-remplie entre-temps (clear() a déjà remis l'état)
			if (token !== craftToken) return
			building.value = false
			if (success) {
				clearIngredients()
				built.value = true
			}
		})
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
		// Bouts francs et angles vifs : la jauge est carree comme la vignette qu'elle
		// entoure, un bout arrondi trahissait encore l'ancien anneau.
		stroke-linecap: butt;
		// L'arc capte le survol (le reste du SVG reste transparent aux clics) pour
		// afficher le tooltip charge / capacite (#622).
		pointer-events: stroke;
		cursor: help;
		// Remplissage visiblement anime quand on pose ou retire une alteration (#622).
		transition: stroke-dashoffset 0.5s cubic-bezier(0.22, 1, 0.36, 1);
		// Le trace part deja du milieu du haut et tourne dans le sens horaire : pas de
		// rotation a appliquer, contrairement a un cercle (sinon le depart se decale
		// sur un coin et l'arc semble detache).
		// Angles vifs : la jauge est carree comme la vignette qu'elle entoure.
		stroke-linejoin: miter;
	}
	// Charge negative : meme depart en haut, mais l'arc tourne dans le sens ANTI-horaire,
	// pour qu'un trou se lise comme l'exact inverse d'un gain (#622). Le miroir est pose
	// sur CHAQUE trace et non sur le svg : apres une casse, la charge actuelle peut etre
	// negative pendant que la tentative en cours vise du positif, les deux arcs partent
	// alors du haut dans des sens opposes.
	.fill.reverse {
		transform-box: fill-box;
		transform-origin: center;
		transform: scaleX(-1);
	}
	// Couleur du palier, comme la silhouette de la vignette.
	// Palier 0 : charge negative, la piece a ete creusee sous ses stats de base (#622).
	.fill.tier-0 { stroke: #7d5a5a; }
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
	color: var(--white);
	// Liseré sombre : lisible sur n'importe quelle teinte d'image et dans les deux thèmes.
	text-shadow: 0 0 2px #000, 0 0 2px #000, 0 1px 1px #000;
	pointer-events: none;
}
// Au-dela de 100 % du puits : rouge vif, on tente un depassement (#622).
.cell8.component .charge-corner.over { color: #ff5252; }
// Charge negative : la casse a creuse la piece sous ses stats de base (#622).
.cell8.component .charge-corner.deficit { color: #e0a0a0; }
// Compteur d'empilement pour le recyclage groupe (#622) : pastille sombre, coin bas droit.
.cell8.component .stack-count {
	position: absolute;
	right: 2px;
	bottom: 2px;
	z-index: 3;
	background: #000000b3;
	color: var(--white);
	font-size: 14px;
	font-weight: bold;
	padding: 0 5px;
	border-radius: var(--radius);
	pointer-events: none;
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
// Detruire et Alterer sont les deux actions engageantes : fond plein, rouge et vert,
// pour qu'elles se distinguent des boutons neutres (#622).
.corner-btn.recycle.v-btn {
	background-color: #c62828 !important;
	border-color: #9e1f1f;
}
.corner-btn.fuse-btn.v-btn {
	background-color: var(--primary-surface) !important;
	border-color: #4a8714;
	.fuse-icon {
		color: var(--primary-surface-text);
	}
}
.corner-btn.fuse-btn.v-btn.v-btn--disabled {
	background-color: var(--background-disabled) !important;
	border-color: var(--border);
}
// Recommencer : MEME emplacement que Fusionner (coin bas droit), les deux boutons etant
// mutuellement exclusifs (recommencer n'apparait qu'a zero alteration posee, fusionner
// qu'a partir d'une). Le geste est ainsi toujours le meme, au meme endroit (#622).
.redo { right: -4px; bottom: -4px; }
// Effacer : coin HAUT droit, aligne sur les autres (etait a -5px, decale).
.clear { right: -4px; top: -4px; }
// Vider les alterations : coin HAUT gauche, en miroir de la croix — les deux nettoient,
// l'une la recette seule, l'autre la forge entiere.
.sweep { left: -4px; top: -4px; }
// Recyclage : coin BAS DROIT, la ou tombe naturellement la main droite, et ou se trouve
// Alterer dans l'onglet d'a cote : l'action engageante est toujours au meme endroit.
.recycle { right: -4px; bottom: -4px; }
// Alterer : coin BAS droit, la ou tombe naturellement la main droite.
.fuse-btn { right: -4px; bottom: -4px; }
// Recommencer une destruction : meme coin que Detruire, qu'il remplace une fois la
// piece partie en eclats — les deux ne coexistent jamais.
.redo-destroy { right: -4px; bottom: -4px; }
// Taille du lot : coin BAS gauche, libere par le recyclage.
.batch { left: -4px; bottom: -4px; }
// Le libelle (×1 / ×10) tient dans la meme pastille ronde que les icones des autres
// boutons d'angle : ×10 est le plus large, il fixe la taille.
.batch-label {
	font-size: 13px;
	font-weight: bold;
	line-height: 1;
	color: var(--text-color);
}
.cell8.component .item img {
	max-width: 100%;
	max-height: 100%;
}

.forge {
	display: flex;
	// La grille seule, centree verticalement par .forge-wrapper : les cartes de la
	// tentative sont passees sous les stats, la forge ne change donc plus de hauteur.
	flex-direction: column;
	align-items: center;
	width: 260px;
	height: auto;
	flex-shrink: 0;
	// Plus d'air en haut et en bas qu'a la marge normale de 10 px : la grille ne colle
	// plus a la barre d'onglets, et les boutons d'angle (qui debordent de 4 px) ne
	// touchent plus le bord du panneau (demande de Pierre).
	padding: 24px 10px;
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
		border-radius: var(--radius-tiny);
		transition: all 0.3s ease;
		background: var(--background-secondary);
		position: absolute;
		padding: 0;
		&.active {
			background: var(--pure-white);
			box-shadow: var(--elevation-1);
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
		border-radius: var(--radius-pill);
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
			box-shadow: var(--elevation-1);
			&.disabled {
				color: var(--text-color-secondary);
				background: var(--background-disabled);
			}
		}
		& :deep(.v-ripple__container) {
			border-radius: var(--radius-pill);
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
			border-radius: var(--radius);
			color: var(--white);
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
// --- Animations de la forge (#622) ---
//
// Le rebond d'arrivee porte sur l'IMAGE (clef = id du composant) et non sur .item :
// ainsi il ne rejoue pas quand la classe d'issue est retiree du parent.
.cell8.component .item img {
	animation: item-animation 0.4s ease 1;
}

// Couche de particules AU-DESSUS des cases (cell8 est en z-index 2) : sinon le flux
// disparait derriere le composant sur la moitie de son trajet.
.particles {
	position: absolute;
	inset: 0;
	pointer-events: none;
	z-index: 3;
	// Le flux s'ouvre et se coupe en fondu, il n'apparait pas d'un bloc : les particules
	// sont deja en vol quand la couche s'allume (retour de Pierre).
	opacity: 0;
	transition: opacity 0.35s ease;
	&.flowing { opacity: 1; }
}
// Particules teintees par la carac, du centre de leur case vers le composant.
// left/top viennent du style inline ; --dx/--dy portent le trajet restant.
// Trajectoire en trois points : depart disperse, milieu decale sur le cote, arrivee
// sur le composant. Taille, vitesse et courbure viennent du style inline (#622).
@keyframes particle-flow {
	0%   { transform: translate(var(--sx), var(--sy)) scale(0.45); opacity: 0; }
	12%  { opacity: 1; }
	25%  { transform: translate(var(--q1x), var(--q1y)) scale(0.85); }
	50%  { transform: translate(var(--mx), var(--my)) scale(1); }
	75%  { transform: translate(var(--q3x), var(--q3y)) scale(0.8); }
	82%  { opacity: 1; }
	100% { transform: translate(var(--dx), var(--dy)) scale(0.3); opacity: 0; }
}
.particle {
	position: absolute;
	border-radius: 50%;
	background: currentColor;
	box-shadow: 0 0 8px currentColor, 0 0 3px currentColor, 0 0 1px #fff;
	opacity: 0;
	animation-name: particle-flow;
	animation-timing-function: linear;
	animation-iteration-count: infinite;
}

// Fusion : les alterations filent vers le composant et s'y resorbent.
// Le selecteur doit battre `.forge .cell:not(.cell8) .item` (rebond de pose), qui est
// imbrique sous .forge et donc plus specifique qu'un `.cell.fusing .item` nu.
@keyframes fuse-travel {
	0%   { transform: translate(0, 0) scale(1); opacity: 1; }
	65%  { opacity: 1; }
	100% { transform: translate(var(--dx), var(--dy)) scale(0.25); opacity: 0; }
}
.forge .grid .cell.fusing .item {
	animation: fuse-travel 0.24s cubic-bezier(0.55, 0, 0.9, 0.45) forwards;
}

// Issue de la tentative, jouee sur le composant central.
@keyframes outcome-success {
	0%   { transform: scale(1); filter: none; }
	35%  { transform: scale(1.22); filter: brightness(1.5) drop-shadow(0 0 12px var(--primary)); }
	70%  { transform: scale(0.98); }
	100% { transform: scale(1); filter: none; }
}
@keyframes outcome-fail {
	0%, 100% { transform: translateX(0); }
	15% { transform: translateX(-7px); }
	30% { transform: translateX(6px); }
	45% { transform: translateX(-5px); }
	60% { transform: translateX(4px); }
	80% { transform: translateX(-2px); }
}
// Casse : on secoue plus fort et la piece se desature, elle a perdu quelque chose.
@keyframes outcome-broken {
	0%   { transform: translateX(0) scale(1); filter: none; }
	10%  { transform: translateX(-9px) scale(1.06); filter: drop-shadow(0 0 10px #c62828); }
	25%  { transform: translateX(9px) scale(0.92); filter: drop-shadow(0 0 10px #c62828) saturate(0.4); }
	40%  { transform: translateX(-7px) scale(1.02); filter: saturate(0.4); }
	60%  { transform: translateX(5px) scale(0.96); filter: saturate(0.25) brightness(0.85); }
	80%  { transform: translateX(-3px) scale(1); filter: saturate(0.6); }
	100% { transform: translateX(0) scale(1); filter: none; }
}
.cell8.outcome-success .item { animation: outcome-success 0.9s ease-out; }
.cell8.outcome-fail .item { animation: outcome-fail 0.6s ease-in-out; }
.cell8.outcome-broken .item { animation: outcome-broken 1.1s ease-in-out; }

// Halo colore derriere le composant, selon l'issue.
@keyframes outcome-halo {
	0%   { opacity: 0; transform: scale(0.75); }
	30%  { opacity: 0.8; }
	100% { opacity: 0; transform: scale(1.45); }
}
.cell8.component::after {
	content: '';
	position: absolute;
	inset: -12px;
	border-radius: var(--radius-pill);
	pointer-events: none;
	opacity: 0;
	z-index: 0;
}
.cell8.outcome-success::after { background: radial-gradient(circle, #5fad1b99, transparent 70%); animation: outcome-halo 0.9s ease-out; }
.cell8.outcome-fail::after { background: radial-gradient(circle, #c6282866, transparent 70%); animation: outcome-halo 0.6s ease-out; }
.cell8.outcome-broken::after { background: radial-gradient(circle, #c62828aa, transparent 70%); animation: outcome-halo 1.1s ease-out; }

// --- Destruction : le composant vole en 8 parts (#622) ---
// Les parts se superposent exactement a l'image d'origine, qu'on masque le temps de
// l'eclatement pour que la decoupe paraisse continue.
.forge .grid .cell8.shattering .item { visibility: hidden; }
.shatter {
	position: absolute;
	inset: 0;
	pointer-events: none;
	z-index: 4;
}
.shatter img {
	position: absolute;
	inset: 0;
	width: 100%;
	height: 100%;
	object-fit: contain;
	animation: shard-fly 0.62s cubic-bezier(0.2, 0.6, 0.35, 1) forwards;
}
// Les parts enflent a mi-course puis reviennent a leur taille normale en s'effacant :
// l'explosion respire au lieu de simplement retrecir (#622).
@keyframes shard-fly {
	0%   { transform: translate(0, 0) rotate(0) scale(1); opacity: 1; }
	45%  { transform: translate(calc(var(--tx) * 0.45), calc(var(--ty) * 0.45)) rotate(calc(var(--rot) * 0.35)) scale(1.4); opacity: 1; }
	100% { transform: translate(var(--tx), var(--ty)) rotate(var(--rot)) scale(1); opacity: 0; }
}

// Butin qui rejoint l'historique, piece par piece.
.loot-flight {
	position: fixed;
	inset: 0;
	pointer-events: none;
	z-index: 9999;
}
.loot {
	position: fixed;
	width: 34px;
	height: 34px;
	margin: -17px 0 0 -17px;
	object-fit: contain;
	opacity: 0;
	filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.35));
	animation: loot-fly 0.62s cubic-bezier(0.35, 0, 0.35, 1) forwards;
}
// Petit saut vers le haut au depart : le vol se lit mieux qu'une ligne droite.
@keyframes loot-fly {
	0%   { transform: translate(0, 0) scale(0.5); opacity: 0; }
	18%  { transform: translate(calc(var(--tx) * 0.08), -26px) scale(1.15); opacity: 1; }
	80%  { opacity: 1; }
	100% { transform: translate(var(--tx), var(--ty)) scale(0.55); opacity: 0; }
}

// Numero de dosage sur une alteration posee : meme repere qu'en palette, coin haut
// gauche, le coin bas droit restant a la quantite (#622).
.forge .grid .cell .item .alt-number {
	position: absolute;
	top: 6%;
	left: 10%;
	// Un peu plus petit : les dosages en chiffres romains (jusqu'a LVIII) sont plus
	// larges que les chiffres arabes et deborderaient du badge (#622).
	font-size: 9px;
	font-weight: bold;
	color: var(--white);
	text-shadow: 0 0 2px #000, 0 0 2px #000, 0 1px 1px #000;
	pointer-events: none;
	z-index: 2;
}
</style>