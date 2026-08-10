<template>
	<div class="page">
		<div class="page-header page-bar">
			<h1>Leek Wars 3.0 : composants</h1>
		</div>
		<div class="lw3">
			<div class="title-row">
				<h2>Design system</h2>
				<span class="crumb">redesign / composants</span>
			</div>
			<div class="px-sep"></div>

			<!-- Icônes -->
			<div class="panel">
				<div class="panel-header">
					<span><v-icon class="accent" :size="14">mdi-shape</v-icon> Icônes <span class="header-note">Material Design Icons</span></span>
				</div>
				<div class="icons">
					<div v-for="i in ICONS" :key="i.icon" class="icon-cell">
						<v-icon :size="22">{{ i.icon }}</v-icon>
						<span class="icon-name">{{ i.usage }}</span>
					</div>
				</div>
				<div class="icon-variants">
					<span class="variant-label">taille</span>
					<v-icon v-for="s in ICON_SIZES" :key="s" :size="s">mdi-trophy</v-icon>
					<span class="variant-label">couleur héritée</span>
					<span class="variant-colors">
						<v-icon :size="18" style="color: var(--red)">mdi-heart</v-icon>
						<v-icon :size="18" style="color: var(--gold)">mdi-circle-multiple</v-icon>
						<v-icon :size="18" style="color: var(--cyan)">mdi-flash</v-icon>
						<v-icon :size="18" style="color: var(--lime)">mdi-star</v-icon>
					</span>
				</div>
			</div>

			<!-- Palette -->
			<div class="panel">
				<div class="panel-header">
					<span><v-icon class="accent" :size="14">mdi-palette</v-icon> Palette</span>
				</div>
				<div class="swatches">
					<div v-for="c in COLORS" :key="c" class="swatch">
						<div class="swatch-color" :style="{ background: `var(--${c})` }"></div>
						<span class="swatch-name">{{ c }}</span>
					</div>
				</div>
			</div>

			<!-- Boutons, pastilles, champs -->
			<div class="lw3-columns">
				<div class="panel">
					<div class="panel-header">
						<span><v-icon class="accent" :size="14">mdi-gesture-tap-button</v-icon> Boutons</span>
					</div>
					<div class="lw3-pad lw3-inline">
						<button class="btn btn-primary"><v-icon :size="14">mdi-play</v-icon> Combattre</button>
						<button class="btn"><v-icon :size="14">mdi-code-braces</v-icon> Éditer</button>
						<button class="btn btn-ghost">Annuler</button>
						<button class="btn btn-sm">Petit</button>
					</div>
				</div>
				<div class="panel">
					<div class="panel-header">
						<span><v-icon class="accent" :size="14">mdi-label</v-icon> Pastilles</span>
					</div>
					<div class="lw3-pad lw3-inline">
						<span class="chip green">Victoire</span>
						<span class="chip amber">Nul</span>
						<span class="chip red">Défaite</span>
						<span class="chip cyan">Niveau 301</span>
						<span class="chip magenta">Légende</span>
					</div>
				</div>
				<div class="panel">
					<div class="panel-header">
						<span><v-icon class="accent" :size="14">mdi-form-textbox</v-icon> Champs</span>
					</div>
					<div class="lw3-pad lw3-search">
						<v-icon :size="16">mdi-magnify</v-icon>
						<input class="input" placeholder="Rechercher un poireau">
					</div>
				</div>
			</div>

			<!-- Onglets, table, pagination -->
			<div class="panel">
				<div class="tabs">
					<button v-for="t in TABS" :key="t.label" class="tab" :class="{ active: tab === t.label }" @click="tab = t.label">
						<v-icon :size="14">{{ t.icon }}</v-icon>
						{{ t.label }}
					</button>
				</div>
				<table class="lw-table">
					<thead>
						<tr><th>Place</th><th>Poireau</th><th>Talent</th><th>Niveau</th></tr>
					</thead>
					<tbody>
						<tr v-for="(row, i) in RANKING" :key="row.name" :class="{ highlight: row.self }">
							<td class="place" :class="'top' + (i + 1)">{{ i + 1 }}</td>
							<td class="name" :class="{ legend: row.legend }">{{ row.name }}</td>
							<td class="num">{{ row.talent }}</td>
							<td class="muted">{{ row.level }}</td>
						</tr>
					</tbody>
				</table>
				<div class="lw3-pad">
					<div class="pager">
						<div v-for="p in 5" :key="p" class="pg" :class="{ active: p === 1 }">{{ p }}</div>
						<span class="dots">…</span>
						<div class="pg">42</div>
					</div>
				</div>
			</div>

			<!-- Graphiques -->
			<div class="lw3-columns lw3-columns-2">
				<div class="panel">
					<div class="panel-header">
						<span><v-icon class="accent" :size="14">mdi-chart-line-variant</v-icon> Courbe pixel <span class="header-note">SVG</span></span>
					</div>
					<div class="lw3-pad">
						<div class="spark">
							<div class="spark-grid"></div>
							<svg viewBox="0 0 320 100" preserveAspectRatio="none">
								<defs>
									<linearGradient id="lw3-spark" x1="0" y1="0" x2="0" y2="1">
										<stop offset="0%" stop-color="var(--green)" stop-opacity="0.4" />
										<stop offset="100%" stop-color="var(--green)" stop-opacity="0" />
									</linearGradient>
								</defs>
								<path :d="sparkPath + ' L 320,100 L 0,100 Z'" fill="url(#lw3-spark)" />
								<path :d="sparkPath" fill="none" stroke="var(--green)" stroke-width="1.5" shape-rendering="crispEdges" />
								<rect v-for="(p, i) in sparkDots" :key="i" :x="p[0] - 1.5" :y="p[1] - 1.5" width="3" height="3" fill="var(--green)" />
							</svg>
						</div>
						<div class="spark-axis">
							<span>24 avr</span><span>27 avr</span><span>30 avr</span><span>3 mai</span>
						</div>
					</div>
				</div>

				<div class="panel">
					<div class="panel-header">
						<span><v-icon class="accent" :size="14">mdi-trending-up</v-icon> Talent sur 30 jours <span class="header-note">Chart.js</span></span>
					</div>
					<div class="lw3-pad chart-wrap">
						<Line :data="talentData" :options="talentOptions" />
					</div>
				</div>
			</div>

			<div class="panel">
				<div class="panel-header">
					<span><v-icon class="accent" :size="14">mdi-chart-bar</v-icon> Combats par jour <span class="header-note">Chart.js</span></span>
				</div>
				<div class="lw3-pad chart-wrap chart-wrap-wide">
					<Bar :data="resultsData" :options="resultsOptions" />
				</div>
				<div class="chart-legend">
					<span v-for="s in RESULT_SERIES" :key="s.label" class="legend-item">
						<i class="legend-mark" :style="{ background: `var(--${s.token})` }"></i>{{ s.label }}
					</span>
				</div>
			</div>

			<!-- Caractéristiques, combats, inventaire -->
			<div class="lw3-columns">
				<div class="panel">
					<div class="panel-header">
						<span><v-icon class="accent" :size="14">mdi-podium</v-icon> Caractéristiques</span>
					</div>
					<div v-for="s in STATS" :key="s.carac" class="stat-row">
						<span class="k"><img class="charac" :src="'/image/charac/small/' + s.carac + '.png'" :alt="s.label">{{ s.label }}</span>
						<span class="v">{{ s.value }}</span>
					</div>
				</div>
				<div class="panel">
					<div class="panel-header">
						<span><v-icon class="accent" :size="14">mdi-sword-cross</v-icon> Derniers combats</span>
						<v-icon :size="14">mdi-chevron-up</v-icon>
					</div>
					<div class="lw3-pad lw3-stack">
						<div v-for="c in COMBATS" :key="c.name" class="combat-pill" :class="c.result">
							<v-icon :size="14" :class="'icon-' + c.result">mdi-trophy</v-icon>
							<span>{{ c.name }}</span>
							<span class="pill-delta">{{ c.delta }}</span>
						</div>
					</div>
				</div>
				<div class="panel">
					<div class="panel-header">
						<span><v-icon class="accent" :size="14">mdi-treasure-chest</v-icon> Armes</span>
					</div>
					<div class="lw3-pad lw3-slots">
						<div v-for="(w, i) in WEAPONS" :key="w" class="slot" :class="{ active: i === 0 }">
							<img class="slot-image" :src="'/image/weapon/' + w + '.png'" :alt="w">
							<span class="lvl">{{ WEAPON_LEVELS[i] }}</span>
						</div>
					</div>
				</div>
			</div>

			<div class="panel">
				<div class="panel-header">
					<span><v-icon class="accent" :size="14">mdi-chip</v-icon> Puces</span>
				</div>
				<div class="lw3-pad lw3-chips">
					<div v-for="c in CHIP_NAMES" :key="c" class="slot">
						<img class="slot-image" :src="'/image/chip/' + c + '.png'" :alt="c">
					</div>
				</div>
			</div>

			<!-- Jauges et tuiles -->
			<div class="lw3-columns lw3-columns-2">
				<div class="panel">
					<div class="panel-header">
						<span><v-icon class="accent" :size="14">mdi-gauge</v-icon> Jauges</span>
					</div>
					<div class="lw3-pad lw3-stack-lg">
						<div v-for="b in BARS" :key="b.label" class="m-stat-block">
							<div class="m-stat-row"><span>{{ b.label }}</span><span>{{ b.value }} / {{ b.max }}</span></div>
							<div class="m-bar"><div :style="{ width: (100 * b.value / b.max) + '%', background: `var(--${b.token})` }"></div></div>
						</div>
					</div>
				</div>
				<div class="panel">
					<div class="panel-header">
						<span><v-icon class="accent" :size="14">mdi-view-grid</v-icon> Tuiles</span>
					</div>
					<div class="m-stats-grid">
						<div v-for="t in TILES" :key="t.label" class="m-stat-tile">
							<div class="m-stat-l">{{ t.label }}</div>
							<div class="m-stat-v" :style="{ color: `var(--${t.token})` }">{{ t.value }}</div>
						</div>
					</div>
				</div>
			</div>

			<!-- Notifications et chat -->
			<div class="lw3-columns lw3-columns-2">
				<div class="panel">
					<div class="aside-head">
						<span><v-icon class="accent" :size="14">mdi-bell</v-icon> Notifications</span>
						<span class="count">3</span>
					</div>
					<div v-for="n in NOTIFS" :key="n.text" class="notif">
						<span class="dot"></span>
						<div>
							<div><strong>{{ n.who }}</strong> {{ n.text }}</div>
							<div class="when">{{ n.when }}</div>
						</div>
					</div>
				</div>
				<div class="panel">
					<div class="aside-head">
						<span><v-icon class="accent" :size="14">mdi-message-text</v-icon> Chat</span>
					</div>
					<div class="chat-list">
						<div v-for="(m, i) in CHAT" :key="i" class="chat-msg" :class="m.style">
							<span class="when">{{ m.when }}</span>
							<span class="who">{{ m.who }}</span>
							<span class="body">{{ m.text }}</span>
						</div>
					</div>
					<div class="chat-input">
						<input class="input" placeholder="Message">
						<button class="btn btn-sm"><v-icon :size="14">mdi-send</v-icon></button>
					</div>
				</div>
			</div>

			<!-- Combat -->
			<div class="panel">
				<div class="panel-header">
					<span><v-icon class="accent" :size="14">mdi-sword</v-icon> Combat</span>
				</div>
				<div class="hud">
					<div class="hud-log">
						<div class="line green">Gorglucks utilise Lightninger sur Wolp</div>
						<div class="line red">Wolp perd 412 PV</div>
						<div class="line amber">Wolp utilise Bouclier</div>
						<div class="line">Fin du tour 14</div>
					</div>
					<div class="timeline">
						<div v-for="(b, i) in TIMELINE" :key="i" class="tl-bar" :class="{ act: b.enemy, current: i === 3 }">
							<div class="av"></div>
							<div class="b" :style="{ height: b.height + '%' }"></div>
						</div>
					</div>
					<div class="playback">
						<div class="pb-btn"><v-icon :size="16">mdi-skip-previous</v-icon></div>
						<div class="pb-btn lg"><v-icon :size="22">mdi-play</v-icon></div>
						<div class="pb-btn"><v-icon :size="16">mdi-pause</v-icon></div>
						<div class="pb-btn"><v-icon :size="16">mdi-skip-next</v-icon></div>
					</div>
				</div>
			</div>

			<!-- Éditeur -->
			<div class="panel">
				<div class="panel-header">
					<span><v-icon class="accent" :size="14">mdi-code-tags</v-icon> Éditeur</span>
					<span class="header-note">quantum.leek</span>
				</div>
				<div class="code-body">
					<div class="code-gutter">
						<div v-for="l in CODE.length" :key="l">{{ l }}</div>
					</div>
					<div class="code-text"><div v-for="(line, i) in CODE" :key="i"><span v-for="(token, j) in line" :key="j" :class="token.c">{{ token.t }}</span></div></div>
				</div>
				<div class="problems">
					<div class="problem-row"><v-icon :size="14" class="pr-ic">mdi-alert</v-icon> Variable « cible » déclarée mais jamais utilisée, ligne 3</div>
				</div>
				<div class="status-bar">
					<span class="item ok"><v-icon :size="13">mdi-check-circle</v-icon> Compilé</span>
					<span class="item">LeekScript 4</span>
					<span class="item warn"><v-icon :size="13">mdi-alert-outline</v-icon> 1 avertissement</span>
					<span class="item">Ln 4, Col 12</span>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { computed, onMounted, ref, watch } from 'vue'
	import { Bar, Line } from 'vue-chartjs'
	import type { ChartData, ChartOptions } from 'chart.js'
	import { useRedesignTheme } from '@/redesign/theme'
	import { LeekWars } from '@/model/leekwars'
	import '@/redesign/redesign.scss'

	defineOptions({ name: 'RedesignStyleguide', components: { Bar, Line } })

	useRedesignTheme()

	const COLORS = ['green', 'lime', 'cyan', 'magenta', 'amber', 'red', 'gold', 'ink', 'ink-2', 'ink-3', 'bg', 'bg-elev', 'bg-panel', 'bg-input']
	const ICON_SIZES = [12, 14, 18, 22, 28]
	/* Le jeu d'icônes du redesign, pris dans Material Design Icons déjà embarqué
	   par le site (@mdi/js, tree-shaké via src/model/mdi-icons.ts). */
	const ICONS = [
		{ icon: 'mdi-magnify', usage: 'recherche' },
		{ icon: 'mdi-heart', usage: 'vie' },
		{ icon: 'mdi-circle-multiple', usage: 'habs' },
		{ icon: 'mdi-flash', usage: 'action' },
		{ icon: 'mdi-shield', usage: 'équipe' },
		{ icon: 'mdi-sword', usage: 'combat' },
		{ icon: 'mdi-sword-cross', usage: 'arène' },
		{ icon: 'mdi-trophy', usage: 'trophée' },
		{ icon: 'mdi-code-tags', usage: 'éditeur' },
		{ icon: 'mdi-treasure-chest', usage: 'inventaire' },
		{ icon: 'mdi-account-group', usage: 'éleveurs' },
		{ icon: 'mdi-sprout', usage: 'poireaux' },
		{ icon: 'mdi-help-circle', usage: 'aide' },
		{ icon: 'mdi-forum', usage: 'forum' },
		{ icon: 'mdi-bell', usage: 'notifications' },
		{ icon: 'mdi-email', usage: 'messages' },
		{ icon: 'mdi-message-text', usage: 'chat' },
		{ icon: 'mdi-cog', usage: 'réglages' },
		{ icon: 'mdi-play', usage: 'lecture' },
		{ icon: 'mdi-pause', usage: 'pause' },
		{ icon: 'mdi-skip-next', usage: 'suivant' },
		{ icon: 'mdi-skip-previous', usage: 'précédent' },
		{ icon: 'mdi-plus', usage: 'ajouter' },
		{ icon: 'mdi-close', usage: 'fermer' },
		{ icon: 'mdi-chevron-up', usage: 'replier' },
		{ icon: 'mdi-star', usage: 'favori' },
		{ icon: 'mdi-filter-variant', usage: 'filtrer' },
		{ icon: 'mdi-chip', usage: 'puces' },
		{ icon: 'mdi-folder', usage: 'dossier' },
		{ icon: 'mdi-file-document-outline', usage: 'fichier' },
	]
	const TABS = [
		{ label: 'Poireaux', icon: 'mdi-sprout' },
		{ label: 'Éleveurs', icon: 'mdi-account-group' },
		{ label: 'Équipes', icon: 'mdi-shield' },
	]
	const RANKING = [
		{ name: 'Gorglucks', talent: 1842, level: 301, legend: true, self: false },
		{ name: 'SkullGrog', talent: 1790, level: 298, legend: false, self: true },
		{ name: 'Wolp', talent: 1655, level: 287, legend: false, self: false },
	]
	/* Icônes de caractéristiques du jeu : /image/charac/small/<carac>.png */
	const STATS = [
		{ carac: 'life', label: 'Vie', value: '2 695' },
		{ carac: 'strength', label: 'Force', value: '560' },
		{ carac: 'agility', label: 'Agilité', value: '400' },
		{ carac: 'wisdom', label: 'Sagesse', value: '300' },
		{ carac: 'resistance', label: 'Résistance', value: '400' },
		{ carac: 'magic', label: 'Magie', value: '110' },
		{ carac: 'tp', label: 'PT', value: '22' },
		{ carac: 'mp', label: 'PM', value: '15' },
	]
	const WEAPONS = ['enhanced_lightninger', 'katana', 'destroyer', 'magnum', 'laser', 'shotgun', 'axe', 'pistol']
	const WEAPON_LEVELS = [300, 280, 250, 120, 100, 80, 60, 1]
	const CHIP_NAMES = ['fire_ball', 'lightning', 'meteorite', 'iceberg', 'rock', 'spark', 'stalactite', 'venom',
		'shield', 'armor', 'fortress', 'wall', 'bandage', 'cure', 'vaccine', 'regeneration',
		'protein', 'steroid', 'doping', 'adrenaline', 'warm_up', 'leather_boots', 'teleportation', 'jump']
	const COMBATS = [
		{ name: 'Gorglucks', delta: '+12', result: 'win' },
		{ name: 'SkullGrog', delta: '0', result: 'draw' },
		{ name: 'Wolp', delta: '-8', result: 'loss' },
	]
	const BARS = [
		{ label: 'Vie', value: 2695, max: 3200, token: 'red' },
		{ label: 'Expérience', value: 740, max: 1000, token: 'green' },
		{ label: 'Capital libre', value: 7, max: 30, token: 'lime' },
	]
	const TILES = [
		{ label: 'Victoires', value: '2 699', token: 'green' },
		{ label: 'Nuls', value: '1 116', token: 'amber' },
		{ label: 'Défaites', value: '3 553', token: 'red' },
		{ label: 'Talent', value: '7 812', token: 'ink' },
		{ label: 'Niveau', value: '301', token: 'ink' },
		{ label: 'Trophées', value: '212', token: 'gold' },
	]
	const NOTIFS = [
		{ who: 'Wolp', text: 'vous a défié en combat.', when: 'il y a 3 min' },
		{ who: 'Tournoi', text: 'commence dans 10 minutes.', when: 'il y a 12 min' },
		{ who: 'SkullGrog', text: 'a rejoint votre équipe.', when: 'hier' },
	]
	const CHAT = [
		{ who: 'Pilow', text: 'la 2.50 arrive bientôt', when: '14:02', style: '' },
		{ who: 'Wolp', text: 'quelqu\'un pour un BR ?', when: '14:03', style: 'alt' },
		{ who: 'Nyaleph', text: 'mon IA compile enfin', when: '14:05', style: 'alt2' },
		{ who: 'TheScout', text: 'gg', when: '14:06', style: 'alt3' },
	]
	const TIMELINE = [
		{ height: 80, enemy: false }, { height: 55, enemy: true }, { height: 92, enemy: false },
		{ height: 40, enemy: true }, { height: 70, enemy: false }, { height: 30, enemy: true },
		{ height: 88, enemy: false }, { height: 62, enemy: true },
	]
	const CODE: { t: string, c: string }[][] = [
		[{ t: '// cible la plus proche', c: 'tk-cm' }],
		[{ t: 'var', c: 'tk-kw' }, { t: ' cible ', c: 'tk-var' }, { t: '= ', c: 'tk-op' }, { t: 'getNearestEnemy', c: 'tk-fn' }, { t: '()', c: 'tk-op' }],
		[{ t: 'if', c: 'tk-kw' }, { t: ' (', c: 'tk-op' }, { t: 'getWeapon', c: 'tk-fn' }, { t: '() != ', c: 'tk-op' }, { t: 'WEAPON_PISTOL', c: 'tk-num' }, { t: ') {', c: 'tk-op' }],
		[{ t: '    setWeapon', c: 'tk-fn' }, { t: '(', c: 'tk-op' }, { t: 'WEAPON_PISTOL', c: 'tk-num' }, { t: ')', c: 'tk-op' }],
		[{ t: '}', c: 'tk-op' }],
		[{ t: 'useWeapon', c: 'tk-fn' }, { t: '(cible)', c: 'tk-op' }],
	]
	const RESULT_SERIES = [
		{ label: 'Victoires', token: 'green' },
		{ label: 'Nuls', token: 'amber' },
		{ label: 'Défaites', token: 'red' },
	]

	const tab = ref(TABS[0].label)

	/* Courbe du mockup : tracé déterministe, repris tel quel de screens/dashboard.jsx. */
	const sparkPoints = computed(() => {
		const points: [number, number][] = []
		let y = 70
		for (let i = 0; i < 32; i++) {
			y += (Math.sin(i * 0.7) * 3) + ((i * 1.7) % 5) - 1.5 - 0.4
			if (y > 90) y -= 4
			points.push([i * (320 / 31), Math.max(8, Math.min(90, y))])
		}
		return points
	})
	const sparkPath = computed(() => 'M ' + sparkPoints.value.map(p => p.join(',')).join(' L '))
	const sparkDots = computed(() => sparkPoints.value.filter((_, i) => i % 4 === 0))

	/* Chart.js habillé avec les jetons du redesign : les couleurs sont lues sur le
	   DOM, donc un changement de thème les recalcule au lieu de les figer. */
	function token(name: string) {
		return getComputedStyle(document.documentElement).getPropertyValue('--' + name).trim()
	}

	const TALENT = [1620, 1634, 1628, 1650, 1672, 1668, 1690, 1702, 1698, 1715, 1740, 1738, 1755, 1762, 1780, 1776, 1790, 1802, 1798, 1812, 1806, 1820, 1834, 1828, 1840, 1842]
	const WINS = [12, 9, 14, 11, 16, 13, 15]
	const DRAWS = [3, 5, 2, 4, 3, 6, 2]
	const LOSSES = [6, 8, 5, 7, 4, 6, 5]

	const talentData = ref<ChartData<'line'>>({ labels: [], datasets: [] })
	const talentOptions = ref<ChartOptions<'line'>>({})
	const resultsData = ref<ChartData<'bar'>>({ labels: [], datasets: [] })
	const resultsOptions = ref<ChartOptions<'bar'>>({})

	function buildCharts() {
		const green = token('green')
		const grid = token('line')
		const ink3 = token('ink-3')
		const mono = "'JetBrains Mono', ui-monospace, monospace"

		const axes = {
			x: { grid: { color: grid }, border: { color: grid }, ticks: { color: ink3, font: { family: mono, size: 10 } } },
			y: { grid: { color: grid }, border: { color: grid }, ticks: { color: ink3, font: { family: mono, size: 10 } } },
		}

		talentData.value = {
			labels: TALENT.map((_, i) => (i + 1) + ' mai'),
			datasets: [{
				data: TALENT,
				tension: 0.2,
				borderColor: green,
				borderWidth: 2,
				pointRadius: 0,
				pointHoverRadius: 5,
				pointBackgroundColor: green,
				fill: { target: 'origin', above: green + '30' },
			}],
		}
		talentOptions.value = {
			aspectRatio: 2.6,
			plugins: { legend: { display: false } },
			scales: axes,
		}

		// 2 px de fond entre deux segments empilés : la bordure est peinte à la
		// couleur du panneau, ce qui sépare les blocs sans ajouter de trait.
		const segment = { borderColor: token('bg-panel'), borderWidth: 2, borderSkipped: false, barPercentage: 0.65, categoryPercentage: 0.85 }
		resultsData.value = {
			labels: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
			datasets: [
				{ label: 'Victoires', data: WINS, backgroundColor: token('green'), ...segment },
				{ label: 'Nuls', data: DRAWS, backgroundColor: token('amber'), ...segment },
				{ label: 'Défaites', data: LOSSES, backgroundColor: token('red'), ...segment },
			],
		}
		resultsOptions.value = {
			aspectRatio: 4,
			// Légende rendue en HTML sous le graphique, pour qu'elle porte la
			// typo pixel du design plutôt que celle de Chart.js.
			plugins: { legend: { display: false } },
			scales: { x: { ...axes.x, stacked: true }, y: { ...axes.y, stacked: true } },
		}
	}

	onMounted(buildCharts)
	watch(() => LeekWars.darkMode, buildCharts)
