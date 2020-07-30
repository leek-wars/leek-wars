<template lang="html">
	<div class="changelog-page">
		<div class="page-header page-bar">
			<h1>{{ $t('main.changelog') }}</h1>
			<div class="tabs">
				<router-link to="/about">
					<div class="tab">
						<v-icon>mdi-information-variant</v-icon>
						{{ $t('main.about') }}
					</div>
				</router-link>
				<router-link to="/statistics">
					<div class="tab">
						<v-icon>mdi-chart-timeline-variant</v-icon>
						{{ $t('main.stats') }}
					</div>
				</router-link>
				<router-link to="/app">
					<div class="tab">
						<v-icon>mdi-cellphone-android</v-icon>
						{{ $t('main.app') }}
					</div>
				</router-link>
			</div>
		</div>
		<panel v-if="!changelog" class="first">
			<loader />
		</panel>
		<template v-else>
			<panel v-for="(version, v) in lazy_changelog" :key="version.version" :class="{last: v === changelog.length - 1}" icon="mdi-star">
				<template slot="title">{{ $t('changelog.version_n', [version.version_name]) }} ({{ version.date | date }}) {{ translations[version.version] && translations[version.version].title ? ' — ' + translations[version.version].title : '' }}</template>
				<template slot="actions">
					<div class="button flat" @click="showChangelogDialog(version)">
						<v-icon>mdi-eye-outline</v-icon>
					</div>
				</template>
				<div slot="content" class="wrapper">
					<div class="content">
						<changelog-version :version="version" />
					</div>
				</div>
			</panel>
		</template>
		<changelog-dialog v-model="changelogDialog" :changelog="changelogVersion" />
	</div>
</template>

<script lang="ts">
	import { LeekWars } from '@/model/leekwars'
	import { Component, Vue } from 'vue-property-decorator'
	import ChangelogDialog from './changelog-dialog.vue'
	import ChangelogVersion from './changelog-version.vue'

	@Component({ name: 'changelog', i18n: {}, components: { ChangelogVersion, ChangelogDialog } })
	export default class Changelog extends Vue {
		changelog: any = null
		changelogDialog: boolean = false
		changelogVersion: any = null
		translations: any = {}
		lazy_end: number = 2

		get lazy_changelog() {
			if (!this.changelog) { return [] }
			return this.changelog.slice(0, this.lazy_end)
		}

		created() {
			LeekWars.get('changelog/get/' + this.$i18n.locale).then(data => {
				this.changelog = data.changelog
				for (const c in this.changelog) {
					Vue.set(this.changelog[c], 'active', parseInt(c, 10) < 2 ? true : false)
				}
				const lw_version = parseInt(LeekWars.normal_version.replace(/\./g, ''), 10)
				if (this.changelog[0].version !== lw_version) {
					this.changelog.unshift({active: true, image: true, version: lw_version, version_name: LeekWars.normal_version.replace(/\.(\d)$/, '$1'), date: Date.now() / 1000, data: 'changelog_' + lw_version})
				}
				LeekWars.setTitle(this.$t('main.changelog'))
				this.$root.$emit('loaded')
			})
			window.addEventListener('scroll', this.scroll)

			import(/* webpackChunkName: "changelog-[request]" */ `json-loader!yaml-loader!@/component/changelog/changelog.${this.$i18n.locale}.yaml`).then((translations) => {
				this.translations = translations
			})
		}
		destroyed() {
			window.removeEventListener('scroll', this.scroll)
		}
		showChangelogDialog(version: any) {
			this.changelogVersion = version
			this.changelogDialog = true
		}
		scroll(e: Event) {
			if (!this.changelog) { return }
			if (this.lazy_changelog.length < this.changelog.length) {
				if (window.scrollY + window.innerHeight + 2000 > document.body.clientHeight) {
					this.lazy_end += 2
				}
			}
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
	.changelog-page ::v-deep a {
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