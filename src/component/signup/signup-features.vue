<template lang="html">
	<panel class="features first">
		<div v-for="(feature, f) in features" :key="f" class="feature">
			<div class="images">
				<div v-for="(image, i) in feature.images" :key="i" class="image-wrapper">
					<img :src="'/image/feature/small_' + image + '.webp'" @click="zoom">
				</div>
			</div>
			<div class="description">
				<span class="title"><v-icon>{{ feature.icon }}</v-icon> {{ $t(feature.title) }}</span>
				<span v-for="(text, t) in feature.texts" :key="t" v-html="$t(text)"></span>
			</div>
		</div>
		<div v-if="bigImage" class="big" @click="bigImage = null">
			<img :src="bigImage">
		</div>
	</panel>
</template>

<script lang="ts">
	/**
	 * mogrify -format webp *.png
	 * for file in *.webp; do convert $file -resize 400 small_$file; done
	 */
	import { i18n, loadComponentLanguage, mixins } from '@/model/i18n'
	import { Component, Vue, Watch } from 'vue-property-decorator'

	@Component({ name: 'signup-features', i18n: {}, mixins })
	export default class SignupFeatures extends Vue {
		bigImage: string = ''

		features = [
			{
				icon: 'mdi-code-braces',
				title: 'ai_title',
				images: ['documentation', 'debug_mark', 'editor_test', 'editor_black', 'editor'],
				texts: ["ai_text1", "ai_text2"]
			},
			{
				icon: 'mdi-wrench-outline',
				title: 'build_title',
				images: ['characteristics', 'leek_chips', 'leek_weapons', 'leek_page'],
				texts: ["build_text1", "build_text2"]
			},
			{
				icon: 'mdi-sword-cross',
				title: 'fight_title',
				images: ['fight_forest', 'fight_glacier', 'garden', 'fight_desert'],
				texts: ["fight_text1", "fight_text2"]
			},
			{
				icon: 'mdi-memory',
				title: 'items_title',
				images: ['chip_grapple', 'chip_arsenic', 'chip_fortress', 'chip_remission', 'weapon_m_laser', 'chip_meteorite'],
				texts: ["items_text1", "items_text2"]
			},
			{
				icon: 'mdi-trophy-outline',
				title: "trophies_title",
				images: ['trophies_notif', 'trophies', 'trophies_2'],
				texts: ["trophies_text1"]
			},
			{
				icon: 'mdi-trophy-outline',
				title: "tournament_title",
				images: ['ranking', 'fight_battle_royale', 'fight_tournament', 'tournament'],
				texts: ["tournament_text1", "tournament_text2"]
			},
			{
				icon: 'mdi-trophy-outline',
				title: "community_title",
				images: ['comments', 'encyclopedia', 'forum_topic', 'forum'],
				texts: ["community_text1"]
			},
			{
				icon: 'mdi-auto-fix',
				title: 'customization_title',
				images: ['pomp', 'potions', 'hats', 'leek_style'],
				texts: ["customization_text1"]
			},
		]

		zoom(e: Event) {
			this.bigImage = (e.target as HTMLElement).getAttribute('src')!.replace("small_", "")
			console.log(e.target)
		}
	}
</script>

<style lang="scss" scoped>
.features {
	padding: 10px 0;
}
.feature {
	display: flex;
	font-size: 18px;
	font-weight: 300;
	margin: 5px 0;
	.images {
		display: flex;
		flex: 3;
		height: 300px;
		min-width: 0;
		justify-content: flex-end;
	}
	.image-wrapper {
		min-width: 0;
		display: flex;
		max-width: 200px;
		height: 300px;
		justify-content: flex-end;
	}
	img {
		border: 5px solid white;
		box-shadow: 0px 3px 5px -1px rgb(0 0 0 / 20%), 0px 5px 8px 0px rgb(0 0 0 / 14%), 0px 1px 14px 0px rgb(0 0 0 / 12%);
		border-radius: 5px;
		min-width: 0;
		max-width: 380px;
		flex-shrink: 0;
		transform-style: preserve-3d;
		transform: perspective(800px) rotateY(25deg);
		transition: all 0.2s ease;
		cursor: zoom-in;
	}
	&:nth-child(2n) {
		flex-direction: row-reverse;
		.images {
			flex-direction: row-reverse;
		}
		img {
			transform: perspective(800px) rotateY(-25deg);
			&:hover {
				transform: perspective(800px) rotateY(-15deg) translateX(50px);
			}
		}
		.image-wrapper {
			justify-content: flex-start;
		}
		.image-wrapper:last-child img:hover {
			transform: perspective(800px) rotateY(-15deg);
		}
	}
	&:nth-child(2n+1) {
		img {
			&:hover {
				transform: perspective(800px) rotateY(15deg) translateX(-50px);
			}
		}
		.image-wrapper:last-child img:hover {
			transform: perspective(800px) rotateY(15deg);
		}
		.description {
			padding-right: 10px;
		}
	}
	.description {
		display: flex;
		flex: 2;
		align-items: center;
		flex-direction: column;
		justify-content: center;
		.title {
			font-size: 22px;
			font-weight: 400;
			position: relative;
			align-self: flex-start;
			display: flex;
			align-items: center;
			margin-bottom: 30px;
			&:after {
				width: 100%;
				background: #5fad1b;
				height: 2px;
				content: "";
				position: absolute;
				bottom: -6px;
				left: 0;
			}
			.v-icon {
				margin-right: 6px;
				font-size: 26px;
			}
		}
		span {
			margin-bottom: 20px;
			text-align: justify;
		}
	}
}
#app.app .feature {
	flex-direction: column-reverse;
	&:not(:last-child) .images {
		margin-bottom: 20px;
	}
	img {
		transform: none;
		max-width: calc(100vw - 30px);
		box-shadow: none;
	}
}
.big {
	position: fixed;
	top: 0;
	right: 0;
	left: 0;
	bottom: 0;
	display: flex;
	width: 100%;
	height: 100%;
	align-items: center;
	justify-content: center;
	background: #000a;
	z-index: 10;
	img {
		max-width: 1500px;
		border: 5px solid white;
		box-shadow: 0px 3px 5px -1px rgb(0 0 0 / 20%), 0px 5px 8px 0px rgb(0 0 0 / 14%), 0px 1px 14px 0px rgb(0 0 0 / 12%);
		border-radius: 10px;
	}
}
</style>