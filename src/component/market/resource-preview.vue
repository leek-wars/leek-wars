<template lang="html">
	<div></div>
</template>

<script setup lang="ts">
defineOptions({ name: 'ResourcePreview' })

defineProps<{
	resource?: Record<string, unknown>
}>()
</script>

<style src='./item-preview.scss' lang='scss'></style>