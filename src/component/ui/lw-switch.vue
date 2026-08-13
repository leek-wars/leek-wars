<template lang="html">
	<div class="lw-switch" :class="{disabled}" @click="onClick">
		<input ref="input" type="checkbox" role="switch" :checked="modelValue" :disabled="disabled" @click.stop @change="onChange">
		<span class="track" aria-hidden="true"><span class="thumb"></span></span>
		<span v-if="label || $slots.label" class="label"><slot name="label">{{ label }}</slot></span>
	</div>
</template>

<script setup lang="ts">
// Interrupteur maison de Leek Wars 3.0, remplaçant de v-switch (REDESIGN.md :
// sortie des contrôles Material, décision du 2026-08-12). API alignée sur les
// usages existants : v-model / :model-value, label (prop ou slot), disabled.
// Un @change posé par le parent est reçu par retombée (l'événement natif de
// l'input remonte jusqu'à la racine), comme avec v-switch.
import { ref } from 'vue'

defineOptions({ name: 'LWSwitch' })

const props = defineProps<{
	modelValue?: boolean
	label?: string
	disabled?: boolean
}>()

const emit = defineEmits<{
	'update:modelValue': [value: boolean]
}>()

const input = ref<HTMLInputElement | null>(null)

// Le clic (racine, piste ou libellé) est rejoué sur l'input caché : c'est lui
// qui émet les événements natifs, le clavier (espace) passe par le même chemin.
// Le @click.stop de l'input empêche ce clic synthétique de remonter en doublon
// du clic d'origine — un parent qui fait le toggle dans son propre @click
// (pattern .tab des trophées) ne doit le voir qu'une fois.
function onClick() {
	if (props.disabled) { return }
	input.value?.click()
}

// L'input est contrôlé : son état DOM est ramené à la prop, et le parent seul
// décide (v-model ou mise à jour du store). Un lecteur de e.target.checked
// verrait l'ancienne valeur : aucun usage ne le fait, ils lisent leur modèle.
function onChange(e: Event) {
	const checked = (e.target as HTMLInputElement).checked
	;(e.target as HTMLInputElement).checked = !!props.modelValue
	emit('update:modelValue', checked)
}
</script>

<style lang="scss">
.lw-switch {
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
	.track {
		position: relative;
		flex-shrink: 0;
		width: 36px;
		height: 18px;
		background: var(--background-input);
		border: 1px solid var(--border-strong);
		transition: background-color .1s linear, border-color .1s linear;
	}
	.thumb {
		position: absolute;
		top: 2px;
		left: 2px;
		width: 12px;
		height: 12px;
		background: var(--text-color-faint);
		transition: transform .1s linear, background-color .1s linear;
	}
	input:checked ~ .track {
		background: var(--primary);
		border-color: var(--primary);
		.thumb {
			transform: translateX(18px);
			background: var(--primary-text);
		}
	}
	&:hover:not(.disabled) .track {
		border-color: var(--primary);
	}
	&:active:not(.disabled) .track {
		transform: translate(1px, 1px);
	}
	input:focus-visible ~ .track {
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

/* Rendu v2 : l'ancien design doit rester tel qu'il était (REDESIGN.md), donc
   le composant y reprend la silhouette Material du v-switch qu'il remplace :
   rail arrondi fin, pouce rond débordant, ombre d'élévation. */
body.v2 .lw-switch {
	.track {
		width: 34px;
		height: 14px;
		border: none;
		border-radius: 7px;
		background: rgba(0, 0, 0, 0.38);
	}
	.thumb {
		top: -3px;
		left: 0;
		width: 20px;
		height: 20px;
		border-radius: 50%;
		background: #fafafa;
		box-shadow: var(--elevation-1);
	}
	input:checked ~ .track {
		background: rgba(95, 173, 27, 0.5);
		.thumb {
			transform: translateX(14px);
			background: var(--primary);
		}
	}
	&:hover:not(.disabled) .track {
		border-color: transparent;
	}
	&:active:not(.disabled) .track {
		transform: none;
	}
}
body.v2.dark .lw-switch {
	.track {
		background: rgba(255, 255, 255, 0.3);
	}
	.thumb {
		background: #bdbdbd;
	}
}
</style>
