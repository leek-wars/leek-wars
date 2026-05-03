<template>
	<div class="result card">
		<div v-ripple class="main" @click="$emit('gotoresult', result)">
			<div class="image">
				<rich-tooltip-leek v-if="result.type === 'leek'" :id="result.id" v-slot="{ props }">
					<span v-bind="props"><leek-image :leek="result" :scale="1" width="44" height="44" /></span>
				</rich-tooltip-leek>
				<rich-tooltip-farmer v-else-if="result.type === 'farmer'" :id="result.id">
					<avatar :farmer="result" />
				</rich-tooltip-farmer>
				<emblem v-else-if="result.type === 'team'" :team="result" />
			</div>
			<div class="name">
				<rich-tooltip-farmer v-if="result.type === 'farmer'" :id="result.id">
					<span>{{ result.name }}</span>
				</rich-tooltip-farmer>
				<span v-else>{{ result.name }}</span>
			</div>
			<div class="level">{{ description }}</div>
		</div>
		<router-link :to="'/' + result.type + '/' + result.id">
			<v-btn variant="text" size="small" color="grey" icon="mdi-account-outline" />
		</router-link>
	</div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { i18n } from '@/model/i18n'
import RichTooltipFarmer from '@/component/rich-tooltip/rich-tooltip-farmer.vue'
import RichTooltipLeek from '@/component/rich-tooltip/rich-tooltip-leek.vue'
import RichTooltipTeam from '@/component/rich-tooltip/rich-tooltip-team.vue'

const props = defineProps<{
	result: any
}>()

defineEmits<{
	gotoresult: [result: any]
}>()

const description = computed(() => {
	if (props.result.type === 'leek') return i18n.t('main.leek_level', [props.result.level])
	if (props.result.type === 'farmer') return i18n.t('main.farmer')
	if (props.result.type === 'team') return i18n.t('main.team_level', [props.result.level])
	return ''
})
</script>

<style lang="scss" scoped>
	.result {
		height: 48px;
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
		max-width: 44px;
		max-height: 44px;
	}
	.result .name {
		margin: 3px 0;
	}
	.result .image {
		width: 44px;
		height: 44px;
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