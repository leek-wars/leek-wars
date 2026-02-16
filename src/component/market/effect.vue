<template lang="html">
	<div class="effect" @click="LeekWars.effectRawOpened = !LeekWars.effectRawOpened">
		<v-tooltip v-if="icon" content-class="fluid">
			<template #activator="{ props }">
				<img class="icon" :src="'/image/charac/small/' + icon + '.png'" v-bind="props">
			</template>
			<i18n-t keypath="effect.increased_by">
				<template #charac>
					<b>{{ $t('characteristic.' + icon) }}</b>
				</template>
			</i18n-t>
			<div>
				{{ charac }} {{ $t('characteristic.' + icon) }} :
				<span v-if="Math.round(effect.value1 * boost) == Math.round((effect.value1 + effect.value2) * boost)" v-html="$t('effect.type_' + effect.id + '_fixed', [Math.round(effect.value1 * boost)])"></span>
				<span v-else v-html="$t('effect.type_' + effect.id, [Math.round(effect.value1 * boost), Math.round((effect.value1 + effect.value2) * boost)])"></span>
			</div>
		</v-tooltip>

		<span v-if="passive">{{ $t('effect.passive') }}</span>
		<i18n-t v-if="effect.id == 14" keypath="effect.type_14_fixed">
			<template #summon>
				<b>{{ $t('effect.summon_' + effect.value1) }}</b>
			</template>
		</i18n-t>
		<span v-else-if="effect.value2 == 0" v-html="$t('effect.type_' + effect.id + '_fixed', [value1])"></span>
		<span v-else v-html="$t('effect.type_' + effect.id, [format(effect.value1), format(effect.value1 + effect.value2)])"></span>
		<span v-if="effect.modifiers & EffectModifier.ON_CASTER">
			<span v-if="effectThe">&nbsp;{{ $t('effect.the_caster') }}</span>
			<span v-else>&nbsp;{{ $t('effect.to_the_caster') }}</span>
		</span>
		<b v-if="effect.modifiers & EffectModifier.MULTIPLIED_BY_TARGETS">&nbsp;{{ $t('effect.multiplied_target') }}</b>

		<b v-if="effect.turns === -1">{{ $t('effect.infinite') }}</b>
		<i18n-t v-else-if="effect.turns > 0" keypath="effect.on_n_turns">
			<template #turns>
				<span v-html="$tc('effect.n_turns', effect.turns)"></span>
			</template>
		</i18n-t>
		<span v-if="effect.modifiers & EffectModifier.STACKABLE">
			(<b>{{ $t('effect.stackable') }}</b>)
		</span>
		<span v-if="effect.modifiers & EffectModifier.NOT_REPLACEABLE">
			(<b>{{ $t('effect.not_replaceable') }}</b>)
		</span>
		<span v-if="effect.modifiers & EffectModifier.IRREDUCTIBLE">
			(<b>{{ $t('effect.irreductible') }}</b>)
		</span>

		<v-tooltip v-if="enemies && !allies">
			<template #activator="{ props }">
				<span class="ennemies" v-bind="props" />
			</template>
			<span>{{ $t('effect.target_enemies') }}</span>
		</v-tooltip>

		<span>
			<v-tooltip v-if="allies && !enemies">
				<template #activator="{ props }">
					<span class="allies" v-bind="props"></span>
				</template>
				<span>{{ $t('effect.target_allies') }}</span>
			</v-tooltip>
		</span>

		<span>
			<v-tooltip v-if="!caster">
				<template #activator="{ props }">
					<span class="not-player" v-bind="props"></span>
				</template>
				<span>{{ $t('effect.target_not_player') }}</span>
			</v-tooltip>
		</span>

		<span>
			<v-tooltip v-if="!nonSummons">
				<template #activator="{ props }">
					<span class="summons" v-bind="props"></span>
				</template>
				<span>{{ $t('effect.target_summons') }}</span>
			</v-tooltip>
		</span>

		<span>
			<v-tooltip v-if="!summons">
				<template #activator="{ props }">
					<span class="not-summons" v-bind="props"></span>
				</template>
				<span>{{ $t('effect.target_not_summons') }}</span>
			</v-tooltip>
		</span>

		<lw-code v-if="LeekWars.effectRawOpened" :single="true" :code="'[' + effect.id + ' ' + EffectType[effect.id] + ', ' + format(effect.value1) + ', ' + format(effect.value1 + effect.value2) + ', ' + effect.turns + ', ' + effect.targets + ', ' + effect.modifiers + ']'" class="raw" />
	</div>
