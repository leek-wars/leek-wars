<template>
	<div class="result card">
		<div v-ripple class="main" @click="$emit('gotoresult', result)">
			<div class="image">
				<rich-tooltip-leek v-if="result.type === 'leek'" :id="result.id" v-slot="{ on }">
					<leek-image :leek="result" :scale="1" width="40" height="40" :on="on" />
				</rich-tooltip-leek>
				<rich-tooltip-farmer v-else-if="result.type === 'farmer'" :id="result.id" v-slot="{ on }">
					<avatar :farmer="result" :on="on" />
				</rich-tooltip-farmer>
				<emblem v-else-if="result.type === 'team'" :team="result" />
			</div>
			<div class="name">
				<rich-tooltip-farmer v-if="result.type === 'farmer'" :id="result.id" v-slot="{ on }">
					<span v-on="on">{{ result.name }}</span>
				</rich-tooltip-farmer>
				<span v-else>{{ result.name }}</span>
			</div>
			<div class="level">{{ description }}</div>
		</div>
		<router-link :to="'/' + result.type + '/' + result.id">
			<v-btn text icon color="grey">
				<v-icon>mdi-account-outline</v-icon>
			</v-btn>
		</router-link>
	</div>
</template>

<script lang="ts">
	import { i18n } from '@/model/i18n'
	import { Component, Prop, Vue } from 'vue-property-decorator'
	import RichTooltipFarmer from '@/component/rich-tooltip/rich-tooltip-farmer.vue'
	import RichTooltipLeek from '@/component/rich-tooltip/rich-tooltip-leek.vue'
	import RichTooltipTeam from '@/component/rich-tooltip/rich-tooltip-team.vue'

	@Component({ components: { RichTooltipFarmer, RichTooltipLeek, RichTooltipTeam } })
	export default class RankingSearchResult extends Vue {
		@Prop({ required: true }) result!: any
		get description() {
			if (this.result.type === 'leek') {
				return i18n.t('main.leek_level', [this.result.level])
			} else if (this.result.type === 'farmer') {
				return i18n.t('main.farmer')
			} else if (this.result.type === 'team') {
				return i18n.t('main.team_level', [this.result.level])
			}
		}
	}
</script>

<style lang="scss" scoped>
	.result {
		height: 44px;
		display: flex;
		margin-top: 6px;
	}
	.result .main {
		flex: 1;
		padding: 2px;
		border-radius: 3px;
		cursor: pointer;
	}
	.result img {
		max-width: 40px;
		max-height: 40px;
	}
	.result .name {
		margin: 2px 0;
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
	button {
		margin: 4px;
	}
</style>