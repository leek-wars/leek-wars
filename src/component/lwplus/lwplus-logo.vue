<template>
	<img
		class="lwplus-logo"
		:src="src"
		:alt="alt"
		:width="size.w"
		:height="size.h"
		draggable="false"
		@pointerenter="onPointerEnter"
		@pointerleave="rest"
		@error="rest">
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

// Logo LW+ : rendu 3D doré pré-calculé (Blender, scripts/generate-lwplus-logo.py).
//
// Au repos c'est une image FIXE, et le WebP animé (qui tourne en boucle) n'est
// mis en source que pendant le survol À LA SOURIS. Deux images, un échange de
// `src` : rien d'autre.
//
// Les deux versions précédentes essayaient de rejouer UN tour à chaque survol,
// avec un WebP en boucle unique relancé par une URL d'objet. Ça ne tient pas :
// un navigateur ne rejoue pas de façon fiable une animation déjà terminée
// (vérifié, l'image restait sur son image de fin), et l'URL d'objet ne s'affiche
// pas dans la WebView de l'appli Android — l'image y cassait au premier appui.
// La boucle infinie montrée pendant le survol donne le même effet à l'œil, sans
// rien de tout ça.
//
// La dernière image de l'animation est identique à la première, donc l'échange
// ne saute ni à l'entrée ni à la sortie.
const props = withDefaults(defineProps<{
	variant?: 'lwplus' | 'plus'
	alt?: string
}>(), { variant: 'lwplus', alt: 'LW+' })

const reduced = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
const still = computed(() => '/image/lwplus/' + props.variant + '_still.webp')
const animated = computed(() => '/image/lwplus/' + props.variant + '.webp')
const size = computed(() => props.variant === 'lwplus' ? { w: 800, h: 400 } : { w: 400, h: 400 })
const src = ref(still.value)

// Souris seulement : sur un écran tactile l'appui déclenche quand même le
// survol, et il n'y a pas de sortie pour revenir à l'image fixe.
function spin(event?: PointerEvent) {
	if (reduced) { return }
	if (event && event.pointerType && event.pointerType !== 'mouse') { return }
	src.value = animated.value
}

// Sert aussi de filet sur `error` : si l'animé ne s'affiche pas, on garde la fixe.
function rest() {
	src.value = still.value
}

function onPointerEnter(event: PointerEvent) {
	spin(event)
}

defineExpose({ spin, rest })
</script>

<style lang="scss" scoped>
.lwplus-logo {
	display: block;
	height: auto;
	user-select: none;
}
</style>
