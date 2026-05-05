<template lang="html">
	<rich-tooltip-farmer :id="farmer.id" v-slot="{ props }" :bottom="farmer.id !== $store.state.farmer?.id" :instant="true" class="rich">
		<div class="elem" v-bind="props">
			<avatar :farmer="farmer" />
			<div class="name">{{ farmer.name }}</div>
			<talent :id="farmer.id" :talent="farmer.talent" category="farmer" />
			<div class="level">
				<span class="flex">
				{{ farmer.leek_count }} <img class="icon" src="/image/icon/black/leek.png"></span>
				{{ $t('main.level_n', [farmer.total_level]) }}
				<flag class="country" v-if="farmer.country" :code="farmer.country" />
			</div>
		</div>
	</rich-tooltip-farmer>
</template>

<script setup lang="ts">
import RichTooltipFarmer from '@/component/rich-tooltip/rich-tooltip-farmer.vue'

defineProps<{
	farmer: any
}>()
</script>

<style lang="scss" scoped>
	.elem {
		width: 100%;
		padding: 10px 0;
	}
	.avatar {
		width: 80%;
		aspect-ratio: 1;
	}
	.talent {
		margin: 5px 0;
	}
	.name {
		font-size: 17px;
		font-weight: 500;
		padding: 5px;
		padding-bottom: 3px;
		text-overflow: ellipsis;
		overflow: hidden;
	}
	.level {
		font-size: 14px;
		padding-top: 3px;
		color: var(--text-color-secondary);
		font-weight: 500;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-wrap: wrap;
		gap: 4px 2px;
		.icon {
			width: 16px;
			opacity: 0.5;
			margin: 0 3px;
		}
		.country {
			max-width: 18px;
			max-height: 18px;
			margin-left: 5px;
		}
	}
	#app.app {
		.level {
			font-size: 13px;
		}
	}
	#app.dark .icon {
		filter: invert(1);
	}
</style>