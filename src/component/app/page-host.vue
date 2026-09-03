<template>
	<router-view />
</template>

<script setup lang="ts">
	defineOptions({ name: 'PageHost' })
	// Pas de `:key` sur le router-view : le remount keyé avait été posé pour contourner les
	// crashs « parentNode/nextSibling of null » (#4163), dont la cause réelle s'est révélée être
	// tout autre (une liaison de <script setup> masquant le composant <error> sur leek/team/trophy,
	// cf. component-tag-shadowing.test.ts). On garde donc le patch in-place, moins coûteux.
</script>
