<template lang="html">
	<div draggable='true' class='ai'>{{ ai.name }}</div>
</template>

<script lang="ts">
	import { AI } from '@/model/ai'
	import { Component, Prop, Vue } from 'vue-property-decorator'
	@Component({ name: "ai" })
	export default class AIElement extends Vue {
		@Prop({required: true}) ai!: AI
	}
</script>

<style lang="scss" scoped>
	.ai {
		display: inline-block;
		vertical-align: bottom;
		background-image: url('/image/ai.png');
		background-size: 100% 100%;
		padding: 0 14px;
		padding-top: 45px;
		width: 75px;
		height:  90px;
		position: relative;
		word-wrap: break-word;
		color: #888;
		font-size: 17px;
		font-weight: bold;
		text-align: center;
	}
</style>