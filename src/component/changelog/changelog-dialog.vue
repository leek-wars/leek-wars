<template lang="html">
	<popup :value="value" :width="800" :full="true" @input="$emit('input', $event)">
		<v-icon slot="icon">mdi-star</v-icon>
		<i18n-t slot="title" keypath="changelog.version_online">
			<b v-if="changelog" slot="version">{{ changelog.version_name }}</b>
		</i18n-t>
		<div v-if="changelog" class="changelog">
			<changelog-version :version="changelog" />
			<div class="all">
				<i18n-t keypath="changelog.see_all_changes">
					<router-link slot="changelog" to="/changelog">changelog</router-link>
				</i18n-t>
			</div>
		</div>
		<template #actions>
			<div v-ripple @click="$emit('input', false)">{{ $t('main.ok') }} :)</div>
		</template>
	</popup>
</template>

<script lang="ts">
	import { Options, Prop, Vue } from 'vue-property-decorator'
	import ChangelogVersion from './changelog-version.vue'

	@Options({ name: 'changelog-dialog', i18n: {}, components: { ChangelogVersion } })
	export default class ChangelogDialog extends Vue {
		@Prop({required: true}) changelog!: any
		@Prop() value!: boolean

	}
</script>

<style lang="scss" scoped>
	a, a:visited {
		color: #5fad1b;
	}
	.all {
		padding: 15px;
		padding-top: 5px;
		background: var(--background);
	}
</style>