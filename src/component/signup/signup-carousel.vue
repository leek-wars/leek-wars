<template lang="html">
	<div>
		<swiper :options="swiperOption" @click-slide="handleClickSlide">
			<swiper-slide v-for="image of images" :key="image.id" class="slide">
				<img :src="'/image/' + image.image">
				<div class="legend">{{ image.legend_tr }}</div>
			</swiper-slide>
		</swiper>
		<div v-if="bigImage" class="bigscreen" @click="bigImage = null">
			<img :src="'/image/' + bigImage">
			<div class="biglegend">{{ $t(bigImageLegend) }}</div>
		</div>
	</div>
</template>

<script lang="ts">
	import { i18n, mixins } from '@/model/i18n'
	import { LeekWars } from '@/model/leekwars'
	import { Component, Vue, Watch } from 'vue-property-decorator'

	import 'swiper/css/swiper.css'
	import VueAwesomeSwiper from 'vue-awesome-swiper'
	Vue.use(VueAwesomeSwiper)

	@Component({ name: 'signup-carousel', i18n: {}, mixins })
	export default class SignupCarousel extends Vue {

		bigImage: string | null = null
		bigImageLegend: string = ''
		images = [
			{id: 1, image: "signup/new/fight_factory_small.jpg", legend: "fight_factory", legend_tr: ''},
			{id: 2, image: "signup/new/leek_small.jpg", legend: "leek_page", legend_tr: ''},
			{id: 3, image: "signup/new/br_small.jpg", legend: "fight_ice", legend_tr: ''},
			{id: 4, image: "signup/new/editor_small.jpg", legend: "editor", legend_tr: ''},
			{id: 5, image: "signup/new/forest.jpg", legend: "fight_forest", legend_tr: ''},
			{id: 6, image: "signup/new/market_small.jpg", legend: "market", legend_tr: ''},
			{id: 7, image: "signup/new/desert.jpg", legend: "fight_desert", legend_tr: ''},
			{id: 8, image: "signup/new/ranking_small.jpg", legend: "ranking", legend_tr: ''},
			{id: 9, image: "signup/new/trophies_small.jpg", legend: "trophies", legend_tr: ''},
			{id: 10, image: "signup/new/tournament_small.jpg", legend: "tournament", legend_tr: ''},
			{id: 11, image: "app/preview1.jpg", legend: "android_app", legend_tr: ''},
			{id: 12, image: "app/preview3.jpg", legend: "android_app", legend_tr: ''},
			{id: 13, image: "app/preview5.jpg", legend: "android_app", legend_tr: ''},
			{id: 14, image: "app/preview6.jpg", legend: "android_app", legend_tr: ''},
			{id: 15, image: "app/preview7.jpg", legend: "android_app", legend_tr: ''},
			{id: 16, image: "signup/new/mona.jpg", legend: "pixel_art", legend_tr: ''},
		]
		swiperOption = {
			slidesPerView: 'auto',
			spaceBetween: 15,
			freeMode: true,
			loop: true,
			autoplay: {
				delay: 2000
			}
		}

		@Watch('$i18n.locale', {immediate: true})
		updateLocale() {
			setTimeout(() => {
				for (const image of this.images) {
					image.legend_tr = this.$t(image.legend) as string
				}
			}, 200)
		}

		handleClickSlide(_: number, i: number) {
			if (LeekWars.mobile) { return }
			const image = this.images[i]
			this.bigImage = image.image.replace('_small', '')
			this.bigImageLegend = image.legend
		}
	}
</script>

<style lang="scss" scoped>
	.carousel {
		padding-top: 15px;
		padding-bottom: 10px;
	}
	.slide {
		img {
			height: 400px;
			cursor: zoom-in;
			border-radius: 4px;
		}
		.legend {
			text-align: center;
			font-size: 18px;
			font-weight: 300;
			color: #333;
			margin-top: 5px;
			margin-bottom: 10px;
		}
	}
	.bigscreen {
		z-index: 1000;
		position: fixed;
		top: 0;
		bottom: 0;
		left: 0;
		right: 0;
		padding: 100px 0;
		text-align: center;
		background: rgba(0,0,0,0.7);
		img {
			max-width: calc(100vw - 150px);
			max-height: calc(100vh - 200px);
			box-shadow: 0px 0px 80px black;
			cursor: zoom-out;
			border-radius: 10px;
			border: 6px solid white;
		}
	}
	.biglegend {
		padding-top: 10px;
		color: white;
		font-size: 20px;
		text-shadow: 0px 0px 20px black;
	}
	.slide {
		width: auto;
	}
</style>