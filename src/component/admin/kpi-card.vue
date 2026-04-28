<template>
	<div class="kpi">
		<div class="kpi-label">{{ label }}</div>
		<div class="kpi-value" :class="valueClass">{{ value }}</div>
		<div v-if="delta !== null && delta !== undefined" class="kpi-delta" :class="deltaClass">{{ formatDelta(delta) }}</div>
	</div>
</template>

<script lang="ts" setup>
	import { computed } from 'vue'

	const props = defineProps<{
		label: string
		value: string | number
		valueClass?: string
		delta?: number | null
		lowerIsBetter?: boolean
	}>()

	const deltaClass = computed(() => {
		const d = props.delta
		if (d === null || d === undefined || Math.abs(d) < 1) return 'delta-neutral'
		const good = props.lowerIsBetter ? d < 0 : d > 0
		return good ? 'delta-good' : 'delta-bad'
	})

	function formatDelta(d: number): string {
		const sign = d >= 0 ? '+' : ''
		return sign + d.toFixed(0) + '%'
	}
</script>

<style lang="scss" scoped>
	.kpi {
		background: var(--pure-white);
		border: 1px solid var(--border);
		border-radius: 4px;
		padding: 8px 10px;
		text-align: center;
	}
	.kpi-label {
		font-size: 11px;
		color: var(--text-color-secondary);
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}
	.kpi-value {
		font-size: 22px;
		font-weight: bold;
		font-variant-numeric: tabular-nums;
		margin-top: 2px;
		&.kpi-bad { color: #c62828; }
	}
	.kpi-delta {
		font-size: 12px;
		margin-top: 2px;
		font-variant-numeric: tabular-nums;
		&.delta-good { color: #2e7d32; }
		&.delta-bad { color: #c62828; }
		&.delta-neutral { color: var(--text-color-secondary); }
	}
	body.dark {
		.kpi-value.kpi-bad { color: #ef9a9a; }
		.kpi-delta {
			&.delta-good { color: #81c784; }
			&.delta-bad { color: #ef9a9a; }
		}
	}
</style>
