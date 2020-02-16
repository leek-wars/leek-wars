<template lang="html">
	<div class="item-preview">
		<div class="header">
			<h2 class="name">{{ $t('potion.' + potion.name) }}</h2>
			<div class="level">{{ $t('effect.level_n', [potion.level]) }}</div>
		</div>
		<div class="image">
			<img :src="'/image/potion/' + potion.name + '.png'">
		</div>
		<div v-if="$te('potion.' + potion.name + '_desc')" class="desc">
			{{ $t('potion.' + potion.name + "_desc") }}
		</div>
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
				<div v-else :key="e">
					<div>{{ $t('potion.effect_' + effect.type) }}</div>
				</div>
			</template>
			<div v-if="!potion.consumable" v-html="$t('potion.reusable')"></div>
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