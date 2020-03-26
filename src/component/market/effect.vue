<template lang="html">
	<div class="effect" @click="LeekWars.effectRawOpened = !LeekWars.effectRawOpened">
		<tooltip v-if="icon">
			<template v-slot:activator="{ on }">
				<img class="icon" :src="'/image/charac/small/' + icon + '.png'" v-on="on">
			</template>
			<i18n path="effect.increased_by">
				<b slot="charac">{{ $t('characteristic.' + icon) }}</b>
			</i18n>
		</tooltip>

		<span v-if="passive">{{ $t('effect.passive') }}</span>
		<i18n v-if="effect.id == 14" path="effect.type_14_fixed">
			<b slot="summon">{{ $t('effect.summon_' + effect.value1) }}</b>
		</i18n>
		<span v-else-if="effect.value2 == 0" v-html="$t('effect.type_' + effect.id + '_fixed', [format(effect.value1)])"></span>
		<span v-else v-html="$t('effect.type_' + effect.id, [format(effect.value1), format(effect.value1 + effect.value2)])"></span>
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

		<tooltip v-if="!caster">
			<template v-slot:activator="{ on }">
				<span class="not-player" v-on="on"></span>
			</template>
			<span>{{ $t('effect.target_not_player') }}</span>
		</tooltip>

		<tooltip v-if="!nonSummons">
			<template v-slot:activator="{ on }">
				<span class="summons" v-on="on"></span>
			</template>
			<span>{{ $t('effect.target_summons') }}</span>
		</tooltip>

		<tooltip v-if="!summons">
			<template v-slot:activator="{ on }">
				<span class="not-summons" v-on="on"></span>
			</template>
			<span>{{ $t('effect.target_not_summons') }}</span>
		</tooltip>

		<code v-if="LeekWars.effectRawOpened" class="raw">
			<lw-code :single="true" :code="'[' + effect.id + ' ' + EffectType[effect.id] + ', ' + format(effect.value1) + ', ' + format(effect.value1 + effect.value2) + ', ' + effect.turns + ', ' + effect.targets + ', ' + effect.modifiers + ']'" />
		</code>
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
		EffectType = EffectType
		raw_opened: boolean = false
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
		get icon() {
			if ([EffectType.DAMAGE].includes(this.effect.id)) { return 'strength' }
			if ([EffectType.LIFE_DAMAGE].includes(this.effect.id)) { return 'life' }
			if ([EffectType.HEAL, EffectType.VITALITY].includes(this.effect.id)) { return 'wisdom' }
			if ([EffectType.ABSOLUTE_SHIELD, EffectType.RELATIVE_SHIELD].includes(this.effect.id)) { return 'resistance' }
			if ([EffectType.DAMAGE_RETURN].includes(this.effect.id)) { return 'agility' }
			if ([EffectType.BUFF_STRENGTH, EffectType.BUFF_RESISTANCE, EffectType.BUFF_WISDOM, EffectType.BUFF_AGILITY, EffectType.BUFF_MP, EffectType.BUFF_TP, EffectType.AFTEREFFECT, EffectType.NOVA_DAMAGE].includes(this.effect.id)) { return 'science' }
			if ([EffectType.POISON, EffectType.SHACKLE_MP, EffectType.SHACKLE_TP, EffectType.SHACKLE_STRENGTH, EffectType.SHACKLE_MAGIC].includes(this.effect.id)) { return 'magic' }
		}
	}
</script>

<style lang="scss" scoped>
	div img.icon {
		width: 16px;
		margin-bottom: 1px;
	}
	.effect {
		cursor: pointer;
	}
	.raw {
		font-size: 13px;
		white-space: pre-wrap;
	}
</style>