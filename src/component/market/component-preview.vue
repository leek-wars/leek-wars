<template lang="html">
	<div class="stats">
		<div v-for="(stat, s) in component.stats" :key="s" class="stat" :class="{[stat[0]]: true, negative: stat[1] < 0}">
			<img class="icon" :src="'/image/charac/' + stat[0] + '.png'">
			<b :class="'color-' + stat[0]">{{ stat[1] }}</b>&nbsp;
			<span v-html="$t('characteristic.' + stat[0])"></span>
		</div>
	</div>
</template>

<script lang="ts">
	import { Component, Prop, Vue } from 'vue-property-decorator'
	@Component({ name: 'component-preview' })
	export default class ComponentPreview extends Vue {
		@Prop() component!: any
	}
</script>

<style src='./item-preview.scss' lang='scss'></style>

<style lang="scss" scoped>
	.stats {
		.stat {
			padding: 4px 0;
			padding-left: 60px;
			text-align: left;
			display: flex;
			align-items: center;
			&.negative {
				background: #fcc;
			}
			img {
				width: 20px;
				height: 20px;
				margin-bottom: 1px;
				margin-right: 6px;
			}
		}
	}
	body.dark {
		.stats .stat.negative {
			background: rgb(83, 14, 14);
		}
		.stat.frequency img {
			filter: invert(1);
		}
	}
</style>