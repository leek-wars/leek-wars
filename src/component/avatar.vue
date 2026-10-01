<template lang="html">
	<!-- L'image est ENVELOPPÉE et non posée seule : le thème v3 coupe l'avatar en
	     biseau, et un trait qui suit la coupe demande deux couches — le cadre
	     dessous, découpé au bord ; l'image dessus, découpée un pixel plus bas.
	     Un <img> seul n'a qu'un `clip-path`, donc jamais de trait sur la coupe. -->
	<span class="avatar" v-bind="$attrs"><img :src="url" :alt="farmer?.name ?? ''" loading="lazy"></span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Farmer } from '@/model/farmer'
import { LeekWars } from '@/model/leekwars'

defineOptions({ name: 'Avatar' })

const props = defineProps<{
	farmer?: Farmer
}>()

const url = computed(() => {
	if (props.farmer) {
		if (props.farmer.id > 0) {
			if (props.farmer.avatar_changed > 0) {
				return LeekWars.AVATAR + 'avatar/' + props.farmer.id + '.png?' + props.farmer.avatar_changed
			}
		} else if (props.farmer.id === 0) {
			return '/image/lw_avatar.png'
		}
	}
	return '/image/no_avatar.png'
})
</script>

<style lang="scss" scoped>
	.avatar {
		display: inline-block;
		// Les appelants ne posent parfois qu'une largeur : l'image donnait sa
		// hauteur, l'enveloppe doit faire pareil. Ignoré dès que les deux côtés
		// sont fixés, ce qui est le cas presque partout.
		aspect-ratio: 1;
		background: var(--pure-white);
		border-radius: 50%;
		box-shadow: var(--elevation-1);
		// C'est l'enveloppe qui porte l'arrondi (v2) : sans quoi l'image
		// déborderait des coins.
		overflow: hidden;
	}
	.avatar img {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
</style>