<template>
	<div class="page">
		<div class="page-header page-bar">
			<h1><breadcrumb :items="[{name: 'Administration', link: '/admin'}, {name: 'Game animations', link: '/admin/game-animations'}]" :raw="true" /></h1>
		</div>

		<panel class="player-panel" icon="mdi-flask-outline" title="Test des animations d'armes et de puces">
			<template #content>
				<div class="toolbar">
					<div class="search">
						<v-text-field v-model="search" prepend-inner-icon="mdi-magnify" placeholder="Rechercher une arme ou une puce..." hide-details density="compact" clearable />
					</div>
					<div class="options">
						<div class="option">
							<label>Répétitions</label>
							<v-select v-model="repetitions" :items="repetitionItems" item-title="label" item-value="value" hide-details density="compact" />
						</div>
						<div class="option">
							<label>Carte</label>
							<v-select v-model="mapType" :items="mapItems" item-title="label" item-value="value" hide-details density="compact" />
						</div>
						<v-btn v-if="selected" color="primary" variant="flat" prepend-icon="mdi-restart" @click="relaunch">Relancer</v-btn>
					</div>
				</div>

				<div class="content">
					<div class="grid">
						<div v-for="entry in filteredEntries" :key="entry.kind + entry.id" v-ripple class="entry" :class="{selected: isSelected(entry)}" :title="entry.label + ' (' + entry.kind + ' #' + entry.id + ')'" @click="selectEntry(entry)">
							<span class="kind" :class="entry.kind">{{ entry.kind === 'weapon' ? 'arme' : 'puce' }}</span>
							<img :src="entry.icon" loading="lazy">
							<span class="name">{{ entry.label }}</span>
						</div>
						<div v-if="!filteredEntries.length" class="empty">Aucun résultat</div>
					</div>

					<div class="player-column">
						<div v-if="!selected" class="placeholder">
							<v-icon size="48">mdi-cursor-default-click-outline</v-icon>
							<p>Sélectionne une arme ou une puce dans la grille pour tester son animation.</p>
						</div>
						<div v-else class="player-zone">
							<player ref="playerRef" :key="playerKey" :fight="currentFight" :horizontal="false" />
						</div>
						<div v-if="selected" class="current-entry">
							<img :src="selected.icon">
							<div>
								<div class="entry-title">{{ selected.label }} <span class="entry-id">{{ selected.kind }} #{{ selected.id }}</span></div>
								<div class="entry-sub">Niveau {{ selected.level }} · {{ loopMode ? 'boucle infinie' : repetitions + ' lancers' }} · {{ targetDescription }}</div>
							</div>
						</div>
					</div>
				</div>
			</template>
		</panel>
	</div>
</template>

