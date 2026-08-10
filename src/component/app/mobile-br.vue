<template>
	<router-link v-if="LeekWars.arena.enabled" to="/garden/arena" class="br">
		Arène <b class="progress">{{ LeekWars.arena.progress }} / 20</b>
	</router-link>
</template>

<script setup lang="ts">
</script>

<style lang="scss" scoped>
	.br {
		z-index: 100;
		position: fixed;
		top: 50%;
		right: -34px;
		background: var(--panel-header-background);
		color: var(--white);
		transform: rotate(-90deg);
		padding: 7px 10px;
		border-top-left-radius: var(--radius-medium);
		border-top-right-radius: var(--radius-medium);
	}
</style>