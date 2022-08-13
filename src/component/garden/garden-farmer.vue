<template lang="html">
	<rich-tooltip-farmer :id="farmer.id" v-slot="{ on }" :bottom="farmer.id !== $store.state.farmer.id" :instant="true" class="rich">
		<div class="elem" v-on="on">
			<avatar :farmer="farmer" />
			<div class="name">{{ farmer.name }}</div>
			<talent :id="farmer.id" :talent="farmer.talent" category="farmer" />
			<div class="level">
				{{ farmer.leek_count }} <img src="/image/icon/black/leek.png"> • {{ $t('main.level_n', [farmer.total_level]) }}
			</div>
		</div>
	</rich-tooltip-farmer>
</template>

<script lang="ts">
	import { Component, Prop, Vue } from 'vue-property-decorator'
	import Avatar from '../avatar.vue'
	import RichTooltipFarmer from '@/component/rich-tooltip/rich-tooltip-farmer.vue'

	@Component({
		components: { avatar: Avatar, RichTooltipFarmer }
	})
	export default class GardenFarmer extends Vue {
		@Prop() farmer!: any
	}
</script>

<style lang="scss" scoped>
	.elem {
		width: 100%;
		padding: 10px 0;
	}
	.avatar {
		width: 120px;
		height: 120px;
	}
	.talent {
		margin: 5px 0;
	}
	.name {
		font-size: 18px;
		font-weight: 500;
		padding: 5px;
		padding-bottom: 3px;
		text-overflow: ellipsis;
		overflow: hidden;
	}
	.level {
		font-size: 15px;
		padding-top: 3px;
		color: #555;
		font-weight: 500;
		display: flex;
		align-items: flex-start;
		justify-content: center;
		img {
			width: 16px;
			opacity: 0.5;
			margin: 0 3px;
		}
	}
</style>