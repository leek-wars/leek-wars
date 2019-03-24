<template>
	<router-link v-if="LeekWars.battleRoyale.enabled" to="/garden/battle-royale" class="br">
		BR <b class="progress">{{ LeekWars.battleRoyale.progress }} / 10</b>
	</router-link>
</template>

<script lang="ts">
	import { Component, Vue } from 'vue-property-decorator'
	@Component({})
	export default class MobileBR extends Vue {}
</script>

<style lang="scss" scoped>
	.br {
		z-index: 100;
		position: fixed;
		top: 50%;
		right: -25px;
		background: #2a2a2a;
		color: white;
		transform: rotate(-90deg);
		padding: 7px 10px;
		border-top-left-radius: 6px;
		border-top-right-radius: 6px;
	}
</style>