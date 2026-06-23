<template>
	<router-view :key="routeKey" />
</template>

<script setup lang="ts">
	import { computed } from 'vue'
	import { useRoute } from 'vue-router'
	defineOptions({ name: 'PageHost' })

	const route = useRoute()

	// #4163 : on keye le <router-view> par route.path pour forcer un REMOUNT propre au changement
	// de paramètre (ex /leek/A -> /leek/B) au lieu d'un patch IN-PLACE du composant réutilisé, qui
	// démonte les Teleports/tooltips Vuetify en plein scheduler -> crash "parentNode of null".
	//
	// MAIS beaucoup de pages naviguent entre params EN INTERNE (browse/pagination, on reste sur le
	// même composant) : les remonter = "reload" visible à chaque item/page. Ces pages-là gardent
	// une clé STABLE (pas de remount) ; un crash rare y est rattrapé par le hard-reload de récup.
	// Le corrupteur principal (leek, qui a useLiveHistory) reste keyé.
	const KEEP_MOUNTED = ['/editor', '/market', '/encyclopedia', '/help', '/ranking', '/forum', '/bank']
	const routeKey = computed(() => {
		const path = route.path
		const base = KEEP_MOUNTED.find(p => path === p || path.startsWith(p + '/'))
		return base ?? path
	})
</script>
