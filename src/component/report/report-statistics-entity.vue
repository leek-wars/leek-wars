<template>
	<tr :class="{summon: entity.leek.summon}" class="entity">
		<td class="name">
			<span v-if="entity.alive" class="alive"></span>
			<span v-else class="dead"></span>
			<span class="text">{{ entity.name }}</span>
		</td>
		<td>{{ entity.level }}</td>
		<td v-for="stat in stats" :key="stat" :class="{best: best[stat] === entity.leek.id}">{{ entity[stat] | number }}</td>
	</tr>
</template>

<script lang="ts">
	import { Component, Prop, Vue } from 'vue-property-decorator'
	@Component({})
	export default class ReportStatisticsEntity extends Vue {
		@Prop({required: true}) entity!: any
		@Prop({required: true}) stats!: string[]
		@Prop({required: true}) best!: any
	}
</script>

<style lang="scss" scoped>
	td {
		border: 1px solid #ddd;
		text-align: center;
		padding: 4px 8px;
	}
	.best {
		font-weight: bold;
		font-size: 16px;
		background: white;
	}
	.name {
		text-align: left;
		width: 180px;
		text-overflow: ellipsis;
		overflow: hidden;
		white-space: nowrap;
	}
	.summon .name .text {
		padding-left: 20px;
	}
	.alive {
		margin-left: 27px;
	}
	.dead {
		background-image: url("/image/cross.png");
		width: 15px;
		height: 20px;
		display: inline-block;
		margin-right: 12px;
		vertical-align: bottom;
	}
</style>