<template lang="html">
	<v-menu v-model="open" :disabled="disabled" :close-on-content-click="true" location="bottom start" min-width="0">
		<template #activator="{ props: menuProps }">
			<div class="lw-select" :class="{disabled, open}" v-bind="{ ...menuProps, ...$attrs }" role="combobox" :aria-expanded="open" :aria-disabled="disabled" tabindex="0" @keydown="onKeydown">
				<div class="field">
					<!-- Le libellé flotte au-dessus de la valeur quand il y en a un, comme le
					     `label` de v-select : les appelants le passent pour titrer un filtre. -->
					<span v-if="label" class="label">{{ label }}</span>
					<span class="value" :class="{empty: !selected}">
						<!-- `prepend` et `append` tiennent la place des `prepend-inner` /
						     `append-inner` de v-select : une icône dans le champ (branche
						     git) et un indicateur à sa droite (chargement). -->
						<slot name="prepend" />
						<slot name="selection" :item="selected">{{ selected ? selected.title : (placeholder || '') }}</slot>
					</span>
				</div>
				<slot name="append" />
				<v-icon class="arrow">mdi-menu-down</v-icon>
			</div>
		</template>

		<div class="lw-select-menu" role="listbox">
			<template v-for="item in normalized" :key="String(item.value)">
				<!-- `props` est fourni à brancher tel quel sur la ligne, comme le fait
				     v-select avec v-list-item : l'appelant n'a pas à savoir comment la
				     sélection est câblée. -->
				<slot name="item" :props="itemProps(item)" :item="item">
					<div v-bind="itemProps(item)">{{ item.title }}</div>
				</slot>
			</template>
		</div>
	</v-menu>
</template>

<script setup lang="ts">
// Liste déroulante maison de Leek Wars 3.0, remplaçante de v-select (REDESIGN.md,
// principe 4 : sortie des contrôles Material, Vuetify gardé comme moteur). Le
// v-menu est conservé — c'est une primitive de POSITIONNEMENT explicitement
// admise — et seul l'habillage est repris : trait plutôt qu'ombre floue, angles
// francs, pas de ripple, « pixel push » sur l'état pressé.
//
// L'API reprend celle de v-select là où les appelants s'en servent : v-model,
// items (chaînes ou objets), item-value / item-title, label, disabled, et les
// deux slots `selection` et `item`. L'objet exposé aux slots garde la forme de
// Vuetify — `raw`, `value`, `title` et `props.title` — pour que les call sites
// migrent sans réécrire leur contenu.
import { computed, ref } from 'vue'

// `inheritAttrs: false` + `$attrs` reporté sur le champ : la racine du composant
// est un `v-menu`, et les attributs de l'appelant (à commencer par sa `class`)
// s'y perdaient au lieu d'habiller la boîte. Les feuilles des appelants —
// `.order-select`, `.filter-select`, `.status-select`… — ne s'appliquaient donc
// pas, sans rien signaler.
defineOptions({ name: 'LWSelect', inheritAttrs: false })

/**
 * Item normalisé, à la forme de ceux de v-select — `raw` y est typé `any` comme
 * chez Vuetify, faute de quoi chaque appelant devrait caster pour lire un champ
 * de son propre objet (`item.raw.color`), ce qui rendrait la migration coûteuse.
 */
interface SelectItem {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	raw: any
	value: unknown
	title: string
	props: { title: string, value: unknown }
}

const props = withDefaults(defineProps<{
	modelValue?: unknown
	items?: unknown[]
	itemValue?: string
	itemTitle?: string
	label?: string
	placeholder?: string
	disabled?: boolean
}>(), {
	// Valeurs par défaut explicites : `undefined` est déjà ce que vaut une prop
	// optionnelle non passée, mais la règle vue/require-default-prop veut la voir.
	modelValue: undefined,
	label: undefined,
	placeholder: undefined,
	items: () => [],
	itemValue: 'value',
	itemTitle: 'title',
})

const emit = defineEmits<{
	'update:modelValue': [value: unknown]
}>()

const open = ref(false)

/**
 * Une liste de chaînes ou de nombres est sa propre valeur ET son propre libellé,
 * exactement comme dans v-select : sans ça, `:items="Object.keys(...)"` (les
 * devises de la banque) n'afficherait rien.
 */
function normalize(raw: unknown): SelectItem {
	if (raw !== null && typeof raw === 'object') {
		const record = raw as Record<string, unknown>
		const value = record[props.itemValue]
		const title = record[props.itemTitle]
		return { raw, value, title: title === undefined || title === null ? '' : String(title), props: { title: String(title ?? ''), value } }
	}
	return { raw, value: raw, title: String(raw), props: { title: String(raw), value: raw } }
}

