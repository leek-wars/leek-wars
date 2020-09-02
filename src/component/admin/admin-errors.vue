<template>
	<div>
		<div class="page-header page-bar">
			<h1><router-link to="/admin">Administration</router-link> > Gestionnaire d'erreur</h1>
		</div>
		<panel class="first">
			<div class="errors content">
				<loader v-if="!errors" />
				<div v-else>
					<h2 v-if="errors.length === 0">Aucune erreur !</h2>
					<div v-else>
						<div v-for="(error, e) in errors" :key="e" class="error">
							<div class="card">
								<div>Erreur #{{ error.id }} - <b>{{ LeekWars.formatDateTime(error.time) }}</b> - Type {{ error.type }} - Gravité {{ error.severity }}</div>
								<code>{{ error.trace.substring(0, 8000) }}</code>
								<div v-if="error.file || error.line">Fichier <b>{{ error.file }}</b> ligne <b>{{ error.line }}</b></div>
							</div>
							<div class="buttons">
								<v-btn v-if="error.ai" color="primary">IA {{ error.ai }}</v-btn>
								<router-link :to="'/fight/' + error.fight"><v-btn v-if="error.fight">Combat {{ error.fight }}</v-btn></router-link>
								<v-btn color="error" @click="removeError(error.id)">Supprimer</v-btn>
							</div>
						</div>
					</div>
				</div>
			</div>
		</panel>
		<!--
		@view (ai_popup)
		<div class="title">
			AI <b>{ai.name}</b> #{ai.id}
		</div>
		<div class="content">
			<a href="/farmer/{ai.owner}">Auteur</a>
			<code>{ai.java}</code>
		</div>
		<div class="actions">
			<div class="action dismiss">OK</div>
		</div>
		@endview
		-->
	</div>
</template>

<script lang="ts">
	import { LeekWars } from '@/model/leekwars'
	import { store } from '@/model/store'
	import { Component, Vue } from 'vue-property-decorator'

	@Component({})
	export default class AdminErrors extends Vue {
		errors: any[] | null = null
		created() {
			LeekWars.get('error/get-latest').then(data => {
				this.errors = data.errors
				LeekWars.setTitle("Gestionnaire d'erreur (" + store.state.farmer!.errors + ")")

				// $('#errors .error code').each(function() {
				// 	var content = $(this).text()
				// 	$(this).html("<pre>" + content + "</pre>")
				// 	LW.util.createCodeArea(content, $(this).find('pre')[0])
				// })

				// $('.error .code').click(function(e) {

				// 	_.get('ai/get/' + $(this).parent().attr('ai') + '/$', function(data) {

				// 		var popup = new _.popup.new('admin_error_manager.ai_popup', {ai: data.ai}, 1000)
				// 		popup.show(e)

				// 		var content = popup.find('code').text()
				// 		popup.find('code').html("<pre>" + content + "</pre>")
				// 		LW.util.createCodeArea(content, popup.find('code').find('pre')[0])
				// 	})
				// })

				// var line = __ERROR_LINE

				// var elem = $($($('#codes td')[1]).find('.line-number span')[line - 1])
				// elem.css('color', 'red')
				// elem.css('font-weight', 'bold')
			})
		}

		removeError(id: number) {
			LeekWars.post('error/delete', { id })
			this.errors = this.errors!.filter(e => e.id !== id)
		}
	}
</script>

<style lang="scss" scoped>
	.error {
		margin-bottom: 10px;
		.card {
			padding: 10px;
		}
		.buttons {
			display: flex;
			justify-content: flex-end;
			.v-btn {
				margin-right: 0;
				margin-left: 10px;
			}
		}
	}
	.error code {
		margin: 8px 0;
		display: block;
		word-break: break-word;
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
	button {
		margin-top: 10px;
	}
</style>