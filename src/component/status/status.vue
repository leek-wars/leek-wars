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

<script lang="ts">
	import { mixins } from '@/model/i18n'
	import { LeekWars } from '@/model/leekwars'
	import { Options, Vue } from 'vue-property-decorator'

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

	@Options({ name: 'status', i18n: {}, mixins: [...mixins] })
	export default class Status extends Vue {
		services: {[k: string]: string} = {}
		healthy = true
		loaded = false
		lastChecked: Date | null = null
		now = Date.now()
		timer: number | null = null
		nowTimer: number | null = null

		created() {
			LeekWars.setTitle(this.$t('title'))
			this.refresh()
			this.timer = window.setInterval(() => this.refresh(), 10000)
			this.nowTimer = window.setInterval(() => {
				if (!document.hidden) this.now = Date.now()
			}, 1000)
		}
		beforeUnmount() {
			if (this.timer) window.clearInterval(this.timer)
			if (this.nowTimer) window.clearInterval(this.nowTimer)
		}
		async refresh() {
			try {
				const data = await LeekWars.get('health/check')
				this.applyResponse(data)
			} catch (e: any) {
				// Non-2xx responses (e.g. 503 when a service is down) still carry the body
				if (e && typeof e === 'object' && 'services' in e) {
					this.applyResponse(e)
				} else {
					this.services = { api: 'error' }
					this.healthy = false
				}
			}
			this.lastChecked = new Date()
			this.loaded = true
		}
		applyResponse(data: {services?: {[k: string]: string}, healthy?: boolean}) {
			this.services = data.services || {}
			this.healthy = !!data.healthy
		}
		serviceIcon(name: string) {
			return SERVICE_ICONS[name] || 'mdi-help-circle'
		}
		get serviceList() {
			const extras = Object.keys(this.services).filter(n => !SERVICE_ORDER.includes(n))
			return [...SERVICE_ORDER.filter(n => n in this.services), ...extras]
				.map(n => ({ name: n, status: this.services[n] }))
		}
		get errorCount() {
			return Object.values(this.services).filter(v => v === 'error').length
		}
		get overallState(): 'ok' | 'partial' | 'down' {
			if (this.healthy || this.errorCount === 0) return 'ok'
			return this.errorCount === Object.keys(this.services).length ? 'down' : 'partial'
		}
		get overallIcon() {
			return { ok: 'mdi-check-circle', partial: 'mdi-alert', down: 'mdi-close-circle' }[this.overallState]
		}
		get lastCheckedLabel() {
			if (!this.lastChecked) return ''
			const s = Math.max(0, Math.floor((this.now - this.lastChecked.getTime()) / 1000))
			if (s < 5) return this.$t('just_now')
			return this.$t('seconds_ago', { s })
		}
	}
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
