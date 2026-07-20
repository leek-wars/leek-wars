<template lang="html">
	<img :src="src" loading="lazy">
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { LeekWars } from '@/model/leekwars'

// Les icônes de trophée ont une structure en gris #444, illisible sur fond
// sombre. On génère des variantes `<code>_dark.svg` (gris éclairci, accents
// conservés) via scripts/generate-trophy-dark.mjs, et on bascule simplement
// le src selon le thème. Pas de recoloration runtime : <img> natif + lazy.
// `light` force la variante claire (gris #444) même en thème sombre : utile
// sur un fond jaune vif (récompenses de parrainage débloquées) où le gris
// éclairci serait délavé.
const props = defineProps<{ code: string, light?: boolean }>()

const src = computed(() => LeekWars.STATIC + 'image/trophy/' + props.code + (LeekWars.darkMode && !props.light ? '_dark' : '') + '.svg')
</script>