const normalized = computed(() => props.items.map(normalize))

const selected = computed(() => normalized.value.find(item => item.value === props.modelValue) ?? null)

/**
 * Ce qui se branche sur une ligne. Volontairement sans `title` : la ligne est un
 * élément ordinaire et non un v-list-item, l'attribut y deviendrait une infobulle
 * native parasite. Le libellé se lit dans `item.title`, que le slot reçoit aussi.
 * `class` porte la ligne sélectionnée, que le thème marque d'un liseré.
 */
function itemProps(item: SelectItem) {
	return {
		class: ['lw-select-item', { selected: item.value === props.modelValue }],
		role: 'option',
		'aria-selected': item.value === props.modelValue,
		onClick: () => select(item),
	}
}

function select(item: SelectItem) {
	open.value = false
	if (item.value !== props.modelValue) emit('update:modelValue', item.value)
}

/**
 * Clavier : le v-menu ouvre déjà à Entrée/Espace via son activateur, mais les
 * flèches doivent parcourir les valeurs sans ouvrir la liste — c'est le
 * comportement d'un `select` natif, et le seul moyen de changer de valeur
 * au clavier quand la liste est fermée.
 */
function onKeydown(e: KeyboardEvent) {
	if (props.disabled) return
	if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
	e.preventDefault()
	const list = normalized.value
	if (!list.length) return
	const current = list.findIndex(item => item.value === props.modelValue)
	const next = e.key === 'ArrowDown'
		? Math.min(list.length - 1, current + 1)
		: Math.max(0, (current === -1 ? 0 : current) - 1)
	select(list[next])
}
</script>

<style lang="scss">
.lw-select {
	display: flex;
	align-items: center;
	gap: 4px;
	min-width: 0;
	padding: 4px 6px;
	background: var(--background-input);
	border: 1px solid var(--border-strong);
	color: var(--text-color);
	cursor: pointer;
	user-select: none;
	.field {
		display: flex;
		flex-direction: column;
		min-width: 0;
		flex: 1;
	}
	// Le libellé titre le champ sans le pousser : plus petit et estompé, sur sa
	// propre ligne, comme le label flottant qu'il remplace.
	.label {
		font-size: 11px;
		line-height: 1.1;
		color: var(--text-color-secondary);
	}
	.value {
		display: flex;
		align-items: center;
		gap: 4px;
		min-width: 0;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	// Rien de sélectionné : le texte d'invite s'estompe, comme un placeholder.
	.value.empty {
		color: var(--text-color-secondary);
	}
	.arrow {
		flex-shrink: 0;
		color: var(--text-color-secondary);
	}
	&:hover:not(.disabled) {
		border-color: var(--primary);
	}
	// Pixel push : le champ s'enfonce d'un pixel quand la liste est ouverte,
	// l'état « pressé » du design system, à la place du ripple.
	&.open:not(.disabled) {
		border-color: var(--primary);
		transform: translate(1px, 1px);
	}
	&:focus-visible {
		outline: 2px solid var(--primary);
		outline-offset: 1px;
	}
	&.disabled {
		cursor: not-allowed;
		opacity: 0.5;
	}
}

// La surface flottante (trait + ombre pixel) vient déjà de la coquille v3, qui
// habille `.v-menu > .v-overlay__content`. Ne restent ici que les lignes.
.lw-select-menu {
	padding: 2px 0;
	max-height: 320px;
	overflow-y: auto;
}
.lw-select-item {
	display: flex;
	align-items: center;
	gap: 6px;
	padding: 5px 10px;
	cursor: pointer;
	white-space: nowrap;
}
.lw-select-item:hover {
	background: var(--background-secondary);
}
.lw-select-item.selected {
	box-shadow: inset 3px 0 0 var(--primary);
	font-weight: bold;
}

/* Rendu v2 : l'ancien design ne doit pas bouger (REDESIGN.md), donc le composant
   y reprend la silhouette du v-select Material qu'il remplace — champ sans
   cadre posé sur une surface claire, coins arrondis, et pas de pixel push. */
body.v2 .lw-select {
	border: none;
	border-radius: var(--radius);
	background: var(--background-secondary);
	padding: 6px 8px;
	&.open:not(.disabled) {
		transform: none;
	}
	&:hover:not(.disabled) {
		border-color: transparent;
	}
}
body.v2 .lw-select-item.selected {
	box-shadow: none;
	color: var(--primary);
}
</style>
