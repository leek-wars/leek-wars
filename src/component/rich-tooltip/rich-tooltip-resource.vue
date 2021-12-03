<template>
	<v-menu :close-on-content-click="false" :min-width="300" offset-overflow :nudge-top="bottom ? 0 : 6" :open-delay="_open_delay" :close-delay="_close_delay" :top="!bottom" :bottom="bottom" transition="none" open-on-hover offset-y :nudge-right="0" content-class="menu" @input="$emit('input', $event)">
		<template v-slot:activator="{ on }">
			<slot :on="on"></slot>
		</template>
		<div class="card">
			<div class="item-preview">
				<div class="header">
					<h2 class="name">{{ $t('resource.' + resource.name) }}</h2>
					<div class="level">{{ $t('effect.level_n', [resource.level]) }}</div>
				</div>
				<div class="image">
					<img :src="'/image/resource/' + resource.name + '.png'">
				</div>
				<div class="stats">
					<div>
						Très rare (1%)
					</div>
					<div>
						Valeur estimée : <b>{{ resource.price | number }}</b> <span class='hab'></span>
					</div>
					<div v-if="quantity > 1">
						Valeur du lot : <b>{{ resource.price * quantity | number }}</b> <span class='hab'></span>
					</div>
					<div>
						<v-btn small class="get-all notif-trophy" @click.stop="retrieveAll()"><span v-if="!LeekWars.mobile">Récupérer</span> <img src="/image/icon/black/arrow-down-right-bold.svg"></v-btn>
					</div>
				</div>
			</div>
		</div>
	</v-menu>
</template>

<script lang="ts">
	import WeaponPreview from '@/component/market/weapon-preview.vue'
	import { WeaponTemplate } from '@/model/weapon'
	import { Component, Prop, Vue, Watch } from 'vue-property-decorator'

	@Component({ components: {  } })
	export default class RichTooltipResource extends Vue {
		@Prop({required: true}) resource!: any
		@Prop() quantity!: number
		@Prop() bottom!: boolean
		@Prop() instant!: boolean

		get _open_delay() {
			return this.instant ? 0 : 500
		}
		get _close_delay() {
			return this.instant ? 0 : 0
		}

		retrieveAll() {

		}
	}
</script>

<style lang="scss" scoped>
.menu.v-menu__content {
	background: none;
}
.card {
	width: 300px;
	.image {
		// padding: 5px;
	}
}
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
</style>