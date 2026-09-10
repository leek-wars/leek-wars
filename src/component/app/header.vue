<template lang="html">
	<header v-if="LeekWars.header" class="header">
		<div class="header-left">
			<router-link to="/">
				<div class="logo-wrapper">
					<!-- Icône devant le mot-symbole (v3, demande de Pierre) : c'est le poireau
					     du favicon, déjà l'icône du jeu, pas un dessin nouveau — le logo
					     définitif reste à la charge de Pierre (REDESIGN.md, principe 5). -->
					<img v-if="!LeekWars.legacyTheme && !LeekWars.xpTheme" class="logo-icon" src="/image/favicon.png" alt="">
					<img v-if="LeekWars.legacyTheme || LeekWars.xpTheme" class="logo" :src="LeekWars.xpTheme ? '/image/xp_logo.png' : '/image/leekwars.svg'">
					<!-- Le logo historique est rempli d'un dégradé vertical (blanc → #b3b3b3),
					     hérité d'une barre sombre. Le v3 en prend une version à plat, même
					     géométrie au point près, un seul aplat : c'est un essai demandé par
					     Pierre en attendant le logo définitif (cf. REDESIGN.md, principe 5).
					     Le SVG sert de MASQUE et la boîte est peinte en `--text-color` :
					     le mot-symbole est de la couleur du texte, pas d'un noir ou d'un
					     blanc pur (demande de Pierre, 2026-09-08). -->
					<span v-else class="logo logo-mask" role="img" aria-label="Leek Wars"></span>
					<span v-if="seasonDecoration" class="season-decoration">{{ seasonDecoration }}</span>
					<span v-if="LeekWars.BETA_LOCAL" class="beta-local-label">Bêta locale</span>
					<span v-else-if="LeekWars.LOCAL" class="local-label">local</span>
					<span v-else-if="LeekWars.DEV" class="dev-label">dev</span>
					<span v-if="env.BETA" class="beta-label">Bêta</span>
					<!-- <v-tooltip>
						<template #activator="{ props }">
							<img v-bind="props" class="hat" src="/image/10years_hat.png">
						</template>
						{{ $t('main.10years') }}
					</v-tooltip> -->
				</div>
			</router-link>
		</div>
		<div class="header-right">
			<div v-if="!$store.state.connected" class="header-signin buttons">
				<div class="button-wrapper">
					<div class="header-button" @click="LeekWars.darkMode = !LeekWars.darkMode">
						<v-icon>mdi-weather-night</v-icon>
					</div>
				</div>
				<v-menu offset-y>
					<template #activator="{ props }">
						<div class="button-wrapper language-button" v-bind="props">
							<div class="header-button">
								<flag :code="LeekWars.languages[$i18n.locale].country" :clickable="false" />
							</div>
						</div>
					</template>
					<v-list :dense="true">
						<v-list-item v-for="(language, i) in LeekWars.languages" :key="i" class="language" @click="LeekWars.setLocale(language.code)">
							<template #prepend>
								<flag :code="language.country" :clickable="false" />
							</template>
							<span class="name">{{ language.name }}</span>
							<template #append>
								<span v-if="language.beta" class="beta">bêta</span>
							</template>
						</v-list-item>
					</v-list>
				</v-menu>
				<div class="button-wrapper help-button">
					<router-link to="/help">
						<div class="header-button">
							<v-icon>mdi-help-circle-outline</v-icon>
							<span class="help-label">{{ $t('main.help') }}</span>
						</div>
					</router-link>
				</div>
				<div class="button-wrapper">
					<router-link to="/login">
						<div class="header-button">
							<v-icon>mdi-power</v-icon>
							<span>{{ $t('main.connection') }}</span>
						</div>
					</router-link>
				</div>
				<div v-if="env.SIGN_UP" class="button-wrapper">
					<router-link to="/">
						<div class="signup-button header-button">
							<v-icon>mdi-account-plus</v-icon>
							<span>{{ $t('main.signup') }}</span>
						</div>
					</router-link>
				</div>
			</div>
			<div v-if="$store.state.farmer" class="header-farmer buttons">
				<!--
				<div class="button-wrapper">
					<div class="header-button" @click="LeekWars.setLocale($i18n.locale === 'fr' ? 'en' : 'fr')">
						{{ $i18n.locale }}
					</div>
				</div>
				-->
				<!-- <div class="button-wrapper">
					<div class="header-button" @click="LeekWars.darkMode = !LeekWars.darkMode">
						<v-icon>mdi-weather-night</v-icon>
					</div>
				</div> -->
				<!-- Encart LW+ (#3303) : le « + » 3D doré, qui ne tourne qu'au survol du
				     bouton, et le temps restant de l'abonnement en abrégé (« 15 j »,
				     « 3 mois », « 2 ans »). Mène à la page d'abonnement. Absent sans LW+. -->
				<div v-if="$store.state.farmer.lwplus && lwplusRemaining" class="button-wrapper">
					<router-link to="/lwplus" :class="{'header-active': $route.path.startsWith('/lwplus')}">
						<div class="header-button lwplus-button" @pointerenter="spinPlus">
							<lwplus-logo ref="lwplusLogo" variant="plus" alt="LW+" class="lwplus-icon" />
							<span class="text">{{ lwplusRemaining }}</span>
						</div>
					</router-link>
				</div>
				<div v-if="env.BANK && $store.state.farmer.verified && $store.state.farmer.bank_enabled" class="button-wrapper">
					<router-link to="/bank?ref=header" :class="{'header-active': $route.path.startsWith('/bank')}">
						<div v-if="$store.state.farmer" class="header-button">
							<span class="farmer-crystals text">{{ $filters.number(Math.round($store.state.farmer.animated_crystals)) }}</span>
							<span class="crystal text"></span>
							<span v-if="$store.state.farmer.animated_crystals < $store.state.farmer.crystals" class="crystal win"></span>
							<span v-else-if="$store.state.farmer.animated_crystals > $store.state.farmer.crystals" class="crystal lose"></span>
						</div>
					</router-link>
				</div>
				<div class="button-wrapper">
					<!-- `header-active` à la main : /market et /market/:item sont deux
					     records de route distincts, router-link-active ne suit donc pas
					     les sous-pages (idem banque et potager). -->
					<router-link to="/market" :class="{'header-active': $route.path.startsWith('/market')}">
						<div v-if="$store.state.farmer" class="header-button">
							<span class="farmer-habs text">{{ $filters.number(Math.round($store.state.farmer.animated_habs)) }}</span>
							<span class="hab text"></span>
							<span v-if="$store.state.farmer.animated_habs < $store.state.farmer.habs" class="hab win"></span>
							<span v-else-if="$store.state.farmer.animated_habs > $store.state.farmer.habs" class="hab lose"></span>
						</div>
					</router-link>
				</div>
				<div class="button-wrapper">
					<v-tooltip v-if="$store.state.farmer?.bought_fights || $store.state.farmer?.team_fights" bottom>
						<template #activator="{ props }">
							<router-link to="/garden" v-bind="props" :class="{'header-active': $route.path.startsWith('/garden')}">
								<div class="header-button fights-button">
									<span class="farmer-fights text">{{ $filters.number($store.state.farmer.fights) }}</span>
									<span v-if="$store.state.farmer?.team_fights" class="farmer-fights text">+ {{ $filters.number($store.state.farmer.team_fights) }}</span>
									<v-icon>mdi-sword-cross</v-icon>
								</div>
							</router-link>
						</template>
						{{ $t('main.free_fights') }} : {{ $filters.number(Math.max(0, $store.state.farmer.fights - $store.state.farmer.bought_fights)) }}<br>
						{{ $t('main.paid_fights') }} : {{ $filters.number(Math.min($store.state.farmer.fights, $store.state.farmer.bought_fights)) }}<template v-if="$store.state.farmer.team_fights"><br>
						{{ $t('main.team') }} : {{ $filters.number($store.state.farmer.team_fights) }}</template>
					</v-tooltip>
					<router-link v-else to="/garden" :class="{'header-active': $route.path.startsWith('/garden')}">
						<div class="header-button fights-button">
							<span v-if="$store.state.farmer" class="farmer-fights text">{{ $filters.number($store.state.farmer.fights) }}</span>
							<span v-if="$store.state.farmer?.team_fights" class="farmer-fights text">+ {{ $filters.number($store.state.farmer.team_fights) }}</span>
							<v-icon>mdi-sword-cross</v-icon>
						</div>
					</router-link>
				</div>
				<div class="button-wrapper">
					<v-menu v-if="env.SOCIAL" :nudge-bottom="3" :width="400" :max-height="400" bottom offset-y>
						<template #activator="{ props }">
							<div class="header-button messages-button" v-bind="props">
								<v-icon>mdi-email-outline</v-icon>
								<span v-show="$store.state.unreadMessages > 0" class="counter">{{ $store.state.unreadMessages }}</span>
							</div>
						</template>
						<div class="dialog">
							<div class="dialog-items">
								<router-link v-for="chat in $store.state.conversationsList" :key="chat.id" :to="'/messages/conversation/' + chat.id">
									<conversation :chat="chat" />
								</router-link>
							</div>
							<router-link to="/messages" class="see-all">{{ $t('main.all_private_messages') }}</router-link>
						</div>
					</v-menu>
				</div>
				<div class="button-wrapper">
					<v-menu :nudge-bottom="3" :width="400" :max-height="400" bottom offset-y @update:model-value="readNotifications">
						<template #activator="{ props }">
							<div class="header-button notifications-button" v-bind="props">
								<v-icon>mdi-bell-outline</v-icon>
								<span v-show="$store.state.unreadNotifications > 0" class="counter">{{ $store.state.unreadNotifications }}</span>
							</div>
						</template>
						<div class="dialog">
							<div class="dialog-items">
								<notification v-for="notification in $store.state.notifications" :key="notification.id" :notification="notification" />
							</div>
							<router-link to="/notifications" class="see-all">{{ $t('main.all_notifications') }}</router-link>
						</div>
					</v-menu>
				</div>
				<!-- La console flottait en icône libre par-dessus la page, en haut à
				     gauche : elle rejoint la barre, avec les autres outils. -->
				<div class="button-wrapper">
					<v-tooltip bottom>
						<template #activator="{ props }">
							<div class="console-button header-button" v-bind="props" @click="openConsole">
								<v-icon>mdi-console</v-icon>
							</div>
						</template>
						{{ $t('main.console') }}
					</v-tooltip>
				</div>
				<div class="button-wrapper">
					<router-link to="/settings">
						<div class="settings-button header-button">
							<!-- mdi-cog plein : le glyphe canonique des réglages (ICONS.md,
							     décidé le 2026-08-31), le contour est réservé aux états vides. -->
							<v-icon>mdi-cog</v-icon>
						</div>
					</router-link>
				</div>
				<div class="button-wrapper">
					<router-link to="/farmer">
						<div class="header-button">
							<span v-if="$store.state.farmer" class="farmer-name text">{{ $store.state.farmer.name }}</span>
							<avatar :farmer="$store.state.farmer" />
						</div>
					</router-link>
					<v-menu v-model="accountMenu" :width="300" :close-on-content-click="false" location="bottom end" scrim>
						<template #activator="{ props }">
							<div v-bind="props" class="header-button merge-left">
								<v-icon>mdi-chevron-down</v-icon>
							</div>
						</template>
						<account-switcher @close="accountMenu = false" />
					</v-menu>
				</div>
			</div>
		</div>
	</header>
