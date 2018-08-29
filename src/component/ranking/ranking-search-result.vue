<template>
	<router-link :to="'/' + result.type + '/' + result.id">
		<div class="result">
			<div class="image">
				<img :src="result.image">
			</div>
			<div class="name">{{ result.name }}</div>
			<div class="level">{{ description }}</div>
		</div>
	</router-link>
</template>

<script lang="ts">
	import { i18n } from '@/model/i18n'
	import { Component, Prop, Vue } from 'vue-property-decorator'
	@Component({})
	export default class RankingSearchResult extends Vue {
		@Prop({ required: true }) result!: any
		get description() {
			if (this.result.type === 'leek') {
				return i18n.t('ranking.leek_level', [this.result.level])
			} else if (this.result.type === 'farmer') {
				return i18n.t('ranking.farmer')
			} else if (this.result.type === 'team') {
				return i18n.t('ranking.team_level', [this.result.level])
			}
		}
	}
</script>

<style lang="scss" scoped>
	.result {
		height: 40px;
		margin-bottom: 4px;
	}
	.result:hover {
		background: white;
		box-shadow: 0px 2px 1px -1px rgba(0,0,0,0.2), 0px 1px 1px 0px rgba(0,0,0,0.14), 0px 1px 3px 0px rgba(0,0,0,0.12);
	}
	.result img {
		max-width: 40px;
		max-height: 40px;
	}
	.result .image {
		width: 40px;
		height: 40px;
		float: left;
		margin-right: 8px;
		text-align: center;
	}
	.result .level {
		color: #aaa;
		font-size: 13px;
	}
</style>