</template>

<script lang="ts">
	import { Effect, EffectModifier, EffectType, State } from '@/model/effect'
	import { i18n } from '@/model/i18n'
	import { Leek } from '@/model/leek'
	import { LeekWars } from '@/model/leekwars'
	import { store } from '@/model/store'
	import { Options, Prop, Vue } from 'vue-property-decorator'
	import Code from '@/component/app/code.vue'

	@Options({ name: 'effect-view', components: { 'lw-code': Code } })
	export default class EffectView extends Vue {

		@Prop() effect!: Effect
		@Prop() passive!: boolean
		@Prop() leek!: Leek

		EffectModifier = EffectModifier
		EffectType = EffectType
		LeekWars = LeekWars
		raw_opened: boolean = false

		get value1() {
			if (this.effect.id === EffectType.ADD_STATE) {
				// return State[this.effect.value1]
				return i18n.t('effect.state_' + this.effect.value1)
			}
			return this.format(this.effect.value1)
		}
		get enemies() { return this.effect.targets & 1 }
		get allies(): boolean { return (this.effect.targets & (1 << 1)) !== 0 }
		get caster(): boolean { return (this.effect.targets & (1 << 2)) !== 0 }
		get nonSummons(): boolean { return (this.effect.targets & (1 << 3)) !== 0 }
		get summons(): boolean { return (this.effect.targets & (1 << 4)) !== 0 }
		get effectThe(): boolean {
			return this.effect.id === EffectType.HEAL || this.effect.id === EffectType.RAW_HEAL || this.effect.id === EffectType.STEAL_LIFE
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
			if ([EffectType.HEAL, EffectType.BOOST_MAX_LIFE].includes(this.effect.id)) { return 'wisdom' }
			if ([EffectType.ABSOLUTE_SHIELD, EffectType.RELATIVE_SHIELD].includes(this.effect.id)) { return 'resistance' }
			if ([EffectType.DAMAGE_RETURN].includes(this.effect.id)) { return 'agility' }
			if ([EffectType.BUFF_STRENGTH, EffectType.BUFF_RESISTANCE, EffectType.BUFF_WISDOM, EffectType.BUFF_AGILITY, EffectType.BUFF_MP, EffectType.BUFF_TP, EffectType.AFTEREFFECT, EffectType.NOVA_DAMAGE, EffectType.NOVA_VITALITY].includes(this.effect.id)) { return 'science' }
			if ([EffectType.POISON, EffectType.SHACKLE_MP, EffectType.SHACKLE_TP, EffectType.SHACKLE_STRENGTH, EffectType.SHACKLE_MAGIC, EffectType.SHACKLE_AGILITY, EffectType.SHACKLE_WISDOM].includes(this.effect.id)) { return 'magic' }
		}

		get my_leek() {
			return this.leek ? this.leek : (store.state.farmer ? LeekWars.first(store.state.farmer!.leeks) : null)
		}
		get charac() {
			if (this.icon) {
				if (this.leek) {
					return (this.leek as any)['total_' + this.icon]
				}
				if (store.state.farmer) {
					let max = 0
					for (const l in store.state.farmer!.leeks) {
						max = Math.max(max, (store.state.farmer!.leeks[l] as any)['total_' + this.icon])
					}
					return max
				}
			}
			return 0
		}
		get boost() {
			if (this.icon === 'life') {
				return this.charac / 100
			} else {
				return 1 + this.charac / 100
			}
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
		padding: 4px 0;
		display: block;
		border: none;
	}
</style>