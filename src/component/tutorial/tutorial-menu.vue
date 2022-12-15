<template lang="html">

	<div class="tutorial-menu">

		<router-link v-for="(item, i) of items" :key="i" class="item" :style="{'background-image': 'url(' + item.image + ')'}" :to="'/encyclopedia/' + locale + '/' + $t(item.name).replace(/ /g, '_')">
			<v-icon class="icon">mdi-{{ item.icon }}</v-icon>
			<div class="bottom">
				<div class="name">
					<span>{{ i + 1 }} - {{ $t(item.name) }}</span>
					<v-icon v-if="i < progress">mdi-check-bold</v-icon>
				</div>
				<ul class="items"><li>{{ $t(item.name + '_items') }}</li></ul>
			</div>
		</router-link>
	</div>
</template>

<script lang="ts">
	import { store } from '@/model/store'
	import { Component, Prop, Vue } from 'vue-property-decorator'
	import { tutorial_items } from './tutorial-items'

	@Component({ name: 'tutorial-menu', i18n: {} })
	export default class TutorialMenu extends Vue {
		@Prop() locale!: string
		items = tutorial_items

		created() {
			const locale = this.locale
			import(/* webpackChunkName: "tutorial-[request]" */ `@/lang/${locale}/tutorial.json`).then(module => {
				this.$i18n.mergeLocaleMessage(locale, module)
			})
		}

		get progress() {
			return store.state.farmer ? store.state.farmer.tutorial_progress : 0
		}
	}
</script>

<style lang="scss" scoped>
	.tutorial-menu {
		display: grid;
		gap: 15px;
		flex-wrap: wrap;
		grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
		text-align: center;
		.item {
			position: relative;
			font-size: 17px;
			height: 170px;
			background-size: cover;
			background-position: center;
			display: flex;
			align-items: flex-end;
			text-decoration: none !important;
			border-radius: 4px;
			box-shadow: 0px 2px 1px -1px rgb(0 0 0 / 20%), 0px 1px 1px 0px rgb(0 0 0 / 14%), 0px 1px 3px 0px rgb(0 0 0 / 12%);
			overflow: hidden;
			.bottom {
				padding-top: 20px;
				padding-bottom: 8px;
				padding-left: 12px;
				background: linear-gradient(transparent, #000d);
				flex: 1;
				color: white;
				text-align: left;
				border-bottom-left-radius: 4px;
				border-bottom-right-radius: 4px;
				margin-bottom: -28px;
				transition: margin-bottom 200ms ease;
				.name {
					display: flex;
					align-items: center;
					gap: 8px;
					.v-icon {
						color: white;
						background: #5fad1b;
						border-radius: 50%;
						padding: 2px;
						font-size: 15px;
					}
				}
			}
			&:hover .bottom {
				margin-bottom: 0;
			}
			img {
				height: 140px;
				width: 100%;
				vertical-align: top;
				object-fit: cover;
			}
			.icon {
				position: absolute;
				font-size: 40px;
				background: white;
				border-radius: 50%;
				box-shadow: rgba(0, 0, 0, 0.3) 0px 5px 5px;
				left: 9px;
				top: 9px;
				padding: 7px;
				color: #222;
			}
			.items {
				font-size: 14px;
				margin: 0;
				margin-top: 5px;
				color: white;
				padding-left: 18px;
			}
		}
	}
</style>