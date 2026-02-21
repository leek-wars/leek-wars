<template lang="html">
	<div class="scheme-preview">
		<scheme ref="schemeElement" :scheme="scheme" :show-result="true" :show-price="false" @update:model-value="$emit('update:modelValue', $event)" />

		<v-btn class="button" :disabled="!$store.getters.scheme_possible(scheme)" @click="emitter.emit('craft', scheme)"><v-icon>mdi-hammer-wrench</v-icon> Fabriquer</v-btn>
	</div>
</template>

<script lang="ts">
	import { SchemeTemplate } from '@/model/scheme'
	import { Options, Prop, Vue } from 'vue-property-decorator'
	import SchemeView from './scheme.vue';
	import { emitter } from '@/model/vue';

	@Options({ components: { 'scheme': SchemeView } })
	export default class SchemePreview extends Vue {
		@Prop() scheme!: SchemeTemplate

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