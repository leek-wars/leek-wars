<template lang="html">
	<div :class="{raw: raw}" class="breadcrumb">
		<template v-for="(item, i) in items">
			<router-link :key="item.name" v-ripple :to="item.link" class="item">{{ item.name }}</router-link>
			<v-icon v-if="i < items.length - 1" :key="i">mdi-chevron-right</v-icon>
		</template>
	</div>
</template>

<script lang="ts">
	import { Component, Prop, Vue } from 'vue-property-decorator'
	@Component({})
	export default class Breadcrumb extends Vue {
		@Prop({required: true}) items!: any[]
		@Prop() raw!: boolean
	}
</script>

<style lang="scss" scoped>
	.breadcrumb {
		display: flex;
		align-items: baseline;
		margin: 0 -6px;
		height: 100%;
		.item {
			padding: 0 6px;
			height: 100%;
		}
		.item:not(:first-child) {
			white-space: nowrap;
			text-overflow: ellipsis;
			overflow: hidden;
		}
		i {
			align-self: center;
		}
	}
	.breadcrumb:not(.raw) {
		font-size: 16px;
		i {
			margin-left: -6px;
			margin-right: -6px;
		}
		.item {
			padding: 10px;
		}
	}
</style>