<template>
	<img class="lwplus-logo" :src="src" :alt="alt" :width="size.w" :height="size.h" draggable="false" @pointerenter="onPointerEnter" @error="onError">
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'

// Logo LW+ : rendu 3D doré pré-calculé (Blender, scripts/generate-lwplus-logo.py).
// Le WebP joue UN tour du « + » (1 s) puis s'arrête sur son image de fin, qui est
// aussi l'image de départ. On relance le tour au survol, et nulle part tout seul
// (décision de Pierre, 10/09) : le tour de trop finit par agacer sur une page
// qu'on garde ouverte.
//
// Un navigateur ne redémarre pas une image animée déjà en cache (changer le
// fragment de l'URL ne suffit pas, vérifié sur Chrome) : le fichier est donc
// chargé une fois en Blob et chaque tour reçoit une URL d'objet neuve, que le
// navigateur traite comme une image nouvelle, sans requête réseau.
//
// Tout ce mécanisme est un CONFORT : si le Blob n'arrive pas, n'est pas une
// image, ou si son URL ne s'affiche pas (WebView de l'appli Android, portail de
// la beta qui répond du HTML sur un asset…), on retombe sur le fichier et
// l'image reste à l'écran. Elle ne doit jamais casser pour une animation.
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

function releaseObjectUrl() {
	if (objectUrl) {
		URL.revokeObjectURL(objectUrl)
		objectUrl = ''
	}
}

// Souris seulement : sur un écran tactile un appui déclenche quand même le
// survol, et l'URL d'objet ne s'affiche pas dans la WebView de l'appli — l'image
// cassait au premier appui (signalé par Pierre depuis la beta, 10/09). Sans
// survol, pas de tour : le fichier suffit.
function isHoverPointer(event: PointerEvent) {
	return !event.pointerType || event.pointerType === 'mouse'
}

function onPointerEnter(event: PointerEvent) {
	if (isHoverPointer(event)) { spin() }
}

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

// L'URL d'objet n'a pas pu s'afficher : on revient au fichier et on renonce aux
// tours suivants, plutôt que de laisser une image cassée à l'écran.
function onError() {
	if (!src.value.startsWith('blob:')) { return }
	blob = null
	releaseObjectUrl()
	src.value = base.value
}

defineExpose({ spin })

onMounted(async () => {
	if (reduced) { return }
	try {
		const response = await fetch(base.value)
		if (!response.ok) { return }
		const loaded = await response.blob()
		// Un portail d'authentification répond 200 avec du HTML : ce Blob-là
		// donnerait une image cassée au premier survol.
		if (!loaded.type.startsWith('image/')) { return }
		blob = loaded
	} catch (_e) {
		// Sans Blob, l'image reste celle du fichier et ne tourne qu'au chargement
	}
})
onUnmounted(releaseObjectUrl)
</script>

<style lang="scss" scoped>
.lwplus-logo {
	display: block;
	height: auto;
	user-select: none;
}
</style>
