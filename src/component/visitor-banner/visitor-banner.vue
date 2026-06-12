<template lang="html">
	<div v-if="enabled && !minimized" class="visitor-banner" :class="{visible}">
		<div class="preview">
			<leek-image class="leek-live" :leek="{level: 1, skin, hat}" :scale="0.5" />
		</div>
		<div class="text">
			<div class="title">Leek Wars</div>
			<div class="pitch">{{ t('pitch') }}</div>
			<div class="form">
				<div class="name-row">
					<input ref="nameInput" v-model="leekName" :placeholder="t('leek_name')" maxlength="20" @keyup.enter="submit">
					<div v-ripple class="dice" :title="t('random')" @click="randomize"><v-icon>mdi-dice-multiple</v-icon></div>
				</div>
				<div class="skins">
					<div v-for="s in [1, 2, 3, 4, 5, 6, 7, 8]" :key="s" v-ripple class="skin" :class="{['skin-' + s]: true, selected: skin === s}" @click="skin = s"></div>
				</div>
				<div class="hats">
					<div v-ripple class="hat" :class="{selected: hat === 0}" @click="hat = 0"><img src="/image/hat/no_hat.png"></div>
					<div v-for="h in hatList" :key="h" v-ripple class="hat" :class="{selected: hat === h}" @click="hat = h"><img :src="'/image/hat/' + LeekWars.hats[h].name + '.png'"></div>
				</div>
				<div v-if="error" class="error">{{ error }}</div>
			</div>
		</div>
		<button v-ripple class="cta" :disabled="loading || !leekName.trim()" @click="submit">{{ t('play') }}</button>
		<v-icon class="close" :title="t('minimize')" @click="minimize">mdi-chevron-down</v-icon>
	</div>
	<div v-else-if="enabled" v-ripple class="visitor-bubble" :title="t('pitch')" @click="reopen">
		<leek-image class="bubble-leek" :leek="{level: 1, skin, hat}" :scale="0.35" />
		<div class="bubble-text">
			<div class="bubble-name">{{ leekName.trim() ? leekName : 'Leek Wars' }}</div>
			<div class="bubble-finish">{{ t('finish') }}</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getRedirectAfterLogin } from '@/router'
import { mixins, useNamespacedT } from '@/model/i18n'
import { LeekWars } from '@/model/leekwars'
import { store } from '@/model/store'

defineOptions({ name: 'VisitorBanner', i18n: {}, mixins: [...mixins] })

const t = useNamespacedT('visitor-banner')
const route = useRoute()
const router = useRouter()

const MINIMIZED_KEY = 'visitor-banner-minimized'

const visible = ref(false)
// Jamais vraiment fermé : la croix replie le bandeau en bulle dans le coin,
// et l'état survit à la navigation.
const minimized = ref(localStorage.getItem(MINIMIZED_KEY) === '1')

// Formulaire d'inscription rapide (mêmes champs que le fast register de la home).
// Le brouillon survit aux rechargements pour que la bulle réduite montre toujours
// le poireau en cours de création.
const DRAFT_KEY = 'visitor-banner-draft'
const draft = JSON.parse(localStorage.getItem(DRAFT_KEY) || '{}')
const leekName = ref<string>(draft.name || '')
const skin = ref<number>(draft.skin || 1)
const hat = ref<number>(draft.hat || 0)
watch([leekName, skin, hat], () => {
	localStorage.setItem(DRAFT_KEY, JSON.stringify({ name: leekName.value, skin: skin.value, hat: hat.value }))
})
const error = ref('')
const loading = ref(false)
const nameInput = ref<HTMLInputElement | null>(null)
const hatList = computed(() => LeekWars.hats ? [2, 9, 7, 1] : [])

// Pages où le bandeau est inutile : le funnel d'authentification. Sur la home,
// le signup est déjà le contenu principal : le bandeau n'apparaît que si le
// visiteur scrolle loin du formulaire (500px).
const excluded = computed(() => route.path.startsWith('/login')
	|| route.path.startsWith('/signup')
	|| route.path.startsWith('/forgot-password'))
const isHome = computed(() => route.path === '/')

// `connected === 'true'` en localStorage = session existante en cours de
// restauration : ne pas flasher le bandeau chez un joueur connecté.
const enabled = computed(() => !excluded.value && localStorage.getItem('connected') !== 'true')

let timer = 0
function reveal() {
	visible.value = true
	disarm()
}
function onScroll() {
	if (window.scrollY > 500) reveal()
}
function arm() {
	disarm()
	if (isHome.value) {
		// Home : n'apparaître que si le visiteur quitte la zone du signup.
		window.addEventListener('scroll', onScroll, { passive: true })
	} else {
		// Courte temporisation pour laisser la page s'afficher d'abord (pas de
		// déclenchement au scroll : certaines pages ne scrollent pas).
		timer = window.setTimeout(reveal, 500)
	}
}
function disarm() {
	window.removeEventListener('scroll', onScroll)
	clearTimeout(timer)
}

