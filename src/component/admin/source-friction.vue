<template>
	<v-menu v-model="value" :close-on-content-click="false" :open-on-hover="true" :open-delay="300" :close-delay="1" location="bottom" @update:model-value="open($event)">
		<template #activator="{ props: activatorProps }">
			<span v-bind="activatorProps">
				<slot :props="activatorProps"></slot>
			</span>
		</template>
		<div class="friction card">
			<loader v-if="!data" :size="30" />
			<template v-else>
				<div v-if="data.reasons.length" class="reasons">
					<div v-for="(r, i) of data.reasons" :key="i" class="reason">
						<v-icon>mdi-alert-outline</v-icon> {{ r }}
					</div>
				</div>

				<div v-if="data.errors.length" class="errors">
					<div v-for="(e, i) of data.errors" :key="i" class="error-row" :class="e.source">
						<v-icon :title="e.source === 'api' ? 'Erreur API' : 'Erreur de code'">{{ e.source === 'api' ? 'mdi-web' : 'mdi-code-tags' }}</v-icon>
						<div class="body">
							<div class="message" :title="e.message">{{ e.message }}</div>
							<div class="meta">
								<span v-if="e.location" class="location">{{ e.location }}</span>
								<span v-if="e.occurrences > 1" class="count">×{{ e.occurrences }}</span>
								<span class="time">{{ $filters.duration(e.time) }}</span>
							</div>
						</div>
					</div>
				</div>

				<div v-if="!data.reasons.length && !data.errors.length" class="empty">Aucune friction détectée</div>
			</template>
		</div>
	</v-menu>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { LeekWars } from '@/model/leekwars'

interface FrictionError { source: 'code' | 'api', message: string, location: string, occurrences: number, time: number, status?: number }
interface FrictionData { reasons: string[], errors: FrictionError[] }

const props = defineProps<{ id: number }>()

const value = ref(false)
const data = ref<FrictionData | null>(null)
let loaded = false

function open(v: boolean) {
	if (!v || loaded || props.id <= 0) { return }
	loaded = true
	LeekWars.get<FrictionData>('source/friction/' + props.id).then(d => {
		data.value = d
	})
}
</script>

<style lang="scss" scoped>
.friction {
	padding: 10px;
	min-width: 280px;
	max-width: 420px;
	font-size: 13px;
}
.reasons {
	display: flex;
	flex-direction: column;
	gap: 2px;
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
.errors {
	margin-top: 8px;
	padding-top: 8px;
	border-top: 1px solid var(--border);
	display: flex;
	flex-direction: column;
	gap: 4px;
	.error-row {
		display: flex;
		align-items: flex-start;
		gap: 6px;
		> .v-icon {
			font-size: 15px;
			margin-top: 1px;
			flex-shrink: 0;
			color: var(--text-color-secondary);
		}
		&.code > .v-icon {
			color: #c62828;
		}
		.body {
			min-width: 0;
			flex: 1;
		}
		.message {
			color: #c62828;
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
		}
		.meta {
			display: flex;
			align-items: center;
			gap: 6px;
			font-size: 11px;
			color: var(--text-color-secondary);
			.location {
				overflow: hidden;
				text-overflow: ellipsis;
				white-space: nowrap;
			}
			.count {
				font-weight: 600;
				flex-shrink: 0;
			}
			.time {
				margin-left: auto;
				flex-shrink: 0;
				padding-left: 6px;
			}
		}
	}
}
body.dark .errors .error-row .message {
	color: #ef9a9a;
}
body.dark .errors .error-row.code > .v-icon {
	color: #ef9a9a;
}
.empty {
	text-align: center;
	opacity: 0.4;
}
</style>
