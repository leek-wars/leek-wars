<template lang="html">
	<div class="lw-input" :class="{disabled, error: !!error}" v-bind="rootAttrs">
		<label v-if="label" class="label" :for="id">{{ label }}</label>
		<div class="field">
			<v-icon v-if="prependInnerIcon" class="prepend">{{ prependInnerIcon }}</v-icon>
			<input :id="id" ref="input" v-bind="inputAttrs" :type="type || 'text'" :value="modelValue" :placeholder="placeholder" :disabled="disabled" @input="onInput">
			<span v-if="suffix" class="suffix">{{ suffix }}</span>
			<v-icon v-if="clearable && modelValue" class="clear" @click="clear">mdi-close</v-icon>
		</div>
		<div v-if="error" class="message error-message">{{ error }}</div>
		<div v-else-if="message" class="message">{{ message }}</div>
	</div>
</template>

<script setup lang="ts">
// Champ texte maison, remplaçant de v-text-field (REDESIGN.md : sortie des
// contrôles Material). Le label est posé EN FIXE au-dessus du champ, et non
// flottant comme chez Vuetify : c'est le choix de Pierre, et ça évite tout le
// mécanisme d'animation et d'encoche du contour.
import { computed, ref, useAttrs } from 'vue'

defineOptions({ name: 'LWInput', inheritAttrs: false })

const props = defineProps<{
	modelValue?: string | number | null
	// `v-model.number` passe ses modificateurs ici : sans les lire, un champ
	// numérique renverrait une chaîne et casserait les comparaisons côté appelant.
	modelModifiers?: { number?: boolean, trim?: boolean }
	label?: string
	placeholder?: string
	type?: string
	suffix?: string
	prependInnerIcon?: string
	clearable?: boolean
	disabled?: boolean
	hint?: string
	errorMessages?: string | string[]
	// `messages` : le pendant informatif de `error-messages`, que l'éditeur
	// utilise pour avertir sur les noms de fichiers refusés par Windows.
	// Sans cette prop, l'avertissement disparaissait dans les attributs.
	messages?: string | string[]
}>()

const emit = defineEmits<{
	'update:modelValue': [value: string | number | null]
}>()

const attrs = useAttrs()
const input = ref<HTMLInputElement | null>(null)

// `inheritAttrs: false` sinon les attributs iraient tous sur la racine, alors
// que `autofocus`, `type` ou `@keyup.enter` doivent atteindre le champ. Mais
// `class` et `style`, eux, visent bien la boîte entière : l'appelant écrit
// `style="max-width: 130px"` ou une classe d'état pour le tout, pas pour
// l'input seul. D'où la répartition.
const rootAttrs = computed(() => ({ class: attrs.class, style: attrs.style }))
const inputAttrs = computed(() => {
	const rest = { ...attrs }
	delete rest.class
	delete rest.style
	return rest
})

let uid = 0
const id = 'lw-input-' + (uid++)

const first = (v?: string | string[]) => Array.isArray(v) ? v[0] : v
const error = computed(() => first(props.errorMessages))
const message = computed(() => first(props.messages) || props.hint)

function onInput(e: Event) {
	let value: string | number = (e.target as HTMLInputElement).value
	if (props.modelModifiers?.trim) { value = value.trim() }
	if (props.modelModifiers?.number) {
		const n = parseFloat(value)
		// Comme le v-model.number de Vue : la valeur brute est conservée quand
		// elle n'est pas un nombre, sinon taper « 1e » viderait le champ.
		if (!isNaN(n)) { value = n }
	}
	emit('update:modelValue', value)
}

function clear() {
	emit('update:modelValue', '')
	input.value?.focus()
}

// v-text-field exposait focus() sur son instance, et quatre appelants s'en
// servent (dialogues de l'éditeur) : sans ça, `ref.focus()` serait silencieux.
defineExpose({
	focus: () => input.value?.focus(),
	select: () => input.value?.select(),
	blur: () => input.value?.blur(),
	input,
	attrs,
})
</script>

<style lang="scss">
.lw-input {
	display: flex;
	flex-direction: column;
	gap: 4px;
	min-width: 0;
	.label {
		font-size: 12px;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		color: var(--text-color-secondary);
	}
	.field {
		display: flex;
		align-items: center;
		gap: 6px;
		background: var(--background-input);
		border: 1px solid var(--border-strong);
		padding: 0 8px;
		transition: border-color .12s ease;
	}
	.field:focus-within {
		border-color: var(--primary);
	}
	input {
		flex: 1;
		min-width: 0;
		background: none;
		border: none;
		outline: none;
		color: var(--text-color);
		font-family: var(--font-body);
		font-size: 14px;
		height: 32px;
		padding: 0;
	}
	input::placeholder {
		color: var(--text-color-faint);
	}
	.prepend, .suffix, .clear {
		color: var(--text-color-secondary);
		font-size: 18px;
		flex: none;
	}
	.suffix {
		font-size: 13px;
	}
	.clear {
		cursor: pointer;
	}
	.clear:hover {
		color: var(--text-color);
	}
	.message {
		font-size: 12px;
		color: var(--text-color-secondary);
	}
	&.error .field {
		border-color: var(--error);
	}
	.error-message {
		color: var(--error);
	}
	&.disabled {
		opacity: 0.5;
		pointer-events: none;
	}
}

/* Rendu v2 : le champ garde la silhouette du v-text-field « outlined » qu'il
   remplace — contour arrondi et label au-dessus en gris. Il n'est pas identique
   au pixel près (le label flottant et son encoche dans le contour sautent),
   c'est le seul écart assumé de la famille des contrôles maison. */
body.v2 .lw-input {
	.field {
		border: 1px solid var(--grey-10);
		border-radius: var(--radius);
		background: var(--pure-white);
	}
	.field:focus-within {
		border-color: var(--primary);
		box-shadow: 0 0 0 1px var(--primary);
	}
	.label {
		text-transform: none;
		letter-spacing: normal;
		color: var(--grey-7);
	}
}
</style>
