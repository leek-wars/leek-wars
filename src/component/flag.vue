<template lang="html">
	<router-link v-if="_clickable" class="flag" :title="code ? $t('country.' + code) : undefined" :to="'/ranking?country=' + code">
		<img :src="url" loading="lazy">
	</router-link>
	<span v-else class="flag" :title="code ? $t('country.' + code) : undefined">
		<img :src="url" loading="lazy">
	</span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

defineOptions({ name: 'Flag' })

const props = defineProps<{
	code?: string
	clickable?: boolean
}>()

const _clickable = computed(() => props.clickable !== false)

const url = computed(() => props.code ? '/image/flag/' + props.code + '.png?2' : '/image/flag/_.png?2')
</script>

<style lang="scss" scoped>
	.flag {
		display: inline-flex;
		// center : empêche le flex d'étirer l'image (sinon déformation Safari).
		align-items: center;
		justify-content: center;
		position: relative;
		img {
			display: block;
			// L'image se dimensionne sur la contrainte du parent (hauteur OU
			// largeur) en gardant son ratio, et le conteneur se réduit à elle.
			// Évite la boîte/ombre trop large quand Safari résout mal la taille
			// auto d'un img en 100% dans un inline-flex (#4122).
			max-width: 100%;
			max-height: 100%;
			width: auto;
			height: auto;
			border-radius: calc(1px + 6%);
			box-shadow: 0 1px 2px 0 #0003;
		}
		&:before {
			content: "";
			top: 0;
			left: 0;
			bottom: 0;
			width: 100%;
			height: 100%;
			position: absolute;
			display: block;
			mix-blend-mode: multiply;
			box-sizing: border-box;
			border: 1px solid rgba(0,0,0,.1);
			border-radius: calc(1px + 6%);
		}
	}
</style>