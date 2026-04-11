<template lang="html">
	<div>
		<div class="stats">
			<template v-for="(effect, e) of potion.effects" :key="e">
				<template v-if="effect.type == PotionEffect.CHANGE_SKIN">
					<div v-html="$t('potion.effect_' + effect.type, [$t('potion.skin_' + effect.params[0])])"></div>
					<div class="leek-preview">
						<leek-image :leek="{level: 30, skin: effect.params[0]}" :scale="0.55" />
						<leek-image :leek="{level: 90, skin: effect.params[0]}" :scale="0.65" />
						<leek-image :leek="{level: 250, skin: effect.params[0]}" :scale="0.7" />
					</div>
				</template>
				<div v-else-if="effect.type == PotionEffect.RESTAT">
					<div>{{ $t('potion.effect_' + effect.type) }}</div>
				</div>
				<div v-else-if="effect.type == PotionEffect.CLOVER_PASSED || effect.type == PotionEffect.CLOVER_HOUR || effect.type == PotionEffect.CLOVER_SECOND" class="effect">
					<img class="icon" src="/image/clover.png">
					{{ $t('potion.effect_' + effect.type) }}
				</div>
				<div v-else>
					<div class="effect">
						<img class="icon" :src="'/image/charac/small/strength.png'">
						<span v-html="$t('potion.effect_' + effect.type, [ effect.params[1], $t('characteristic.strength'), potion.duration ])"></span>
					</div>
				</div>
			</template>
			<div v-if="!potion.consumable">
				<v-icon>mdi-autorenew</v-icon>
				<span v-html="$t('potion.reusable')"></span>
			</div>
		</div>
		<div v-if="isClover && showUse && inventoryItem" class="use-section">
			<v-btn prepend-icon="mdi-bottle-tonic-plus-outline" @click="useCloverPotion">
				{{ $t('potion.clover_use') }}
			</v-btn>
		</div>
	</div>
</template>

<script lang="ts">
	import AreaView from '@/component/market/area-view.vue'
	import EffectView from '@/component/market/effect.vue'
	import RangeView from '@/component/market/range-view.vue'
	import { PotionEffect, PotionTemplate } from '@/model/potion'
	import { emitter } from '@/model/vue'
	import { LeekWars } from '@/model/leekwars'
	import { ItemType } from '@/model/item'
	import { store } from '@/model/store'
	import { Options, Prop, Vue } from 'vue-property-decorator'

	@Options({
		name: 'potion-preview',
		components: { 'range-view': RangeView, 'effect-view': EffectView, 'area-view': AreaView }
	})
	export default class PotionPreview extends Vue {
		@Prop() potion!: PotionTemplate
		@Prop({ default: false }) inventory!: boolean
		@Prop({ default: false }) showUse!: boolean
		@Prop() itemTemplateId!: number
		PotionEffect = PotionEffect

		get isClover() {
			return this.potion?.effects?.some((e: any) => e.type >= PotionEffect.CLOVER_PASSED && e.type <= PotionEffect.CLOVER_SECOND)
		}

		get inventoryItem() {
			if (!store.state.farmer) return null
			return store.state.farmer.potions.find((p: any) => p.template === this.itemTemplateId)
		}

		useCloverPotion() {
			const item = this.inventoryItem
			if (!item) return
			LeekWars.post('potion/use', { item_id: item.id }).then((data: any) => {
				if (this.potion.consumable) {
					store.commit('remove-inventory', { type: ItemType.POTION, item_template: this.itemTemplateId })
				}
				if (data.clover) {
					LeekWars.cloverResult = this.formatCloverInfo(data.clover)
					LeekWars.cloverPopup = true
				}
				emitter.emit('clover-used')
			})
		}

		formatCloverInfo(clover: any): string {
			if (clover.type === 'passed') {
				return clover.passed
					? this.$t('potion.clover_passed_yes') as string
					: this.$t('potion.clover_passed_no') as string
			} else if (clover.type === 'hour') {
				return clover.passed
					? this.$t('potion.clover_hour_passed', [clover.hour]) as string
					: this.$t('potion.clover_hour_coming', [clover.hour]) as string
			} else if (clover.type === 'second') {
				const time = clover.hour + 'h' + String(clover.minute).padStart(2, '0') + 'm' + String(clover.second).padStart(2, '0') + 's'
				return clover.passed
					? this.$t('potion.clover_second_passed', [time]) as string
					: this.$t('potion.clover_second_coming', [time]) as string
			}
			return ''
		}
	}
</script>

<style src='./item-preview.scss' lang='scss'></style>

<style scoped lang="scss">
.effect {
	display: flex;
	align-items: center;
	gap: 4px;
	padding: 8px 12px;
	.icon {
		width: 20px;
		height: 20px;
	}
}
.use-section {
	background: var(--background);
	padding: 12px;
	text-align: center;
}
</style>