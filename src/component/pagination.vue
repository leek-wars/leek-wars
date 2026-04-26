<template lang="html">
	<div v-if="total > 0" class="pagination">
		<router-link v-if="start > 1" :to="url + url_end">1</router-link>
		<span v-if="start > 1">...</span>

		<router-link v-for="i in (end - start + 1)" :key="i" :to="url + (start + i === 2 ? '' : page + (start + i - 1)) + url_end" :class="{current: i + start - 1 === current}">{{ start + i - 1 }}</router-link>

		<span v-if="end < total">...</span>
		<router-link v-if="end < total" :to="url + page + total + url_end">{{ total }}</router-link>
	</div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
	current: number
	total: number
	url: string
	urlQuery?: string
	query?: boolean
}>()

const url_end = computed(() => props.urlQuery || '')
const center = computed(() => Math.max(5, Math.min(props.total - 4, props.current)))
const start = computed(() => center.value - 4)
const end = computed(() => Math.min(props.total, center.value + 4))
const page = computed(() => props.query ? '&page=' : '/page-')
</script>

<style lang="scss" scoped>
	.pagination {
		text-align: center;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 2px;
	}
	a {
		padding: 5px 10px;
		vertical-align: middle;
		font-size: 18px;
		display: inline-block;
		border-radius: 20px;
		&:hover {
			background: var(--border);
		}
	}
	a.current {
		color: white;
		background-color: #5fad1b;
		font-weight: 500;
	}
</style>