</template>

<script lang="ts" setup>
	import { emitter } from '@/model/emitter'
	import { LeekWars } from '@/model/leekwars'
	import { store } from '@/model/store'
	import { seasonDisplay } from '@/model/season'
	import { i18n } from '@/model/i18n'
	import { computed, defineAsyncComponent, ref } from 'vue'
	import LwplusLogo from '@/component/lwplus/lwplus-logo.vue'

	defineOptions({ name: 'LwHeader' })

	// Temps restant de LW+ en une unité, arrondi vers le haut : jours sous un mois,
	// mois sous un an, années ensuite. Les libellés abrégés viennent de main.n_*.
	const lwplusLogo = ref<InstanceType<typeof LwplusLogo> | null>(null)

	// Souris seulement : sur un écran tactile, l'appui déclenche le survol et le
	// tour n'a pas lieu d'être (même règle que dans lwplus-logo.vue).
	function spinPlus(event: PointerEvent) {
		if (!event.pointerType || event.pointerType === 'mouse') { lwplusLogo.value?.spin() }
	}
	const lwplusRemaining = computed(() => {
		const until = store.state.farmer?.lwplus_until ?? 0
		const seconds = until - LeekWars.time
		if (seconds <= 0) { return '' }
		const days = Math.max(1, Math.ceil(seconds / 86400))
		if (days < 30) { return i18n.tc('main.n_day', days) }
		if (days < 365) { return i18n.tc('main.n_month', Math.max(1, Math.round(days / 30))) }
		return i18n.tc('main.n_year', Math.max(1, Math.round(days / 365)))
	})

	// Décoration saisonnière greffée sur le logo (#4383), seulement en saison active.
	const seasonDecoration = computed(() => {
		const s = store.state.farmer?.season
		return s && s.active ? seasonDisplay(s.key).decoration : null
	})

	const Conversation = defineAsyncComponent(() => import('@/component/messages/conversation.vue'))
	const AccountSwitcher = defineAsyncComponent(() => import('@/component/app/account-switcher.vue'))

	const accountMenu = ref(false)

	// La fenêtre de console est montée à la racine de l'application, hors de
	// portée de la barre : c'est elle qui écoute.
	function openConsole() {
		emitter.emit('open-console')
	}

	function readNotifications() {
		if (store.state.unreadNotifications) {
			LeekWars.post('notification/read-all')
			store.commit('read-notifications')
		}
	}
