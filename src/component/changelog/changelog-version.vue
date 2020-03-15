<template lang="html">
	<div class="version">
		<img v-if="version.image" :src="'/image/mail/mail_' + version.version + '.png'" class="image">
		<div class="wrapper">
			<div v-for="(changes, s) in sections" :key="s" class="section">
				<h4 v-if="sections.length > 1" v-emojis :class="{first: s === 0}">{{ $t('changelog.title_' + s) }}</h4>
				<div v-for="(change, c) in changes" :key="c" class="change" v-html="'➤ ' + change"></div>
			</div>
			<router-link v-if="version.forum_topic" :to="'/forum/category-' + version.forum_category + '/topic-' + version.forum_topic">
				<v-btn color="primary" class="button">➤ {{ $t('changelog.forum_topic') }}</v-btn>
			</router-link>
		</div>
	</div>
</template>

<script lang="ts">
	import { LeekWars } from '@/model/leekwars'
	import { Component, Prop, Vue } from 'vue-property-decorator'
	
	@Component({ name: 'changelog-version', i18n: {} })
	export default class ChangelogVersion extends Vue {
		@Prop({required: true}) version!: any
		changelog: any = null

		created() {
			import(/* webpackChunkName: "changelog-[request]" */ `json-loader!yaml-loader!@/lang/${this.$i18n.locale}/changelog.yaml`).then((changelog) => {
				this.changelog = changelog
			})
		}

		get changes() {
			if (!this.version || !this.changelog) { return [] }
			return this.changelog[this.version.version]
		}

		get title() {
			return this.changes.title
		}

		get sections() {
			if (!this.version) { return [] }

			const changes = []
			if (Array.isArray(this.changes)) {
				changes.push(this.changes)
			} else {
				for (const key in this.changes) {
					if (key === 'title') { continue }
					changes.push(this.changes[key])
				}
			}
			return changes.map((cat: any) => cat.map((c: any) => c.replace('# ', '').replace('#ai', '<span class="ai" title="' + this.$t('changelog.need_ai_change') + '">AI</span>')))
		}
	}
</script>

<style lang="scss" scoped>
	.version {
		background: rgba(100,100,100,0.1);
	}
	.change {
		padding: 0 10px;
		line-height: 20px;
		::v-deep .ai {
			background: #00a3cc;
			padding: 0 4px;
			color: white;
			border-radius: 4px;
			cursor: help;
		}
	}
	.image {
		width: 100%;
		vertical-align: bottom;
	}
	.wrapper {
		max-width: 800px;
		margin: 0 auto;
		background: #f2f2f2;
		padding: 15px;
	}
	h4 {
		margin-bottom: 10px;
		text-transform: uppercase;
		color: #000;
		font-size: 19px;
	}
	h4:not(.first) {
		margin-top: 10px;
	}
	.button {
		margin-top: 10px;
	}
</style>