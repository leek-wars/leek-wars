<template lang="html">
	<div class="carousel">
		<div class="swiper">
			<div class="swiper-wrapper">
				<div v-for="(image, i) of images" :key="i" class="swiper-slide" :class="`slide--${i}`" @click="handleClickSlide(i)">
					<img height="400" :src="'/image/' + image.image" loading="lazy">
					<div class="legend">{{ $t(image.legend) }}</div>
				</div>
			</div>
		</div>
		<div v-if="bigImage" class="bigscreen" @click="bigImage = null">
			<img :src="'/image/' + bigImage">
			<div class="biglegend">{{ $t(bigImageLegend) }}</div>
		</div>
	</div>
</template>

<script lang="ts">
	import { mixins } from '@/model/i18n'
	import { LeekWars } from '@/model/leekwars'
	import { Options, Vue, Watch } from 'vue-property-decorator'
	import { Swiper, Navigation, Pagination, Autoplay } from 'swiper'
	import 'swiper/css'

	@Options({ name: 'signup-carousel', i18n: {}, mixins: [...mixins] })
	export default class SignupCarousel extends Vue {

		bigImage: string | null = null
		bigImageLegend: string = ''
		images = [
			{id: 1, image: "signup/factory_fight_small.webp", legend: "fight_factory", legend_tr: ''},
			{id: 2, image: "signup/leek_small.webp", legend: "leek_page", legend_tr: ''},
			{id: 3, image: "signup/br_small.webp", legend: "fight_ice", legend_tr: ''},
			{id: 4, image: "signup/editor_small.webp", legend: "editor", legend_tr: ''},
			{id: 5, image: "signup/forest_fight_small.webp", legend: "fight_forest", legend_tr: ''},
			{id: 6, image: "signup/market_small.webp", legend: "market", legend_tr: ''},
			{id: 7, image: "signup/fight_desert_small.webp", legend: "fight_desert", legend_tr: ''},
			{id: 8, image: "signup/ranking_small.webp", legend: "ranking", legend_tr: ''},
			{id: 9, image: "signup/trophies_small.webp", legend: "trophies", legend_tr: ''},
			{id: 10, image: "signup/tournament_small.webp", legend: "tournament", legend_tr: ''},
			{id: 11, image: "app/preview1_small.webp", legend: "android_app", legend_tr: ''},
			{id: 12, image: "app/preview3_small.webp", legend: "android_app", legend_tr: ''},
			{id: 13, image: "app/preview5_small.webp", legend: "android_app", legend_tr: ''},
			{id: 14, image: "app/preview6_small.webp", legend: "android_app", legend_tr: ''},
			{id: 15, image: "app/preview7_small.webp", legend: "android_app", legend_tr: ''},
			{id: 16, image: "signup/mona_small.webp", legend: "pixel_art", legend_tr: ''},
		]

		mounted() {
			Swiper.use([Navigation, Pagination, Autoplay])
			const swiper = new Swiper('.swiper', {
				slidesPerView: 'auto',
				spaceBetween: 15,
				freeMode: true,
				loop: true,
				autoplay: {
					delay: 2000,
					disableOnInteraction: true
				}
			})
		}

		handleClickSlide(i: number) {
			if (LeekWars.mobile) { return }
			const image = this.images[i]
			this.bigImage = image.image.replace('_small', '')
			this.bigImageLegend = image.legend
		}
	}
</script>

<style lang="scss" scoped>
	.carousel {
		width: 100vw;
		margin-left: calc((100% - 100vw) / 2);
		user-select: none;
	}
	.swiper-slide {
		width: auto;
		img {
			height: 400px;
			cursor: zoom-in;
			vertical-align: bottom;
		}
		.legend {
			text-align: center;
			font-size: 18px;
			padding: 10px 0;
			background: var(--background);
		}
	}
	.bigscreen {
		z-index: 1000;
		position: fixed;
		top: 0;
		bottom: 0;
		left: 0;
		right: 0;
		padding: 50px 0;
		text-align: center;
		background: rgba(0,0,0,0.7);
		img {
			max-width: calc(100vw - 100px);
			max-height: calc(100vh - 100px);
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
</style>