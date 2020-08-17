<template lang="html">
	<div v-if="constant" class="doc-constant" :class="{item: is_weapon || is_chip, deprecated: constant.deprecated}">
		<h2 v-if="!is_weapon && !is_chip">{{ constant.name }}</h2>
		<div v-if="constant.deprecated" class="deprecated-message">Cette constante est dépréciée.</div>
		<chip-preview v-if="is_chip" :chip="LeekWars.chips[constant.value]" />
		<weapon-preview v-else-if="is_weapon" :weapon="LeekWars.weapons[constant.value]" />
		<div v-else-if="$te('doc.const_' + constant.name)" v-dochash v-code class="content" v-html="$t('doc.const_' + constant.name)"></div>
		<h4>{{ $t('doc.value') }}</h4>
		<ul>
			<li>{{ constant.name }} = {{ constant.value }}</li>
		</ul>
		<h4 v-if="chips.length + weapons.length">{{ $t('doc.items') }} ({{ chips.length + weapons.length }})</h4>
		<router-link v-for="chip of chips" :key="chip.id" :to="'/help/documentation/CHIP_' + chip.name.toUpperCase()">
			<rich-tooltip-chip v-slot="{ on }" :chip="chip" :bottom="true" :instant="true" @input="$emit('input', $event)">
				<img :src="'/image/chip/small/' + chip.name + '.png'" class="item" v-on="on">
			</rich-tooltip-chip>
		</router-link>
		<router-link v-for="weapon of weapons" :key="weapon.id" :to="'/help/documentation/WEAPON_' + weapon.name.toUpperCase()">
			<rich-tooltip-weapon v-slot="{ on }" :weapon="weapon" :bottom="true" :instant="true" @input="$emit('input', $event)">
				<img :src="'/image/weapon/' + weapon.name + '.png'" class="item weapon" v-on="on">
			</rich-tooltip-weapon>
		</router-link>
	</div>
</template>

<script lang="ts">
	import ChipPreview from '@/component/market/chip-preview.vue'
	import WeaponPreview from '@/component/market/weapon-preview.vue'
	import { Constant } from '@/model/constant'
	import { LeekWars } from '@/model/leekwars'
	import { Component, Prop, Vue } from 'vue-property-decorator'
	@Component({ name: 'documentation-constant', components: { WeaponPreview, ChipPreview }})
	export default class DocumentationConstant extends Vue {
		@Prop() constant!: Constant

		get value_int() {
			return parseInt(this.constant.value, 10)
		}
		get is_weapon() {
			return this.constant.name.startsWith('WEAPON_')
		}
		get is_chip() {
			return this.constant.name.startsWith('CHIP_')
		}
		get chips() {
			const items = [] as any
			if (this.constant.deprecated) { return items }
			if (this.constant.name.startsWith("EFFECT_MODIFIER_")) {
				for (const i in LeekWars.chips) {
					if (LeekWars.chips[i].effects.some((e) => e.modifiers & this.value_int)) {
						items.push(LeekWars.chips[i])
					}
				}
			} else if (this.constant.name.startsWith("EFFECT_") && !this.constant.name.startsWith("EFFECT_TARGET_")) {
				for (const i in LeekWars.chips) {
					if (LeekWars.chips[i].effects.some((e) => e.id === this.value_int)) {
						items.push(LeekWars.chips[i])
					}
				}
			}
			return items
		}
		get weapons() {
			const items = [] as any
			if (this.constant.name.startsWith("EFFECT_MODIFIER_")) {
				for (const i in LeekWars.weapons) {
					if (LeekWars.weapons[i].effects.some((e) => e.modifiers & this.value_int)) {
						items.push(LeekWars.weapons[i])
					}
				}
			} else if (this.constant.name.startsWith("EFFECT_") && !this.constant.name.startsWith("EFFECT_TARGET_")) {
				for (const i in LeekWars.weapons) {
					if (LeekWars.weapons[i].effects.some((e) => e.id === this.value_int) || LeekWars.weapons[i].passive_effects.some((e) => e.id === this.value_int)) {
						items.push(LeekWars.weapons[i])
					}
				}
			}
			return items
		}
	}
</script>

<style lang="scss" scoped>
	h2 {
		margin-bottom: 10px;
		font-size: 20px;
		color: #333;
	}
	h4 {
		font-weight: 500;
		margin: 0;
		color: #666;
		margin-top: 10px;
		margin-bottom: 8px;
		font-size: 15px;
	}
	.doc-constant .item {
		height: 50px;
		margin: 0 2px;
	}
	.weapon {
		width: 104px;
		object-fit: contain;
	}
</style>