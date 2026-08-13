<template lang="html">
	<div class="lw-checkbox" :class="{disabled}" @click="onClick">
		<input ref="input" type="checkbox" :checked="modelValue" :disabled="disabled" @click.stop @change="onChange">
		<span class="box" aria-hidden="true"><span class="check"></span></span>
		<span v-if="label || $slots.label" class="label"><slot name="label">{{ label }}</slot></span>
	</div>
</template>

<script setup lang="ts">
// Case à cocher maison de Leek Wars 3.0, remplaçante de v-checkbox
// (REDESIGN.md : sortie des contrôles Material). Même mécanique que
// lw-switch : clic rejoué sur l'input caché, input contrôlé par la prop,
// @change et @update:model-value des parents servis comme avant.
import { ref } from 'vue'

defineOptions({ name: 'LWCheckbox' })

const props = defineProps<{
	modelValue?: boolean
	label?: string
	disabled?: boolean
}>()

const emit = defineEmits<{
	'update:modelValue': [value: boolean]
}>()

const input = ref<HTMLInputElement | null>(null)

function onClick() {
	if (props.disabled) { return }
	input.value?.click()
}

function onChange(e: Event) {
	const checked = (e.target as HTMLInputElement).checked
	;(e.target as HTMLInputElement).checked = !!props.modelValue
	emit('update:modelValue', checked)
}
</script>

<style lang="scss">
.lw-checkbox {
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
	/* Coche en L retourné, tracée par deux bords : pas de glyphe, pas d'image */
	.check {
		position: absolute;
		top: 1px;
		left: 4px;
		width: 6px;
		height: 10px;
		border: solid transparent;
		border-width: 0 2px 2px 0;
		transform: rotate(45deg);
	}
	input:checked ~ .box {
		background: var(--primary);
		border-color: var(--primary);
		.check {
			border-color: var(--primary-text);
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

/* Rendu v2 : silhouette Material de la v-checkbox remplacée (REDESIGN.md),
   pour que la bascule « Ancien design » reste fidèle. */
body.v2 .lw-checkbox {
	.box {
		width: 18px;
		height: 18px;
		border: 2px solid rgba(0, 0, 0, 0.54);
		border-radius: 2px;
		background: transparent;
	}
	.check {
		top: 0;
		left: 4px;
		width: 6px;
		height: 11px;
	}
	input:checked ~ .box {
		background: var(--primary);
		border-color: var(--primary);
		.check {
			/* Blanc littéral : --pure-white s'inverse en sombre dans le v2,
			   la coche Material reste blanche dans les deux thèmes. */
			border-color: #fff;
		}
	}
	&:active:not(.disabled) .box {
		transform: none;
	}
}
body.v2.dark .lw-checkbox .box {
	border-color: rgba(255, 255, 255, 0.7);
}
</style>
