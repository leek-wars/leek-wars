<template>
	<router-view :key="LeekWars.routerViewKey" />
</template>

<script setup lang="ts">
	import { LeekWars } from '@/model/leekwars'
	defineOptions({ name: 'PageHost' })
</script>
