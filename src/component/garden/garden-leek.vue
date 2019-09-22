<template lang="html">
	<rich-tooltip-leek v-ripple :id="leek.id" :bottom="true" :instant="true" :leek="leek.id" :disabled="leek.id in $store.state.farmer.leeks" class="leek">
		<div v-if="leek" class="elem">
			<div class="image">
				<leek-image :leek="leek" :scale="0.70" />
			</div>
			<div class="name">{{ leek.name }}</div>
			<talent :talent="leek.talent" />
			<br>
			<span class="level">{{ $t('main.level_n', [leek.level]) }}</span>
		</div>
	</rich-tooltip-leek>
</template>

<script lang="ts">
	import { Leek } from '@/model/leek'
	import { Component, Prop, Vue } from 'vue-property-decorator'
	@Component({ name: 'garden-leek' })
	export default class GardenLeek extends Vue {
		@Prop() leek!: Leek
	}
</script>

<style lang="scss" scoped>
	.elem {
		width: 100%;
		padding: 10px 0;
	}
	.name {
		font-size: 20px;
		font-weight: 500;
		padding: 0 5px;
		padding-top: 4px;
		text-overflow: ellipsis;
		overflow: hidden;
		white-space: nowrap;
	}
	.talent {
		margin: 5px 0;
	}
	.level {
		font-size: 17px;
		color: #555;
		font-weight: 500;
	}
</style>