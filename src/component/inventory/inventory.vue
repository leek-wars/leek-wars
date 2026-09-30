<template>
	<panel :icon="LeekWars.mobile ? '' : 'mdi-treasure-chest'" class="inventory-panel">
		<template #title>
			<div><span v-if="!LeekWars.mobile">{{ $t('main.inventory') }}</span> ({{ filtered_inventory.length }}<span v-if="filter !== ItemType.ALL || query"> / {{ inventory.length }}</span>)</div>
			<div class="categories">

			</div>
		</template>
		<template #actions>
			<span class="value" title="Valeur totale">{{ $filters.number(total_estimated) }} <div class="hab"></div></span>
			<div class="search" :class="{ active: search }">
				<v-icon class="search-icon" @click="searchInput?.focus()">mdi-magnify</v-icon>
				<input ref="searchInput" v-model="search" type="text" :placeholder="$t('main.search')" :aria-label="$t('main.search')" autocomplete="off" spellcheck="false" @keyup.stop @keydown.esc="search = ''">
				<v-icon v-if="search" class="clear" @click="search = ''">mdi-close</v-icon>
			</div>
			<v-menu offset-y>
				<template #activator="{ props }">
					<div class="button flat" v-bind="props">
						<v-icon>mdi-sort</v-icon>
					</div>
				</template>
				<v-list dense class="menu-actions">
					<v-list-item v-ripple @click="sort = Sort.DATE">
						<span>{{ $t('date') }}</span>
						<v-icon v-if="sort === Sort.DATE">mdi-check</v-icon>
					</v-list-item>
					<v-list-item v-ripple @click="sort = Sort.PRICE">
						<span>{{ $t('price') }}</span>
						<v-icon v-if="sort === Sort.PRICE">mdi-check</v-icon>
					</v-list-item>
					<v-list-item v-ripple @click="sort = Sort.PRICE_LOT">
						<span>{{ $t('price_lot') }}</span>
						<v-icon v-if="sort === Sort.PRICE_LOT">mdi-check</v-icon>
					</v-list-item>
					<v-list-item v-ripple @click="sort = Sort.QUANTITY">
						<span>{{ $t('quantity') }}</span>
						<v-icon v-if="sort === Sort.QUANTITY">mdi-check</v-icon>
					</v-list-item>
					<!-- <v-list-item v-ripple @click="sort = Sort.NAME">
						<span>{{ $t('name') }}</span>
						<v-icon v-if="sort === Sort.NAME">mdi-check</v-icon>
					</v-list-item> -->
					<v-list-item v-ripple @click="sort = Sort.LEVEL">
						<span>{{ $t('level') }}</span>
						<v-icon v-if="sort === Sort.LEVEL">mdi-check</v-icon>
					</v-list-item>
					<v-list-item v-ripple @click="sort = Sort.RARITY">
						<span>{{ $t('rarity') }}</span>
						<v-icon v-if="sort === Sort.RARITY">mdi-check</v-icon>
					</v-list-item>
					<v-list-item v-ripple @click="sort = Sort.CHARGE">
						<span>{{ $t('charge') }}</span>
						<v-icon v-if="sort === Sort.CHARGE">mdi-check</v-icon>
					</v-list-item>
				</v-list>
			</v-menu>
			<v-menu offset-y>
				<template #activator="{ props }">
					<div class="button flat" v-bind="props">
						<v-badge v-if="filter !== ItemType.ALL" content="1" color="#5fad1b" floating>
							<v-icon>mdi-filter-outline</v-icon>
						</v-badge>
						<v-icon v-else>mdi-filter-outline</v-icon>
					</div>
				</template>
				<v-list dense class="menu-actions">
					<v-list-item v-for="t in ItemTypes" :key="t" v-ripple @click="filter = t">
						<v-icon>{{ ITEM_TYPE_ICONS[t] }}</v-icon>
						<span>{{ $t('main.' + ITEM_TYPE_NAME[t]) }}</span>
						<v-icon v-if="t === filter">mdi-check</v-icon>
					</v-list-item>
				</v-list>
			</v-menu>
			<v-menu offset-y>
				<template #activator="{ props }">
					<div class="button flat" v-bind="props">
						<v-badge v-if="group !== Group.NONE" content="1" color="#5fad1b" floating>
							<v-icon>mdi-format-list-group</v-icon>
						</v-badge>
						<v-icon v-else>mdi-format-list-group</v-icon>
					</div>
				</template>
				<v-list dense class="menu-actions">
					<v-list-item v-ripple @click="group = Group.NONE">
						<span>{{ $t('no_group') }}</span>
						<v-icon v-if="group === Group.NONE">mdi-check</v-icon>
					</v-list-item>
					<v-list-item v-ripple @click="group = Group.TYPE">
						<span>{{ $t('type') }}</span>
						<v-icon v-if="group === Group.TYPE">mdi-check</v-icon>
					</v-list-item>
					<v-list-item v-ripple @click="group = Group.RARITY">
						<span>{{ $t('rarity') }}</span>
						<v-icon v-if="group === Group.RARITY">mdi-check</v-icon>
					</v-list-item>
				</v-list>
			</v-menu>
			<v-menu offset-y>
				<template #activator="{ props }">
					<div class="button flat" v-bind="props">
						<v-icon>mdi-cog-outline</v-icon>
					</div>
				</template>
				<v-list dense class="menu-actions">
					<v-list-item class="submenu-header">{{ $t('size') }}</v-list-item>
					<v-list-item v-ripple @click="size = Size.SMALL">
						<span>{{ $t('size_small') }}</span>
						<v-icon v-if="size === Size.SMALL">mdi-check</v-icon>
					</v-list-item>
					<v-list-item v-ripple @click="size = Size.NORMAL">
						<span>{{ $t('size_normal') }}</span>
						<v-icon v-if="size === Size.NORMAL">mdi-check</v-icon>
					</v-list-item>
					<v-list-item v-ripple @click="size = Size.LARGE">
						<span>{{ $t('size_large') }}</span>
						<v-icon v-if="size === Size.LARGE">mdi-check</v-icon>
					</v-list-item>
					<!-- Disposition de la PAGE (inventaire + atelier) : elle appartient au
					     parent, qui la passe en prop. Sans prop (atelier), la section
					     n'apparait pas. -->
					<template v-if="layout">
						<v-divider />
						<v-list-item class="submenu-header">{{ $t('layout') }}</v-list-item>
						<v-list-item v-ripple @click="emit('update:layout', 'rows')">
							<span>{{ $t('layout_rows') }}</span>
							<v-icon v-if="layout === 'rows'">mdi-check</v-icon>
						</v-list-item>
						<v-list-item v-ripple @click="emit('update:layout', 'columns')">
							<span>{{ $t('layout_columns') }}</span>
							<v-icon v-if="layout === 'columns'">mdi-check</v-icon>
						</v-list-item>
					</template>
				</v-list>
			</v-menu>
		</template>
		<template #content>
			<div ref="inventory" class="inventory-content">
				<loader v-if="!$store.state.farmer" />
				<div v-else class="inventory" :class="'size-' + size">
					<template v-for="entry in display_inventory" :key="entry.key">
						<div v-if="entry.separator" class="type-separator" :class="entry.rarity !== undefined ? 'rarity-' + entry.rarity : ''" @click="entry.groupKey !== undefined && toggleGroup(entry.groupKey)">
							<v-icon class="collapse-icon" :class="{ collapsed: entry.collapsed }">mdi-chevron-down</v-icon>
							<v-icon v-if="entry.type !== undefined">{{ ITEM_TYPE_ICONS[entry.type] }}</v-icon>
							<span v-if="entry.type !== undefined">{{ $t('main.' + ITEM_TYPE_NAME[entry.type]) }}</span>
							<span v-else>{{ $t('main.difficulty_' + entry.rarity) }}</span>
							<span class="group-count">({{ entry.count }})</span>
						</div>
						<div v-else-if="entry.placeholder" class="placeholder"></div>
						<div v-else-if="entry.item" class="cell active" :class="['rarity-border-' + LeekWars.items[entry.item.template].rarity, { 'not-craftable': !entry.craftable, selectable: entry.item.type === ItemType.COMPONENT || entry.item.type === ItemType.ALTERATION }]" @mouseenter="showTooltip(entry.item as InventoryItem, $event)" @mouseleave="scheduleHideTooltip()" @click="selectItem(entry.item as InventoryItem, $event)">
							<div class="item" :quantity="$filters.number(entry.item.quantity)" :type="LeekWars.items[entry.item.template].type">
								<img v-if="entry.item.type === ItemType.RESOURCE" class="image" :src="'/image/resource/' + LeekWars.items[entry.item.template].name + '.png'" loading="lazy">
								<scheme-image v-else-if="entry.item.type === ItemType.SCHEME" class="image" :scheme="LeekWars.schemes[LeekWars.items[entry.item.template].params]" />
								<img v-else-if="entry.item.type === ItemType.COMPONENT" class="image" :class="alteredClassFor(entry.item as InventoryItem)" :src="'/image/component/' + LeekWars.items[entry.item.template].name + '.png'" loading="lazy">
								<alteration-icon v-else-if="entry.item.type === ItemType.ALTERATION" :template="entry.item.template" :size="32" />
								<img v-else class="image" :class="{small: entry.item.template === 37 || entry.item.template === 45 || entry.item.template === 153 || entry.item.template === 182}" :src="itemImageUrl(LeekWars.items[entry.item.template])" loading="lazy">
								<img v-if="LeekWars.items[entry.item.template].name.startsWith('box')" class="retrieve notif-trophy" src="/image/icon/black/arrow-down-right-bold.svg">
								<img v-if="LeekWars.christmasPresents && LeekWars.items[entry.item.template].name.startsWith('present')" class="retrieve notif-trophy" src="/image/icon/black/arrow-down-right-bold.svg">
								<!-- Métabolisme resolu de la piece, coin haut gauche (#12146) : la
								     reponse trouvee reste sous les yeux, y compris sur une piece
								     mise de cote depuis des semaines.
								     APRÈS la chaîne d'images, jamais au milieu : un `v-if` glissé
								     entre deux branches coupe le `v-else-if`/`v-else` qui suit, et
								     chaque case rendait alors DEUX images superposées. -->
								<metabolism-badge v-if="entry.item.optimal_dose" :dose="entry.item.optimal_dose" />
								<div class="id">#{{ entry.item.template }}</div>
							</div>
						</div>
					</template>
					<div v-for="item in (group === Group.NONE ? placeholder_count : 0)" :key="'p' + item" class="placeholder"></div>
				</div>

				<v-menu v-model="tooltipVisible" :activator="tooltipActivator" :close-on-content-click="false" :min-width="280" :open-delay="0" :close-delay="0" :bottom="true" offset-y :open-on-hover="false">
					<div class="inventory-tooltip" @mouseenter="onTooltipEnter" @mouseleave="onTooltipLeave">
						<item-preview v-if="tooltipItem" :item="tooltipItem" :quantity="tooltipQuantity" :instance="tooltipInstance" :inventory="true" :show-use="true" @retrieve="retrieve" />
					</div>
				</v-menu>

				<popup v-model="retrieveDialog" :width="400">
					<template #title>Objets obtenus</template>
					<div class="inventory">
						<div v-for="item in retrieveItems" :key="item.id" class="cell active" :class="'rarity-border-' + LeekWars.items[item.template].rarity">
							<div class="item" :quantity="item.quantity" :type="LeekWars.items[item.template].type">
								<img v-if="LeekWars.items[item.template].type === ItemType.RESOURCE" class="image" :src="'/image/resource/' + LeekWars.items[item.template].name + '.png'">
								<img v-else class="image" :class="{small: item.template === 37 || item.template === 45 || item.template === 153 || item.template === 182}" :src="itemImageUrl(LeekWars.items[item.template])">
							</div>
						</div>
					</div>
					<br>
					<div>
						Total estimé : <b>{{ $filters.number(retrieveItems.reduce((s, i) => s + i.quantity * (LeekWars.items[i.template].price ?? 0), 0)) }}</b> <span class="hab"></span>
					</div>
				</popup>

			</div>
		</template>
	</panel>
</template>

<script lang="ts" setup>
	import { mixins, useNamespacedT } from '@/model/i18n'
	import { type Item, type ItemTemplate, ItemType, ItemTypes, ITEM_TYPE_ICONS, ITEM_TYPE_NAME, itemImageUrl } from '@/model/item'
	import { itemDisplayName } from '@/model/item-name'
	import { foldText } from '@/model/text'
	import { LeekWars } from '@/model/leekwars'
	import { store } from '@/model/store'
	import { computed, onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from 'vue'
	import { useRouter } from 'vue-router'
	import ItemPreview from '@/component/market/item-preview.vue'
	import SchemeImage from '../market/scheme-image.vue'
	import AlterationIcon from '../alteration/alteration-icon.vue'
	import MetabolismBadge from '../alteration/metabolism-badge.vue'
	import { emitter } from '@/model/emitter'
	import { alteredClass, displayRatio } from '@/model/alteration'

	enum Sort {
		DATE, PRICE, PRICE_LOT, QUANTITY, /*NAME, */ LEVEL, RARITY, CHARGE
	}
	enum Group {
		NONE, TYPE, RARITY
	}
	enum Size {
		SMALL, NORMAL, LARGE
	}

	defineOptions({ name: 'Inventory', i18n: {}, mixins: [...mixins] })

	/**
	 * Disposition de la page qui accueille l'inventaire ('rows' ou 'columns'), pour
	 * offrir le reglage dans le menu des options. Le parent reste proprietaire de la
	 * valeur : l'inventaire ne fait que l'afficher et demander le changement.
	 */
	defineProps<{ layout?: 'rows' | 'columns' }>()
	const emit = defineEmits<{ 'update:layout': [value: 'rows' | 'columns'] }>()

	const t = useNamespacedT('inventory')
	const router = useRouter()
	const inventoryRef = useTemplateRef<HTMLElement>('inventory')

	const CATEGORY_ITEMS = 1
	const CATEGORY_RESOURCES = 2
	const placeholder_count = ref(0)
	const columns = ref(0)
	const sort = ref<Sort>(parseInt(localStorage.getItem('inventory/sort') || '0', 10) as Sort)
	const filter = ref<ItemType>(parseInt(localStorage.getItem('inventory/filter') || '0', 10) as ItemType)
	const group = ref<Group>(parseInt(localStorage.getItem('inventory/group') || '0', 10) as Group)
	const size = ref<Size>(parseInt(localStorage.getItem('inventory/size') || '1', 10) as Size)
	const collapsedGroups = ref<Set<number>>(new Set(JSON.parse(localStorage.getItem('inventory/collapsed') || '[]')))
	const retrieveDialog = ref(false)
	const retrieveItems = ref<Item[]>([])

	// Le compte des ingrédients passe par le getter du store, seul endroit qui sait qu'une
	// pièce ALTÉRÉE est une instance à part, rangée sous le même template que la pile de ses
	// jumelles neuves : la recherche à la main renvoyait la première ligne venue, et une
	// pomme altérée cachait les 470 autres.
	function isSchemeCraftable(item: Item & { type: ItemType }): boolean {
		if (item.type !== ItemType.SCHEME || !store.state.farmer) return true
		const scheme = LeekWars.schemes[LeekWars.items[item.template].params]
		if (!scheme) return true
		for (const ingredient of scheme.items) {
			if (!ingredient) continue
			const [itemId, quantity] = ingredient
			if (store.getters.item_quantity(itemId) < quantity) return false
		}
		return true
	}

	const tooltipVisible = ref(false)
	const tooltipItem = ref<ItemTemplate | null>(null)
	const tooltipQuantity = ref(0)
	// L'instance survolee : c'est elle qui porte les alterations.
	const tooltipInstance = ref<InventoryItem | null>(null)
	const tooltipActivator = ref<HTMLElement | undefined>(undefined)
	let tooltipShowTimer = 0
	let tooltipHideTimer = 0
	let tooltipOnTooltip = false

	/**
	 * Clic sur un item : un composant part dans la forge, qui devient l'atelier
	 * d'alteration. Les autres types n'ont pas d'action au clic.
	 */
	/**
	 * Palier d'alteration d'un composant, pour la silhouette coloree.
	 *
	 * Le lisere du haut de la cellule sert deja a la rarete du template : la marque
	 * d'alteration passe donc par l'image elle-meme, ce qui epouse la decoupe de
	 * l'objet et evite de generer 52 composants x 5 paliers d'images.
	 */
	function alteredClassFor(item: InventoryItem): string {
		return alteredClass(item, LeekWars.componentCapacity(item.template), LeekWars.alterations?.weights)
	}

	function selectItem(item: InventoryItem, event?: MouseEvent) {
		// Sur mobile il n'y a pas de survol : le tap est le seul moyen d'ouvrir une
		// fiche. On l'affiche donc au clic, tout de suite, sans le delai du desktop.
		if (LeekWars.mobile && event) {
			showTooltipNow(item as Item & { type: ItemType }, event)
		}
		if (item.type === ItemType.COMPONENT) {
			// Sur desktop l'infobulle suit la souris : on la ferme pour ne pas masquer
			// la forge ou le composant vient d'atterrir.
			if (!LeekWars.mobile) hideTooltip()
			emitter.emit('alter', item)
		} else if (item.type === ItemType.ALTERATION) {
			emitter.emit('add-alteration', item)
		}
	}

	/**
	 * Ouvre l'infobulle au tap (mobile), sans le delai de 500 ms du survol.
	 *
	 * L'ouverture est differee d'un tick : sinon le meme evenement de tap remonte
	 * jusqu'au detecteur de "clic exterieur" du v-menu, qui le referme aussitot. C'est
	 * cette course qui faisait que l'infobulle ne s'ouvrait qu'une fois sur deux.
	 */
	function showTooltipNow(item: Item & { type: ItemType }, event: MouseEvent) {
		clearTimeout(tooltipShowTimer)
		clearTimeout(tooltipHideTimer)
		// currentTarget devient null des que le handler rend la main : on le capture ici.
		const target = event.currentTarget as HTMLElement
		tooltipVisible.value = false
		requestAnimationFrame(() => {
			tooltipActivator.value = target
			tooltipItem.value = LeekWars.items[item.template]
			tooltipQuantity.value = item.quantity
			tooltipInstance.value = item
			tooltipVisible.value = true
		})
	}

	function showTooltip(item: Item & { type: ItemType }, event: MouseEvent) {
		clearTimeout(tooltipHideTimer)
		const target = event.currentTarget as HTMLElement
		if (tooltipVisible.value) {
			tooltipActivator.value = target
			tooltipItem.value = LeekWars.items[item.template]
			tooltipQuantity.value = item.quantity
			tooltipInstance.value = item
		} else {
			clearTimeout(tooltipShowTimer)
			tooltipShowTimer = window.setTimeout(() => {
				tooltipActivator.value = target
				tooltipItem.value = LeekWars.items[item.template]
				tooltipQuantity.value = item.quantity
				tooltipInstance.value = item
				tooltipVisible.value = true
			}, 500)
		}
	}

	function scheduleHideTooltip() {
		clearTimeout(tooltipShowTimer)
		tooltipHideTimer = window.setTimeout(() => {
			if (!tooltipOnTooltip) {
				tooltipVisible.value = false
			}
		}, 100)
	}

	function onTooltipEnter() {
		tooltipOnTooltip = true
		clearTimeout(tooltipHideTimer)
	}

	function onTooltipLeave() {
		tooltipOnTooltip = false
		tooltipVisible.value = false
	}

	// Chaque objet affiché est rendu à partir de LeekWars.items[item.template] (rareté,
	// image, prix) : un template absent des game data — ressource de saison tout juste
	// droppée, données de jeu pas encore rafraîchies — fait planter la page entière.
	// On l'écarte plutôt que de perdre tout l'inventaire.
	function withKnownTemplate<T extends { template: number }>(items: T[]): T[] {
		return items.filter(item => {
			if (item.template in LeekWars.items) return true
			console.warn('[inventory] template inconnu, objet ignoré :', item.template)
			return false
		})
	}

	/**
	 * L'inventaire, assemblé depuis les dix listes du fermier.
	 *
	 * Chaque liste est traitée défensivement, pour deux raisons vécues :
	 *
	 * - une liste ABSENTE de la réponse serveur (`.map` sur `undefined`) faisait planter le
	 *   calcul, donc le panneau entier disparaissait ;
	 * - un objet dont le TEMPLATE est inconnu des données de jeu casse le rendu plus loin
	 *   (`LeekWars.items[template]` vaut `undefined`, et les composants qui l'affichent
	 *   attendent un objet). C'est arrivé avec un cache IndexedDB antérieur aux altérations :
	 *   36 objets inconnus suffisaient à vider un inventaire de 428.
	 *
	 * Dans les deux cas on préfère afficher ce qu'on sait afficher, et signaler le reste une
	 * fois en console plutôt que de tout perdre.
	 */
	const inventory = computed(() => {
		const farmer = store.state.farmer
		if (!farmer) return []
		const inventory = []
		const inconnus: number[] = []
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const listes: [ItemType, any[]][] = [
			[ItemType.WEAPON, farmer.weapons], [ItemType.CHIP, farmer.chips],
			[ItemType.POTION, farmer.potions], [ItemType.HAT, farmer.hats],
			[ItemType.POMP, farmer.pomps], [ItemType.RESOURCE, farmer.resources],
			[ItemType.COMPONENT, farmer.components], [ItemType.SCHEME, farmer.schemes],
			[ItemType.ALTERATION, farmer.alterations], [ItemType.FIGHT_PACK, farmer.fight_packs],
		]
		for (const [type, liste] of listes) {
			for (const item of (liste || [])) {
				if (!LeekWars.items[item.template]) { inconnus.push(item.template); continue }
				inventory.push({ type, ...item })
			}
		}
		if (inconnus.length) {
			console.warn(`[Inventaire] ${inconnus.length} objet(s) ignoré(s), template inconnu des`
				+ ` données de jeu : ${[...new Set(inconnus)].join(', ')}.`
				+ ` Cache périmé ? indexedDB.deleteDatabase('leek-wars-data') puis recharger.`)
		}
		return inventory
	})

	/**
	 * Recherche par nom, insensible à la casse et aux accents. Elle porte sur le
	 * nom affiché dans la langue du joueur ; un schéma se retrouve donc aussi par le nom
	 * de ce qu'il fabrique. « #123 » ou « 123 » retrouve l'objet par son numéro, celui
	 * qu'affiche chaque case.
	 */
	const search = ref('')
	const searchInput = useTemplateRef<HTMLInputElement>('searchInput')
	const query = computed(() => foldText(search.value.trim()))

	// Noms repliés, par template : ils ne dépendent que de la langue, pas de ce qui est
	// tapé, et une frappe ne les retraduit donc pas. Calculé seulement quand on cherche.
	const foldedNames = computed(() => {
		const names = new Map<number, string>()
		for (const item of inventory.value) {
			if (!names.has(item.template)) names.set(item.template, foldText(itemDisplayName(LeekWars.items[item.template], t)))
		}
		return names
	})

	const filtered_inventory = computed(() => {
		let items = inventory.value
		if (filter.value !== ItemType.ALL) items = items.filter(item => item.type == filter.value)
		const q = query.value
		if (q) {
			const id = q.replace(/^#/, '')
			const names = foldedNames.value
			items = items.filter(item => String(item.template) === id || names.get(item.template)!.includes(q))
		}
		return items
	})

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	type InventoryItem = any

	/**
	 * Charge d'un composant en fraction de sa capacite, exactement telle que l'affiche sa
	 * jauge (cf. displayRatio). 0 pour tout ce qui n'est pas un composant altere, qui se
	 * retrouve donc en fin de tri.
	 */
	function chargeRatio(item: InventoryItem): number {
		const weights = LeekWars.alterations?.weights
		if (!item.stats || !weights) return 0
		return displayRatio(item.stats, LeekWars.componentCapacity(item.template), weights)
	}

	function sortCompare(a: InventoryItem, b: InventoryItem) {
		if (sort.value === Sort.DATE) {
			if (b.time === a.time) return a.id - b.id
			return b.time - a.time
		}
		if (sort.value === Sort.PRICE) return LeekWars.items[b.template].price! - LeekWars.items[a.template].price!
		if (sort.value === Sort.PRICE_LOT) return LeekWars.items[b.template].price! * b.quantity - LeekWars.items[a.template].price! * a.quantity
		if (sort.value === Sort.QUANTITY) return b.quantity - a.quantity
		if (sort.value === Sort.RARITY) return LeekWars.items[b.template].rarity - LeekWars.items[a.template].rarity
		// Tri par charge : en POURCENTAGE de la capacite et non en points, sinon une grosse
		// piece a peine entamee passait devant une petite piece au maximum. C'est aussi le
		// chiffre que porte la jauge, donc le tri suit ce que le joueur voit.
		if (sort.value === Sort.CHARGE) return chargeRatio(b) - chargeRatio(a)
		return LeekWars.items[b.template].level - LeekWars.items[a.template].level
	}

	const sorted_inventory = computed(() => {
		return [...filtered_inventory.value].sort((a, b) => {
			if (group.value === Group.TYPE && a.type !== b.type) return a.type - b.type
			if (group.value === Group.RARITY) {
				const ra = LeekWars.items[a.template].rarity
				const rb = LeekWars.items[b.template].rarity
				if (ra !== rb) return rb - ra
			}
			return sortCompare(a, b)
		})
	})

	const display_inventory = computed<{ item?: InventoryItem; key: string | number; separator?: boolean; placeholder?: boolean; rarity?: number; type?: ItemType; count?: number; collapsed?: boolean; groupKey?: number; craftable?: boolean }[]>(() => {
		const items = sorted_inventory.value
		const entry = (item: InventoryItem) => ({ item, key: item.id, craftable: isSchemeCraftable(item) })
		if (group.value === Group.NONE) return items.map(entry)
		const groupCounts: Record<number, number> = {}
		for (const item of items) {
			const gk = group.value === Group.TYPE ? item.type : LeekWars.items[item.template].rarity
			groupCounts[gk] = (groupCounts[gk] || 0) + 1
		}
		const cols = columns.value || 1
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const result: any[] = []
		let lastGroup = -1
		let groupCount = 0
		for (const item of items) {
			const groupKey = group.value === Group.TYPE ? item.type : LeekWars.items[item.template].rarity
			if (groupKey !== lastGroup) {
				if (lastGroup !== -1 && !collapsedGroups.value.has(lastGroup) && groupCount % cols !== 0) {
					const pad = cols - (groupCount % cols)
					for (let i = 0; i < pad; i++) {
						result.push({ placeholder: true, key: 'pad-' + lastGroup + '-' + i })
					}
				}
				const collapsed = collapsedGroups.value.has(groupKey)
				if (group.value === Group.TYPE) {
					result.push({ separator: true, type: item.type, count: groupCounts[groupKey], key: 'sep-' + groupKey, collapsed, groupKey })
				} else {
					result.push({ separator: true, rarity: groupKey, count: groupCounts[groupKey], key: 'sep-' + groupKey, collapsed, groupKey })
				}
				lastGroup = groupKey
				groupCount = 0
			}
			if (!collapsedGroups.value.has(groupKey)) {
				result.push(entry(item))
				groupCount++
			}
		}
		return result
	})

	const total_estimated = computed(() => Math.floor(filtered_inventory.value.reduce((s: number, i) => s + (LeekWars.items[i.template]?.price ?? 0) * i.quantity, 0)))

	const SIZES = {
		[Size.SMALL]:  { desktop: { w: 55, h: 58 }, mobile: { w: 45, h: 48 } },
		[Size.NORMAL]: { desktop: { w: 73, h: 76 }, mobile: { w: 60, h: 63 } },
		[Size.LARGE]:  { desktop: { w: 100, h: 103 }, mobile: { w: 80, h: 83 } },
	}

	function resize() {
		const s = SIZES[size.value] || SIZES[Size.NORMAL]
		const W = LeekWars.mobile ? s.mobile.w : s.desktop.w
		const H = LeekWars.mobile ? s.mobile.h : s.desktop.h
		const el = inventoryRef.value
		if (!el) return
		const margin = 5
		columns.value = Math.floor((el.clientWidth - margin) / (W + margin))
		const last_columns = filtered_inventory.value.length % columns.value
		const column = last_columns === 0 ? 0 : columns.value - last_columns
		const rows = Math.floor((el.clientHeight - margin) / (H + margin))
		placeholder_count.value = Math.max(column, columns.value * rows - filtered_inventory.value.length)
	}

	watch([filtered_inventory, size], resize)

	function hideTooltip() {
		tooltipVisible.value = false
		clearTimeout(tooltipShowTimer)
	}

	const actions = [
		{icon: 'mdi-trophy-variant-outline', click: () => router.push('/collection')},
		{icon: 'mdi-bank', click: () => router.push('/bank?ref=inventory_action')},
		{icon: 'mdi-store', click: () => router.push('/market')},
	]
	LeekWars.setActions(actions)

	function updateSubtitle() {
		if (store.state.farmer) {
			LeekWars.setSubTitle(t('main.x_habs', [LeekWars.formatNumber(store.state.farmer.habs)]) as string + " • " + t('main.x_crystals', [LeekWars.formatNumber(store.state.farmer.crystals)]))
		}
	}

	onMounted(() => {
		LeekWars.setTitle(t('main.inventory') as string)
		updateSubtitle()
		LeekWars.footer = false
		LeekWars.box = true
		resize()
		emitter.on('resize', resize)
		emitter.on('craft', hideTooltip)
		emitter.on('clover-used', hideTooltip)
	})

	onBeforeUnmount(() => {
		emitter.off('resize', resize)
		emitter.off('craft', hideTooltip)
		clearTimeout(tooltipShowTimer)
		clearTimeout(tooltipHideTimer)
	})

	watch(sort, () => localStorage.setItem('inventory/sort', '' + sort.value))
	watch(filter, () => localStorage.setItem('inventory/filter', '' + filter.value))
	watch(group, () => localStorage.setItem('inventory/group', '' + group.value))
	watch(size, () => localStorage.setItem('inventory/size', '' + size.value))

	function toggleGroup(groupKey: number) {
		if (collapsedGroups.value.has(groupKey)) {
			collapsedGroups.value.delete(groupKey)
		} else {
			collapsedGroups.value.add(groupKey)
		}
		collapsedGroups.value = new Set(collapsedGroups.value)
		localStorage.setItem('inventory/collapsed', JSON.stringify([...collapsedGroups.value]))
	}

	function retrieve(items: unknown[]) {
		const typedItems = withKnownTemplate(items as Item[])
		if (typedItems.length) {
			retrieveDialog.value = true
			retrieveItems.value = typedItems
		}
	}
</script>

<style lang="scss" scoped>
.panel :deep(h2 > div) {
	width: 145px;
}
.inventory-panel {
	flex: 1;
	min-height: 0;
}
.container {
	flex: 1;
	min-height: 0;
}
.inventory-panel {
	// height: 100%;
}
#app.app .container {
	margin-bottom: 0;
}
.inventory-content {
	overflow-y: scroll;
	overflow-x: hidden;
	display: flex;
	flex-direction: column;
	flex: 1;
	:deep(.loader) {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
	}
}
.inventory {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(73px, 1fr));
	gap: 5px;
	margin: 5px;
	.item {
		height: 76px;
	}
	&.size-0 {
		grid-template-columns: repeat(auto-fill, minmax(55px, 1fr));
		.item { height: 58px; }
	}
	&.size-2 {
		grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
		.item { height: 103px; }
	}
}
#app.app .inventory {
	grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
	.item {
		height: 63px;
	}
	&.size-0 {
		grid-template-columns: repeat(auto-fill, minmax(45px, 1fr));
		.item { height: 48px; }
	}
	&.size-2 {
		grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
		.item { height: 83px; }
	}
}
.categories {
	display: flex;
	align-items: stretch;
	align-self: stretch;
	color: var(--white);
	.category {
		cursor: pointer;
		display: flex;
		align-items: center;
		&.selected {
			background: var(--grey-5);
		}
		.v-icon {
			padding: 0 12px;
			margin: 0;
		}
	}
}
.value {
	display: inline-flex;
	align-items: center;
	vertical-align: bottom;
	font-size: 15px;
	// La valeur totale vit dans le slot `#actions` du panneau : elle prend
	// l'encre de l'en-tête. --grey-13 (« presque blanc ») supposait un en-tête
	// sombre dans les deux thèmes, ce que le v3 en clair n'est plus — crème sur
	// crème, le montant disparaissait et il ne restait que l'icône des habs.
	color: var(--panel-header-color);
	margin: 0 10px;
	.hab {
		margin-left: 5px;
	}
}
// Même encre que la valeur : le fond du champ est dérivé de la couleur de
// l'en-tête, pour rester lisible sur un en-tête sombre comme clair.
.search {
	display: inline-flex;
	align-items: center;
	align-self: center;
	height: 26px;
	margin-right: 6px;
	padding: 0 6px;
	border-radius: var(--radius-small);
	color: var(--panel-header-color);
	background: color-mix(in srgb, currentColor 12%, transparent);
	.search-icon, .clear {
		font-size: 18px;
		margin: 0;
		opacity: 0.8;
	}
	.clear {
		cursor: pointer;
	}
	input {
		width: 130px;
		margin-left: 4px;
		padding: 0;
		border: none;
		outline: none;
		background: transparent;
		color: inherit;
		font-size: 14px;
		transition: width 0.15s;
		&::placeholder {
			color: inherit;
			opacity: 0.6;
		}
	}
}
// Sur mobile l'en-tête est déjà plein (valeur + quatre boutons) : la recherche
// n'y est qu'une loupe, et le champ prend la place de la valeur une fois ouvert.
#app.app .search {
	padding: 0 4px;
	.search-icon {
		cursor: pointer;
	}
	input {
		width: 0;
		margin-left: 0;
	}
	&:focus-within, &.active {
		input {
			width: 110px;
			margin-left: 4px;
		}
	}
}
#app.app .value:has(~ .search:focus-within, ~ .search.active) {
	display: none;
}
// Un composant part dans la forge au clic.

