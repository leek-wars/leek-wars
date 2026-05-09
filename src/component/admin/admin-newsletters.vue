<template>
	<div class="page">
		<div class="page-header page-bar">
			<div>
				<h1><breadcrumb :items="[{name: 'Administration', link: '/admin'}, {name: 'Newsletters', link: '/admin/newsletters'}]" :raw="true" /></h1>
				<div class="info">{{ count }} inscrits</div>
			</div>
			<v-btn-toggle v-model="lang" mandatory density="compact" color="primary">
				<v-btn value="fr"><flag code="fr" /> FR</v-btn>
				<v-btn value="en"><flag code="gb" /> EN</v-btn>
			</v-btn-toggle>
		</div>
		<panel class="first">
			<template #content>
				<div class="newsletters">
					<div v-for="n in newsletters" :key="n.version" class="newsletter card">
						<div class="main">
							<b>Version {{ n.version }}</b>
							<div class="subject">{{ n[lang].subject || '(pas de sujet)' }}</div>
							<div class="spacer"></div>
							<v-btn v-if="$store.state.farmer" @click="test(n, $store.state.farmer.id)"><v-icon>mdi-cog-outline</v-icon> Test compte normal</v-btn>
							<v-text-field v-model="n.testTarget" type="number" label="Farmer ID" density="compact" hide-details style="max-width: 150px" />
							<v-btn @click="test(n, n.testTarget)"><v-icon>mdi-cog-outline</v-icon> Test</v-btn>
							<v-btn v-if="n.sent === 0" color="primary" @click="send(n)"><v-icon>mdi-send-outline</v-icon> Envoyer</v-btn>
							<div v-else>Envoyé le {{ $filters.date(n.sent) }}</div>
						</div>
						<v-card class="preview"><div v-html="html(n[lang].preview)"></div></v-card>
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
	const lang = ref<'fr' | 'en'>('fr')

	if (!store.getters.admin) router.replace('/')
	LeekWars.setTitle("Admin Newsletters")

	function load() {
		LeekWars.get('newsletter/all').then(ns => {
			for (const n of ns) n.testTarget = 73156
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
	.flag {
		height: 14px;
		margin-right: 4px;
		vertical-align: middle;
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
			flex-wrap: wrap;
			padding: 10px;
			gap: 10px;
		}
		.subject {
			font-size: 14px;
			min-width: 250px;
		}
		.preview {
			margin: 0 15px 15px;
			padding: 15px;
		}
	}
</style>