// Pas d'init one-shot dans onMounted : ce composant monte à la racine de app.vue
// AVANT que le routeur ait résolu la route initiale (route.path vaut encore '/',
// donc `enabled` est faux à cet instant). On arme/désarme au fil de `enabled`
// et de la route (le mode d'apparition diffère sur la home).
watch([enabled, isHome], ([v]) => {
	if (v && !visible.value && !minimized.value) arm()
	else disarm()
}, { immediate: true })

onBeforeUnmount(disarm)

function minimize() {
	minimized.value = true
	localStorage.setItem(MINIMIZED_KEY, '1')
}
// Générateur de pseudos pour le bouton dé : composés prononçables, optionnellement
// numérotés, toujours valides côté serveur (lettres/chiffres, 4-20 caractères).
const NAME_STARTS = ['Poiro', 'Leek', 'Porro', 'Turbo', 'Mega', 'Ultra', 'Dark', 'Super', 'Cyber', 'Atomik', 'Ninja', 'Pixel', 'Quantum', 'Astro', 'Hyper', 'Krypto', 'Zappy', 'Iron', 'Shadow', 'Volt', 'Spicy', 'Disco']
const NAME_ENDS = ['tron', 'zor', 'max', 'flash', 'storm', 'byte', 'wave', 'blade', 'boss', 'prime', 'mancer', 'punch', 'racer', 'nator', 'splash', 'fury', 'spark', 'rex', 'leek', 'mix']
function pick<T>(list: T[]): T {
	return list[Math.floor(Math.random() * list.length)]
}
function randomize() {
	const start = pick(NAME_STARTS)
	let end = pick(NAME_ENDS)
	while (start.toLowerCase().includes('leek') && end === 'leek') { end = pick(NAME_ENDS) }
	leekName.value = start + end + (Math.random() < 0.4 ? String(1 + Math.floor(Math.random() * 98)) : '')
	skin.value = 1 + Math.floor(Math.random() * 8)
	hat.value = pick([0, ...hatList.value])
}

function reopen() {
	minimized.value = false
	visible.value = true
	localStorage.setItem(MINIMIZED_KEY, '0')
	disarm()
	nextTick(() => nameInput.value?.focus())
}

function submit() {
	if (loading.value) return
	const name = leekName.value.trim()
	if (!name) {
		nameInput.value?.focus()
		return
	}
	loading.value = true
	error.value = ''
	LeekWars.post('farmer/register-fast', { leek_name: name, hat: hat.value, skin: skin.value }).then(data => {
		store.commit('connect', data)
		store.commit('connected', '$')
		router.push(getRedirectAfterLogin())
	}).error((errs: unknown) => {
		loading.value = false
		const first = (errs as [number, string, (string | number)[]][])[0]
		error.value = first ? t('error_' + first[1], first[2] || []) : t('error_register')
		// clé non traduite (code d'erreur inconnu) : retomber sur le message générique
		if (error.value.startsWith('error_')) { error.value = t('error_register') }
	})
}
</script>

