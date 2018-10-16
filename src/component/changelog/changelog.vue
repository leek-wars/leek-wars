<template lang="html">
	<div id="changelog-page">
		<div class="page-header page-bar">
			<h1>{{ $t('title') }}</h1>
		</div>
		<div v-if="!changelog" class="panel">
			<div class="content">
				<loader />
			</div>
		</div>
		<template v-else>
			<div v-for="version in changelog" :key="version.version" class="panel">
				<div class="header">
					<h2>{{ $t('version_n', [version.version_name]) }} ({{ version.date }})</h2>
					<div v-if="version.forum_topic" class="right">
						<router-link :to="'/forum/category-' + version.forum_category + '/topic-' + version.forum_topic">
							<div class="button flat">➤ {{ $t('forum_topic') }}</div>
						</router-link>
					</div>
				</div>
				<div class="content">
					<div class="wrapper">
						<div v-for="(change, c) in version.changes" :key="c" class="change" v-html="'➤ ' + change"></div>
					</div>
				</div>
			</div>
		</template>
	</div>
</template>

<script lang="ts">
	import { LeekWars } from '@/model/leekwars'
	import { Component, Vue } from 'vue-property-decorator'
	
	@Component({ name: 'changelog', i18n: {} })
	export default class Changelog extends Vue {
		changelog: any = null
		created() {
			LeekWars.get<any>('changelog/get/' + this.$i18n.locale).then((data) => {
				for (const d of data.data.changelog) {
					const changes_data = this.$t(d.data) as string
					d.changes = []
					const changes_array = changes_data.split("\n")
					for (const c of changes_array) {
						const change = c.replace('# ', '')
						if (change.length > 0) {
							d.changes.push(change)
						}
					}
				}
				this.changelog = data.data.changelog
				LeekWars.setTitle(this.$t('title'))
				this.$root.$emit('loaded')
			})
		}
	}
</script>

<style lang="scss" scoped>
	#changelog-page {
		font-size: 16px;
	}
	.change {
		padding: 0 10px;
	}
	.panel .content {
		background: rgba(100,100,100,0.1);
		padding: 0;
	}
	.wrapper {
		max-width: 800px;
		margin: 0 auto;
		background: #f2f2f2;
		padding: 15px;
	}
	#changelog-page /deep/ a {
		color: green;
	}
</style>