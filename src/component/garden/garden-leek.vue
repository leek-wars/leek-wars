<template lang="html">
	<rich-tooltip-leek :id="leek.id" v-slot="{ on }" :bottom="true" :instant="true">
		<div v-if="leek" class="leek" v-on="on">
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
	.leek {
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