<template>
	<div class="panel">
		<div v-if="hasTitle" class="header">
			<h2>
				<v-icon v-if="icon">{{ icon }}</v-icon>
				<slot name="title">{{ title }}</slot>
			</h2>
			<div class="actions">
				<slot name="actions"></slot>
				<div v-if="toggle" class="button text expand" @click="cycle">
					<v-icon>{{ toggleIcon }}</v-icon>
				</div>
			</div>
		</div>
		<template v-if="expanded">
			<slot v-if="$slots.content" name="content"></slot>
			<div v-else class="content">
				<slot></slot>
			</div>
		</template>
	</div>
</template>

<script setup lang="ts">
import { computed, ref, useSlots, watch } from 'vue'

defineOptions({ name: 'Panel' })

const props = withDefaults(defineProps<{
	icon?: string
	title?: string
	toggle?: string
	toggleInvert?: boolean
	/**
	 * Nombre d'etats du bouton. 2 par defaut (replie / ouvert) ; a 3 le bouton boucle
	 * replie -> mi-hauteur -> plein -> replie. C'est au parent de traduire l'etat en
	 * hauteur, le panneau ne connait que son cran (#622).
	 */
	states?: number
}>(), {
	icon: undefined,
	title: undefined,
	toggle: undefined,
	toggleInvert: false,
	states: 2,
})

const emit = defineEmits<{
	'update:expanded': [value: boolean]
	'update:state': [value: number]
}>()

const slots = useSlots()

/** 0 = replie, 1 = mi-hauteur (mode 3 crans seulement), 2 = plein. */
const state = ref(2)
/** Cran d'ouverture par defaut : le plein, dans les deux modes. */
const OPEN = 2

// Les appelants existants lisent et ECRIVENT `expanded` (le redimensionneur de
// l'inventaire le passe a false) : on le garde comme vue booleenne sur le cran.
const expanded = computed({
	get: () => state.value > 0,
	set: (value: boolean) => { state.value = value ? OPEN : 0 },
})

const hasTitle = computed(() => props.title || !!slots.title)

if (props.toggle) {
	const stored = localStorage.getItem(props.toggle)
	if (stored === null) { localStorage.setItem(props.toggle, props.states >= 3 ? '' + OPEN : 'true') }
	// Ancien format booleen : les panneaux deja replies par le joueur le restent.
	state.value = stored === null ? OPEN
		: stored === 'true' ? OPEN
		: stored === 'false' ? 0
		: Math.max(0, Math.min(OPEN, parseInt(stored, 10) || 0))
}

const collapseIcon = computed(() => props.toggleInvert ? 'mdi-chevron-down' : 'mdi-chevron-up')
const expandIcon = computed(() => props.toggleInvert ? 'mdi-chevron-up' : 'mdi-chevron-down')
// L'icone annonce ce que fera le PROCHAIN clic, d'ou le double chevron au cran
// intermediaire : un clic de plus ouvre en grand.
const toggleIcon = computed(() => {
	if (props.states < 3) return state.value > 0 ? collapseIcon.value : expandIcon.value
	if (state.value === 0) return expandIcon.value
	if (state.value === 1) return props.toggleInvert ? 'mdi-chevron-double-up' : 'mdi-chevron-double-down'
	return collapseIcon.value
})

function cycle() {
	state.value = props.states >= 3 ? (state.value + 1) % 3 : (state.value > 0 ? 0 : OPEN)
}

watch(state, () => {
	if (props.toggle) {
		// Le format booleen historique est conserve pour les panneaux a deux crans : une
		// vingtaine de cles existent deja chez les joueurs, et l'inventaire relit la
		// sienne directement. Seul le mode a trois crans stocke un numero.
		localStorage.setItem(props.toggle, props.states >= 3 ? '' + state.value : '' + (state.value > 0))
		emit('update:expanded', state.value > 0)
		emit('update:state', state.value)
	}
})

defineExpose({ expanded, state })
</script>

<style lang="scss" scoped>
	.panel {
		background: var(--background);
		border-radius: var(--radius);
		box-shadow: var(--panel-shadow);
		display: flex;
		flex-direction: column;
		width: 100%;
		margin-bottom: 12px;
		&.last, &:last-child {
			margin-bottom: 0;
		}
	}
	#app.app .panel {
		border-radius: 0;
	}
	.panel.first {
		border-top-left-radius: 0px;
	}
	.panel.auto {
		padding: 20px;
	}
	.panel > .header {
		height: 36px;
		background: var(--panel-header-background);
		position: relative;
		text-align: left;
		border-top-left-radius: var(--radius-small);
		border-top-right-radius: var(--radius-small);
		display: flex;
		i {
			margin-right: 7px;
		}
		h2 {
			color: var(--panel-header-color);
			font-size: 17px;
			display: inline-flex;
			align-items: center;
			height: 36px;
			line-height: 36px;
			padding: 0 12px;
			position: relative;
			white-space: nowrap;
			border-top-left-radius: var(--radius-small);
			text-overflow: ellipsis;
			overflow: hidden;
			flex: 1;
			&:deep(a, a:visited) {
				color: var(--panel-header-color);
				font-weight: bold;
				vertical-align: top;
			}
			&:deep(img) {
				height: 25px;
				margin-right: 8px;
			}
		}
	}
	#app.app .panel > .header {
		border-radius: 0;
	}
	.panel.first > .header {
		border-top-left-radius: 0px;
	}

	.panel.first > .header h2 {
		border-top-left-radius: 0px;
	}
	.header > .actions {
		height: 36px;
		display: flex;
		justify-content: flex-end;
	}
	.header > .actions :deep(.button) {
		height: 36px;
		color: var(--panel-header-color);
		padding: 0 10px;
		cursor: pointer;
		display: inline-flex;
		user-select: none;
		align-items: center;
		gap: 6px;
		img {
			height: 36px;
			width: 28px;
			padding: 7px 3px;
			opacity: 0.9;
			vertical-align: top;
		}
		.v-icon {
			width: 24px;
			height: 24px;
			padding: 6px 0;
			box-sizing: content-box;
			opacity: 0.9;
			color: var(--panel-header-color);
		}
	}
	.header > .actions :deep(> div:last-child.button),
	.header > .actions :deep(> a:last-child .button),
	.header > .actions :deep(> div:last-child .button) {
		border-top-right-radius: var(--radius-small);
	}
	.header > .actions :deep(.button :last-child) {
		margin-right: 0;
	}
	.header > .actions :deep(.button:hover) {
		background: var(--grey-7);
	}
	.header > .actions :deep(.button.green:hover) {
		background: rgba(110, 201, 31, 0.8) 0%;
	}
	.header > .actions :deep(.button.red:hover) {
		background: rgba(201, 31, 31, 0.8) 0%;
	}
	.panel:deep( > .content) {
		padding: 15px;
	}
	.panel.collapsed .content {
		display: none;
	}
</style>