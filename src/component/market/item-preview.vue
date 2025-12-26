<template lang="html">
	<div class="item-preview" :class="category">
		<div class="header">
			<h2 v-if="item.type === ItemType.SCHEME" class="name">{{ $t('main.scheme_x', [$t(schemeCategory + '.' + schemeName)]) }} <!--(#{{ item.id }})--></h2>
			<h2 v-else class="name">{{ $t(category + '.' + name_short) }} <!--(#{{ item.id }})--></h2>
			<!-- <h2 class="name">{{ $t(category + '.' + name_short) }}</h2> -->
			<div class="spacer"></div>
			<div class="level">{{ $t('effect.level_n', [item.level]) }}</div>
		</div>
		<div class="rarity-band rarity" :class="'difficulty-' + item.rarity"></div>
		<div v-if="item.rarity > 0" class="rarity-wrapper">
			<span class="rarity" :class="'difficulty-' + item.rarity">{{ $t('main.difficulty_' + item.rarity) }}</span>
		</div>
		<div v-if="item.type === ItemType.WEAPON || item.type === ItemType.CHIP" class="constant">{{ item.name.toUpperCase() }}</div>
		<div class="image" :class="{sound: category === 'chip' || category === 'weapon'}">
			<img v-if="item.type === ItemType.WEAPON" :src="'/image/weapon/' + item.name.replace(category + '_', '') + '.png'" @click="playSound(item, category)" :width="WeaponsData[item.params].width">
			<scheme-image v-else-if="item.type === ItemType.SCHEME" :scheme="LeekWars.schemes[item.params]" />
			<img v-else :src="'/image/' + category + '/' + item.name.replace(category + '_', '') + '.png'" @click="playSound(item, category)">
		</div>
		<div v-if="$te(category + '.' + name_short + '_desc')" class="desc">
			{{ $t(category + '.' + name_short + '_desc') }}
		</div>
		<weapon-preview v-if="item.type === ItemType.WEAPON" :weapon="LeekWars.weapons[item.params]" :leek="leek" />
		<chip-preview v-else-if="item.type === ItemType.CHIP" :chip="CHIPS[item.id]" :leek="leek" @input="$emit('input', $event)" />
		<potion-preview v-else-if="item.type === ItemType.POTION" :potion="LeekWars.potions[item.id]" />
		<hat-preview v-else-if="item.type === ItemType.HAT" :hat="LeekWars.hats[item.params]" />
		<pomp-preview v-else-if="item.type === ItemType.POMP" :pomp="LeekWars.pomps[item.id]" />
		<resource-preview v-else-if="item.type === ItemType.RESOURCE" :resource="LeekWars.items[item.id]" />
		<component-preview v-else-if="item.type === ItemType.COMPONENT" :component="LeekWars.components[item.params]" @input="$emit('input', $event)" />
		<scheme-preview v-else-if="item.type === ItemType.SCHEME" :scheme="LeekWars.schemes[item.params]" @input="$emit('input', $event)" />
		<!-- <fight-pack-preview v-else-if="item.type === ItemType.FIGHT_PACK" :resource="LeekWars.items[item.id]" /> -->

		<div v-if="inventory" class="stats inventory">
			<div v-if="item.price">
				{{ $t('main.estimated_value') }} : <b>{{ item.price | number }}</b> <span class='hab'></span>
			</div>
			<div v-if="item.price && quantity > 1">
				{{ $t('main.lot_value') }} : <b>{{ item.price * quantity | number }}</b> <span class='hab'></span>
			</div>
			<div v-if="item.name.startsWith('box') || ((($store.state.farmer && $store.state.farmer.admin) || LeekWars.christmasPresents) && item.name.startsWith('present'))">
				<v-btn small class="get-all notif-trophy" @click.stop="retrieveN(1)">{{ $t('main.retrieve') }} <img src="/image/icon/black/arrow-down-right-bold.svg"></v-btn>
				<v-btn v-if="quantity >= 10" small class="get-all notif-trophy" @click.stop="retrieveN(10)">x10 <img src="/image/icon/black/arrow-down-right-bold.svg"></v-btn>
				<v-btn v-if="quantity >= 100" small class="get-all notif-trophy" @click.stop="retrieveN(100)">x100 <img src="/image/icon/black/arrow-down-right-bold.svg"></v-btn>
			</div>
		</div>
	</div>
</template>

<script lang="ts">
import { ItemTemplate, ItemType, ITEM_CATEGORY_NAME } from '@/model/item'
import { Component, Prop, Vue } from 'vue-property-decorator'
import WeaponPreview from '@/component/market/weapon-preview.vue'
import ChipPreview from '@/component/market/chip-preview.vue'
import PotionPreview from '@/component/market/potion-preview.vue'
import HatPreview from '@/component/market/hat-preview.vue'
import PompPreview from '@/component/market/pomp-preview.vue'
import ResourcePreview from '@/component/market/resource-preview.vue'
import FightPackPreview from '@/component/market/fight-pack-preview.vue'
import ComponentPreview from '@/component/market/component-preview.vue'
import { LeekWars } from '@/model/leekwars'
import { store } from '@/model/store'
import { CHIPS } from '@/model/chips'
import { WeaponsData } from '@/model/weapon'
import SchemePreview from './scheme-preview.vue'
import SchemeImage from './scheme-image.vue'
import { Leek } from '@/model/leek'

@Component({ name: 'item-preview', components: {
	'weapon-preview': WeaponPreview,
	'chip-preview': ChipPreview,
	'potion-preview': PotionPreview,
	'hat-preview': HatPreview,
	'pomp-preview': PompPreview,
	'fight-pack-preview': FightPackPreview,
	'resource-preview': ResourcePreview,
	'component-preview': ComponentPreview,
	'scheme-preview': SchemePreview,
	'scheme-image': SchemeImage
}})
export default class ItemPreview extends Vue {
	@Prop() item!: ItemTemplate
	@Prop() quantity!: number
	@Prop() inventory!: boolean
	@Prop() leek!: Leek

	ItemType = ItemType
	CHIPS = CHIPS
	WeaponsData = WeaponsData

	get category() {
		return ITEM_CATEGORY_NAME[this.item.type]
	}

	get name_short() {
		return this.item.name.replace(this.category + '_', '')
	}

	get scheme() {
		return LeekWars.schemes[this.item.params]
	}
	get schemeItem() {
		return this.scheme ? LeekWars.items[this.scheme.result] : null
	}
	get schemeCategory() {
		return this.schemeItem ? ITEM_CATEGORY_NAME[this.schemeItem.type] : null
	}
	get schemeName() {
		return this.schemeItem ? this.schemeItem.name.replace(this.schemeCategory + '_', ''): null
	}

	retrieveN(n: number) {
		LeekWars.post<{habs: number, items: {[key: number]: any}}>('item/retrieve', { template: this.item.id, quantity: n }).then((data) => {
			// console.log(data)
			if (data.habs) {
				store.commit('update-habs', data.habs)
			}
			for (const item of Object.values(data.items)) {
				store.commit('add-inventory', {...item, type: LeekWars.items[item.template].type, time: Date.now() / 1000 })
			}
			this.$emit('retrieve', Object.values(data.items))
			store.commit('remove-inventory', { type: ItemType.RESOURCE, item_template: this.item.id, quantity: n })
		})
	}

	weaponSound(id: number) {
		return ({
			1: ['double_gun'], 2: ['machine_gun'], 3: ['double_gun'], 4: ['shotgun'],
			5: ['double_gun'], 6: ['laser'], 7: ['grenade_shoot', 0.7, 'explosion.wav'],
			8: ['flame_thrower'], 9: ['double_gun'], 10: ['gazor'], 11: ['electrisor'],
			12: ['laser'], 13: ['laser'], 14: ['sword'], 15: ['sword'], 16: ['sword'], 17: ['laser'],
			18: ['grenade_shoot', 0.7, 'explosion.wav'], 19: ['electrisor'], 20: ['gazor', 1.2, 'explosion.wav'], 21: ['laser', 0.1, 'poison'],
			22: ['rifle.wav', 0.15, 'rifle.wav', 0.15, 'rifle.wav'],
			23: ['double_gun'],
			24: ['rifle.wav', 0.15, 'rifle.wav', 0.15, 'rifle.wav'],
			25: ['lightninger', 0.7, 'lightninger_impact'],
			26: [],
			27: ['lightninger'],
			28: [],
			29: ['rocket', 0.7, 'explosion.wav'],
			30: [],
			31: [],
			32: ['sword'],
			33: ['lightninger', 0.7, 'lightninger_impact'],
			34: ['double_gun'],
			35: ['sword'],
			36: ['sword'],
			37: ['sword'],
			38: ['sword'],
			39: ['sword'],
			40: ['quantum_rifle'],
		} as {[key: number]: any})[id]
	}

	chipSound(id: number) {
		return ({
			1: ['heal'], 2: ['heal'], 3: ['heal'], 4: ['heal'], 5: ['heal'], 6: ['lightning'],
			7: ['lightning'], 8: ['lightning'], 9: ['fire'], 10: ['fire'],
			11: ['meteorite', 1.8, 'explosion.wav', 0.3, 'explosion.wav', 0.3, 'explosion.wav'],
			12: ['rock'], 13: ['rock'], 14: ['rockfall'], 15: ['ice'], 16: ['ice'], 17: ['ice'],
			18: ['shield'], 19: ['shield'], 20: ['shield'], 21: ['shield'], 22: ['shield'],
			23: ['shield'], 24: ['shield'], 25: ['buff'], 26: ['buff'], 27: ['buff'], 28: ['buff'],
			29: ['buff'], 30: ['buff'], 31: ['buff'], 32: ['buff'], 33: ['buff'], 34: ['buff'],
			35: ['buff'], 36: ['liberation'], 37: ['teleportation'], 38: ['heal'], 39: ['teleportation'],
			40: ['bulb'], 41: ['bulb'], 42: ['bulb'], 43: ['bulb'], 44: ['bulb'], 45: ['bulb'], 46: ['bulb'],
			47: ['heal'], 48: ['shield'], 49: ['resurrection'], 50: ['fire', 0, 'rock', 0.25, 'rock', 0.2, 'rock', 0.3, 'rock', 0.2, 'rock'],
			51: ['buff'], 52: ['heal'], 53: ['heal'], 54: ['buff'], 55: ['debuff'], 56: ['debuff'], 57: ['debuff'],
			58: ['debuff'], 59: ['debuff'], 60: ['buff'], 61: ['poison'], 62: ['poison'], 63: ['poison'],
			64: ['buff'], 65: ['buff'], 66: ['buff'], 67: ['buff'], 68: ['buff'], 69: ['fire'], 70: ['liberation'],
			71: ['sword'], 72: ['buff'], 73: ['heal'], 74: ['buff'], 75: ['alteration.wav'], 76: ['lightning', 0, 'electrisor'], 77: ['bulb'], 78: ['move'],
			79: ['poison'], 80: ['heal'], 81: ['buff'], 82: ['buff'],
			83: ['teleportation'], 84: ['heal'], 85: ['alteration.wav'], 86: ['alteration.wav'], 87: ['alteration.wav'],
			88: ['grapple'], 89: ['boxing'], 92: ['bulb'], 93: ['bulb'], 94: ['heal'], 95: ['debuff'], 96: ['debuff'], 97: ['poison'],
			98: ['buff'], 99: ['shield'], 100: ['liberation'],
			101: [], 102: [], 103: [], 104: ['buff'],

		} as {[key: number]: any})[id]
	}

	playSound(item: any, type: string) {
		if (type !== 'chip' && type !== 'weapon') { return }
		const play = (sounds: any) => {
			if (sounds.length === 0) { return }
			const sound = sounds[0]
			const sound_ext = sound.includes('.') ? sound : sound + '.mp3'
			const audio = new Audio('/sound/' + sound_ext)
			audio.volume = 0.5
			audio.play()
			if (sounds.length > 1) {
				setTimeout(() => {
					play(sounds.slice(2))
				}, parseFloat(sounds[1]) * 1000)
			}
		}
		play((type === 'weapon') ? this.weaponSound(item.params) : this.chipSound(item.params))
		LeekWars.post('market/sound-played')
	}
}
</script>

<style lang="scss" scoped>
.get-all.v-size--small {
	font-size: 15px;
	font-weight: 500;
	padding: 7px;
	margin: 6px 4px;
	img {
		margin-left: 4px;
		margin-right: 0;
		width: 18px;
	}
}
.rarity-band {
	border-radius: 0;
	padding: 1.5px;
	&.difficulty-0 {
		background: var(--background-secondary);
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