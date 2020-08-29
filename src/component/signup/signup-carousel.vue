<template lang="html">
	<div>
		<swiper :options="swiperOption" @click-slide="handleClickSlide">
			<swiper-slide v-for="(image, i) of images" :key="i" class="slide">
				<img :src="'/image/' + image[0]">
				<div class="legend">{{ $t(image[1]) }}</div>
			</swiper-slide>
		</swiper>

		<div v-if="bigImage" class="bigscreen" @click="bigImage = null">
			<img :src="'/image/' + bigImage">
			<div class="biglegend">{{ $t(bigImageLegend) }}</div>
		</div>
	</div>
</template>

<script lang="ts">
	import ChangelogVersion from '@/component/changelog/changelog-version.vue'
	import { i18n, mixins } from '@/model/i18n'
	import { LeekWars } from '@/model/leekwars'
	import { Component, Vue } from 'vue-property-decorator'

	import 'swiper/css/swiper.css'
	import VueAwesomeSwiper from 'vue-awesome-swiper'
	Vue.use(VueAwesomeSwiper)

	@Component({ name: 'signup-carousel', i18n: {}, mixins })
	export default class SignupCarousel extends Vue {

		bigImage: string | null = null
		bigImageLegend: string = ''
		images = [
			["signup/new/fight_factory_small.jpg", "fight_factory"],
			["signup/new/leek_small.jpg", "leek_page"],
			["signup/new/br_small.jpg", "fight_ice"],
			["signup/new/editor_small.jpg", "editor"],
			["signup/new/forest.jpg", "fight_forest"],
			["signup/new/market_small.jpg", "market"],
			["signup/new/desert.jpg", "fight_desert"],
			["signup/new/ranking_small.jpg", "ranking"],
			["signup/new/trophies_small.jpg", "trophies"],
			["signup/new/tournament_small.jpg", "tournament"],
			["app/preview1.jpg", "android_app"],
			["app/preview3.jpg", "android_app"],
			["app/preview5.jpg", "android_app"],
			["app/preview6.jpg", "android_app"],
			["app/preview7.jpg", "android_app"],
			["signup/new/mona.jpg", "pixel_art"],
		]
		swiperOption = {
			slidesPerView: 'auto',
			spaceBetween: 15,
			freeMode: true,
			loop: true,
			autoplay: {
				delay: 3000,
				disableOnInteraction: true
			}
		}

		handleClickSlide(_: number, i: number) {
			if (LeekWars.mobile) { return }
			const image = this.images[i]
			this.bigImage = image[0].replace('_small', '')
			this.bigImageLegend = image[1]
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