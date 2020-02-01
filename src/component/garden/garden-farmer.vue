<template lang="html">
	<rich-tooltip-farmer :id="farmer.id" v-slot="{ on }" :bottom="true" :instant="true" class="rich">
		<div class="elem" v-on="on">
			<avatar :farmer="farmer" />
			<div class="name">{{ farmer.name }}</div>
			<talent :talent="farmer.talent" />
			<br>
			<span class="level">
				{{ $t('garden.n_leeks', [farmer.leek_count]) }}
			</span>
			<br>
			<span class="level">{{ $t('main.total_level_n', [farmer.total_level]) }}</span>
		</div>
	</rich-tooltip-farmer>
</template>

<script lang="ts">
	import { Component, Prop, Vue } from 'vue-property-decorator'
	import Avatar from '../avatar.vue'
	@Component({
		components: { avatar: Avatar }
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
		font-size: 19px;
		font-weight: 500;
		padding: 0 5px;
		padding-top: 4px;
		text-overflow: ellipsis;
		overflow: hidden;
	}
</style>