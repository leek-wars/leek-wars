<template>
	<img v-if="!LeekWars.legacyTheme && !LeekWars.xpTheme" class="page-icon" :src="'/image/menu/' + name + '.svg'" alt="">
	<v-icon v-else class="page-icon">{{ fallback }}</v-icon>
</template>

<script setup lang="ts">
	import { LeekWars } from '@/model/leekwars'

	// Icône de titre de page. En v3 c'est l'asset coloré du menu
	// (`public/image/menu/<name>.svg`, généré par scripts/generate-menu-icons.mjs)
	// et non le glyphe vert (Pierre, 2026-09-07 : « mettre celui en couleur au
	// lieu de juste vert ») : le vocabulaire ne change pas, le glyphe mdi de
	// repli reste celui d'ICONS.md, seule la peinture change. Le v2 et le thème XP
	// gardent leur glyphe.
	defineOptions({ name: 'PageIcon' })

	defineProps<{
		/** Nom de l'asset dans public/image/menu/. */
		name: string
		/** Glyphe mdi pour les thèmes qui n'ont pas d'asset (v2, XP). */
		fallback: string
	}>()
</script>
