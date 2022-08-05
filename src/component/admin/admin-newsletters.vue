<template>
	<div>
		<div class="page-header page-bar">
			<div>
				<h1><router-link to="/admin">Administration</router-link> > Newsletters</h1>
				<div class="info">{{ count }} inscrits</div>
			</div>
		</div>
		<panel class="first">
			<div slot="content" class="newsletters">
				<div ref="progress" class="progress">
					<div v-for="p in progress" :key="p.id">{{ p.progress }} --- {{ p.farmer }} ({{ p.id }}) --- {{ p.email }}</div>
				</div>
				<div v-for="newsletter in newsletters" :key="newsletter.id" class="newsletter card">
					<div class="main">
						<b>Version {{ newsletter.version }}</b>
						<div>FR : {{ newsletter.title_fr }}</div>
						<div>EN : {{ newsletter.title_en }}</div>
						<div class="spacer"></div>
						<v-btn v-if="newsletter.sent === 0" @click="test(newsletter)"><v-icon>mdi-cog-outline</v-icon> Test</v-btn>
						<v-btn v-if="newsletter.sent === 0" color="primary" @click="send(newsletter)"><v-icon>mdi-send-outline</v-icon> Envoyer</v-btn>
						<div v-else>Envoyé le {{ newsletter.sent | date }}</div>
					</div>
					<div class="content">
						FR :
						<div v-html="html(newsletter.content_fr)"></div>
						EN :
						<div v-html="html(newsletter.content_en)"></div>
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
	export default class AdminNewsletters extends Vue {

		newsletters: any = []
		count: any = 0
		progress: any = []

		created() {
			LeekWars.setTitle("Admin Newsletters")

			LeekWars.get('newsletter/all').then(newsletters => this.newsletters = newsletters)
			LeekWars.get('newsletter/count').then(count => this.count = count)
		}

		html(html: string) {
			return html.replace("\n", "")
		}

		test(newsletter: any) {
			LeekWars.post('newsletter/test', {id: newsletter.id}).then(x => LeekWars.toast("Envoyé !"))
		}
		send(newsletter: any) {

			const es = new EventSource(LeekWars.API + 'newsletter/send/' + newsletter.id)
			es.onmessage = (e) => {
				if (e.data === 'CLOSE') {
					es.close()
					LeekWars.toast("Envoyé !")
				} else {
					const data = JSON.parse(e.data)
					this.progress.push(data)
					;(this.$refs.progress as HTMLElement).scrollTo(0, 9999999)
				}
			}

			// const xhr = new XMLHttpRequest()
			// new Promise<any>((resolve, reject) => {
			// 	xhr.open('POST', LeekWars.API + 'newsletter/send')
			// 	xhr.responseType = 'json'
			// 	xhr.setRequestHeader('Authorization', 'Bearer ' + store.state.token)
			// 	xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8')
			// 	xhr.addEventListener('message', (e) => {
			// 		console.log(e)
			// 	})
			// 	xhr.onload = (e: any) => {
			// 		if (e.target.status === 200) {
			// 			resolve(e.target.response)
			// 		} else {
			// 			reject(e.target.response)
			// 		}
			// 	}
			// 	xhr.onerror = reject
			// 	xhr.send("id=" + newsletter.id)
			// }).then(() => {
			// 	LeekWars.toast("Envoyé !")
			// })
		}
	}
</script>

<style lang="scss" scoped>
	.v-btn .v-icon {
		margin-right: 5px;
	}
	.newsletters {
		display: flex;
		flex-direction: column;
		gap: 15px;
		margin: 15px;
	}
	.newsletter {
		.main {
			display: flex;
			align-items: center;
			padding: 10px;
			gap: 10px;
			height: 64px;
		}
		.content {
			display: flex;
			justify-content: center;
			padding-bottom: 15px;
		}
	}
	.progress {
		max-height: 200px;
		overflow-y: auto;
	}
</style>