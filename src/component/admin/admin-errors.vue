<template>
	<div class="page">
		<div class="page-header page-bar">
			<h1><router-link to="/admin">Administration</router-link> > Gestionnaire d'erreur</h1>
		</div>
		<panel class="first last">
			<div class="errors content">
				<loader v-if="!errors" />
				<div v-else>
					<div class="delete">
						Supprimer par mot-clé
						<input type="text" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" v-model="deleteQuery">
						<v-btn small @click="deleteErrors">Supprimer</v-btn>
					</div>

					<h2 v-if="errors.length === 0">Aucune erreur !</h2>
					<div v-else>
						<div v-for="(error, e) in errors" :key="e" class="error">
							<div class="card">
								<div class="header">
									<div>Erreur #{{ error.id }} - <b>{{ LeekWars.formatDateTime(error.time) }}</b> - Type {{ error.type }} - Gravité {{ error.severity }}</div>
									<div class="spacer"></div>
									<router-link v-if="error.farmer" :to="'/farmer/' + error.farmer.id" class="farmer" v-ripple>
										{{ error.farmer.name }}
										<avatar :farmer="error.farmer" />
									</router-link>
									<span class="ip" v-if="error.ip">{{ error.ip }}</span>
									<a :href="LeekWars.API + 'ai/download/' + error.ai" target="_blank"><v-btn v-if="error.ai" color="primary" small>IA {{ error.ai }}</v-btn></a>
									<router-link :to="'/fight/' + error.fight"><v-btn v-if="error.fight" small>Combat {{ error.fight }}</v-btn></router-link>
									<v-icon color="error" @click="removeError(error.id)">mdi-delete</v-icon>
								</div>
								<code>{{ error.trace.substring(0, 8000) }}</code>
								<div v-if="error.file || error.line">Fichier <b>{{ error.file }}</b> ligne <b>{{ error.line }}</b></div>
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
	import { Component, Vue } from 'vue-property-decorator'

	@Component({})
	export default class AdminErrors extends Vue {
		errors: any[] | null = null
		deleteQuery: string = ''

		created() {
			this.update()
		}

		update() {
			LeekWars.get('error/get-latest').then(data => {
				this.errors = data.errors
				LeekWars.setTitle("Gestionnaire d'erreur (" + (store.state.farmer ? store.state.farmer!.errors : 0) + ")")
			})
		}

		removeError(id: number) {
			LeekWars.delete('error/delete', { id })
			this.errors = this.errors!.filter(e => e.id !== id)
			this.$store.commit('remove-error')
		}

		deleteErrors() {
			LeekWars.delete('error/delete-query', { query: this.deleteQuery }).then(() => {
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
			gap: 8px;
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
</style>