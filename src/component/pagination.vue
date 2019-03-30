<template lang="html">
	<div v-if="total > 0" class="pagination">
		<router-link v-if="start > 1" :to="url">1</router-link>
		<span v-if="start > 1">...</span>

		<router-link v-for="i in (end - start + 1)" :key="i" :to="url + (start + i === 2 ? '' : '/page-' + (start + i - 1))" :class="{current: i + start - 1 === current}">{{ start + i - 1 }}</router-link>	

		<span v-if="end < total">...</span>
		<router-link v-if="end < total" :to="url + '/page-' + total">{{ total }}</router-link>
	</div>
</template>

<script lang="ts">
	import { Farmer } from '@/model/farmer'
	import { LeekWars } from '@/model/leekwars'
	import { Component, Prop, Vue } from 'vue-property-decorator'

	@Component({})
	export default class Pagination extends Vue {
		@Prop({required: true}) current!: number
		@Prop({required: true}) total!: number
		@Prop({required: true}) url!: string
		get center(): number { return Math.max(5, Math.min(this.total - 4, this.current)) }
		get start(): number { return this.center - 4 }
		get end(): number { return Math.min(this.total, this.center + 4) }
	}
</script>

<style lang="scss" scoped>
	.pagination {
		padding: 10px;
		text-align: center;
	}
	a {
		padding: 5px 7px;
		vertical-align: middle;
		font-size: 18px;
		display: inline-block;
		border-radius: 20px;
		margin: 0 2px;
	}
	a.current {
		padding: 5px 10px;
		color: white;
		background-color: #5fad1b;
		font-weight: bold;
	}
</style>