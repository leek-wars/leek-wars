<template>
	<tr :class="{summon: entity.leek.summon}" class="entity">
		<td class="name">
			<span v-if="entity.alive" class="alive"></span>
			<span v-else class="dead"></span>
			<span class="text">{{ entity.translatedName }}</span>
		</td>
		<td>{{ entity.level }}</td>
		<td v-for="stat in stats" :key="stat" :class="{best: best[stat].indexOf(entity.leek.id) !== -1}">
			<template v-if="entity[stat]">{{ $filters.number(entity[stat]) }}</template>
		</td>
	</tr>
</template>

<script lang="ts">
	import { Options, Prop, Vue } from 'vue-property-decorator'
	@Options({})
	export default class ReportStatisticsEntity extends Vue {
		@Prop({required: true}) entity!: any
		@Prop({required: true}) stats!: string[]
		@Prop({required: true}) best!: any
	}
</script>

<style lang="scss" scoped>
	td {
		border: 1px solid var(--border);
		text-align: center;
		padding: 4px;
		font-size: 14px;
	}
	.best {
		font-weight: bold;
		background: var(--background-header);
	}
	.name {
		text-align: left;
		width: 180px;
		text-overflow: ellipsis;
		overflow: hidden;
		white-space: nowrap;
	}
	.summon .name .text {
		padding-left: 15px;
	}
	.alive {
		margin-left: 21px;
	}
	.dead {
		background-image: url("/image/cross.png");
		width: 15px;
		height: 20px;
		display: inline-block;
		margin-right: 6px;
		vertical-align: bottom;
	}
</style>
