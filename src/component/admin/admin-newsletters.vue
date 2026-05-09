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
					<div v-for="n in newsletters" :key="n.version" class="newsletter card">
						<div class="main">
							<b>Version {{ n.version }}</b>
							<div class="subjects">
								<div><flag code="fr" /> {{ n.fr.subject || '(pas de sujet)' }}</div>
								<div><flag code="gb" /> {{ n.en.subject || '(no subject)' }}</div>
							</div>
							<div class="spacer"></div>
							<v-btn @click="n.expanded = !n.expanded"><v-icon>{{ n.expanded ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon> Aperçu</v-btn>
							<v-btn v-if="$store.state.farmer" @click="test(n, $store.state.farmer.id)"><v-icon>mdi-cog-outline</v-icon> Test compte normal</v-btn>
							<v-text-field v-model="n.testTarget" type="number" label="Farmer ID" density="compact" hide-details style="max-width: 150px" />
							<v-btn @click="test(n, n.testTarget)"><v-icon>mdi-cog-outline</v-icon> Test</v-btn>
							<v-btn v-if="n.sent === 0" color="primary" @click="send(n)"><v-icon>mdi-send-outline</v-icon> Envoyer</v-btn>
							<div v-else>Envoyé le {{ $filters.date(n.sent) }}</div>
						</div>
						<div v-if="n.expanded" class="content">
							<v-card><div v-html="html(n.fr.preview)"></div></v-card>
							<v-card><div v-html="html(n.en.preview)"></div></v-card>
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
	import { ref } from 'vue'
	import { useRouter } from 'vue-router'
	import Breadcrumb from '@/component/forum/breadcrumb.vue'

	const router = useRouter()
	const newsletters = ref<any>([])
	const count = ref<any>(0)

	if (!store.getters.admin) router.replace('/')
	LeekWars.setTitle("Admin Newsletters")

	function load() {
		LeekWars.get('newsletter/all').then(ns => {
			for (const n of ns) {
				n.testTarget = 73156
				n.expanded = false
			}
			newsletters.value = ns
		})
	}

	load()
	LeekWars.get('newsletter/count').then(c => {
		count.value = c
		LeekWars.setSubTitle(c + " inscrits")
	})

	function html(html: string) {
		return html.replace("\n", "")
	}

	function test(n: any, target: any) {
		LeekWars.post('newsletter/test', { version: n.version, target }).then(() => LeekWars.toast("Envoyé !"))
	}

	function send(n: any) {
		const es = new EventSource(LeekWars.API + 'newsletter/send/' + encodeURIComponent(n.version))
		es.onmessage = (e) => {
			if (e.data === 'CLOSE') {
				es.close()
				LeekWars.toast("Envoyé !")
				load()
			}
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
		.flag {
			height: 14px;
			margin-right: 4px;
			vertical-align: middle;
		}
		.main {
			display: flex;
			align-items: center;
			flex-wrap: wrap;
			padding: 10px;
			gap: 10px;
		}
		.subjects {
			display: flex;
			flex-direction: column;
			gap: 2px;
			font-size: 14px;
			min-width: 250px;
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
	}
	#app.app .content {
		flex-wrap: wrap;
		.v-card {
			flex: 100% 0 0;
		}
	}
</style>
