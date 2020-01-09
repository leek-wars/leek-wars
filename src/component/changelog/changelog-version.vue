<template lang="html">
	<div class="version">
		<img v-if="version.image" :src="'/image/mail/mail_' + version.version + '.png'" class="image">
		<div v-for="(section, s) in changes" :key="s" class="section">
			<h4 v-emojis v-if="changes.length > 1" :class="{first: s === 0}">{{ $t('changelog.title_' + s) }}</h4>
			<div v-for="(change, c) in section" :key="c" class="change" v-html="'➤ ' + change"></div>
		</div>
		<router-link v-if="version.forum_topic" :to="'/forum/category-' + version.forum_category + '/topic-' + version.forum_topic">
			<v-btn class="button">➤ {{ $t('changelog.forum_topic') }}</v-btn>
		</router-link>
	</div>
</template>

<script lang="ts">
	import { LeekWars } from '@/model/leekwars'
	import { Component, Prop, Vue } from 'vue-property-decorator'
	
	@Component({ name: 'changelog-version', i18n: {} })
	export default class ChangelogVersion extends Vue {
		@Prop({required: true}) version!: any
		get changes() {
			if (!this.version) return []
			const data = this.$t('changelog.' + this.version.data) as string
			return data.split("=====").map(s => s.split("\n").filter((c) => c.length > 0).map((c) => c.replace('# ', '')))
		}
	}
</script>

<style lang="scss" scoped>
	.change {
		padding: 0 10px;
		line-height: 20px;
	}
	.image {
		width: calc(100% + 30px);
		margin-left: -15px;
		margin-right: -15px;
		margin-bottom: 10px;
		margin-top: -15px;
	}
	h4 {
		margin-bottom: 10px;
		text-transform: uppercase;
		color: #000;
	}
	h4:not(.first) {
		margin-top: 10px;
	}
	.button {
		margin-top: 10px;
	}
</style>