<template lang="html">
	<popup :model-value="modelValue" :width="800" :full="true">
		<template #icon>
			<v-icon>mdi-star</v-icon>
		</template>
		<template #title>
			<i18n-t keypath="changelog.version_online">
				<template #version>
					<b v-if="changelog">{{ changelog.version_name }}</b>
				</template>
			</i18n-t>
		</template>
		<div v-if="changelog" class="changelog">
			<changelog-version :version="changelog" />
			<div class="all">
				<i18n-t keypath="changelog.see_all_changes">
					<template #changelog>
						<router-link to="/changelog">changelog</router-link>
					</template>
				</i18n-t>
			</div>
		</div>
		<template #actions>
			<div v-ripple @click="$emit('update:modelValue', false)">{{ $t('main.ok') }} :)</div>
		</template>
	</popup>
</template>

<script lang="ts">
	import { Options, Prop, Vue } from 'vue-property-decorator'
	import ChangelogVersion from './changelog-version.vue'

	@Options({ name: 'changelog-dialog', i18n: {}, components: { ChangelogVersion } })
	export default class ChangelogDialog extends Vue {
		@Prop({required: true}) changelog!: any
		@Prop() modelValue!: boolean

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