<script setup lang="ts">
	import { Fight, FightType } from '@/model/fight'
	import { i18n, mixins } from '@/model/i18n'
	import { LeekWars } from '@/model/leekwars'
	import { store } from '@/model/store'
	import { ActionType } from '@/model/action'
	import { EffectType } from '@/model/effect'
	import { CHIP_ANIMATIONS, WEAPONS } from '@/component/player/game/game'
	import type { Game } from '@/component/player/game/game'
	import Player from '@/component/player/player.vue'
	import Breadcrumb from '@/component/forum/breadcrumb.vue'
	import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
	import { useRouter } from 'vue-router'

	defineOptions({ name: 'AdminGameAnimations', i18n: {}, mixins: [...mixins], components: { Player, Breadcrumb } })

	type Kind = 'weapon' | 'chip'
	interface AnimEntry { kind: Kind, id: number, name: string, label: string, icon: string, level: number }

	const router = useRouter()
	if (!store.getters.admin) router.replace('/')
	LeekWars.setTitle("Game animations")
	// large = pleine largeur, box = pleine hauteur, footer masqué (cf. inventaire/
	// documentation). resetLayout() dans router.beforeEach remet tout à défaut.
	onMounted(() => { LeekWars.large = true; LeekWars.box = true; LeekWars.footer = false })

	// Scène fixe : lanceur au centre, 2 ennemis et 2 alliés autour.
	const CASTER_CELL = 306
	const SCENE = [
		{ id: 0, cell: CASTER_CELL, team: 1 }, // lanceur
		{ id: 1, cell: 221, team: 2 },         // ennemi
		{ id: 2, cell: 396, team: 2 },         // ennemi
		{ id: 3, cell: 216, team: 1 },         // allié
		{ id: 4, cell: 391, team: 1 },         // allié
	]
	// Cibles non-lanceur, ennemi / allié alternés pour bien voir la différence.
	const NON_CASTER_TARGETS = [SCENE[1].cell, SCENE[3].cell, SCENE[2].cell, SCENE[4].cell]
	// Puces : d'abord soi-même, puis les 4 autres. Armes : seulement les 4 autres.
	const CHIP_TARGETS = [CASTER_CELL, ...NON_CASTER_TARGETS]
	const WEAPON_TARGETS = NON_CASTER_TARGETS
	// Cases vides alternées pour les puces type téléportation / invocation qui
	// exigent une cellule libre (504 puis 306 en boucle).
	const EMPTY_CELLS = [504, 306]

	// L'ordre doit suivre game.maps (index 0 = Nexus) ; data.map.type = index - 1 (cf. buildFight).
	const MAPS = ['Nexus', 'Usine', 'Désert', 'Forêt', 'Glacier', 'Plage', 'Temple', 'Japon', 'Château', 'Cimetière']

	const search = ref('')
	const repetitions = ref<number>(100)
	const mapType = ref(0)
	const selected = ref<AnimEntry | null>(null)
	const runId = ref(0)
	const playerRef = ref<{ game: Game } | null>(null)

	const repetitionItems = [
		{ label: '1 lancer', value: 1 },
		{ label: '10 lancers', value: 10 },
		{ label: '100 lancers', value: 100 },
		{ label: 'Boucle infinie', value: -1 },
	]
	const mapItems = MAPS.map((label, value) => ({ label, value }))

	function trans(key: string, fallback: string) {
		return i18n.global.te(key) ? i18n.t(key) as string : fallback
	}

	// Une puce « case vide » a un effet de téléportation ou d'invocation : elle
	// doit viser une cellule libre, pas un poireau.
	function needsEmptyCell(chipId: number): boolean {
		const tpl = LeekWars.chipTemplates[chipId]
		const data = tpl ? LeekWars.chips[tpl.item] as { effects?: { id: number }[] } | undefined : undefined
		const effects = data?.effects ?? []
		return effects.some(e => e.id === EffectType.TELEPORT || e.id === EffectType.SUMMON)
	}

	const loopMode = computed(() => repetitions.value === -1)
	const castCount = computed(() => loopMode.value ? 100 : repetitions.value)

	// Armes (id = template, animation = WEAPONS[id-1]) puis puces (id = chipId,
	// animation = CHIP_ANIMATIONS[id-1]). On ne garde que celles ayant une animation.
	const allEntries = computed<AnimEntry[]>(() => {
		const weapons: AnimEntry[] = []
		for (const idStr in LeekWars.weapons) {
			const id = parseInt(idStr, 10)
			if (!WEAPONS[id - 1]) continue
			const tpl = LeekWars.weapons[id] as { name: string, level?: number } | undefined
			if (!tpl) continue
			const short = tpl.name.replace('weapon_', '')
			weapons.push({ kind: 'weapon', id, name: short, label: trans('weapon.' + short, short), icon: '/image/weapon/' + short + '.png', level: tpl.level ?? 0 })
		}
		weapons.sort((a, b) => a.level - b.level || a.id - b.id)

		const chips: AnimEntry[] = []
		for (const chipIdStr in LeekWars.chipTemplates) {
			const id = parseInt(chipIdStr, 10)
			if (!CHIP_ANIMATIONS[id - 1]) continue
			const tpl = LeekWars.chipTemplates[id]
			const data = LeekWars.chips[tpl.item] as { name: string, level?: number } | undefined
			if (!data) continue
			chips.push({ kind: 'chip', id, name: data.name, label: trans('chip.' + data.name, data.name), icon: '/image/chip/' + data.name + '.png', level: data.level ?? 0 })
		}
		chips.sort((a, b) => b.id - a.id) // puces récentes (id élevé) en premier

		return [...weapons, ...chips]
	})

	const filteredEntries = computed(() => {
		const q = (search.value || '').trim().toLowerCase()
		if (!q) return allEntries.value
		return allEntries.value.filter(e => e.name.toLowerCase().includes(q) || e.label.toLowerCase().includes(q) || ('' + e.id) === q)
	})

	function isSelected(entry: AnimEntry) {
		return selected.value?.kind === entry.kind && selected.value?.id === entry.id
	}

	const targetDescription = computed(() => {
		if (!selected.value) return ''
		if (selected.value.kind === 'weapon') return 'sur les 4 poireaux à tour de rôle'
		const emptyCell = needsEmptyCell(selected.value.id)
		return emptyCell ? 'sur case vide' : 'sur soi-même puis les 4 poireaux à tour de rôle'
	})

	const playerKey = computed(() => `${selected.value?.kind}-${selected.value?.id}-${castCount.value}-${mapType.value}-${runId.value}`)

	const currentFight = computed<Fight | undefined>(() => {
		if (!selected.value) return undefined
		return buildFight(selected.value, castCount.value)
	})

	function selectEntry(entry: AnimEntry) {
		selected.value = entry
		setupLoop()
	}

	function relaunch() {
		runId.value++
		setupLoop()
	}

	// Construit un combat synthétique sur la scène fixe : le lanceur (id 0) utilise
	// l'arme ou la puce sur les cibles à tour de rôle. Pas de dégâts réels (aucune
	// action LIFE_LOST émise) → personne ne meurt, la boucle reste valide.
	function buildFight(entry: AnimEntry, casts: number): Fight {
		// Ids 0-based et denses : le moteur itère this.leeks via for...of (un id
		// manquant à l'index 0 ferait planter launch() sur entity.cell).
		const leeks = SCENE.map((s, i) => ({
			id: s.id, type: 0, name: 'Poireau ' + (i + 1),
			team: s.team,
			level: 100, life: 2500,
			strength: 300, wisdom: 300, agility: 200, resistance: 100,
			science: 200, magic: 200, frequency: 100,
			tp: 100, mp: 6,
			cellPos: s.cell,
			orientation: -1,
			skin: (i % 18) + 1, hat: null, metal: true, face: 2,
			chips: [], weapons: [],
		}))
		const casterId = 0
		const emptyCell = entry.kind === 'chip' && needsEmptyCell(entry.id)

		const actions: number[][] = [[ActionType.START_FIGHT]]
		for (let k = 0; k < casts; k++) {
			actions.push([ActionType.NEW_TURN, k + 1])
			actions.push([ActionType.LEEK_TURN, casterId])
			if (entry.kind === 'weapon') {
				const cell = WEAPON_TARGETS[k % WEAPON_TARGETS.length]
				actions.push([ActionType.SET_WEAPON, entry.id])
				actions.push([ActionType.USE_WEAPON, cell, 0])
			} else {
				const cell = emptyCell ? EMPTY_CELLS[k % EMPTY_CELLS.length] : CHIP_TARGETS[k % CHIP_TARGETS.length]
				actions.push([ActionType.USE_CHIP, entry.id, cell, 0])
			}
			actions.push([ActionType.END_TURN, casterId, 100, 6])
		}
		actions.push([ActionType.END_FIGHT])

		const team1 = leeks.filter(l => l.team === 1).map(l => l.id)
		const team2 = leeks.filter(l => l.team === 2).map(l => l.id)
		// init() fait this.maps[data.map.type + 1] → l'index de la grille MAPS
		// (0 = Nexus) correspond à un type décalé de -1.
		const map = { id: 0, type: mapType.value - 1, width: 18, height: 18, obstacles: {}, pattern: [], players: {} }

		return {
			title: 'Test animation', context: 0, date: 0,
			farmers1: { 1: { id: 1, name: 'Pilow' } },
			farmers2: { 1: { id: 1, name: 'Pilow' } },
			id: 0, farmer1: 1, farmer2: 1,
			leeks1: [], leeks2: [], team1: null, team2: null,
			report: {}, status: 1,
			team1_name: 'A', team2_name: 'B',
			tournament: 0, type: FightType.SOLO, winner: 1, year: 2026,
			data: { actions, map, leeks, team1, team2, ops: {} },
			comments: [], result: 'win', queue: 0, trophies: [],
			chests: 0, size: 0, rareloot: 0, levelups: 0,
		} as unknown as Fight
	}

	// Boucle infinie : on surveille la fin du replay et on rejoue depuis le début
	// (requestJump évite de recréer le Game et de recharger les textures).
	let loopTimer: ReturnType<typeof setInterval> | null = null
	function setupLoop() {
		if (loopTimer) { clearInterval(loopTimer); loopTimer = null }
		if (!loopMode.value) return
		loopTimer = setInterval(() => {
			const game = playerRef.value?.game
			if (!game || !game.actions || !game.actions.length) return
			if (game.currentAction >= game.actions.length - 1) {
				game.requestJump(0)
			}
		}, 250)
	}

	// Réarme/désarme la boucle quand on bascule entre « fini » et « infini ».
	watch(loopMode, setupLoop)

	onBeforeUnmount(() => { if (loopTimer) clearInterval(loopTimer) })
