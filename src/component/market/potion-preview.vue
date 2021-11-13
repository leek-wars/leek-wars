<template lang="html">
	<div>
		<div class="stats">
			<template v-for="(effect, e) of potion.effects">
				<template v-if="effect.type == PotionEffect.CHANGE_SKIN">
					<div :key="e" v-html="$t('potion.effect_' + effect.type, [$t('potion.skin_' + effect.params[0])])"></div>
					<div :key="e + '_'" class="leek-preview">
						<leek-image :leek="{level: 30, skin: effect.params[0]}" :scale="0.55" />
						<leek-image :leek="{level: 90, skin: effect.params[0]}" :scale="0.65" />
						<leek-image :leek="{level: 250, skin: effect.params[0]}" :scale="0.7" />
					</div>
				</template>
				<div v-else-if="effect.type == PotionEffect.RESTAT" :key="e">
					<div>{{ $t('potion.effect_' + effect.type) }}</div>
				</div>
				<div v-else :key="e">
					<div>
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
	</div>
</template>

<script lang="ts">
	import AreaView from '@/component/market/area-view.vue'
	import EffectView from '@/component/market/effect.vue'
	import RangeView from '@/component/market/range-view.vue'
	import { PotionEffect, PotionTemplate } from '@/model/potion'
	import { Component, Prop, Vue } from 'vue-property-decorator'

	@Component({
		components: { 'range-view': RangeView, 'effect-view': EffectView, 'area-view': AreaView }
	})
	export default class PotionPreview extends Vue {
		@Prop() potion!: PotionTemplate
		PotionEffect = PotionEffect
	}
</script>

<style src='./item-preview.scss' lang='scss'></style>