</script>

<style lang="scss" scoped>
	.logo {
		filter: var(--header-logo-filter);
		width: 100%;
		max-width: 320px;
		max-height: 45px;
		margin: 0px;
		margin-top: 15px;
		margin-bottom: 10px;
	}
	// v3 : mot-symbole plus petit, précédé du poireau. Le wrapper passe en flex
	// pour aligner l'icône, le logo et le badge d'environnement sur une même
	// ligne ; les marges d'origine calaient le logo dans une barre alignée en bas,
	// alors que celle du v3 centre son contenu.
	body:not(.v2):not(.xp) {
		.logo-wrapper {
			display: flex;
			align-items: center;
			gap: 10px;
		}
		.logo {
			width: auto;
			height: 32px;
			max-width: none;
			max-height: none;
			margin: 0;
		}
		// Le mot-symbole peint en couleur de texte : la boîte prend la largeur du
		// SVG par son ratio (175.283 × 23.778) et le masque, calé à gauche et
		// contenu, garde ses proportions si la boîte se resserre (mobile).
		.logo-mask {
			display: block;
			aspect-ratio: 175.283 / 23.778;
			background-color: var(--text-color);
			mask: url('/image/leekwars_flat.svg') left center / contain no-repeat;
			-webkit-mask: url('/image/leekwars_flat.svg') left center / contain no-repeat;
		}
		.logo-icon {
			height: 32px;
			width: auto;
			flex-shrink: 0;
		}
		// Les badges d'environnement sont calés pour la barre du v2, alignée en
		// bas (`line-height: 70px`) : dans un wrapper flex ils gonflent la ligne.
		.logo-wrapper :is(.dev-label, .beta-label, .local-label, .beta-local-label) {
			line-height: 1;
			margin-left: 0;
		}
		// La décoration saisonnière était posée à 287 px du bord, c'est-à-dire au
		// bout du logo d'avant. Elle s'accroche maintenant à son coin, quelle que
		// soit sa largeur.
		.logo-wrapper .season-decoration {
			top: -6px;
			left: auto;
			right: -18px;
			font-size: 26px;
		}
	}
	.avatar {
		height: 42px;
		width: 42px;
		margin-left: 8px;
		margin-right: 0;
	}
	.header {
		display: flex;
		justify-content: space-between;
		align-items: flex-end;
		height: 80px;
	}
	// L'épée du compteur de combats : plus petite que les icônes de la barre
	// (26 px), qui sont seules dans leur bouton — celle-ci accompagne un nombre.
	.header .fights-button .v-icon {
		font-size: 21px;
		opacity: 0.8;
	}
	.header-left {
		padding-right: 20px;
	}
	.logo-wrapper {
		white-space: nowrap;
		position: relative;
		.season-decoration {
			position: absolute;
			top: 7px;
			left: 287px;
			font-size: 36px;
			line-height: 1;
			transform: rotate(-3deg);
			pointer-events: none;
			filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.3));
		}
		.hat {
			position: absolute;
			top: -10px;
			left: 160px;
			height: 50px;
		}
	}
	.header .buttons {
		padding-bottom: 4px;
		display: flex;
	}
	.header .button-wrapper {
		flex-grow: 1;
		white-space: nowrap;
	}
	.header .header-signin {
		padding-bottom: 5px;
		text-align: right;
	}
	.header .header-button {
		display: inline-flex;
		cursor: pointer;
		text-align: center;
		padding: 0 4px;
		line-height: 42px;
		font-size: 17px;
		height: 42px;
		margin-left: 25px;
		color: var(--header-color);
		position: relative;
		background: var(--header-button-background);
		vertical-align: bottom;
		white-space: nowrap;
		user-select: none;
		align-items: center;
		line-height: 42px;
		i {
			color: var(--header-color);
			font-size: 26px;
		}
		&.merge-left {
			margin-left: 0;
			&:before {
				display: none;
			}
		}
	}
	.header-button i {
		vertical-align: text-bottom;
	}
	.header .button-wrapper:first-child .header-button {
		margin-left: 0;
	}
	.header-farmer .button-wrapper:first-child .header-button {
		padding-left: 10px;
	}
	.header-signin .button-wrapper:last-child .header-button {
		padding-right: 12px;
	}
	.header .header-button .text {
		line-height: 42px;
		height: 42px;
		display: inline-block;
		vertical-align: top;
		padding-right: 3px;
	}
	.header .header-button .crystal {
		vertical-align: bottom;
		margin-bottom: -13px;
	}
	// L'or en encre pour la marque, le temps restant dans la couleur du compteur.
	.header .lwplus-button {
		padding: 0 10px 0 6px;
		gap: 4px;
		// Le rendu a une marge de cadrage : 32 px d'image pour un signe d'environ 25 px.
		.lwplus-icon {
			width: 32px;
			height: 32px;
			margin: -3px;
		}
		.text {
			padding-right: 0;
		}
	}
	.signup-button {
		padding-right: 20px;
	}
	.header-button:not(.mobile):before {
		content: "";
		position: absolute;
		left: -20px;
		top: 0;
		width: 0;
		height: 0;
		border-style: solid;
		border-width: 0 0 42px 20px;
		border-color: transparent transparent var(--header-button-background) transparent;
	}
	.header-button:not(.mobile):after {
		content: "";
		position: absolute;
		z-index: -1;
		right: -20px;
		top: 0;
		width: 0;
		height: 0;
		border-style: solid;
		border-width: 42px 20px 0 0;
		border-color: var(--header-button-background) transparent transparent transparent;
	}
	.header .button-wrapper:last-child .header-button:after {
		border: none;
	}
	.header .header-button:hover {
		background: var(--header-button-background-hover);
	}
	.header .header-button:hover:before {
		border-color: transparent transparent var(--header-button-background-hover) transparent;
	}
	.header .header-button:hover:after {
		border-color: var(--header-button-background-hover) transparent transparent transparent;
	}
	.farmer-avatar {
		height: 42px;
		width: 42px;
		margin-left: 8px;
		margin-right: -4px;
	}
	.settings-button img, .notifications-button img, .messages-button img {
		height: 26px;
		width: 26px;
		margin: 8px 0;
		opacity: 0.8;
	}
	.messages-button,
	.notifications-button {
		position: relative;
	}
	.counter {
		position: absolute;
		top: -2px;
		right: -6px;
		background: var(--primary-surface);
		padding: 4px 5px;
		color: var(--primary-surface-text);
		border-radius: var(--radius);
		height: 20px;
		line-height: 12px;
	}
	.dialog {
		background: var(--background);
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
		border-radius: var(--radius);
	}
	.dialog-items {
		width: 400px;
		max-height: 350px;
		overflow-y: auto;
		overflow-x: hidden;
	}
	.see-all {
		padding: 8px;
		display: block;
		text-align: center;
		color: var(--text-color-secondary);
	}
	.see-all:hover {
		background: var(--pure-white);
	}

	@media screen and (min-width: 1600px) {
		#app.connected:not(.social-collapsed) .header-farmer .notifications-button,
		#app.connected:not(.social-collapsed) .header-farmer .messages-button {
			display: none;
		}
	}
	@media screen and (max-width: 1199px) {
		.header {
			height: auto;
			display: block;
		}
		.header .button-wrapper div {
			display: flex;
			justify-content: center;
			flex: 1;
		}
		.header .button-wrapper:first-child .header-button:before {
			display: none;
		}
	}
	@media screen and (max-width: 999px) {
		.header .header-button {
			padding: 0;
		}
		.header-left {
			padding: 0;
		}
	}
	@media screen and (max-width: 599px) {
		.help-label {
			display: none;
		}
		#app.connected .header {
			display: none;
		}
		#app:not(.connected) .header .logo-wrapper {
			padding-left: 20px;
			padding-right: 20px;
		}
	}
	.button-wrapper.language-button {
		flex-basis: 60px;
		flex-grow: 0;
		.flag {
			max-width: 30px;
			max-height: 30px;
		}
	}
	.language .flag {
		width: 26px;
		margin-right: 8px;
	}
	.beta {
		background: var(--white);
		color: var(--grey-2);
		padding: 2px 4px;
		border: 1px solid var(--grey-9);
		border-radius: var(--radius);
		font-size: 12px;
		margin-left: 8px;
	}
	.win {
		position: absolute;
		animation: win 0.15s infinite;
		margin-top: 0;
		right: 4px;
	}
	@keyframes win {
		0% { margin-top: -120px; }
		100% { margin-top: 0; }
	}
	.lose {
		position: absolute;
		animation: lose 0.25s infinite;
		margin-top: 0;
		right: 4px;
	}
	@keyframes lose {
		0% { margin-top: 0; opacity: 1; }
		100% { margin-top: 100px; opacity: 0; }
	}
</style>
