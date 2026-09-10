<template lang="html">
	<div class="fast-fight">
		<v-tooltip :disabled="allowed && !disabled" location="top">
			<template #activator="{ props: tooltipProps }">
				<div v-bind="tooltipProps" class="split" :class="{locked: !allowed}">
					<!-- Non abonné : le bouton reste ACTIF et mène à la page de vente. Le
					     désactiver aurait rendu l'argumentaire inatteignable — un lien dans un
					     tooltip Vuetify ne se laisse pas survoler. -->
					<v-btn
						class="main"
						color="primary"
						:loading="loading"
						:disabled="allowed && disabled"
						@click="allowed ? launch(count) : router.push('/lwplus')">
						<v-icon>{{ allowed ? 'mdi-sword-cross' : 'mdi-lock' }}</v-icon>&nbsp;{{ t('fast_fight_n', [count]) }}
						<!-- Le « + » doré marque la fonctionnalité LW+. Image statique et
						     légère (2,6 ko) : le rendu animé sert au hero et à l'en-tête,
						     il serait trop lourd sur une page vue par tout le monde. -->
						<img class="plus-badge" src="/image/lwplus/plus_badge.webp" alt="LW+" width="128" height="128">
					</v-btn>
					<v-menu v-model="menu" location="bottom end" :disabled="!allowed || disabled || loading">
						<template #activator="{ props: menuProps }">
							<v-btn
								v-bind="menuProps"
								class="chevron"
								color="primary"
								:disabled="!allowed || disabled || loading"
								:aria-label="t('fast_fight_choose')">
								<v-icon>mdi-chevron-down</v-icon>
							</v-btn>
						</template>
						<div class="count-menu">
							<div
								v-for="option in COUNTS"
								:key="option"
								v-ripple
								class="count-option"
								:class="{active: option === count}"
								@click="choose(option)">
								<v-icon>mdi-sword-cross</v-icon>
								<span>{{ t('fast_fight_n', [option]) }}</span>
							</div>
						</div>
					</v-menu>
				</div>
			</template>
			<div v-if="!allowed" class="upsell">
				<div>{{ t('fast_fight_lwplus_only') }}</div>
				<div class="discover">{{ t('fast_fight_discover') }}</div>
			</div>
			<template v-else>{{ disabledReason || t('fast_fight_unavailable') }}</template>
		</v-tooltip>
	</div>
</template>

<script setup lang="ts">
	import { computed, ref } from 'vue'
	import { useRouter } from 'vue-router'
	import { useNamespacedT } from '@/model/i18n'
	import { store } from '@/model/store'

	// Pas de dictionnaire propre : les clés vivent dans garden.*, avec le reste du potager.
	defineOptions({ name: 'GardenFastFight' })

	const props = defineProps<{
		disabled?: boolean
		disabledReason?: string
		loading?: boolean
	}>()
	const emit = defineEmits<{
		'launch': [count: number]
	}>()

	const t = useNamespacedT('garden')
	const router = useRouter()

	// Doit rester aligné sur GardenController::FAST_GARDEN_COUNTS (le serveur ramène
	// toute autre valeur dans cette liste, mais autant ne jamais la lui envoyer).
	const COUNTS = [5, 10, 20]

	const stored = parseInt(localStorage.getItem('garden/fast_count') || '', 10)
	const count = ref(COUNTS.includes(stored) ? stored : 10)
	const menu = ref(false)

	// Admin inclus : c'est lui qui teste la fonctionnalité, et c'était déjà son bouton x10.
	const allowed = computed(() => !!(store.state.farmer?.lwplus || store.state.farmer?.admin))

	// Choisir un nombre ne lance RIEN : le menu règle le bouton, c'est le bouton qui
	// lance. Un lancement immédiat au choix surprenait (on voulait juste changer
	// de réglage) et rendait les lots involontaires.
	function choose(option: number) {
		count.value = option
		localStorage.setItem('garden/fast_count', String(option))
		menu.value = false
	}

	function launch(n: number) {
		if (!allowed.value || props.disabled || props.loading) return
		emit('launch', n)
	}
</script>

<style lang="scss" scoped>
	.fast-fight {
		display: inline-block;
	}
	.split {
		display: inline-flex;
		align-items: stretch;
	}
	.main {
		border-top-right-radius: 0;
		border-bottom-right-radius: 0;
	}
	.chevron {
		border-top-left-radius: 0;
		border-bottom-left-radius: 0;
		min-width: 36px !important;
		padding: 0 !important;
		// Trait de séparation : sans lui les deux moitiés se lisent comme un seul
		// bouton et le chevron passe pour une décoration.
		border-left: 1px solid rgba(0, 0, 0, 0.2);
	}
	.plus-badge {
		width: 22px;
		height: 22px;
		margin-left: 6px;
		margin-right: -2px;
		vertical-align: middle;
	}
	.count-menu {
		background: var(--background);
		border: 1px solid var(--border);
		padding: 4px 0;
	}
	.count-option {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 6px 14px;
		cursor: pointer;
		color: var(--text-color);
		&:hover {
			background: var(--background-secondary);
		}
		&.active {
			font-weight: bold;
			color: var(--primary);
		}
		.v-icon {
			font-size: 18px;
		}
	}
	// Verrouillé : le bouton reste cliquable (il mène à /lwplus) mais ne doit pas
	// promettre un combat. On le désature sans le griser comme un bouton mort.
	.split.locked .main {
		opacity: 0.75;
		filter: saturate(0.5);
		// Un enfant ne peut pas annuler le filtre du parent, il le compose : on
		// resature le badge d'autant pour que le « + » reste doré. C'est lui qui
		// dit pourquoi le bouton est verrouillé.
		.plus-badge {
			filter: saturate(2);
		}
	}
	.upsell {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2px;
		.discover {
			color: var(--gold);
			font-weight: bold;
		}
	}
</style>
