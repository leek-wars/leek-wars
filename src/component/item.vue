<template lang="html">
	<rich-tooltip-weapon v-if="is_weapon" v-slot="{ on }" :bottom="true" :instant="true" :weapon="LeekWars.weapons[template.params]">
		<div class="item" v-on="on">
			<img :src="url" class="weapon">
		</div>
	</rich-tooltip-weapon>
	<rich-tooltip-chip v-else-if="is_chip" v-slot="{ on }" :bottom="true" :instant="true" :chip="LeekWars.chips[template.id]">
		<div class="item" v-on="on">
			<img :src="url">
		</div>
	</rich-tooltip-chip>
	<div v-else class="item">
		<img :src="url">
	</div>
</template>

<script lang="ts">
	import { env } from '@/env'
	import { ItemType } from '@/model/item'
	import { LeekWars } from '@/model/leekwars'
	import { Team } from '@/model/team'
	import { Component, Prop, Vue } from 'vue-property-decorator'

	@Component({ name: "item" })
	export default class ItemView extends Vue {
		@Prop() item!: any

		get template() {
			return LeekWars.items[this.item.template]
		}
		get url() {
			return "/image/" + this.template.name.replace("_", "/") + ".png"
		}
		get is_weapon() {
			return this.template.type === ItemType.WEAPON
		}
		get is_chip() {
			return this.template.type === ItemType.CHIP
		}
	}
</script>

<style lang="scss" scoped>
.item {
	background: white;
	border-radius: 4px;
	box-shadow: 0px 2px 1px -1px rgba(0,0,0,0.2), 0px 1px 1px 0px rgba(0,0,0,0.14), 0px 1px 3px 0px rgba(0,0,0,0.12);
	padding: 4px;
	img {
		width: 100%;
		height: 100%;
		object-fit: contain;
	}
	img.weapon {
		transform: rotate(-40deg);
		width: 120%;
		height: 120%;
		margin: -8%;
	}
}
</style>