<template>
	<router-view :key="LeekWars.routerViewKey" />
</template>

<script setup lang="ts">
	import { LeekWars } from '@/model/leekwars'
	defineOptions({ name: 'PageHost' })
	// Pas de `:key` par route sur le router-view : le remount keyé avait été posé pour contourner les
	// crashs « parentNode/nextSibling of null », dont la cause réelle s'est révélée être
	// tout autre (une liaison de <script setup> masquant le composant <error> sur leek/team/trophy,
	// cf. component-tag-shadowing.test.ts). On garde donc le patch in-place, moins coûteux.
	// La clé ne change qu'au changement de compte, pour recréer la page (cf. model/account-switch.ts).
</script>
