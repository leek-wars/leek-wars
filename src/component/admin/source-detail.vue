<template>
	<v-menu v-model="value" :close-on-content-click="false" :open-on-hover="true" :open-delay="300" :close-delay="1" :nudge-width="260" offset-y bottom @update:model-value="open($event)">
		<template #activator="{ props: activatorProps }">
			<span v-bind="activatorProps">
				<slot :props="activatorProps"></slot>
			</span>
		</template>
		<div class="detail card">
			<loader v-if="!data" :size="30" />
			<template v-else>
				<div class="counts">
					<div v-for="c of data.counts" :key="c.label" class="count" :class="{empty: c.value === 0}">
						<v-icon>{{ 'mdi-' + c.icon }}</v-icon>
						<span class="value">{{ c.value }}</span>
						<span class="label">{{ c.label }}</span>
					</div>
				</div>

				<div v-if="data.reasons.length" class="reasons">
					<div v-for="(r, i) of data.reasons" :key="i" class="reason">
						<v-icon>mdi-alert-outline</v-icon> {{ r }}
					</div>
				</div>

				<div v-if="data.recent.length" class="recent">
					<div v-for="(a, i) of data.recent" :key="i" class="action" :class="{error: a.error}">
						<v-icon>{{ 'mdi-' + a.icon }}</v-icon>
						<span class="label">{{ a.label }}</span>
						<span v-if="a.error" class="err" :title="a.error">{{ a.error }}</span>
						<span class="time">{{ $filters.duration(a.time) }}</span>
					</div>
				</div>
				<div v-else class="empty-recent">∅</div>
			</template>
		</div>
	</v-menu>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { LeekWars } from '@/model/leekwars'

interface DetailCount { label: string, value: number, icon: string }
interface DetailAction { label: string, icon: string, time: number, error: string | null }
interface DetailData { counts: DetailCount[], reasons: string[], recent: DetailAction[] }

const props = defineProps<{ id: number }>()

const value = ref(false)
const data = ref<DetailData | null>(null)
let loaded = false

function open(v: boolean) {
	if (!v || loaded || props.id <= 0) { return }
	loaded = true
	LeekWars.get<DetailData>('source/details/' + props.id).then(d => {
		data.value = d
	})
}
</script>

<style lang="scss" scoped>
.detail {
	padding: 10px;
	min-width: 260px;
	max-width: 360px;
	font-size: 13px;
}
.counts {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 2px 12px;
	.count {
		display: flex;
		align-items: center;
		gap: 5px;
		.v-icon {
			font-size: 16px;
			color: var(--text-color-secondary);
		}
		.value {
			font-weight: 600;
			min-width: 18px;
			text-align: right;
		}
		.label {
			color: var(--text-color-secondary);
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
		}
		&.empty {
			opacity: 0.4;
		}
	}
}
.reasons {
	margin-top: 8px;
	padding-top: 8px;
	border-top: 1px solid var(--border);
	.reason {
		display: flex;
		align-items: center;
		gap: 5px;
		color: #e65100;
		.v-icon {
			font-size: 16px;
			color: #e65100;
		}
	}
}
body.dark .reasons .reason, body.dark .reasons .reason .v-icon {
	color: #ffb74d;
}
.recent {
	margin-top: 8px;
	padding-top: 8px;
	border-top: 1px solid var(--border);
	.action {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 1px 0;
		.v-icon {
			font-size: 15px;
			color: var(--text-color-secondary);
		}
		.label {
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
		}
		.err {
			color: #c62828;
			font-size: 11px;
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
		}
		.time {
			margin-left: auto;
			color: var(--text-color-secondary);
			font-size: 11px;
			flex-shrink: 0;
			padding-left: 6px;
		}
		&.error .label {
			color: #c62828;
		}
	}
}
.empty-recent {
	margin-top: 8px;
	text-align: center;
	opacity: 0.4;
}
</style>
