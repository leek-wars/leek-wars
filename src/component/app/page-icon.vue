<template>
	<img v-if="!LeekWars.legacyTheme && !LeekWars.xpTheme" class="page-icon" :src="'/image/menu/' + name + '.svg'" alt="">
	<v-icon v-else-if="LeekWars.xpTheme" class="page-icon">{{ fallback }}</v-icon>
</template>

<script setup lang="ts">
	import { LeekWars } from '@/model/leekwars'

	// Icône de titre de page. En v3 c'est l'asset coloré du menu
	// (`public/image/menu/<name>.svg`, généré par scripts/generate-menu-icons.mjs)
	// et non le glyphe vert : le vocabulaire ne change pas, le glyphe mdi de
	// repli reste le même, seule la peinture change. Le thème XP garde son
	// glyphe.
	//
	// L'ancien design, lui, ne rend RIEN : son titre de page tient dans l'onglet
	// vert, il n'a jamais eu d'icône, et les règles qui placent celle-ci vivent
	// dans la coquille v3, gardée par `body:not(.v2)` — rendue quand même, elle
	// se posait seule en haut de la barre et poussait le titre d'une ligne (42
	// pages).
	defineOptions({ name: 'PageIcon' })

	defineProps<{
		/** Nom de l'asset dans public/image/menu/. */
		name: string
		/** Glyphe mdi pour les thèmes qui n'ont pas d'asset (XP). */
		fallback: string
	}>()
</script>
