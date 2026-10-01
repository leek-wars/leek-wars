<template>
	<div class="arena-widget">
		<div class="count">
			<span :class="{ live: count > 0 }" class="dot"></span>
			<strong>{{ count }}</strong> <span class="max">/ {{ Arena.MAX_PLAYERS }}</span>
		</div>
		<div class="gauge">
			<div :class="{ ready: count >= Arena.MIN_PLAYERS }" :style="{ width: Math.min(100, 100 * count / Arena.MAX_PLAYERS) + '%' }" class="bar"></div>
		</div>
		<div class="message">
			<template v-if="countdown >= 0">{{ t('arena_countdown', [countdown]) }}</template>
			<template v-else-if="registered">{{ t('arena_registered') }}</template>
			<template v-else-if="count >= Arena.MIN_PLAYERS">{{ t('arena_ready', count) }}</template>
			<template v-else-if="count > 0">{{ t('arena_missing', Arena.MIN_PLAYERS - count) }}</template>
			<template v-else>{{ t('arena_empty') }}</template>
		</div>
		<!-- Le mode préféré, comme au Potager, pour en changer depuis le widget
		     avant de « Rejoindre ». Rien à afficher une fois inscrit : le mode part
		     avec l'inscription. Icônes seules — le panneau est étroit — et le
		     libellé dans l'infobulle. -->
		<div v-if="!registered && countdown < 0" class="preferences">
			<v-tooltip v-for="mode of ARENA_PREFERENCES" :key="mode" location="bottom" :text="modeLabel(mode)">
				<template #activator="{ props }">
					<div v-ripple v-bind="props" class="mode" :class="{ selected: preference === mode }" @click="setPreference(mode)">
						<v-icon>{{ modeIcon(mode) }}</v-icon>
					</div>
				</template>
			</v-tooltip>
		</div>
		<div class="actions">
			<v-btn v-if="registered" @click="leave"><v-icon>mdi-keyboard-backspace</v-icon>&nbsp;{{ t('arena_leave') }}</v-btn>
			<v-btn v-else-if="leek" color="primary" @click="join"><v-icon>mdi-stadium</v-icon>&nbsp;{{ t('arena_join') }}</v-btn>
			<router-link v-else v-ripple to="/garden/arena" class="button">{{ t('arena_open') }}</router-link>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { computed, ref } from 'vue'
	import { Arena, ARENA_PREFERENCES, arenaModeIcon, arenaModeLabel } from '@/model/arena'
	import { LeekWars } from '@/model/leekwars'
	import { store } from '@/model/store'
	import { useNamespacedT } from '@/model/i18n'

	defineOptions({ name: 'HomeWidgetArena' })

	const t = useNamespacedT('home')

	// Aucune requête : le compteur et le décompte de l'arène sont poussés à tout
	// le monde sur le websocket (`ARENA_CHAT_NOTIF`), comme pour la carte d'invitation
	// du chat. Le widget ne fait que les regarder — il n'a donc rien à faire dans
	// la requête groupée de l'accueil.
	const count = computed(() => store.state.arenaCount || 0)
	const countdown = computed(() => store.state.arenaCountdown)
	const registered = computed(() => store.state.arenaEnabled)

	// Le poireau qu'on enverrait : le dernier choisi s'il est encore éligible,
	// sinon le premier de niveau 20. Même résolution que la carte du chat, pour
	// que les deux boutons « Rejoindre » du site inscrivent bien le même poireau.
	const leek = computed<number | null>(() => {
		const farmer = store.state.farmer
		if (!farmer) return null
		for (const key of ['arena-leek', 'garden/leek']) {
			const id = parseInt(localStorage.getItem(key) || '', 10)
			if (id && farmer.leeks[id] && farmer.leeks[id].level >= Arena.MIN_LEVEL) return id
		}
		for (const id in farmer.leeks) {
			if (farmer.leeks[id].level >= Arena.MIN_LEVEL) return farmer.leeks[id].id
		}
		return null
	})

	// La même liste et le même réglage partagé que le Potager, qui l'écrit dans
	// `arena/preference`.
	const preference = ref(parseInt(localStorage.getItem('arena/preference') || '-1', 10))
	const modeIcon = arenaModeIcon
	function modeLabel(mode: number): string {
		return t('main.' + arenaModeLabel(mode))
	}
	function setPreference(mode: number) {
		preference.value = mode
		localStorage.setItem('arena/preference', '' + mode)
	}

	function join() {
		if (!leek.value) return
		LeekWars.arena.register(leek.value, preference.value)
	}

	function leave() {
		LeekWars.arena.leave()
	}
