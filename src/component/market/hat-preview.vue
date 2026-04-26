<template lang="html">
	<div class="leek-preview">
		<leek-image :leek="{level: 30, hat: hat.id}" :scale="0.55" />
		<leek-image :leek="{level: 90, hat: hat.id}" :scale="0.65" />
		<leek-image :leek="{level: 250, hat: hat.id}" :scale="0.7" />
	</div>
</template>

<script setup lang="ts">
import type { HatTemplate } from '@/model/hat'

defineProps<{
	hat: HatTemplate
}>()
</script>

<style scoped lang="scss">
.leek-preview {
	background: var(--pure-white);
}
</style>