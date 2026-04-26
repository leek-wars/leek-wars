<template>
	<div :a="a">{{ $t('fight.end_of_fight') }}</div>
</template>

<script setup lang="ts">
defineProps<{
	a: number
}>()
</script>
