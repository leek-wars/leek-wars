<template lang="html">
	<div>
		<span v-if="passive">{{ $t('effect.passive') }}</span>
		<i18n v-if="effect.id == 14" path="effect.type_14_fixed">
			<b slot="summon">{{ $t('effect.summon_' + effect.value1) }}</b>
		</i18n>
		<span v-else-if="effect.value2 == 0" v-html="$t('effect.type_' + effect.id + '_fixed', [format(effect.value1)])"></span>
		<span v-else v-html="$t('effect.type_' + effect.id, [effect.value1, format(effect.value1 + effect.value2)])"></span>
		<span v-if="effect.modifiers & EffectModifier.ON_CASTER">
			<template v-if="effectThe">
				{{ $t('effect.the_caster') }}
			</template>
			<template v-else>
				{{ $t('effect.to_the_caster') }}
			</template>
		</span>
		<b v-if="effect.modifiers & EffectModifier.MULTIPLIED_BY_TARGETS">&nbsp;{{ $t('effect.multiplied_target') }}</b>
		
		<b v-if="effect.turns === -1">{{ $t('effect.infinite') }}</b>
		<i18n v-else-if="effect.turns > 0" path="effect.on_n_turns">
			<span slot="turns" v-html="$tc('effect.n_turns', effect.turns)"></span>
		</i18n>
		<span v-if="effect.modifiers & EffectModifier.STACKABLE">
			(<b>{{ $t('effect.stackable') }}</b>)
		</span>

		<tooltip v-if="enemies && !allies">
			<template v-slot:activator="{ on }">
				<span class="ennemies" v-on="on"></span>
			</template>
			<span>{{ $t('effect.target_enemies') }}</span>
		</tooltip>

		<tooltip v-if="allies && !enemies">
			<template v-slot:activator="{ on }">
				<span class="allies" v-on="on"></span>
			</template>
			<span>{{ $t('effect.target_allies') }}</span>
		</tooltip>

		<tooltip v-if="!caster && !always_caster">
			<template v-slot:activator="{ on }">
				<span class="not-player" v-on="on"></span>
			</template>
			<span>{{ $t('effect.target_not_player') }}</span>
		</tooltip>

		<tooltip v-if="!nonSummons && !always_caster">
			<template v-slot:activator="{ on }">
				<span class="summons" v-on="on"></span>
			</template>
			<span>{{ $t('effect.target_summons') }}</span>
		</tooltip>

		<tooltip v-if="!summons && !always_caster">
			<template v-slot:activator="{ on }">
				<span class="not-summons" v-on="on"></span>
			</template>
			<span>{{ $t('effect.target_not_summons') }}</span>
		</tooltip>
	</div>
</template>

<script lang="ts">
	import { Effect, EffectModifier, EffectType } from '@/model/effect'
	import { Component, Prop, Vue } from 'vue-property-decorator'
	@Component({ name: 'effect-view' })
	export default class EffectView extends Vue {
		@Prop() effect!: Effect
		@Prop() passive!: boolean
		EffectModifier = EffectModifier
		get enemies() { return this.effect.targets & 1 }
		get allies(): boolean { return (this.effect.targets & (1 << 1)) !== 0 }
		get caster(): boolean { return (this.effect.targets & (1 << 2)) !== 0 }
		get nonSummons(): boolean { return (this.effect.targets & (1 << 3)) !== 0 }
		get summons(): boolean { return (this.effect.targets & (1 << 4)) !== 0 }
		get effectThe(): boolean {
			return this.effect.id === EffectType.HEAL
		}
		format(n: number) {
			if (Math.floor(n) !== n) {
				return n.toFixed(2)
			}
			return n
		}
	}
</script>