<template lang="html">
	<div class="scheme-preview">
		<scheme ref="schemeElement" :scheme="scheme" :show-result="true" :show-price="false" @update:model-value="$emit('update:modelValue', $event)" />

		<v-btn v-if="showCraft" class="button" :disabled="!$store.getters.scheme_possible(scheme)" @click="emitter.emit('craft', scheme)" prepend-icon="mdi-hammer-wrench">{{ $t('main.craft') }}</v-btn>
	</div>
</template>

<script lang="ts">
	import { SchemeTemplate } from '@/model/scheme'
	import { defineAsyncComponent } from 'vue';
	import { Options, Prop, Vue } from 'vue-property-decorator'
	import { emitter } from '@/model/vue';
	const SchemeView = defineAsyncComponent(() => import('./scheme.vue'))

	@Options({ components: { 'scheme': SchemeView } })
	export default class SchemePreview extends Vue {
		@Prop() scheme!: SchemeTemplate
		@Prop({ default: true }) showCraft!: boolean

		emitter = emitter
	}
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