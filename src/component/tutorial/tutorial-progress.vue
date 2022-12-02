<template lang="html">
	<div class="tutoriel-progress">
		<v-tooltip :open-delay="0" :close-delay="0" bottom>
			<template v-slot:activator="{ on }">
				<router-link class="item current" :to="'/encyclopedia/fr/Tutoriel'">
					<div v-on="on"><v-icon>mdi-home</v-icon></div>
				</router-link>
			</template>
			Accueil
		</v-tooltip>
		<v-tooltip v-for="(item, i) of items" :key="i" :open-delay="0" :close-delay="0" bottom>
			<template v-slot:activator="{ on }">
				<router-link class="item" :class="{ completed: i < progress, current: i == progress }" :to="'/encyclopedia/fr/' + item.name.replace(/ /g, '_')">
					<div v-on="on"><v-icon>mdi-{{ item.icon }}</v-icon></div>
				</router-link>
			</template>
			{{ item.name }}
			<div>• {{ item.items }}</div>
		</v-tooltip>
		<div class="trophy">🏆</div>
	</div>
</template>

<script lang="ts">
	import { Component, Vue } from 'vue-property-decorator'
	import { tutorial_items } from './tutorial-items'

	@Component({ name: 'tutorial-progress', i18n: {} })
	export default class TutorialProgress extends Vue {

		progress = 6
		items = tutorial_items
	}
</script>

<style lang="scss" scoped>
	.tutoriel-progress {
		display: flex;
		align-items: center;
		width: 100%;
		gap: 6px;
		margin: 25px 0;
		.item {
			flex: 1;
			height: 30px;
			border-radius: 4px;
			background: #eee;
			box-shadow: 0px 2px 1px -1px rgb(0 0 0 / 20%), 0px 1px 1px 0px rgb(0 0 0 / 14%), 0px 1px 3px 0px rgb(0 0 0 / 12%);
			text-decoration: none !important;
			margin: 2px;
			div {
				height: 100%;
				color: #222;
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
				background: white;
			}
			&.router-link-active {
				margin: 0;
				border: 2px solid #222;
			}
		}
	}
	.trophy {
		font-size: 18px;
		margin: 0 5px;
	}
</style>