</script>

<style lang="scss" scoped>
	.arena-widget {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 10px;
		height: 100%;
		text-align: center;
	}
	.count {
		display: flex;
		align-items: baseline;
		gap: 8px;
		font-size: 32px;
		font-weight: bold;
		color: var(--primary);
		line-height: 1;
	}
	.count .max {
		font-size: 17px;
		font-weight: normal;
		color: var(--text-color-secondary);
	}
	// La pastille ne clignote que lorsqu'il y a vraiment du monde à rejoindre :
	// une salle vide qui pulse promet un combat qui n'arrive pas.
	.dot {
		width: 10px;
		height: 10px;
		border-radius: 50%;
		background: var(--border);
		align-self: center;
	}
	.dot.live {
		background: var(--primary);
		animation: arena-pulse 1.6s ease-in-out infinite;
	}
	@keyframes arena-pulse {
		0%, 100% { opacity: 1; }
		50% { opacity: 0.3; }
	}
	.gauge {
		width: min(100%, 260px);
		height: 8px;
		border-radius: var(--radius);
		background: var(--background-row, var(--background-secondary));
		overflow: hidden;
	}
	.bar {
		height: 100%;
		background: var(--text-color-secondary);
		transition: width 0.3s ease;
	}
	// Le seuil de lancement franchi : la jauge passe au vert, c'est le seul
	// moment où rejoindre déclenche vraiment un combat.
	.bar.ready {
		background: var(--primary);
	}
	.message {
		font-size: 14px;
		color: var(--text-color-secondary);
		padding: 0 8px;
	}
	// Rangée de modes : six cibles carrées sur UNE ligne — repliées, elles
	// coûtaient une deuxième rangée que le panneau n'a pas, et le haut du widget
	// se faisait couper.
	.preferences {
		display: flex;
		gap: 4px;
		flex-wrap: nowrap;
		justify-content: center;
	}
	.mode {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		border-radius: var(--radius);
		cursor: pointer;
		color: var(--text-color-secondary);
		background: var(--background-row, var(--background-secondary));
	}
	.mode .v-icon {
		font-size: 17px;
		color: inherit;
	}
	.mode:hover {
		color: var(--text-color);
	}
	// Le mode retenu se lit comme les autres sélections du thème : l'aplat
	// d'accent, et l'encre qui va avec.
	.mode.selected {
		background: var(--primary-surface);
		color: var(--primary-surface-text);
	}
	.actions {
		display: flex;
		gap: 8px;
	}
	// Panneau court — c'est la hauteur par défaut du widget : on resserre le
	// chiffre et les gouttières pour que la rangée des modes tienne quand même.
	// Mesuré : 135 px d'occupation pour 154 px de panneau.
	@container (max-height: 175px) {
		.arena-widget {
			gap: 6px;
		}
		.count {
			font-size: 26px;
		}
		.mode {
			width: 24px;
			height: 24px;
		}
	}
	// Trop étroit pour six choix de front (188 px) : la rangée s'efface. Le mode choisi
	// reste celui du Potager, qui le pose dans le même réglage.
	@container (max-width: 200px) {
		.preferences {
			display: none;
		}
	}
	// Panneau bas : le chiffre reste, le reste s'efface plutôt que de déborder.
	@container (max-height: 150px) {
		.gauge, .message, .preferences {
			display: none;
		}
	}
</style>