</script>

<style lang="scss" scoped>
	/* Mise en page de la galerie uniquement.
	   Les composants eux-mêmes ne portent aucun style ici : ils viennent
	   de src/redesign/components.scss, qui est la source de vérité. */
	.lw3 {
		padding: 16px;
		display: flex;
		flex-direction: column;
		gap: 16px;
	}
	.lw3-columns {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
		gap: 14px;
	}
	.lw3-columns-2 {
		grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
	}
	.lw3-pad { padding: 12px 14px; }
	.lw3-inline { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
	.lw3-stack { display: flex; flex-direction: column; gap: 6px; }
	.lw3-stack-lg { display: flex; flex-direction: column; gap: 14px; }
	.lw3-slots { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
	.lw3-chips { display: grid; grid-template-columns: repeat(auto-fill, minmax(52px, 1fr)); gap: 6px; }
	.lw3-search { display: flex; align-items: center; gap: 8px; color: var(--ink-3); }
	.header-note { color: var(--ink-3); }
	.icon-win { color: var(--green); }
	.icon-draw { color: var(--amber); }
	.icon-loss { color: var(--red); }
	.pill-delta { margin-left: auto; }

	/* Assets réels du jeu */
	.slot-image {
		width: 82%;
		height: 82%;
		object-fit: contain;
	}
	.charac {
		width: 14px;
		height: 14px;
		flex: none;
	}

	.icons {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
	}
	.icon-cell {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 6px;
		padding: 12px 4px;
		border-right: 1px solid var(--line);
		border-bottom: 1px solid var(--line);
		color: var(--ink);
	}
	.icon-cell:hover { background: var(--bg-row); color: var(--green); }
	.icon-name {
		font-family: var(--f-mono);
		font-size: 10px;
		color: var(--ink-3);
	}
	.icon-variants {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 8px;
		padding: 12px 14px;
		color: var(--ink-2);
	}
	.variant-label {
		font-family: var(--f-pixel);
		font-size: 8px;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		color: var(--ink-3);
		margin-left: 12px;
	}
	.variant-label:first-child { margin-left: 0; }
	.variant-colors { display: inline-flex; align-items: center; gap: 8px; }

	.swatches {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
		gap: 10px;
		padding: 14px;
	}
	.swatch-color {
		height: 44px;
		border: 1.5px solid var(--line-strong);
	}
	.swatch-name {
		display: block;
		margin-top: 4px;
		font-family: var(--f-mono);
		font-size: 10px;
		color: var(--ink-3);
	}

	.spark-axis {
		display: flex;
		justify-content: space-between;
		margin-top: 8px;
		font-family: var(--f-mono);
		font-size: 10px;
		color: var(--ink-3);
	}
	.chart-wrap { width: 100%; }
	.chart-wrap-wide { padding-bottom: 4px; }
	.chart-legend {
		display: flex;
		gap: 16px;
		padding: 0 14px 12px;
		font-family: var(--f-pixel);
		font-size: 8px;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		color: var(--ink-2);
	}
	.legend-item { display: inline-flex; align-items: center; gap: 6px; }
	.legend-mark { width: 8px; height: 8px; display: inline-block; }
</style>
