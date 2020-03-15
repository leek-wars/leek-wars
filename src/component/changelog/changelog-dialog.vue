<template lang="html">
	<popup :value="value" :width="800" :full="true" @input="$emit('input', $event)">
		<i18n slot="title" path="changelog.version_online">
			<b v-if="changelog" slot="version">{{ changelog.version_name }}</b>
		</i18n>
		<div v-if="changelog" class="changelog">
			<changelog-version :version="changelog" />
			<div class="all">
				<i18n path="changelog.see_all_changes">
					<router-link slot="changelog" to="/changelog">changelog</router-link>
				</i18n>
			</div>
		</div>
		<div slot="actions">
			<div @click="$emit('input', false)">{{ $t('changelog.popup_ok') }}</div>
		</div>
	</popup>
</template>

<script lang="ts">
	import { LeekWars } from '@/model/leekwars'
	import { Component, Prop, Vue } from 'vue-property-decorator'
	import ChangelogVersion from './changelog-version.vue'
	
	@Component({ name: 'changelog-dialog', i18n: {}, components: { ChangelogVersion } })
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
		background: #f2f2f2;
	}
</style>