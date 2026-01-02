<template lang="html">
	<div class="scheme-preview">
		<scheme ref="schemeElement" :scheme="scheme" :show-result="true" :show-price="false" @input="$emit('input', $event)" />

		<v-btn class="button" :disabled="!$store.getters.scheme_possible(scheme)" @click="emitter.emit('craft', scheme)"><v-icon>mdi-hammer-wrench</v-icon> Fabriquer</v-btn>
	</div>
</template>

<script lang="ts">
	import { SchemeTemplate } from '@/model/scheme'
	import { Options, Prop, Vue } from 'vue-property-decorator'
	import SchemeView from './scheme.vue';

	@Options({ components: { 'scheme': SchemeView } })
	export default class SchemePreview extends Vue {
		@Prop() scheme!: SchemeTemplate


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