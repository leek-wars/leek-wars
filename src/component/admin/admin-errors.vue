<template>
	<div>
		<div class="page-header page-bar">
			<h1><router-link to="/admin">Administration</router-link> > Gestionnaire d'erreur</h1>
		</div>
		<panel>
			<div class="errors content">
				<loader v-if="!errors" />
				<div v-else>
					<h2 v-if="errors.length === 0">Aucune erreur !</h2>
					<div v-else>
						<div v-for="(error, e) in errors" :key="e" class="error card" ai="{error.ai}">
							Error #{{ error.id }} - <b>{{ LeekWars.formatDateTime(error.time) }}</b> - Type {{ error.type }} - Severity {{ error.severity }}
							<br>
							<code>{{ error.trace }}</code>
							Fight : {{ error.fight }} - IA : {{ error.ai }}
							<br>
							File {{ error.file }} line {{ error.line }}
							<br>
							<div v-if="error.ai" class="button code green" @click="seeAI(error.ai)">See AI code</div>
						</div>
					</div>
				</div>
			</div>
		</panel>

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
	</div>
</template>

<script lang="ts">
	import { LeekWars } from '@/model/leekwars'
	import { Component, Vue } from 'vue-property-decorator'

	@Component({})
	export default class AdminErrors extends Vue {
		errors: any = null
		created() {
			LeekWars.get<any>('error/get-latest/' + this.$store.state.token + '/' + encodeURI(this.$store.state.supertoken)).then((data) => {
				this.errors = data.errors
				LeekWars.setTitle("Gestionnaire d'erreur")

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
	}
</script>

<style lang="scss" scoped>
	.error {
		padding: 10px;
		margin: 10px 0;
		background: white;
		box-shadow: 0px 2px 1px -1px rgba(0,0,0,0.2), 0px 1px 1px 0px rgba(0,0,0,0.14), 0px 1px 3px 0px rgba(0,0,0,0.12);
	}
	.error code {
		margin: 8px 0;
		display: block;
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
	.button {
		margin-top: 10px;
	}
</style>