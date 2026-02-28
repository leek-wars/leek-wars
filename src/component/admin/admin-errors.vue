<template>
	<div class="page">
		<div class="page-header page-bar">
			<h1><router-link to="/admin">Administration</router-link> > Gestionnaire d'erreur</h1>
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
									<span class="ls" v-if="error.ai_version">LS {{ error.ai_version }}</span>
									<span class="ls" v-if="error.ai">IA {{ error.ai }}</span>
									<!-- <a :href="LeekWars.API + 'ai/download/' + error.ai" target="_blank"><v-btn v-if="error.ai" color="primary" small>IA {{ error.ai }}</v-btn></a> -->
									<a :href="LeekWars.API + 'error/ai-code/' + error.id" target="_blank"><v-btn v-if="error.ai" color="primary" size="small">IA {{ error.ai }}</v-btn></a>
									<router-link :to="'/fight/' + error.fight"><v-btn v-if="error.fight" size="small">Combat {{ error.fight }}</v-btn></router-link>
									<a v-if="error.issue" :href="'https://github.com/5pilow/leek-wars-server/issues/' + error.issue" target="_blank"><v-btn size="small" color="success">Issue #{{ error.issue }}</v-btn></a>
									<v-btn v-else size="small" @click="createIssue(error)">Créer issue</v-btn>
									<v-icon color="error" @click="removeError(error.id)">mdi-delete</v-icon>
								</div>
								<code>{{ error.trace.substring(0, 8000) }}</code>
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

	@Options({})
	export default class AdminErrors extends Vue {
		errors: any[] | null = null
		deleteQuery: string = ''
		newErrors: number = 0

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

		update() {
			LeekWars.get('error/get-latest').then(data => {
				this.errors = data.errors
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
		.ip {
			font-family: monospace;
			font-size: 13px;
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
	}
	.error code {
		margin: 8px 0;
		display: block;
		word-break: break-word;
		font-size: 14px;
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