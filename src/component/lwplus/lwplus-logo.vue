<template>
	<img class="lwplus-logo" :src="src" :alt="alt" :width="size.w" :height="size.h" draggable="false" @mouseenter="spin">
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'

// Logo LW+ : rendu 3D doré pré-calculé (Blender, scripts/generate-lwplus-logo.py).
// Le WebP joue UN tour du « + » (1 s) puis s'arrête sur son image de fin, qui
// est aussi l'image de départ. On relance le tour au
// survol, et nulle part tout seul (décision de Pierre, 10/09) : le tour de trop
// finit par agacer sur une page qu'on garde ouverte. Un navigateur ne redémarre pas une image animée déjà en cache
// (changer le fragment de l'URL ne suffit pas, vérifié sur Chrome) : le fichier
// est donc chargé une fois en Blob et chaque tour reçoit une URL d'objet neuve,
// que le navigateur traite comme une image nouvelle, sans requête réseau.
// Quand l'utilisateur refuse le mouvement, on sert l'image fixe et rien ne bouge.
const props = withDefaults(defineProps<{
	variant?: 'lwplus' | 'plus'
	alt?: string
}>(), { variant: 'lwplus', alt: 'LW+' })

const reduced = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
const base = computed(() => '/image/lwplus/' + props.variant + (reduced ? '_poster.png' : '.webp'))
const size = computed(() => props.variant === 'lwplus' ? { w: 800, h: 400 } : { w: 400, h: 400 })
const src = ref(base.value)
const SPIN_DURATION = 1000

let spinningUntil = 0
let blob: Blob | null = null
let objectUrl = ''

function spin() {
	if (reduced || !blob) { return }
	const now = Date.now()
	if (now < spinningUntil) { return }
	spinningUntil = now + SPIN_DURATION
	const previous = objectUrl
	objectUrl = URL.createObjectURL(blob)
	src.value = objectUrl
	// L'ancienne URL n'est libérée qu'une fois la nouvelle affichée
	if (previous) { setTimeout(() => URL.revokeObjectURL(previous), 500) }
}

defineExpose({ spin })

onMounted(async () => {
	if (reduced) { return }
	try {
		blob = await (await fetch(base.value)).blob()
	} catch (_e) {
		// Sans blob, on garde le tour du chargement et on ne relance rien
	}
})
onUnmounted(() => {
	if (objectUrl) { URL.revokeObjectURL(objectUrl) }
})
</script>

<style lang="scss" scoped>
.lwplus-logo {
	display: block;
	height: auto;
	user-select: none;
}
</style>
