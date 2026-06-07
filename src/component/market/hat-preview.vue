<template lang="html">
	<div class="leek-preview">
		<template v-if="previewLeeks.length">
			<div v-for="leek in previewLeeks" :key="leek.id" class="leek-entry">
				<leek-image :leek="leek" :scale="0.55" />
				<div class="leek-name">{{ leek.name }}</div>
			</div>
		</template>
		<template v-else>
			<leek-image :leek="{level: 30, hat: hat.id}" :scale="0.55" />
			<leek-image :leek="{level: 90, hat: hat.id}" :scale="0.65" />
			<leek-image :leek="{level: 250, hat: hat.id}" :scale="0.7" />
		</template>
	</div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { HatTemplate } from '@/model/hat'
import type { Leek } from '@/model/leek'
import { store } from '@/model/store'

const props = defineProps<{
	hat: HatTemplate
}>()

const MAX_PREVIEW_LEEKS = 4

// Aperçu du chapeau sur les poireaux du joueur, avec l'arme qu'ils tiennent habituellement.
// Repli sur des poireaux d'exemple si le joueur n'est pas connecté ou n'a pas de poireau.
const previewLeeks = computed<Leek[]>(() => {
	const farmer = store.state.farmer
	if (!farmer || !farmer.leeks) { return [] }
	return Object.values(farmer.leeks)
		.slice(0, MAX_PREVIEW_LEEKS)
		.map(leek => ({ ...leek, hat: props.hat.id }) as unknown as Leek)
})
</script>

<style scoped lang="scss">
.leek-preview {
	background: var(--pure-white);
	display: flex;
	flex-wrap: wrap;
	align-items: flex-end;
	justify-content: center;
	gap: 10px 14px;
}
.leek-entry {
	display: flex;
	flex-direction: column;
	align-items: center;
}
.leek-name {
	margin-top: 2px;
	font-size: 13px;
	font-weight: 500;
	color: var(--text-color);
	max-width: 120px;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}
</style>
