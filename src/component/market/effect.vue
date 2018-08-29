<template lang="html">
	<div>
		<span v-if="effect.id == 14">{{ $t('effect.type_14_fixed', [$t('effect.summon_' + effect.value1)]) }}</span>
		<span v-else-if="effect.value2 == 0" v-html="$t('effect.type_' + effect.id + '_fixed', [effect.value1])"></span>
		<span v-else v-html="$t('effect.type_' + effect.id, [effect.value1, effect.value1 + effect.value2])"></span>

		<span v-if="effect.turns > 0" v-html="' ' + $t('effect.on_n_turns', {turns: effect.turns})"></span>

		<v-tooltip bottom open-delay="0" close-delay="0">
			<span v-if="enemies && !allies" slot="activator" class="ennemies"></span>
			<span>{{ $t('effect.target_enemies') }}</span>
		</v-tooltip>

		<v-tooltip bottom open-delay="0" close-delay="0">
			<span v-if="allies && !enemies" slot="activator" class="allies"></span>
			<span>{{ $t('effect.target_allies') }}</span>
		</v-tooltip>

		<v-tooltip bottom open-delay="0" close-delay="0">
			<span v-if="!caster" slot="activator" class="not-player"></span>
			<span>{{ $t('effect.target_not_player') }}</span>
		</v-tooltip>

		<v-tooltip bottom open-delay="0" close-delay="0">
			<span v-if="!nonSummons" slot="activator" class="summons"></span>
			<span>{{ $t('effect.target_summons') }}</span>
		</v-tooltip>

		<v-tooltip bottom open-delay="0" close-delay="0">
			<span v-if="!summons" slot="activator" class="not-summons"></span>
			<span>{{ $t('effect.target_not_summons') }}</span>
		</v-tooltip>
	</div>
</template>

<script lang="ts">
	import { Effect } from '@/model/effect'
	import { Component, Prop, Vue } from 'vue-property-decorator'
@Component({ name: 'effect-view' })
	export default class EffectView extends Vue {
		@Prop() effect!: Effect
		get enemies() { return this.effect.targets & 1 }
		get allies(): boolean { return (this.effect.targets & (1 << 1)) !== 0 }
		get caster(): boolean { return (this.effect.targets & (1 << 2)) !== 0 }
		get nonSummons(): boolean { return (this.effect.targets & (1 << 3)) !== 0 }
		get summons(): boolean { return (this.effect.targets & (1 << 4)) !== 0 }
	}
</script>