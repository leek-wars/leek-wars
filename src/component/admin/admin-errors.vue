<template>
	<div class="page">
		<div class="page-header page-bar">
			<h1><breadcrumb :items="[{name: 'Administration', link: '/admin'}, {name: 'Gestionnaire d\'erreur', link: '/admin/errors'}]" :raw="true" /></h1>
		</div>
		<panel class="first last">
			<div class="errors content">
				<div v-if="newErrors > 0" class="new-errors" @click="refresh">
					{{ newErrors }} nouvelle{{ newErrors > 1 ? 's' : '' }} erreur{{ newErrors > 1 ? 's' : '' }}
				</div>
				<loader v-if="!errors" />
				<div v-else>
					<div class="delete">
						Supprimer par mot-clé
						<input type="text" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" v-model="deleteQuery">
						<v-btn size="small" @click="deleteErrors">Supprimer</v-btn>
					</div>

					<h2 v-if="errors.length === 0">Aucune erreur !</h2>
					<div v-else>
						<div v-for="(error, e) in errors" :key="e" class="error">
							<div class="card">
								<div class="header">
									<v-icon color="error" @click="removeError(error.id)">mdi-delete</v-icon>
									<div>Erreur #{{ error.id }} - <b>{{ LeekWars.formatDateTime(error.time) }}</b> - Type {{ error.type }} - Gravité {{ error.severity }}</div>
									<span v-if="error.service" class="service" :class="error.service">{{ error.service }}</span>
									<div class="spacer"></div>
									<flag class="locale" v-if="error.locale" :code="LeekWars.languages[error.locale]?.country" />
									<span class="locale" v-if="error.locale">{{ error.locale }}</span>
									<router-link v-if="error.farmer" :to="'/farmer/' + error.farmer.id" class="farmer" v-ripple>
										{{ error.farmer.name }}
										<avatar :farmer="error.farmer" />
									</router-link>
									<span class="ip" v-if="error.ip">{{ error.ip }}</span>
								<span v-if="error.user_agent" class="user-agent" :title="error.user_agent">{{ formatUA(error.user_agent) }}</span>
									<span v-if="error.build_commit || error.build_date" class="build" :class="{stale: error.build.stale}" :title="error.build.title">
										<v-icon size="14">mdi-package-variant</v-icon>
										<span v-if="error.build_commit">{{ error.build_commit }}</span>
										<span v-if="error.build.age" class="build-age">{{ error.build.age }}</span>
									</span>
									<span class="ls" v-if="error.ai_version">LS {{ error.ai_version }}</span>
									<span class="strict" v-if="error.ai_strict">Strict</span>
									<span class="ls" v-if="error.ai">IA {{ error.ai }}</span>
									<!-- <a :href="LeekWars.API + 'ai/download/' + error.ai" target="_blank"><v-btn v-if="error.ai" color="primary" small>IA {{ error.ai }}</v-btn></a> -->
									<a :href="LeekWars.API + 'error/ai-code/' + error.id" target="_blank"><v-btn v-if="error.ai" color="primary" size="small">LS {{ error.ai }}</v-btn></a>
									<a :href="LeekWars.API + 'error/ai-java-code/' + error.id" target="_blank"><v-btn v-if="error.ai" color="secondary" size="small">Java {{ error.ai }}</v-btn></a>
									<router-link :to="'/fight/' + error.fight"><v-btn v-if="error.fight" size="small">Combat {{ error.fight }}</v-btn></router-link>
									<a v-if="error.issue" :href="'https://github.com/5pilow/leek-wars-server/issues/' + error.issue" target="_blank"><v-btn size="small" color="success">Issue #{{ error.issue }}</v-btn></a>
									<v-btn v-else size="small" @click="createIssue(error)">Créer issue</v-btn>
								</div>
								<div :ref="'trace-' + e" class="trace-container" :class="{ collapsed: traceOverflows[e] && !traceExpanded[e] }">
									<code>{{ error.trace.substring(0, 8000) }}</code>
									<div v-if="traceOverflows[e] && !traceExpanded[e]" class="trace-gradient" @click="toggleTrace(e, true)">
										<v-icon>mdi-chevron-down</v-icon>
									</div>
								</div>
								<div v-if="traceOverflows[e] && traceExpanded[e]" class="trace-collapse" @click="toggleTrace(e, false)">
									<v-icon>mdi-chevron-up</v-icon>
								</div>
								<div v-if="error.file || error.line">Fichier <b>{{ error.file }}</b> <span v-if="error.line"> ligne <b>{{ error.line }}</b></span></div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</panel>
	</div>
</template>

