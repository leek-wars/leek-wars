<template>
	<router-view />
</template>

<script setup lang="ts">
	defineOptions({ name: 'PageHost' })
	// #4163 : plus de keying. Le crash "parentNode of null" venait de pages à racine de template
	// CONDITIONNELLE (<error v-if>/<div v-else class=page>) -> Fragment racine dont l'el devenait
	// null pendant le patch in-place. Corrigé à la source (racine .page stable sur leek/team/trophy),
	// donc le remount keyé n'est plus nécessaire -> on récupère l'UX no-remount partout.
	// Filet de sécurité conservé : le hard-reload sur parentNode/el dans model/vue.ts.
</script>
