<template>
	<div class="page">
		<div class="page-header page-bar">
			<h1><breadcrumb :items="[{name: 'Administration', link: '/admin'}, {name: 'Debug matchmaking', link: '/admin/matchmaking'}]" :raw="true" /></h1>
		</div>
		<panel class="first last">
			<div class="content">
				<div class="search">
					<input v-model="leekId" type="number" placeholder="ID du poireau" @keyup.enter="run">
					<v-btn color="primary" :loading="loading" @click="run">Analyser</v-btn>
				</div>

				<div v-if="error" class="error-box">{{ error }}</div>

				<div v-if="data" class="result">
					<section>
						<h3>Poireau</h3>
						<div class="grid">
							<div><b>ID</b> <router-link :to="'/leek/' + data.leek.id">{{ data.leek.id }}</router-link></div>
							<div><b>Nom</b> {{ data.leek.name }}</div>
							<div><b>Level</b> {{ data.leek.level }}</div>
							<div><b>Talent</b> {{ data.leek.talent }}</div>
							<div :class="{bad: !data.leek.in_arena}"><b>in_arena</b> {{ data.leek.in_arena }}</div>
							<div :class="{bad: !data.leek.valid}"><b>valid</b> {{ data.leek.valid }}</div>
							<div><b>attacked</b> {{ data.leek.attacked }}</div>
							<div :class="{bad: !data.leek.ai || data.leek.ai === -1}"><b>ai</b> {{ data.leek.ai }}</div>
						</div>
					</section>

					<section>
						<h3>Éleveur</h3>
						<div class="grid">
							<div><b>ID</b> <router-link :to="'/farmer/' + data.farmer.id">{{ data.farmer.id }}</router-link></div>
							<div><b>Nom</b> {{ data.farmer.name }}</div>
							<div :class="{bad: data.farmer.day_fight <= 0}"><b>day_fight</b> {{ data.farmer.day_fight }}</div>
							<div :class="{bad: data.farmer.banned}"><b>banned</b> {{ data.farmer.banned }}</div>
						</div>
					</section>

					<section>
						<h3>Blockers (early-returns)</h3>
						<div class="grid">
							<div v-for="(v, k) in data.blockers" :key="k" :class="{bad: v}">
								<b>{{ k }}</b> {{ v ? '✘ bloque' : '✔ OK' }}
							</div>
						</div>
					</section>

					<section>
						<h3>Seuils calculés</h3>
						<div class="grid">
							<div><b>level</b> [{{ data.thresholds.level_down }} → {{ data.thresholds.level_up }}]</div>
							<div><b>talent</b> [{{ data.thresholds.talent_down }} → {{ data.thresholds.talent_up }}]</div>
							<div><b>max_attacked</b> &lt; {{ data.thresholds.max_attacked }}</div>
						</div>
					</section>

					<section>
						<h3>Funnel cumulatif <span class="sub">(candidats restants après chaque filtre)</span></h3>
						<table>
							<thead>
								<tr>
									<th>Étape</th>
									<th>Filtre</th>
									<th>SQL</th>
									<th class="num">Restants</th>
									<th class="num">Éliminés</th>
								</tr>
							</thead>
							<tbody>
								<tr>
									<td>0</td>
									<td><i>baseline (tous les poireaux)</i></td>
									<td></td>
									<td class="num"><b>{{ data.baseline }}</b></td>
									<td class="num">—</td>
								</tr>
								<tr v-for="(step, i) in data.funnel" :key="step.name" :class="{killer: previousCount(i) > 0 && step.count === 0}">
									<td>{{ i + 1 }}</td>
									<td>{{ step.name }}</td>
									<td><code>{{ step.sql }}</code></td>
									<td class="num"><b>{{ step.count }}</b></td>
									<td class="num">{{ previousCount(i) - step.count }}</td>
								</tr>
							</tbody>
						</table>
					</section>

					<section>
						<h3>Par filtre isolé <span class="sub">(candidats passant chaque filtre seul)</span></h3>
						<table>
							<thead>
								<tr><th>Filtre</th><th class="num">Candidats</th></tr>
							</thead>
							<tbody>
								<tr v-for="f in data.isolated" :key="f.name">
									<td>{{ f.name }}</td>
									<td class="num">{{ f.count }}</td>
								</tr>
							</tbody>
						</table>
					</section>

					<section>
						<h3>Opposants finaux <span class="sub">({{ data.opponents.length }}/5)</span></h3>
						<div v-if="data.opponents.length === 0" class="empty">Aucun opposant trouvé.</div>
						<div v-else class="opponents">
							<router-link v-for="op in data.opponents" :key="op.id" :to="'/leek/' + op.id" class="card opponent">
								<leek-image :leek="op" :scale="0.5" />
								<div class="op-name">{{ op.name }}</div>
								<div class="op-meta">Level {{ op.level }} — Talent {{ op.talent }}</div>
							</router-link>
						</div>
					</section>
				</div>
			</div>
		</panel>
	</div>
