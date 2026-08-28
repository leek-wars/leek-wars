<template>
	<a :xlink:href="link" @click="click">
		<rect :x="x" :y="y" :class="{'no-fight': !fight}" class="fight" :width="30" :height="30" />
		<!-- Le glyphe du combat, dessiné en `path` et pas en `image` : on est dans un
		     SVG, `<v-icon>` n'y a pas sa place. Les chemins MDI sont sur une grille de
		     24, d'où le facteur 18/24 pour tenir dans la case. -->
		<path v-if="fight" :d="swordPath" :transform="`translate(${x + 6}, ${y + 6}) scale(0.75)`" class="fight-icon" />
	</a>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { mdiIcons } from '@/model/mdi-icons'

defineOptions({ name: 'TournamentFight' })

const swordPath = mdiIcons['mdi-sword']

const props = defineProps<{
	fight: Record<string, unknown>
	x: number
	y: number
}>()

const router = useRouter()

const link = computed(() => props.fight ? props.fight : null)

function click(e: Event) {
	if (props.fight) router.push(props.fight)
	e.preventDefault()
}
</script>

<style lang="scss" scoped>
	.fight {
		stroke: var(--bracket-line);
		stroke-width: 2;
	}
	.no-fight {
		fill: var(--background);
		stroke-dasharray: 5.5;
	}
	.fight:not(.no-fight) {
		fill: var(--grey-6);
	}
	// Encre claire sur la case grise de la case jouée, dans les deux thèmes.
	.fight-icon {
		fill: var(--white);
		pointer-events: none;
	}
</style>