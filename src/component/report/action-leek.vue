<template>
	<span :class="'team' + leek.team">{{ leek.translatedName }}</span>
</template>

<script setup lang="ts">
import type { FightLeek } from '@/model/fight'

defineProps<{
	leek: FightLeek
}>()
</script>