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
						<div class="header">
							<div class="title">
								<span class="version">Version {{ n.version }}</span>
								<v-btn-toggle v-model="n.lang" mandatory density="compact" color="primary">
									<v-btn value="fr"><flag code="fr" /></v-btn>
									<v-btn value="en"><flag code="gb" /></v-btn>
								</v-btn-toggle>
							</div>
							<div class="status">
								<span v-if="n.sent !== 0" class="sent"><v-icon>mdi-check-circle-outline</v-icon> Envoyé le {{ $filters.date(n.sent) }}</span>
								<v-btn v-else color="primary" @click="send(n)"><v-icon>mdi-send-outline</v-icon> Envoyer</v-btn>
							</div>
						</div>
						<h3 class="subject">{{ n[n.lang].subject || '(pas de sujet)' }}</h3>
						<div class="actions">
							<v-btn v-if="$store.state.farmer" variant="tonal" @click="test(n, $store.state.farmer.id)"><v-icon>mdi-cog-outline</v-icon> Test compte normal</v-btn>
							<v-text-field v-model="n.testTarget" type="number" label="Farmer ID" density="compact" hide-details style="max-width: 130px" />
							<v-btn variant="tonal" @click="test(n, n.testTarget)"><v-icon>mdi-cog-outline</v-icon> Test</v-btn>
						</div>
						<v-card class="preview" variant="outlined"><div v-html="html(n[n.lang].preview)"></div></v-card>
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
				n.lang = 'fr'
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
	.flag {
		height: 14px;
		margin-right: 4px;
		vertical-align: middle;
	}
	:deep(.v-btn-toggle) .v-btn {
		margin: 0 !important;
	}
	.newsletters {
		display: flex;
		flex-direction: column;
		gap: 15px;
		margin: 15px;
	}
	.newsletter {
		padding: 15px;
		.header {
			display: flex;
			align-items: center;
			justify-content: space-between;
			gap: 15px;
			flex-wrap: wrap;
		}
		.title {
			display: flex;
			align-items: center;
			gap: 12px;
		}
		.version {
			font-weight: bold;
			font-size: 16px;
		}
		.status {
			.sent {
				color: #5fad1b;
				font-size: 14px;
				display: inline-flex;
				align-items: center;
				gap: 4px;
			}
		}
		.subject {
			font-size: 18px;
			font-weight: 500;
			margin: 12px 0;
			line-height: 1.3;
		}
		.actions {
			display: flex;
			align-items: center;
			gap: 10px;
			flex-wrap: wrap;
			padding-bottom: 12px;
			border-bottom: 1px solid var(--border-color, #e0e0e0);
			margin-bottom: 12px;
		}
		.preview {
			padding: 15px;
		}
	}
</style>
