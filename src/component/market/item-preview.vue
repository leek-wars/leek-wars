<template lang="html">
	<div class="item-preview" :class="category">
		<div class="header">
			<h2 class="name">{{ $t(category + '.' + name_short) }}</h2>
			<div class="spacer"></div>
			<div class="level">{{ $t('effect.level_n', [item.level]) }}</div>
		</div>
		<div class="rarity-band rarity" :class="'difficulty-' + item.rarity"></div>
		<div v-if="item.rarity > 0" class="rarity-wrapper">
			<span class="rarity" :class="'difficulty-' + item.rarity">{{ $t('main.difficulty_' + item.rarity) }}</span>
		</div>
		<div v-if="item.type === ItemType.WEAPON || item.type === ItemType.CHIP" class="constant">{{ item.name.toUpperCase() }}</div>
		<div class="image sound">
			<img :src="'/image/' + category + '/' + item.name.replace(category + '_', '') + '.png'" @click="LeekWars.playSound(item, 'chip')">
		</div>
		<div v-if="$te(category + '.' + item.name + '_desc')" class="desc">
			{{ $t(category + '.' + item.name + '_desc') }}
		</div>
		<weapon-preview v-if="item.type === ItemType.WEAPON" :weapon="LeekWars.weapons[item.params]" />
		<chip-preview v-else-if="item.type === ItemType.CHIP" :chip="LeekWars.chips[item.id]" @input="$emit('input', $event)" />
		<potion-preview v-else-if="item.type === ItemType.POTION" :potion="LeekWars.potions[item.id]" />
		<hat-preview v-else-if="item.type === ItemType.HAT" :hat="LeekWars.hats[item.id]" />
		<pomp-preview v-else-if="item.type === ItemType.POMP" :pomp="LeekWars.pomps[item.id]" />
		<resource-preview v-else-if="item.type === ItemType.RESOURCE" :resource="LeekWars.items[item.id]" />
		<!-- <fight-pack-preview v-else-if="item.type === ItemType.FIGHT_PACK" :resource="LeekWars.items[item.id]" /> -->

		<div v-if="inventory" class="stats inventory">
			<div>
				Valeur estimée : <b>{{ item.price | number }}</b> <span class='hab'></span>
			</div>
			<div v-if="quantity > 1">
				Valeur du lot : <b>{{ item.price * quantity | number }}</b> <span class='hab'></span>
			</div>
			<div v-if="item.name.includes('box')">
				<v-btn small class="get-all notif-trophy" @click.stop="retrieveAll()">Récupérer <img src="/image/icon/black/arrow-down-right-bold.svg"></v-btn>
			</div>
		</div>
	</div>
</template>

<script lang="ts">
import { ItemTemplate, ItemType } from '@/model/item'
import { Component, Prop, Vue } from 'vue-property-decorator'
import WeaponPreview from '@/component/market/weapon-preview.vue'
import ChipPreview from '@/component/market/chip-preview.vue'
import PotionPreview from '@/component/market/potion-preview.vue'
import HatPreview from '@/component/market/hat-preview.vue'
import PompPreview from '@/component/market/pomp-preview.vue'
import ResourcePreview from '@/component/market/resource-preview.vue'
import FightPackPreview from '@/component/market/fight-pack-preview.vue'

@Component({ components: {
	'weapon-preview': WeaponPreview,
	'chip-preview': ChipPreview,
	'potion-preview': PotionPreview,
	'hat-preview': HatPreview,
	'pomp-preview': PompPreview,
	'fight-pack-preview': FightPackPreview,
	'resource-preview': ResourcePreview
}})
export default class ItemPreview extends Vue {
	@Prop() item!: ItemTemplate
	@Prop() quantity!: number
	@Prop() inventory!: boolean

	ItemType = ItemType

	get category() {
		if (this.item.type === ItemType.WEAPON) return 'weapon'
		if (this.item.type === ItemType.CHIP) return 'chip'
		if (this.item.type === ItemType.POTION) return 'potion'
		if (this.item.type === ItemType.HAT) return 'hat'
		if (this.item.type === ItemType.POMP) return 'pomp'
		if (this.item.type === ItemType.RESOURCE) return 'resource'
		if (this.item.type === ItemType.FIGHT_PACK) return 'resource'
	}

	get name_short() {
		return this.item.name.replace(this.category + '_', '')
	}
}
</script>

<style lang="scss" scoped>

.get-all {
	font-size: 15px;
	font-weight: 500;
	margin: 5px;
	img {
		margin-left: 4px;
		margin-right: 0;
		width: 20px;
	}
}
.rarity-band {
	border-radius: 0;
	padding: 1.5px;
	&.difficulty-0 {
		background: #f2f2f2;
	}
}
.rarity-wrapper {
	padding: 6px;
	text-align: right;
	position: absolute;
	top: 42px;
	right: 0;
}
.inventory {
	background: #f2f2f2;
	div {
		padding: 5px;
	}
}
</style>