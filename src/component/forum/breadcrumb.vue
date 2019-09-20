<template lang="html">
	<div class="breadcrumb" :class="{raw: raw}">
		<template v-for="(item, i) in items">
			<router-link :key="item.name" :to="item.link" class="item">{{ item.name }}</router-link>
			<i class="material-icons" v-if="i < items.length - 1" :key="i">chevron_right</i>
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
		align-items: center;
		.item:not(:first-child) {
			white-space: nowrap;
			text-overflow: ellipsis;
			overflow: hidden;
		}
	}
	.breadcrumb:not(.raw) {
		font-size: 16px;
		padding: 0 10px;
		.item {
			padding: 10px 2px;
		}
	}
</style>