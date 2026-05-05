<template>
	<div class="page">
		<div class="page-header page-bar">
			<div>
				<h1><breadcrumb :items="[{name: 'Administration', link: '/admin'}, {name: 'Newsletters', link: '/admin/newsletters'}]" :raw="true" /></h1>
				<div class="info">{{ count }} inscrits</div>
			</div>
		</div>
		<panel class="first">
			<template #content>
				<div class="newsletters">
					<!-- <div ref="progress" class="progress">
						<div v-for="p in progress" :key="p.id">{{ p.progress }} --- {{ p.farmer }} ({{ p.id }}) --- {{ p.email }}</div>
					</div> -->
					<div v-for="newsletter in newsletters" :key="newsletter.id" class="newsletter card">
						<div class="main">
							<b>Version {{ newsletter.version }}</b>
							<div class="spacer"></div>
							<v-btn v-if="$store.state.farmer" @click="test(newsletter, $store.state.farmer.id)"><v-icon>mdi-cog-outline</v-icon> Test compte normal</v-btn>
							<v-text-field v-model="newsletter.testTarget" type="number" label="Farmer ID" density="compact" hide-details style="max-width: 150px" />
							<v-btn @click="test(newsletter, newsletter.testTarget)"><v-icon>mdi-cog-outline</v-icon> Test</v-btn>
							<!-- <v-btn v-if="newsletter.sent === 0" color="primary" @click="send(newsletter)"><v-icon>mdi-send-outline</v-icon> Envoyer</v-btn> -->
							<div v-if="newsletter.sent !== 0">Envoyé le {{ $filters.date(newsletter.sent) }}</div>
						</div>
						<div class="content">
							<v-card>
								<div class="subject"><flag code="fr" /> {{ newsletter.title_fr }}</div>
								<div v-html="html(newsletter.content_fr)"></div>
							</v-card>
							<v-card>
								<div class="subject"><flag code="gb" /> {{ newsletter.title_en }}</div>
								<div v-html="html(newsletter.content_en)"></div>
							</v-card>
						</div>
					</div>
				</div>
			</template>
		</panel>
	</div>
</template>

<script setup lang="ts">
	import { LeekWars } from '@/model/leekwars'
	import { store } from '@/model/store'
	import { ref, useTemplateRef } from 'vue'
	import { useRouter } from 'vue-router'
	import Breadcrumb from '@/component/forum/breadcrumb.vue'

	const router = useRouter()
	const newsletters = ref<any>([])
	const count = ref<any>(0)
	const progress = ref<any>([])
	const progressEl = useTemplateRef<HTMLElement>('progress')

	if (!store.getters.admin) router.replace('/')
	LeekWars.setTitle("Admin Newsletters")

	LeekWars.get('newsletter/all').then(ns => {
		for (const n of ns) n.testTarget = 73156
		newsletters.value = ns
	})
	LeekWars.get('newsletter/count').then(c => {
		count.value = c
		LeekWars.setSubTitle(c + " inscrits")
	})

	function html(html: string) {
		return html.replace("\n", "")
	}

	function test(newsletter: any, target: any) {
		LeekWars.post('newsletter/test', {id: newsletter.id, target: target}).then(x => LeekWars.toast("Envoyé !"))
	}

	function send(newsletter: any) {

		const es = new EventSource(LeekWars.API + 'newsletter/send/' + newsletter.id)
		es.onmessage = (e) => {
			if (e.data === 'CLOSE') {
				es.close()
				LeekWars.toast("Envoyé !")
			} else {
				const data = JSON.parse(e.data)
				progress.value.push(data)
				progressEl.value?.scrollTo(0, 9999999)
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
	void send
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
		.flag {
			height: 15px;
		}
		.main {
			display: flex;
			align-items: center;
			flex-wrap: wrap;
			padding: 10px;
			gap: 10px;
		}
		.content {
			display: flex;
			justify-content: center;
			padding-bottom: 15px;
			gap: 15px;
		}
		.v-card {
			flex: 700px 0 0;
			padding: 15px;
		}
		.subject {
			font-weight: bold;
			font-size: 18px;
			margin-bottom: 10px;
		}
	}
	#app.app .content {
		flex-wrap: wrap;
		.v-card {
			flex: 100% 0 0;
		}
	}
	.progress {
		max-height: 200px;
		overflow-y: auto;
	}
</style>