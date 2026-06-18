<template>
	<div class="requests">{{ LeekWars.requests }} <v-btn size="x-small" @click="LeekWars.requests = 0">reset</v-btn></div>
</template>

<script setup lang="ts">
	import { LeekWars } from '@/model/leekwars'
	defineOptions({ name: 'RequestCounter' })
</script>

<style lang="scss" scoped>
	// Compteur de requêtes de debug (display:none, activé à la main en dev). Isolé dans
	// son propre composant pour que LeekWars.requests (incrémenté à CHAQUE requête HTTP)
	// ne soit pas lu dans le rendu de app.vue : sinon app.vue se re-render à chaque
	// requête et, quand l'une tombe pendant un swap de <router-view>, re-patche la racine
	// de destination dont l'el est null → crash "parentNode of null" (#4163).
	.requests {
		display: none;
		background: rgba(0,0,0,0.8);
		color: white;
		padding: 10px;
		position: fixed;
		top: 10px;
		left: 10px;
		z-index: 100;
	}
</style>
