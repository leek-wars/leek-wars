<template lang="html">
	<div class="stats">
		<div v-if="pomp.template === 1">
			<leek-image :leek="{level: 30, weapon: 37}" :scale="0.53" />
			<leek-image :leek="{level: 90, weapon: 109}" :scale="0.63" />
			<leek-image :leek="{level: 250, weapon: 47}" :scale="0.65" />
		</div>
		<div v-else-if="pomp.template === 5">
			<leek-image :leek="{level: 90, face: 1}" :scale="0.6" />
			<leek-image :leek="{level: 150, face: 1}" :scale="0.7" />
			<leek-image :leek="{level: 300, face: 1}" :scale="0.8" />
		</div>
		<div v-else-if="pomp.template === 6">
			<leek-image :leek="{level: 90, face: 2}" :scale="0.6" />
			<leek-image :leek="{level: 150, face: 2}" :scale="0.7" />
			<leek-image :leek="{level: 300, face: 2}" :scale="0.8" />
		</div>
		<div v-else-if="pomp.template === 7">
			<leek-image :leek="{level: 90, metal: true}" :scale="0.6" />
			<leek-image :leek="{level: 150, metal: true}" :scale="0.7" />
			<leek-image :leek="{level: 300, metal: true}" :scale="0.8" />
		</div>
		<!-- Titre doré : le même titre avant / après, c'est tout ce que l'apparat change. -->
		<div v-else-if="pomp.template === 8" class="titles">
			<lw-title :title="SAMPLE_TITLE" />
			<v-icon size="20">mdi-arrow-down</v-icon>
			<lw-title :title="[...SAMPLE_TITLE, 1]" />
		</div>
	</div>
</template>

<script setup lang="ts">
import type { PompTemplate } from '@/model/pomp'
import LwTitle from '@/component/title/title.vue'

defineOptions({ name: 'PompPreview' })

// « Champion triomphant » : deux trophées que tout le monde connaît (4 et 5), l'icône
// prise sur le premier.
const SAMPLE_TITLE = [4, 4, 1, 5]

defineProps<{
	pomp: PompTemplate
}>()
</script>

<style lang="scss" scoped>
.titles {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 4px;
}
</style>
