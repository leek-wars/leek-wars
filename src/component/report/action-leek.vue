<template>
	<span :class="'team' + leek.team">{{ leek.translatedName }}</span>
</template>

<script setup lang="ts">
// eslint-disable-next-line @typescript-eslint/no-explicit-any
defineProps<{
	leek: any
}>()
</script>