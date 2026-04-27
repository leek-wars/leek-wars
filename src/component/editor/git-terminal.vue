<template>
	<div class="git-terminal" :class="{dark: isDark}">
		<div ref="logEl" class="log">
			<div v-if="entries.length === 0" class="empty">{{ $t('empty') }}</div>
			<div v-for="entry in entries" :key="entry.id" class="entry" :class="{ error: !entry.success }">
				<div class="line command">
					<span class="time">{{ formatTime(entry.timestamp) }}</span>
					<span class="prompt">$</span>
					<span class="cmd">{{ entry.command }}</span>
					<span class="duration">{{ entry.durationMs }}ms</span>
				</div>
				<pre v-if="entry.output" class="output">{{ entry.output }}</pre>
			</div>
		</div>
		<v-icon v-if="entries.length > 0" class="clear-btn" :title="$t('clear')" @click="clear">mdi-delete-outline</v-icon>
	</div>
</template>

<script setup lang="ts">
import { mixins } from '@/model/i18n'
import { computed, nextTick, onMounted, useTemplateRef, watch } from 'vue'
import { clearLog, gitLog } from './git-log'

defineOptions({ name: 'git-terminal', i18n: {}, mixins: [...mixins] })

const props = withDefaults(defineProps<{
	theme?: string
}>(), {
	theme: 'leek-wars',
})

const logEl = useTemplateRef<HTMLElement>('logEl')

const entries = computed(() => gitLog.entries)
const isDark = computed<boolean>(() => ['monokai', 'vs-dark', 'hc-black'].includes(props.theme))

function clear() { clearLog() }

function formatTime(ts: number): string {
	const d = new Date(ts)
	return d.toTimeString().slice(0, 8)
}

function scrollToBottom() {
	nextTick(() => {
		const el = logEl.value
		if (el) el.scrollTop = el.scrollHeight
	})
}

watch(() => entries.value.length, () => {
	scrollToBottom()
})

onMounted(() => {
	scrollToBottom()
})
</script>

<style lang="scss" scoped>
.git-terminal {
	position: relative;
	height: 100%;
	display: flex;
	flex-direction: column;
	background: var(--background-secondary);
	color: var(--text-color);
	font-family: 'Menlo', 'Consolas', monospace;
	font-size: 12px;
	overflow: hidden;
}
.clear-btn {
	position: absolute;
	top: 4px;
	right: 8px;
	font-size: 18px;
	cursor: pointer;
	opacity: 0.5;
	&:hover { opacity: 1; }
}
.log {
	flex: 1;
	overflow-y: auto;
	padding: 4px 8px;
}
.empty {
	color: var(--text-color-secondary);
	text-align: center;
	padding: 12px;
	font-style: italic;
}
.entry {
	margin-bottom: 6px;
	.cmd { color: #1976d2; font-weight: bold; }
	.output { color: var(--text-color); }
	&.error .cmd { color: #d32f2f; }
	&.error .output { color: #d32f2f; }
}
.line.command {
	display: flex;
	gap: 6px;
	align-items: baseline;
	flex-wrap: wrap;
	.time { color: var(--text-color-secondary); font-size: 10px; }
	.prompt { color: #2e7d32; font-weight: bold; }
	.duration { color: var(--text-color-secondary); font-size: 10px; margin-left: auto; }
}
.output {
	white-space: pre-wrap;
	word-break: break-word;
	margin: 2px 0 0 14px;
	padding: 0;
	font-family: inherit;
	font-size: 11px;
	user-select: text;
	opacity: 0.85;
}

.git-terminal.dark {
	.entry .cmd { color: #7cb7ff; }
	.entry.error .cmd { color: #f66; }
	.entry.error .output { color: #f88; }
	.line.command .prompt { color: #73c991; }
}
</style>
