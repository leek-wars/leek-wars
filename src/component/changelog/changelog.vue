<template lang="html">
	<div class="changelog-page">
		<div class="page-header page-bar">
			<h1>{{ $t('title') }}</h1>
		</div>
		<panel v-if="!changelog" class="first">
			<loader />
		</panel>
		<template v-else>
			<panel v-for="(version, v) in changelog" :key="version.version" :class="{last: v === changelog.length - 1}">
				<h2 slot="title">{{ $t('version_n', [version.version_name]) }} ({{ version.date }})</h2>
				<div slot="content" class="wrapper">
					<div class="content">
						<changelog-version :version="version" />
					</div>
				</div>
			</panel>
		</template>
	</div>
</template>

<script lang="ts">
	import { LeekWars } from '@/model/leekwars'
	import { Component, Vue } from 'vue-property-decorator'
	import ChangelogVersion from './changelog-version.vue'
	
	@Component({ name: 'changelog', i18n: {}, components: { ChangelogVersion } })
	export default class Changelog extends Vue {
		changelog: any = null
		created() {
			LeekWars.get('changelog/get/' + this.$i18n.locale).then(data => {
				this.changelog = data.changelog
				LeekWars.setTitle(this.$t('title'))
				this.$root.$emit('loaded')
			})
		}
	}
</script>

<style lang="scss" scoped>
	.changelog-page {
		font-size: 16px;
	}
	.change {
		padding: 0 10px;
	}
	.wrapper {
		background: rgba(100,100,100,0.1);
	}
	.content {
		max-width: 800px;
		margin: 0 auto;
		background: #f2f2f2;
		padding: 15px;
	}
	.changelog-page /deep/ a {
		color: green;
	}
	.image {
		width: calc(100% + 30px);
		margin-left: -15px;
		margin-right: -15px;
		margin-bottom: 10px;
		margin-top: -15px;
	}
</style>