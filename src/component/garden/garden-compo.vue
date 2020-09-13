<template lang="html">
	<div v-if="compo" class="composition">
		<emblem :team="{id: compo.team_id, emblem_changed: compo.emblem_changed}" />
		<div class="name">{{ compo.name }}</div>
		<talent :id="compo.team_id" :talent="compo.talent" category="team" />
		<br>
		<span class="level">
			{{ $t('main.level_n', [compo.level]) }}
		</span>
		<br>
		<div class="level">
			{{ $t('main.total_level_n', [compo.total_level]) }}
		</div>
	</div>
</template>

<script lang="ts">
	import { Composition } from '@/model/team'
	import { Component, Prop, Vue } from 'vue-property-decorator'
	@Component({})
	export default class GardenCompo extends Vue {
		@Prop() compo!: Composition
	}
</script>

<style lang="scss" scoped>
	.emblem {
		width: 120px;
		height: 120px;
	}
	.name {
		font-size: 18px;
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
</style>