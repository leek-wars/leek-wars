<template>
	<div :class="{extended: extended}" class="screen" @click="extended = !extended">
		<img :src="src">
		<div class="legend">{{ legend }}</div>
	</div>
</template>

<script lang="ts">
	import { LeekWars } from '@/model/leekwars'
	import { Component, Prop, Vue } from 'vue-property-decorator'
	@Component({ name: 'screen' })
	export default class Screen extends Vue {
		@Prop({required: true}) src!: string
		@Prop({required: true}) legend!: string
		extended: boolean = false
	}
</script>

<style lang="scss" scoped>
	.screen {
		margin-bottom: 20px;
	}
	.screen:hover .legend {
		color: black;
	}
	.screen img {
		cursor: zoom-in;
		display: block;
		width: 65%;
		margin: 0 auto;
		border-radius: 6px;
	}
	.screen.extended img {
		cursor: zoom-out;
		width: 100%;
	}
	.screen .legend {
		text-align: center;
		font-size: 18px;
		font-weight: 300;
		color: #555;
		font-style: italic;
		padding: 5px;
	}
</style>