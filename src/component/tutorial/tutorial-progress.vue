<template lang="html">
	<div class="tutoriel-progress">
		<v-tooltip :open-delay="0" :close-delay="0" bottom>
			<template #activator="{ props }">
				<router-link class="item current" :to="'/encyclopedia/' + locale + '/' + $t('main_page')">
					<div v-bind="props"><v-icon>mdi-home</v-icon></div>
				</router-link>
			</template>
			{{ $t('home') }}
		</v-tooltip>
		<v-tooltip v-for="(item, i) of items" :key="i" :open-delay="0" :close-delay="0" bottom>
			<template #activator="{ props }">
				<router-link class="item" :class="{ completed: i < progress, current: i < 10 && i == progress }" :to="'/encyclopedia/' + locale + '/' + $t(item.name).replace(/ /g, '_')">
					<div v-bind="props"><v-icon>mdi-{{ item.icon }}</v-icon></div>
				</router-link>
			</template>
			{{ $t(item.name) }}
			<div>• {{ $t(item.name + '_items') }}</div>
		</v-tooltip>
		<div class="trophy">🏆</div>
	</div>
</template>

<script lang="ts">
	import { store } from '@/model/store'
	import { Options, Prop, Vue } from 'vue-property-decorator'
	import { tutorial_items } from './tutorial-items'

	@Options({ name: 'tutorial-progress', i18n: {} })
	export default class TutorialProgress extends Vue {

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
	#app.app .tutoriel-progress .item {
		flex: none;
	}
	.tutoriel-progress {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		width: 100%;
		gap: 6px;
		margin: 25px 0;
		.item {
			height: 30px;
			border-radius: 4px;
			background: var(--background-secondary);
			box-shadow: 0px 2px 1px -1px rgb(0 0 0 / 20%), 0px 1px 1px 0px rgb(0 0 0 / 14%), 0px 1px 3px 0px rgb(0 0 0 / 12%);
			text-decoration: none !important;
			margin: 2px;
			padding: 0 15px;
			flex: 1;
			div {
				height: 100%;
				color: var(--text-color);
				display: flex;
				align-items: center;
				justify-content: center;
				.v-icon {
					font-size: 20px;
				}
			}
			&.completed {
				background: #5fad1b;
				div {
					color: white;
				}
			}
			&.current {
				background: var(--pure-white);
			}
			&.router-link-active {
				margin: 0;
				border: 2px solid var(--text-color);
			}
		}
	}
	.trophy {
		font-size: 18px;
		margin: 0 5px;
	}
</style>