<template lang="html">
	<div class="page">
		<div class="page-header page-bar">
			<h1>{{ $t('title') }}</h1>
		</div>
		<panel class="first last">
			<div v-if="!loaded" class="loading">
				<loader />
			</div>
			<template v-else>
				<div class="overall" :class="overallState" role="status" aria-live="polite">
					<v-icon class="overall-icon">{{ overallIcon }}</v-icon>
					<div class="overall-text">
						<div class="overall-title">{{ $t('overall_' + overallState) }}</div>
						<div class="overall-sub">{{ $t('last_checked') }} {{ lastCheckedLabel }}</div>
					</div>
				</div>
				<div class="services">
					<div v-for="s of serviceList" :key="s.name" class="service" :class="s.status">
						<v-icon class="service-icon">{{ serviceIcon(s.name) }}</v-icon>
						<div class="service-name">{{ $t('service_' + s.name) }}</div>
						<div class="service-status">
							<span class="dot"></span>
							{{ $t('status_' + s.status) }}
						</div>
					</div>
				</div>
			</template>
		</panel>
	</div>
</template>

<script setup lang="ts">
import { ref, computed, onBeforeUnmount } from 'vue'
import { mixins } from '@/model/i18n'
import { LeekWars } from '@/model/leekwars'

defineOptions({ name: 'status', i18n: {}, mixins: [...mixins] })

const t = useNamespacedT('status')

const SERVICE_ORDER = ['api', 'db', 'redis', 'daemon', 'websocket', 'git', 'static']
const SERVICE_ICONS: {[k: string]: string} = {
	api: 'mdi-api',
	db: 'mdi-database',
	redis: 'mdi-memory',
	daemon: 'mdi-sword-cross',
	websocket: 'mdi-lan-connect',
	git: 'mdi-source-branch',
	static: 'mdi-image-multiple',
}

const services = ref<{[k: string]: string}>({})
const healthy = ref(true)
const loaded = ref(false)
const lastChecked = ref<Date | null>(null)
const now = ref(Date.now())
let timer: number | null = null
let nowTimer: number | null = null

function applyResponse(data: { services?: {[k: string]: string}, healthy?: boolean }) {
	services.value = data.services || {}
	healthy.value = !!data.healthy
}

async function refresh() {
	try {
		const data = await LeekWars.get('health/check')
		applyResponse(data)
	} catch (e: any) {
		if (e && typeof e === 'object' && 'services' in e) {
			applyResponse(e)
		} else {
			services.value = { api: 'error' }
			healthy.value = false
		}
	}
	lastChecked.value = new Date()
	loaded.value = true
}

LeekWars.setTitle(t('title'))
refresh()
timer = window.setInterval(() => refresh(), 10000)
nowTimer = window.setInterval(() => {
	if (!document.hidden) now.value = Date.now()
}, 1000)

onBeforeUnmount(() => {
	if (timer) window.clearInterval(timer)
	if (nowTimer) window.clearInterval(nowTimer)
})

function serviceIcon(name: string) {
	return SERVICE_ICONS[name] || 'mdi-help-circle'
}

const serviceList = computed(() => {
	const extras = Object.keys(services.value).filter(n => !SERVICE_ORDER.includes(n))
	return [...SERVICE_ORDER.filter(n => n in services.value), ...extras]
		.map(n => ({ name: n, status: services.value[n] }))
})

const errorCount = computed(() => Object.values(services.value).filter(v => v === 'error').length)

const overallState = computed<'ok' | 'partial' | 'down'>(() => {
	if (healthy.value || errorCount.value === 0) return 'ok'
	return errorCount.value === Object.keys(services.value).length ? 'down' : 'partial'
})

const overallIcon = computed(() => ({ ok: 'mdi-check-circle', partial: 'mdi-alert', down: 'mdi-close-circle' })[overallState.value])

const lastCheckedLabel = computed(() => {
	if (!lastChecked.value) return ''
	const s = Math.max(0, Math.floor((now.value - lastChecked.value.getTime()) / 1000))
	if (s < 5) return t('just_now')
	return t('seconds_ago', { s })
})
</script>

<style lang="scss" scoped>
.loading {
	padding: 40px 0;
	text-align: center;
}
.overall {
	display: flex;
	align-items: center;
	gap: 20px;
	padding: 20px 25px;
	border-radius: 4px;
	margin-bottom: 20px;
	color: white;
	&.ok { background: var(--primary); }
	&.partial { background: #f0ad4e; }
	&.down { background: #d9534f; }
}
.overall-icon {
	font-size: 42px !important;
	color: white !important;
}
.overall-title {
	font-size: 22px;
	font-weight: 500;
}
.overall-sub {
	font-size: 13px;
	opacity: 0.85;
	margin-top: 2px;
}
.services {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
	gap: 12px;
}
.service {
	display: flex;
	align-items: center;
	gap: 12px;
	padding: 14px 16px;
	border-radius: 4px;
	background: var(--grey-lighter, #f5f5f5);
	border-left: 4px solid transparent;
	&.ok { border-left-color: var(--primary); }
	&.error { border-left-color: #d9534f; }
}
.service-icon {
	font-size: 28px !important;
	color: var(--text-color-secondary) !important;
}
.service-name {
	flex: 1;
	font-weight: 500;
	font-size: 16px;
	text-transform: capitalize;
}
.service-status {
	display: flex;
	align-items: center;
	gap: 6px;
	font-size: 13px;
	color: var(--text-color-secondary);
}
.dot {
	width: 10px;
	height: 10px;
	border-radius: 50%;
	background: #999;
	.ok & { background: var(--primary); }
	.error & { background: #d9534f; }
}
</style>