<script lang="ts">
	import { LeekWars } from '@/model/leekwars'
	import { store } from '@/model/store'
	import { emitter } from '@/model/vue'
	import { Options, Vue } from 'vue-property-decorator'
	import { nextTick } from 'vue'
	import Breadcrumb from '@/component/forum/breadcrumb.vue'

	const STALE_THRESHOLD_DAYS = 2

	function computeBuildInfo(error: any) {
		if (!error.build_date) return { staleDays: 0, stale: false, age: '', title: '' }
		const buildMs = Date.parse(error.build_date)
		if (isNaN(buildMs)) return { staleDays: 0, stale: false, age: '', title: '' }
		const staleDays = Math.floor((error.time * 1000 - buildMs) / (1000 * 60 * 60 * 24))
		const parts: string[] = []
		if (error.build_commit) parts.push('commit ' + error.build_commit)
		parts.push('built ' + error.build_date)
		if (staleDays >= 1) parts.push('(' + staleDays + ' jour' + (staleDays > 1 ? 's' : '') + ' avant l\'erreur)')
		return {
			staleDays,
			stale: staleDays >= STALE_THRESHOLD_DAYS,
			age: staleDays > 0 ? staleDays + 'j' : '',
			title: parts.join(' — ')
		}
	}

	@Options({ components: { Breadcrumb } })
	export default class AdminErrors extends Vue {
		errors: any[] | null = null
		deleteQuery: string = ''
		newErrors: number = 0
		traceExpanded: Record<number, boolean> = {}
		traceOverflows: Record<number, boolean> = {}

		created() {
			if (!this.$store.getters.admin) this.$router.replace('/')
			this.update()
			emitter.on('wsmessage', this.onWsMessage)
		}

		beforeUnmount() {
			emitter.off('wsmessage', this.onWsMessage)
		}

		onWsMessage(e: any) {
			if (e.type === 89) {
				this.newErrors++
			}
		}

		toggleTrace(index: number, expanded: boolean) {
			this.traceExpanded = { ...this.traceExpanded, [index]: expanded }
		}

		update() {
			LeekWars.get('error/get-latest').then(data => {
				for (const error of data.errors) {
					error.build = computeBuildInfo(error)
				}
				this.errors = data.errors
				this.traceExpanded = {}
				this.traceOverflows = {}
				nextTick(() => {
					const overflows: Record<number, boolean> = {}
					for (let i = 0; i < data.errors.length; i++) {
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
						const refs = (this as any).$refs['trace-' + i]
						const el = Array.isArray(refs) ? refs[0] : refs
						overflows[i] = el ? el.scrollHeight > 300 : false
					}
					this.traceOverflows = overflows
				})
				this.$store.commit('error-count', data.count)
				LeekWars.setTitle("Gestionnaire d'erreur (" + (store.state.farmer ? store.state.farmer!.errors : 0) + ")")
			})
		}

		refresh() {
			this.newErrors = 0
			this.update()
		}

		removeError(id: number) {
			LeekWars.delete('error/delete', { id })
			this.errors = this.errors!.filter(e => e.id !== id)
			this.$store.commit('remove-error')
		}

		createIssue(error: any) {
			LeekWars.post('error/create-issue', { id: error.id }).then((data: any) => {
				error.issue = data.issue
			})
		}

		formatUA(ua: string) {
			return LeekWars.parseUserAgent(ua)
		}


		deleteErrors() {
			LeekWars.delete('error/delete-query', { query: this.deleteQuery }).then(() => {
				this.deleteQuery = ''
				this.update()
			})
		}
	}
</script>

<style lang="scss" scoped>
	.error {
		margin-bottom: 10px;
		.card {
			padding: 10px;
		}
		.header {
			display: flex;
			align-items: center;
			flex-wrap: wrap;
			gap: 6px;
		}
		.farmer {
			display: flex;
			align-items: center;
			gap: 8px;
			border: 1px solid #aaa;
			padding: 2px 6px;
			border-radius: 4px;
			.avatar {
				width: 26px;
				height: 26px;
			}
		}
		.strict {
			font-size: 11px;
			font-weight: bold;
			padding: 2px 6px;
			border-radius: 3px;
			background: #e57373;
			color: white;
		}
		.ip {
			font-family: monospace;
			font-size: 13px;
		}
		.user-agent {
			font-family: monospace;
			font-size: 11px;
			color: #666;
			max-width: 200px;
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
		}
		.service {
			font-size: 11px;
			font-weight: bold;
			padding: 2px 6px;
			border-radius: 3px;
			text-transform: uppercase;
			&.daemon { background: #9c27b0; color: white; }
			&.worker { background: #ff9800; color: white; }
			&.api { background: #2196f3; color: white; }
			&.cron { background: #607d8b; color: white; }
			&.client { background: #4caf50; color: white; }
		}
		.build {
			font-family: monospace;
			font-size: 11px;
			color: #666;
			display: inline-flex;
			align-items: center;
			gap: 3px;
			padding: 2px 6px;
			border-radius: 3px;
			background: #eee;
			.build-age {
				opacity: 0.7;
			}
			&.stale {
				background: #ffb74d;
				color: #6d3900;
				font-weight: bold;
			}
		}
	}
	.trace-container {
		position: relative;
		&.collapsed {
			max-height: 300px;
			overflow: hidden;
		}
		code {
			margin: 8px 0;
			display: block;
			word-break: break-word;
			font-size: 14px;
		}
	}
	.trace-gradient {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		height: 80px;
		background: linear-gradient(transparent, var(--pure-white));
		display: flex;
		align-items: flex-end;
		justify-content: center;
		cursor: pointer;
		padding-bottom: 4px;
		.v-icon {
			padding: 2px;
		}
	}
	.trace-collapse {
		display: flex;
		justify-content: center;
		cursor: pointer;
		margin-top: -4px;
		margin-bottom: 4px;
		opacity: 0.6;
		&:hover { opacity: 1; }
	}
	.errors td a {
		color: #0a0;
	}
	.codes {
		font-size: 12px;
		background: white;
	}
	.codes th {
		border: 2px solid #ddd;
		padding: 5px;
		background: white;
		font-weight: normal;
		color: #777;
		font-size: 18px;
	}
	.codes td {
		width: 50%;
		border: 2px solid #ddd;
		padding: 0;
		font-size: 12px;
		vertical-align: top;
	}
	.codes td pre {
		margin: 0;
	}
	#app.app .error code {
		font-size: 10px;
	}
	.delete {
		display: flex;
		gap: 10px;
		width: 100%;
		justify-content: flex-end;
		align-items: center;
		margin-bottom: 10px;
	}
	.flag {
		height: 16px;
	}
	.new-errors {
		text-align: center;
		padding: 8px;
		margin-bottom: 10px;
		background: #5fad1b;
		color: white;
		border-radius: 5px;
		cursor: pointer;
	}
	.new-errors:hover {
		background: #4a9010;
	}
</style>