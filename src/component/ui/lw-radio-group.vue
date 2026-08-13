<template lang="html">
	<div class="lw-radio-group" :class="{inline}" role="radiogroup">
		<slot></slot>
	</div>
</template>

<script lang="ts">
// Compteur de module : un `name` unique par groupe, partagé par ses radios
// pour la navigation aux flèches du clavier, jamais entre deux groupes.
let uid = 0

export interface LWRadioGroupContext {
	model: Readonly<{ value: unknown }>
	name: string
	select: (value: unknown) => void
}
</script>

<script setup lang="ts">
// Groupe de boutons radio maison (REDESIGN.md : sortie des contrôles
// Material). Porte le modèle et le distribue aux lw-radio enfants par
// injection.
import { provide, toRef } from 'vue'

defineOptions({ name: 'LWRadioGroup' })

const props = defineProps<{
	modelValue?: unknown
	inline?: boolean
}>()

const emit = defineEmits<{
	'update:modelValue': [value: unknown]
}>()

provide<LWRadioGroupContext>('lw-radio-group', {
	model: toRef(props, 'modelValue'),
	name: 'lw-radio-group-' + (uid++),
	select: (value: unknown) => emit('update:modelValue', value),
})
</script>

<style lang="scss">
.lw-radio-group {
	display: flex;
	flex-direction: column;
	gap: 6px;
	&.inline {
		flex-direction: row;
		flex-wrap: wrap;
		gap: 6px 16px;
	}
}
</style>
