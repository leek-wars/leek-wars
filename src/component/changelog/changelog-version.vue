<template lang="html">
	<div class="version">
		<img v-if="version.image" :src="'/image/mail/mail_' + version.version + '.webp'" class="image" loading="lazy">
		<div class="wrapper">
			<div v-for="(changes, s) in sections" :key="s" class="section">
				<h4 v-if="sections.length > 1" :class="{first: s === 0}">{{ $t('changelog.title_' + s) }}</h4>
				<div v-for="(change, c) in changes" :key="c" class="change">
					<span v-html="'➤ ' + change.text"></span>
					<v-menu v-for="image in change.images" :key="image" :close-on-content-click="false" :width="280" offset-overflow :nudge-top="0" transition="none" :open-on-hover="true" :open-delay="200" offset-y>
						<template v-slot:activator="{ props }">
							<v-icon class="screenshot" v-bind="props">mdi-tooltip-image-outline</v-icon>
						</template>
						<img class="image-menu" :src="'/image/changelog/' + image + '.png'">
					</v-menu>
				</div>
			</div>
			<router-link v-if="version.forum_topic" :to="'/forum/category-' + version.forum_category + '/topic-' + version.forum_topic">
				<v-btn color="primary" class="button">➤ {{ $t('changelog.forum_topic') }}</v-btn>
			</router-link>
		</div>
	</div>
</template>

<script lang="ts">
	import { LeekWars } from '@/model/leekwars'
	import { Options, Prop, Vue, Watch } from 'vue-property-decorator'

	/**
	 * mogrify -format webp -quality 90 *.jpg *.png
	 */
	@Options({ name: 'changelog-version', i18n: {} })
	export default class ChangelogVersion extends Vue {

		@Prop({required: true}) version!: any
		changelog: any = null

		created() {
			this.update()
		}

		@Watch('$i18n.locale')
		update() {
import(/* webpackChunkName: "changelog-[request]" */ `json-loader!yaml-loader!@/component/changelog/changelog.${this.$i18n.locale}.yaml`).then((changelog) => {
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
			const regex = /#img_(\w+)/g
			return changes.map((cat: any) => cat
				.map((c: any) => {
					return {
						text: c.replace('# ', '').replace('#ai', '<span class="ai" title="' + this.$t('changelog.need_ai_change') + '">AI</span>').replace(regex, ''),
						images: Array.from(c.matchAll(regex), (m: any) => m[1])
					}
				})
			)
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
		.screenshot {
			color: #5fad1b;
			cursor: pointer;
			padding: 0 4px;
			border-radius: 4px;
			font-size: 20px;
			vertical-align: top;
			display: inline-block;
			&:hover {
				color: var(--text-color);
				border-color: var(--text-color);
			}
		}
	}
	.image-menu {
		vertical-align: bottom;
		max-width: 800px;
		max-height: 600px;
	}
	.image {
		width: 100%;
		vertical-align: bottom;
	}
	.wrapper {
		max-width: 820px;
		margin: 0 auto;
		background: var(--background);
		padding: 15px;
	}
	h4 {
		margin-bottom: 10px;
		text-transform: uppercase;
		color: var(--text-color);
		font-size: 19px;
	}
	h4:not(.first) {
		margin-top: 10px;
	}
	.button {
		margin-top: 10px;
	}
</style>