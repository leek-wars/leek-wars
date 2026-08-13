<template lang="html">
	<div class="lw-radio" :class="{disabled}" @click="onClick">
		<input ref="input" type="radio" :name="group?.name" :checked="checked" :disabled="disabled" @click.stop @change="onChange">
		<span class="box" aria-hidden="true"><span class="dot"></span></span>
		<span v-if="label || $slots.label" class="label"><slot name="label">{{ label }}</slot></span>
	</div>
</template>

<script setup lang="ts">
// Bouton radio maison, enfant de lw-radio-group (REDESIGN.md : sortie des
// contrôles Material). Même mécanique que lw-switch : clic rejoué sur
// l'input caché, état contrôlé par le groupe. La sélection remonte par
// group.select(), qui émet update:modelValue sur le groupe.
import { computed, inject, ref } from 'vue'
import type { LWRadioGroupContext } from './lw-radio-group.vue'

defineOptions({ name: 'LWRadio' })

const props = defineProps<{
	value?: unknown
	label?: string
	disabled?: boolean
}>()

const group = inject<LWRadioGroupContext | null>('lw-radio-group', null)
const input = ref<HTMLInputElement | null>(null)

const checked = computed(() => group !== null && group.model.value === props.value)

function onClick() {
	if (props.disabled) { return }
	input.value?.click()
}

function onChange(e: Event) {
	// L'input natif s'est coché tout seul (souris rejouée ou flèche du
	// clavier) : on le ramène à l'état contrôlé, le groupe décide.
	(e.target as HTMLInputElement).checked = checked.value
	group?.select(props.value)
}
</script>

<style lang="scss">
.lw-radio {
	display: inline-flex;
	align-items: center;
	gap: 8px;
	cursor: pointer;
	user-select: none;
	vertical-align: middle;
	input {
		position: absolute;
		width: 1px;
		height: 1px;
		margin: 0;
		opacity: 0;
		pointer-events: none;
	}
	.box {
		position: relative;
		flex-shrink: 0;
		width: 16px;
		height: 16px;
		background: var(--background-input);
		border: 1px solid var(--border-strong);
		transition: background-color .1s linear, border-color .1s linear;
	}
	/* Le point carré : la coche dit « case », le carré plein dit « radio ».
	   Pas de rond, angles francs partout. */
	.dot {
		position: absolute;
		top: 4px;
		left: 4px;
		width: 6px;
		height: 6px;
		background: transparent;
		transition: background-color .1s linear;
	}
	input:checked ~ .box {
		background: var(--primary);
		border-color: var(--primary);
		.dot {
			background: var(--primary-text);
		}
	}
	&:hover:not(.disabled) .box {
		border-color: var(--primary);
	}
	&:active:not(.disabled) .box {
		transform: translate(1px, 1px);
	}
	input:focus-visible ~ .box {
		outline: 2px solid var(--primary);
		outline-offset: 1px;
	}
	.label {
		color: var(--text-color);
	}
	&.disabled {
		cursor: not-allowed;
		opacity: 0.5;
	}
}

/* Rendu v2 : silhouette Material du v-radio remplacé (REDESIGN.md), cercle
   bordé et point rond, pour que la bascule « Ancien design » reste fidèle. */
body.v2 .lw-radio {
	.box {
		width: 20px;
		height: 20px;
		border: 2px solid rgba(0, 0, 0, 0.54);
		border-radius: 50%;
		background: transparent;
	}
	.dot {
		top: 3px;
		left: 3px;
		width: 10px;
		height: 10px;
		border-radius: 50%;
	}
	input:checked ~ .box {
		background: transparent;
		border-color: var(--primary);
		.dot {
			background: var(--primary);
		}
	}
	&:active:not(.disabled) .box {
		transform: none;
	}
}
body.v2.dark .lw-radio .box {
	border-color: rgba(255, 255, 255, 0.7);
}
</style>
