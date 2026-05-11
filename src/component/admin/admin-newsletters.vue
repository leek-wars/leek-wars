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
							<div class="actions">
								<v-btn v-if="$store.state.farmer" variant="tonal" @click="test(n, $store.state.farmer.id)"><v-icon>mdi-cog-outline</v-icon> Test compte normal</v-btn>
								<v-text-field v-model="n.testTarget" type="number" label="Farmer ID" density="compact" hide-details style="max-width: 130px" />
								<v-btn variant="tonal" @click="test(n, n.testTarget)"><v-icon>mdi-cog-outline</v-icon> Test</v-btn>
								<span v-if="n.sent !== 0" class="sent"><v-icon>mdi-check-circle-outline</v-icon> Envoyé le {{ $filters.date(n.sent) }}</span>
								<!-- Envoi via terminal (make newsletter) -->
								<!-- <v-btn v-else color="primary" @click="send(n)"><v-icon>mdi-send-outline</v-icon> Envoyer</v-btn> -->
							</div>
						</div>
						<div v-if="n.stats && n.stats.total > 0" class="stats">
							<div class="stat" title="Mails envoyés">
								<v-icon size="18">mdi-send-outline</v-icon>
								<span class="value">{{ n.stats.total.toLocaleString() }}</span>
								<span class="slabel">envois</span>
							</div>
							<div class="stat" title="Mails ouverts (pixel de tracking)">
								<v-icon size="18">mdi-email-open-outline</v-icon>
								<span class="value">{{ n.stats.opened.toLocaleString() }}</span>
								<span class="slabel">ouverts</span>
								<span class="rate">({{ percent(n.stats.opened, n.stats.total) }}%)</span>
							</div>
							<div class="stat" title="Au moins un lien cliqué">
								<v-icon size="18">mdi-cursor-default-click-outline</v-icon>
								<span class="value">{{ n.stats.clicked.toLocaleString() }}</span>
								<span class="slabel">clics</span>
								<span class="rate">({{ percent(n.stats.clicked, n.stats.total) }}%)</span>
							</div>
							<div class="stat" title="Click-To-Open Rate (clics / ouvertures)">
								<v-icon size="18">mdi-target</v-icon>
								<span class="value">{{ percent(n.stats.clicked, n.stats.opened) }}%</span>
								<span class="slabel">CTOR</span>
							</div>
							<div class="stat bounced" :title="`Permanents: ${n.stats.hard_bounced} · Temporaires: ${n.stats.soft_bounced}`">
								<v-icon size="18">mdi-email-alert-outline</v-icon>
								<span class="value">{{ n.stats.bounced.toLocaleString() }}</span>
								<span class="slabel">bounces</span>
								<span class="rate">({{ percent(n.stats.bounced, n.stats.total) }}%)</span>
								<span v-if="n.stats.bounced > 0" class="breakdown">
									{{ n.stats.hard_bounced }} · {{ n.stats.soft_bounced }}
								</span>
							</div>
							<div class="stat unsub" title="Désinscriptions via le lien du mail">
								<v-icon size="18">mdi-account-off-outline</v-icon>
								<span class="value">{{ n.stats.unsubscribed.toLocaleString() }}</span>
								<span class="slabel">désinscriptions</span>
								<span class="rate">({{ percent(n.stats.unsubscribed, n.stats.total) }}%)</span>
							</div>
						</div>
						<h2 class="subject">{{ n[n.lang].subject || '(pas de sujet)' }}</h2>
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

	interface NewsletterStats {
		total: number
		opened: number
		clicked: number
		bounced: number
		hard_bounced: number
		soft_bounced: number
		unsubscribed: number
	}
	interface Newsletter {
		version: string
		fr: { subject: string; preview: string }
		en: { subject: string; preview: string }
		sent: number
		stats?: NewsletterStats
		testTarget?: number
		expanded?: boolean
	}

	const router = useRouter()
	const newsletters = ref<Newsletter[]>([])
	const count = ref(0)

	if (!store.getters.admin) router.replace('/')
	LeekWars.setTitle("Admin Newsletters")

	const STAT_KEYS: (keyof NewsletterStats)[] = ['total', 'opened', 'clicked', 'bounced', 'hard_bounced', 'soft_bounced', 'unsubscribed']

	function load() {
		LeekWars.get('newsletter/all').then(ns => {
			for (const n of ns) {
				n.testTarget = 73156
				n.lang = 'fr'
				if (!n.stats) n.stats = {} as NewsletterStats
				for (const k of STAT_KEYS) n.stats[k] = n.stats[k] ?? 0
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

	function percent(part: number, total: number) {
		if (!total) return '0.0'
		return ((part / total) * 100).toFixed(1)
	}

	function test(n: Newsletter, target: number) {
		LeekWars.post('newsletter/test', { version: n.version, target }).then(() => LeekWars.toast("Envoyé !"))
	}

	function send(n: Newsletter) {
		const es = new EventSource(LeekWars.API + 'newsletter/send/' + encodeURIComponent(n.version))
		es.onmessage = (e) => {
			if (e.data === 'CLOSE') {
				es.close()
				LeekWars.toast("Envoyé !")
				load()
			}
		}
	}
	void send
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
		.actions {
			display: flex;
			align-items: center;
			gap: 10px;
			flex-wrap: wrap;
			.sent {
				color: #5fad1b;
				font-size: 14px;
				display: inline-flex;
				align-items: center;
				gap: 4px;
			}
		}
		@mixin tinted($light, $dark) {
			&, .slabel, .rate { color: $light; }
			body.dark & {
				&, .slabel, .rate { color: $dark; }
			}
		}
		.stats {
			display: flex;
			flex-wrap: wrap;
			gap: 6px 12px;
			margin-top: 12px;
			padding: 8px 12px;
			background: var(--background-secondary);
			border-radius: 6px;
			font-size: 13px;
			.stat {
				display: inline-flex;
				align-items: center;
				gap: 4px;
				color: var(--text-color);
				.value {
					font-weight: 600;
				}
				.slabel {
					color: var(--text-color-secondary);
				}
				.rate {
					color: var(--text-color-secondary);
					font-size: 12px;
				}
				.breakdown {
					color: var(--text-color-secondary);
					font-size: 12px;
					margin-left: 4px;
				}
				&.bounced { @include tinted(#c62828, #ef9a9a); }
				&.unsub { @include tinted(#ef6c00, #ffb74d); }
			}
		}
		.subject {
			font-size: 18px;
			font-weight: 500;
			margin: 12px 0;
			line-height: 1.3;
		}
		.preview {
			padding: 15px;
		}
	}
</style>
