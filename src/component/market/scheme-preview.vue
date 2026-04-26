<template lang="html">
	<div class="scheme-preview">
		<scheme ref="schemeElement" :scheme="scheme" :show-result="true" :show-price="false" @update:model-value="$emit('update:modelValue', $event)" />

		<v-btn v-if="showCraft" class="button" :disabled="!$store.getters.scheme_possible(scheme)" @click="emitter.emit('craft', scheme)" prepend-icon="mdi-hammer-wrench">{{ $t('main.craft') }}</v-btn>
	</div>
</template>

<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
import type { SchemeTemplate } from '@/model/scheme'
import { emitter } from '@/model/vue'

const SchemeView = defineAsyncComponent(() => import('./scheme.vue'))

defineOptions({ components: { 'scheme': SchemeView } })

withDefaults(defineProps<{
	scheme: SchemeTemplate
	showCraft?: boolean
}>(), {
	showCraft: true,
})

defineEmits<{
	'update:modelValue': [value: any]
}>()

const _emitter = emitter
defineExpose({ emitter: _emitter })
</script>

<style scoped lang="scss">
.scheme-preview {
	background: var(--background);
}
.scheme {
	background: var(--pure-white);
}
.v-btn.button {
	margin: 15px;
}
</style>