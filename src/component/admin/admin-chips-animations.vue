<template>
	<div class="page">
		<div class="page-header page-bar">
			<h1><breadcrumb :items="[{name: 'Administration', link: '/admin'}, {name: 'Animations puces', link: '/admin/chips-animations'}]" :raw="true" /></h1>
		</div>

		<panel class="player-panel" icon="mdi-flask-outline" title="Test des animations de puces">
			<template #content>
				<div class="toolbar">
					<div class="search">
						<v-text-field v-model="search" prepend-inner-icon="mdi-magnify" placeholder="Rechercher une puce..." hide-details density="compact" clearable />
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
						<v-btn v-if="selectedChip" color="primary" variant="flat" prepend-icon="mdi-restart" @click="relaunch">Relancer</v-btn>
					</div>
				</div>

				<div class="content">
					<div class="grid">
						<div v-for="chip in filteredChips" :key="chip.chipId" v-ripple class="chip" :class="{selected: selectedChip === chip.chipId}" :title="chipLabel(chip) + ' (#' + chip.chipId + ')'" @click="selectChip(chip.chipId)">
							<img :src="'/image/chip/' + chip.name + '.png'" loading="lazy">
							<span class="name">{{ chipLabel(chip) }}</span>
						</div>
						<div v-if="!filteredChips.length" class="empty">Aucune puce trouvée</div>
					</div>

					<div class="player-column">
						<div v-if="!selectedChip" class="placeholder">
							<v-icon size="48">mdi-cursor-default-click-outline</v-icon>
							<p>Sélectionne une puce dans la grille pour tester son animation.</p>
						</div>
						<div v-else class="player-zone">
							<player ref="playerRef" :key="playerKey" :fight="currentFight" :horizontal="false" />
						</div>
						<div v-if="selectedChip" class="current-chip">
							<img :src="'/image/chip/' + selectedChipData.name + '.png'">
							<div>
								<div class="chip-title">{{ chipLabel(selectedChipData) }} <span class="chip-id">#{{ selectedChip }}</span></div>
								<div class="chip-sub">Niveau {{ selectedChipData.level }} · {{ loopMode ? 'boucle infinie' : repetitions + ' lancers' }} · {{ emptyCellMode ? 'sur case vide' : 'sur soi-même puis les 4 poireaux à tour de rôle' }}</div>
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
	import { CHIP_ANIMATIONS } from '@/component/player/game/game'
	import type { Game } from '@/component/player/game/game'
	import Player from '@/component/player/player.vue'
	import Breadcrumb from '@/component/forum/breadcrumb.vue'
	import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
	import { useRouter } from 'vue-router'

	defineOptions({ name: 'AdminChipsAnimations', i18n: {}, mixins: [...mixins], components: { Player, Breadcrumb } })

	interface ChipEntry { chipId: number, item: number, name: string, level: number }

	const router = useRouter()
	if (!store.getters.admin) router.replace('/')
	LeekWars.setTitle("Animations puces")
	// large = pleine largeur, box = pleine hauteur, footer masqué (cf. inventaire/
	// documentation). resetLayout() dans router.beforeEach remet tout à défaut.
	onMounted(() => { LeekWars.large = true; LeekWars.box = true; LeekWars.footer = false })

	// Scène fixe : lanceur au centre, 2 ennemis et 2 alliés autour. Le lanceur
	// envoie la puce sur les 4 à tour de rôle pour comparer le rendu allié/ennemi.
	const CASTER_CELL = 306
	const SCENE = [
		{ id: 0, cell: CASTER_CELL, team: 1 }, // lanceur
		{ id: 1, cell: 221, team: 2 },         // ennemi
		{ id: 2, cell: 396, team: 2 },         // ennemi
		{ id: 3, cell: 216, team: 1 },         // allié
		{ id: 4, cell: 391, team: 1 },         // allié
	]
	// Ciblage à tour de rôle : d'abord soi-même, puis ennemi/allié alternés pour
	// bien voir la différence de rendu.
	const ROUND_ROBIN = [CASTER_CELL, SCENE[1].cell, SCENE[2].cell, SCENE[3].cell, SCENE[4].cell]
	// Cases vides alternées pour les puces type téléportation / invocation qui
	// exigent une cellule libre (504 puis 306 en boucle).
	const EMPTY_CELLS = [504, 306]

	const MAPS = ['Nexus', 'Usine', 'Désert', 'Forêt', 'Glacier', 'Plage', 'Temple', 'Japon', 'Château', 'Cimetière']

	const search = ref('')
	const repetitions = ref<number>(100)
	const mapType = ref(0)
	const selectedChip = ref<number | null>(null)
	const runId = ref(0)
	const playerRef = ref<{ game: Game } | null>(null)

	const repetitionItems = [
		{ label: '1 lancer', value: 1 },
		{ label: '10 lancers', value: 10 },
		{ label: '100 lancers', value: 100 },
		{ label: 'Boucle infinie', value: -1 },
	]
	const mapItems = MAPS.map((label, value) => ({ label, value }))

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

	const allChips = computed<ChipEntry[]>(() => {
		const out: ChipEntry[] = []
		for (const chipIdStr in LeekWars.chipTemplates) {
			const chipId = parseInt(chipIdStr, 10)
			if (!CHIP_ANIMATIONS[chipId - 1]) continue // pas d'animation côté client
			const tpl = LeekWars.chipTemplates[chipId]
			const data = LeekWars.chips[tpl.item] as { name: string, level?: number } | undefined
			if (!data) continue
			out.push({ chipId, item: tpl.item, name: data.name, level: data.level ?? 0 })
		}
		out.sort((a, b) => b.chipId - a.chipId) // plus récentes (chipId élevé) en premier
		return out
	})

	function chipLabel(chip: { name: string }) {
		const key = 'chip.' + chip.name
		return i18n.global.te(key) ? i18n.t(key) as string : chip.name
	}

	const filteredChips = computed(() => {
		const q = (search.value || '').trim().toLowerCase()
		if (!q) return allChips.value
		return allChips.value.filter(c => c.name.toLowerCase().includes(q) || chipLabel(c).toLowerCase().includes(q) || ('' + c.chipId) === q)
	})

	const selectedChipData = computed(() => {
		const found = allChips.value.find(c => c.chipId === selectedChip.value)
		return found ?? { chipId: 0, item: 0, name: '', level: 0 }
	})

	const emptyCellMode = computed(() => selectedChip.value !== null && needsEmptyCell(selectedChip.value))

	const playerKey = computed(() => `${selectedChip.value}-${castCount.value}-${mapType.value}-${runId.value}`)

	const currentFight = computed<Fight | undefined>(() => {
		if (!selectedChip.value) return undefined
		return buildFight(selectedChip.value, castCount.value)
	})

	function selectChip(chipId: number) {
		selectedChip.value = chipId
		setupLoop()
	}

	function relaunch() {
		runId.value++
		setupLoop()
	}

	// Construit un combat synthétique sur la scène fixe : le lanceur (id 0) lance
	// la puce sur les 4 autres poireaux à tour de rôle. Pas de dégâts réels
	// (aucune action LIFE_LOST émise) → personne ne meurt, la boucle reste valide.
	function buildFight(chipId: number, casts: number): Fight {
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
		const emptyCell = needsEmptyCell(chipId)

		const actions: number[][] = [[ActionType.START_FIGHT]]
		for (let k = 0; k < casts; k++) {
			const cell = emptyCell ? EMPTY_CELLS[k % EMPTY_CELLS.length] : ROUND_ROBIN[k % ROUND_ROBIN.length]
			actions.push([ActionType.NEW_TURN, k + 1])
			actions.push([ActionType.LEEK_TURN, casterId])
			actions.push([ActionType.USE_CHIP, chipId, cell, 0])
			actions.push([ActionType.END_TURN, casterId, 100, 6])
		}
		actions.push([ActionType.END_FIGHT])

		const team1 = leeks.filter(l => l.team === 1).map(l => l.id)
		const team2 = leeks.filter(l => l.team === 2).map(l => l.id)
		// init() fait this.maps[data.map.type + 1] → l'index de la grille MAPS
		// (0 = Nexus) correspond à un type décalé de -1.
		const map = { id: 0, type: mapType.value - 1, width: 18, height: 18, obstacles: {}, pattern: [], players: {} }

		return {
			title: 'Test animation puce', context: 0, date: 0,
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
	.chip {
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
	.current-chip {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 10px 4px 0;
		img {
			width: 40px;
			height: 40px;
			object-fit: contain;
		}
		.chip-title {
			font-weight: 500;
			font-size: 16px;
		}
		.chip-id {
			color: var(--text-color-secondary);
			font-weight: 400;
			font-size: 13px;
		}
		.chip-sub {
			font-size: 13px;
			color: var(--text-color-secondary);
		}
	}
</style>
