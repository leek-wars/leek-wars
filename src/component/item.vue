<template lang="html">
	<rich-tooltip-item v-slot="{ on }" :bottom="true" :instant="true" :item="item" :inventory="true">
		<div class="item" v-on="on">
			<img :src="url" :class="{weapon: is_weapon}">
		</div>
	</rich-tooltip-item>
</template>

<script lang="ts">
	import { ItemTemplate, ItemType, ITEM_CATEGORY_NAME } from '@/model/item'
	import { Component, Prop, Vue } from 'vue-property-decorator'
	import RichTooltipItem from '@/component/rich-tooltip/rich-tooltip-item.vue'

	@Component({ name: "item", components: { RichTooltipItem } })
	export default class ItemView extends Vue {
		@Prop() item!: ItemTemplate

		get image() {
			return this.item.type === ItemType.COMPONENT ? this.item.name : this.item.name.substring(this.item.name.indexOf('_') + 1)
		}

		get url() {
			return "/image/" + ITEM_CATEGORY_NAME[this.item.type] + "/" + this.image + ".png"
		}
		get is_weapon() {
			return this.item.type === ItemType.WEAPON
		}
	}
</script>

<style lang="scss" scoped>
.item {
	background: var(--pure-white);
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