</script>

<style lang="scss" scoped>
	// Pleine hauteur : la page est en flex column (layout box). Le panel est
	// déjà en flex column, on l'étire et on laisse .content remplir le reste.
	// Le slot #content rend directement dans .panel, donc .toolbar et .content
	// sont enfants flex directs du panel.
	.player-panel {
		flex: 1;
		min-height: 0;
	}
	.toolbar {
		display: flex;
		flex-wrap: wrap;
		gap: 12px;
		align-items: flex-end;
		padding: 12px;
		border-bottom: 1px solid var(--border);
	}
	.search {
		flex: 1;
		min-width: 220px;
	}
	.options {
		display: flex;
		flex-wrap: wrap;
		gap: 12px;
		align-items: flex-end;
	}
	.option {
		display: flex;
		flex-direction: column;
		min-width: 130px;
		label {
			font-size: 12px;
			color: var(--text-color-secondary);
			padding-bottom: 2px;
		}
	}
	.content {
		flex: 1;
		min-height: 0;
		display: flex;
		gap: 12px;
		padding: 12px;
		align-items: stretch;
	}
	.grid {
		flex: 0 0 360px;
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(70px, 1fr));
		gap: 6px;
		max-height: 100%;
		overflow-y: auto;
		align-content: start;
	}
	.entry {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 6px 2px;
		border-radius: 4px;
		cursor: pointer;
		border: 2px solid transparent;
		background: var(--background-secondary);
		&:hover {
			background: var(--background-disabled);
		}
		&.selected {
			border-color: var(--primary);
			background: var(--background-disabled);
		}
		img {
			width: 48px;
			height: 48px;
			object-fit: contain;
		}
		.kind {
			position: absolute;
			top: 2px;
			left: 2px;
			font-size: 9px;
			line-height: 1;
			padding: 2px 3px;
			border-radius: 3px;
			color: var(--pure-white);
			text-transform: uppercase;
			&.weapon { background: #c0612a; }
			&.chip { background: #5fad1b; }
		}
		.name {
			font-size: 11px;
			text-align: center;
			line-height: 1.1;
			margin-top: 2px;
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
			max-width: 100%;
		}
	}
	.empty {
		grid-column: 1 / -1;
		padding: 20px;
		text-align: center;
		color: var(--text-color-secondary);
	}
	.player-column {
		flex: 1;
		min-width: 0;
		min-height: 0;
		display: flex;
		flex-direction: column;
	}
	.placeholder {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 12px;
		min-height: 0;
		color: var(--text-color-secondary);
		background: var(--background-secondary);
		border-radius: 4px;
	}
	.player-zone {
		flex: 1;
		min-height: 0;
		width: 100%;
		background: #2a2a2a;
		border-radius: 4px;
		overflow: hidden;
	}
	.current-entry {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 10px 4px 0;
		img {
			width: 40px;
			height: 40px;
			object-fit: contain;
		}
		.entry-title {
			font-weight: 500;
			font-size: 16px;
		}
		.entry-id {
			color: var(--text-color-secondary);
			font-weight: 400;
			font-size: 13px;
			text-transform: capitalize;
		}
		.entry-sub {
			font-size: 13px;
			color: var(--text-color-secondary);
		}
	}
</style>
