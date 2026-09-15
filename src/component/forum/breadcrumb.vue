<template lang="html">
	<div :class="{raw: raw}" class="breadcrumb">
		<template v-for="(item, i) in items" :key="item.name">
			<component :is="item.link ? 'router-link' : 'span'" v-ripple :to="item.link || undefined" class="item">{{ item.name }}</component>
			<v-icon v-if="i < items.length - 1" :key="i">mdi-chevron-right</v-icon>
		</template>
	</div>
</template>

<script setup lang="ts">
defineProps<{
	items: { name: string, link?: string }[]
	raw?: boolean
}>()
</script>

<style lang="scss" scoped>
	.breadcrumb {
		display: inline;
		i {
			vertical-align: middle;
			font-size: 24px;
		}
	}
	/* Posé dans un titre (`raw`), le fil passe en ligne flex centrée : calé sur
	   la ligne de base, le chevron tombait sous le milieu des capitales de la
	   police pixel, dont la ligne de base est plus haute (2026-09-15). */
	.breadcrumb.raw {
		display: inline-flex;
		align-items: center;
		gap: 4px;
	}
	.breadcrumb:not(.raw) {
		font-size: 16px;
		line-height: 30px;
		padding: 10px;
		display: block;
		i {
			padding-right: 8px;
			margin-bottom: 2px;
		}
		.item {
			padding-right: 8px;
		}
	}
</style>