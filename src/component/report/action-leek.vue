<template>
	<span :class="'team' + leek.team">{{ leek.translatedName }}</span>
</template>

<script setup lang="ts">
defineProps<{
	leek: { team?: number, translatedName?: string, [key: string]: unknown }
}>()
</script>