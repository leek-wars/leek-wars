<template lang="html">
	<div :class="{raw: raw}" class="breadcrumb">
		<template v-for="(item, i) in items" :key="item.name">
			<component :is="item.link ? 'router-link' : 'span'" v-ripple :to="item.link || undefined" class="item">{{ item.name }}</component>
			<v-icon v-if="i < items.length - 1" :key="i">mdi-chevron-right</v-icon>
		</template>
	</div>
</template>

<script lang="ts">
	import { Options, Prop, Vue } from 'vue-property-decorator'
	@Options({})
	export default class Breadcrumb extends Vue {
		@Prop({required: true}) items!: any[]
		@Prop() raw!: boolean
	}
</script>

<style lang="scss" scoped>
	.breadcrumb {
		display: inline;
		i {
			vertical-align: middle;
			font-size: 24px;
		}
	}
	.breadcrumb:not(.raw) {
		font-size: 16px;
		line-height: 30px;
		padding: 10px;
		display: block;
		i {
			padding-right: 8px;
			margin-bottom: 2px;
		}
		.item {
			padding-right: 8px;
		}
	}
</style>