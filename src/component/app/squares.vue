<template>
	<div v-show="LeekWars.squares.squares.length" class="squares">
		<router-link v-for="square in LeekWars.squares.squares" :key="square.id" :to="square.link" class="square card">
			<img :class="{padding: square.padding}" :src="square.image" class="image">
			<div class="wrapper">
				<div class="title" v-html="square.title"></div>
				<div v-emojis class="message" v-text="square.message"></div>
			</div>
		</router-link>
	</div>
</template>

<script lang="ts">
	import { Component, Vue } from 'vue-property-decorator'
	@Component({})
	export default class Squares extends Vue {}
</script>

<style lang="scss" scoped>
	.squares {
		position: fixed;
		bottom: 0;
		right: 0;
		z-index: 10000;
		padding: 20px;
	}
	.square {
		display: flex;
		margin-top: 10px;
		width: 300px;
		border-radius: 2px;
		box-shadow: 0px 11px 15px -7px rgba(0,0,0,0.2), 0px 24px 38px 3px rgba(0,0,0,0.14), 0px 9px 46px 8px rgba(0,0,0,0.12);
		overflow: hidden;
		animation: in-and-out 5s;
	}
	@keyframes in-and-out {
		0% { transform: translate(150%, 0); }
		10% { transform: translate(0, 0); }
		90% { transform: translate(0, 0); }
		100% { transform: translate(150%, 0); }
	}
	.image {
		width: 60px;
		height: 60px;
		flex: 0 0 60px;
		margin-right: 8px;
	}
	.image.padding {
		width: 30px;
		height: 30px;
		flex: 0 0 30px;
		margin-right: 0;
		padding: 15px 12px;
	}
	.wrapper {
		padding: 10px 0;
	}
	.title {
		font-size: 15px;
		margin-bottom: 4px;
	}
	.message {
		font-size: 14px;
	}
</style>