<template>
	<router-view :key="routeKey" />
</template>

<script setup lang="ts">
	import { computed } from 'vue'
	import { useRoute } from 'vue-router'
	defineOptions({ name: 'PageHost' })

	const route = useRoute()

	// TEST #4163 : keyer le <router-view> par route.path force un REMOUNT PROPRE au changement
	// de paramètre (ex /leek/A -> /leek/B) au lieu d'un patch IN-PLACE du composant réutilisé.
	// Le patch in-place démonte les Teleports/tooltips Vuetify en plein scheduler -> crash
	// "parentNode of null" (cf. commentaire leek.vue). Le remount unmonte proprement l'ancien
	// (chemin unmount, pas patch) puis monte le nouveau.
	// On garde route.path (pas fullPath) : pas de remount sur changement de hash/query.
	// EXCEPTION éditeur : 4 records (/editor, /editor/:id, .../diff, .../h/:hash) + self-replace
	// au montage + état Monaco lourd -> une clé unique pour ne JAMAIS le remonter sur ces transitions.
	const routeKey = computed(() => route.path.startsWith('/editor') ? 'editor' : route.path)
</script>