<style lang="scss" scoped>
	.visitor-banner {
		position: fixed;
		left: 50%;
		bottom: 28px;
		z-index: 500;
		display: flex;
		align-items: flex-start;
		gap: 18px;
		width: min(720px, calc(100vw - 24px));
		padding: 16px 18px 16px 22px;
		border-radius: 14px;
		color: white;
		background: linear-gradient(115deg, #2a7a05, #5fad1b, #8bc34a, #5fad1b, #2a7a05);
		background-size: 300% 300%;
		box-shadow: 0 6px 24px rgba(0, 0, 0, 0.35);
		transform: translateX(-50%) translateY(calc(100% + 80px));
		transition: transform 0.55s cubic-bezier(0.22, 1.4, 0.36, 1);
		animation: visitor-banner-gradient 9s ease-in-out infinite;
		&.visible {
			transform: translateX(-50%) translateY(0);
		}
	}
	@keyframes visitor-banner-gradient {
		0%, 100% { background-position: 0% 50%; }
		50% { background-position: 100% 50%; }
	}
	.preview {
		flex-shrink: 0;
		align-self: center;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.leek-live {
		min-width: 80px;
		margin-top: -26px;
		filter: drop-shadow(0 3px 4px rgba(0, 0, 0, 0.3));
		animation: visitor-banner-leek 3.5s ease-in-out infinite;
	}
	@keyframes visitor-banner-leek {
		0%, 100% { transform: translateY(0) rotate(-2deg); }
		50% { transform: translateY(-5px) rotate(3deg); }
	}
	.text {
		flex: 1;
		min-width: 0;
	}
	.title {
		font-weight: bold;
		font-size: 19px;
		margin-bottom: 6px;
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.25);
	}
	.pitch {
		font-size: 14px;
		opacity: 0.95;
	}
	.form {
		display: flex;
		flex-direction: column;
		gap: 11px;
		margin-top: 11px;
		input {
			width: 100%;
			max-width: 310px;
			background: white;
			color: #222;
			border: none;
			border-radius: 8px;
			padding: 10px 14px;
			font-size: 15px;
			outline: none;
			&::placeholder {
				color: #999;
			}
		}
	}
	.name-row {
		display: flex;
		align-items: center;
		gap: 8px;
	}
	.dice {
		flex-shrink: 0;
		width: 38px;
		height: 38px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(255, 255, 255, 0.22);
		border-radius: 8px;
		cursor: pointer;
		transition: background 0.15s ease, transform 0.3s ease;
		&:hover {
			background: rgba(255, 255, 255, 0.4);
			transform: rotate(180deg);
		}
	}
	.skins {
		display: flex;
		gap: 8px;
		flex-wrap: wrap;
	}
	.skin {
		width: 27px;
		height: 27px;
		border-radius: 50%;
		cursor: pointer;
		border: 2px solid rgba(255, 255, 255, 0.4);
		transition: transform 0.15s ease, border-color 0.15s ease;
		&:hover {
			transform: scale(1.15);
		}
		&.selected {
			border-color: white;
			transform: scale(1.2);
			box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.15);
		}
	}
	.hats {
		display: flex;
		gap: 8px;
		flex-wrap: wrap;
	}
	.hat {
		width: 47px;
		height: 40px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(255, 255, 255, 0.22);
		border: 2px solid transparent;
		border-radius: 8px;
		cursor: pointer;
		transition: background 0.15s ease;
		img {
			max-width: 36px;
			max-height: 31px;
			object-fit: contain;
		}
		&:hover {
			background: rgba(255, 255, 255, 0.4);
		}
		&.selected {
			background: white;
			border-color: rgba(0, 0, 0, 0.1);
		}
	}
	.error {
		font-size: 13px;
		font-weight: bold;
		background: rgba(140, 0, 0, 0.45);
		border-radius: 6px;
		padding: 4px 10px;
	}
	.cta {
		flex-shrink: 0;
		align-self: center;
		background: white;
		color: #3e8a00;
		font-weight: bold;
		font-size: 16px;
		padding: 12px 22px;
		border-radius: 9px;
		text-decoration: none;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
		transition: transform 0.15s ease;
		cursor: pointer;
		border: none;
		&:hover {
			transform: scale(1.05);
		}
		&:disabled {
			opacity: 0.6;
			transform: none;
			cursor: wait;
		}
	}
	.close {
		flex-shrink: 0;
		opacity: 0.75;
		cursor: pointer;
		&:hover {
			opacity: 1;
		}
	}
	.visitor-bubble {
		position: fixed;
		right: 18px;
		bottom: 24px;
		z-index: 500;
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 10px 16px 10px 12px;
		border-radius: 16px;
		cursor: pointer;
		color: white;
		background: linear-gradient(135deg, #2a7a05, #5fad1b, #8bc34a);
		box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35);
		animation: visitor-bubble-pop 0.4s cubic-bezier(0.22, 1.6, 0.36, 1);
		transition: transform 0.15s ease;
		&:hover {
			transform: scale(1.05);
		}
	}
	.bubble-leek {
		min-width: 52px;
		margin-top: -22px;
		filter: drop-shadow(0 2px 3px rgba(0, 0, 0, 0.3));
		animation: visitor-banner-leek 3.5s ease-in-out infinite;
	}
	.bubble-name {
		font-weight: bold;
		font-size: 14px;
		margin-bottom: 4px;
		max-width: 150px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.25);
	}
	.bubble-finish {
		font-size: 12px;
		opacity: 0.95;
	}
	@keyframes visitor-bubble-pop {
		from { transform: scale(0); }
		to { transform: scale(1); }
	}
	@media screen and (max-width: 700px) {
		.visitor-banner {
			flex-wrap: wrap;
			gap: 6px 10px;
			padding: 10px 12px;
			bottom: 12px;
		}
		.leek-live {
			min-width: 52px;
			margin-top: -16px;
		}
		.title {
			font-size: 16px;
		}
		.pitch {
			font-size: 13px;
		}
		.cta {
			order: 10;
			flex-basis: 100%;
			text-align: center;
			font-size: 15px;
			padding: 11px 12px;
		}
		.visitor-bubble {
			right: 10px;
			bottom: 12px;
			padding: 8px 12px 8px 10px;
		}
		.bubble-leek {
			min-width: 44px;
			margin-top: -18px;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.visitor-banner, .leek-live, .visitor-bubble {
			animation: none;
			transition: none;
		}
	}
</style>