.cell.selectable {
	cursor: pointer;
}
.cell {
	border: 1px solid var(--border);
	&:hover {
		background: var(--pure-white);
	}
	&.not-craftable {
		background: #f002;
	}
}
.item {
	padding: 5%;
	position: relative;
	.image {
		width: 100%;
		height: 100%;
		object-fit: contain;
		vertical-align: bottom;
		// img {
		// 	position: absolute;
		// 	width: 100%;
		// 	height: 100%;
		// 	object-fit: contain;
		// 	&.item {
		// 		width: 70%;
		// 		height: 70%;
		// 		left: 15%;
		// 		top: 10%;
		// 		filter: grayscale(0.2);
		// 		transform: scaleY(0.7) rotate(45deg) ;
		// 	}
		// }
	}
	&[type="1"] {
		padding: 6%;
		.image {
			transform: rotate(-43deg);
			width: 130%;
			height: 130%;
			margin: -15%;
			&.small {
				width: 110%;
				height: 110%;
				margin: -5%;
			}
		}
	}
	&[type="2"], &[type="5"] {
		padding: 13%;
	}
	&:after {
		position: absolute;
		content: attr(quantity);
		background: #000b;
		border-top-left-radius: var(--radius);
		padding: 1.5px 4.5px;
		right: 0;
		bottom: 0;
		font-size: 14px;
		color: var(--white);
		font-weight: 500;
	}
	.size-0 &:after {
		font-size: 11px;
		padding: 1px 3px;
	}
	&[quantity="1"]:after {
		display: none;
	}
	.id {
		position: absolute;
		top: 0;
		background: #fffd;
		padding: 2px 3px;
		font-size: 12px;
		display: none;
	}
	.retrieve {
		position: absolute;
		top: 3px;
		right: 3px;
		width: 16px;
		padding: 1px;
	}
}
.placeholder {
	border: 1px solid var(--border);
	height: 78px;
}
.size-0 .placeholder { height: 60px; }
.size-2 .placeholder { height: 105px; }
#app.app .placeholder {
	height: 65px;
}
#app.app .size-0 .placeholder { height: 50px; }
#app.app .size-2 .placeholder { height: 85px; }
.type-separator {
	grid-column: 1 / -1;
	display: flex;
	align-items: center;
	gap: 6px;
	padding: 4px 6px;
	font-size: 13px;
	font-weight: 500;
	color: var(--text-color-secondary);
	cursor: pointer;
	user-select: none;
	&:hover {
		background: var(--background-header);
	}
	.v-icon {
		font-size: 18px;
	}
	.collapse-icon {
		transition: transform 0.2s;
		&.collapsed {
			transform: rotate(-90deg);
		}
	}
	.group-count {
		opacity: 0.6;
	}
}
.menu-actions {
	.v-icon {
		margin: 6px;
	}
	.submenu-header {
		font-size: 12px;
		font-weight: 500;
		color: var(--text-color-secondary);
		min-height: 30px;
		pointer-events: none;
	}
}
.inventory-tooltip {
	width: 280px;
}
</style>