</template>

<script lang="ts">
	import { LeekWars } from '@/model/leekwars'
	import { Options, Vue } from 'vue-property-decorator'
	import Breadcrumb from '@/component/forum/breadcrumb.vue'

	interface Opponent { id: number; name: string; level: number; talent: number; skin: number; hat: number; weapon: number; }
	interface FunnelStep { name: string; sql: string; count: number; }
	interface DebugData {
		leek: { id: number; name: string; level: number; talent: number; in_arena: boolean; valid: boolean; attacked: number; ai: number; };
		farmer: { id: number; name: string; day_fight: number; banned: boolean; };
		blockers: Record<string, boolean>;
		thresholds: { talent_down: number; talent_up: number; level_down: number; level_up: number; max_attacked: number; };
		baseline: number;
		funnel: FunnelStep[];
		isolated: { name: string; count: number; }[];
		opponents: Opponent[];
	}

	@Options({ components: { Breadcrumb } })
	export default class AdminMatchmaking extends Vue {
		leekId: string = ''
		loading: boolean = false
		data: DebugData | null = null
		error: string | null = null

		created() {
			if (!this.$store.getters.admin) this.$router.replace('/')
			LeekWars.setTitle('Debug matchmaking')
			const q = this.$route.query.leek
			if (q) {
				this.leekId = '' + q
				this.run()
			}
		}

		run() {
			const id = parseInt(this.leekId, 10)
			if (!id) return
			this.loading = true
			this.error = null
			this.data = null
			LeekWars.get('admin/matchmaking-debug/' + id).then((res: any) => {
				this.loading = false
				this.data = res as DebugData
				if (this.$route.query.leek !== '' + id) {
					this.$router.replace({ query: { leek: '' + id } })
				}
			}).error((err: any) => {
				this.loading = false
				this.error = err?.error || 'Erreur'
			})
		}

		previousCount(i: number): number {
			if (!this.data) return 0
			return i === 0 ? this.data.baseline : this.data.funnel[i - 1].count
		}
	}
</script>

<style lang="scss" scoped>
	.content {
		padding: 15px;
	}
	.search {
		display: flex;
		gap: 10px;
		margin-bottom: 20px;
		input {
			flex: 1;
			max-width: 260px;
			padding: 6px 10px;
			border: 1px solid var(--border);
			border-radius: 4px;
			background: var(--pure-white);
			color: var(--text-color);
		}
	}
	.error-box {
		padding: 10px;
		background: var(--error-background, #fbe9e7);
		color: #c0392b;
		border-radius: 4px;
		margin-bottom: 15px;
	}
	section {
		margin-bottom: 24px;
	}
	h3 {
		margin: 0 0 8px 0;
		font-size: 17px;
		font-weight: 500;
		.sub {
			font-size: 13px;
			color: var(--text-color-secondary);
			font-weight: 400;
			margin-left: 6px;
		}
	}
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
		gap: 6px 14px;
		b {
			display: inline-block;
			min-width: 90px;
			color: var(--text-color-secondary);
			font-weight: 500;
		}
		.bad {
			color: #c0392b;
		}
	}
	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 14px;
		th, td {
			text-align: left;
			padding: 6px 10px;
			border-bottom: 1px solid var(--border);
		}
		th {
			color: var(--text-color-secondary);
			font-weight: 500;
		}
		.num {
			text-align: right;
			font-variant-numeric: tabular-nums;
		}
		code {
			font-size: 12px;
			color: var(--text-color-secondary);
		}
		tr.killer {
			background: rgba(231, 76, 60, 0.12);
			td {
				color: #c0392b;
			}
		}
	}
	.opponents {
		display: flex;
		flex-wrap: wrap;
		gap: 12px;
	}
	.opponent {
		padding: 10px;
		text-align: center;
		text-decoration: none;
		color: inherit;
		width: 160px;
	}
	.op-name {
		font-weight: 500;
		margin-top: 4px;
	}
	.op-meta {
		font-size: 12px;
		color: var(--text-color-secondary);
	}
	.empty {
		padding: 20px;
		text-align: center;
		color: var(--text-color-secondary);
	}
</style>
