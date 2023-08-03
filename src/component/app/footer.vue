<template lang="html">
	<footer class="footer">
		<div class="column">
			<h4 class="version">Leek Wars {{ LeekWars.smart_version }}</h4>
			<a class="item" target="_blank" rel="noopener" href="https://leek-wars.myspreadshop.fr/">
				{{ $t('main.shop') }} <v-icon>mdi-open-in-new</v-icon>
			</a>
			<router-link to="/groups" class="item">{{ $t('main.private_groups') }}</router-link>
			<router-link to="/statistics" class="item">{{ $t('main.statistics') }}</router-link>
			<router-link to="/app" class="item">{{ $t('main.app') }}</router-link>
			<router-link to="/dev-blog" class="item">{{ $t('main.dev-blog') }}</router-link>
			<router-link to="/bank" class="item">
				{{ $t('main.donation') }} <v-icon>mdi-currency-eur</v-icon>
			</router-link>
		</div>
		<div class="column">
			<h4>{{ $t('main.resources_help') }}</h4>
			<router-link to="/changelog" class="item">{{ $t('main.changelog') }}</router-link>
			<router-link to="/help" class="item">{{ $t('main.help') }}</router-link>
			<router-link :to="'/encyclopedia/' + $i18n.locale + '/' + $t('main.game_rules').replace(/ /g, '_')" class="item">{{ $t('main.game_rules') }}</router-link>
			<router-link :to="'/encyclopedia/' + $i18n.locale + '/' + $t('main.tutorial').replace(/ /g, '_')" class="item">{{ $t('main.tutorial') }}</router-link>
			<router-link to="/help/documentation" class="item">{{ $t('main.documentation') }}</router-link>
			<a class="item" @click="LeekWars.show_didactitiel()">{{ $t('main.didactitial') }} <v-icon>mdi-dock-window</v-icon></a>
		</div>
		<!-- <div class="column">
			<h4>{{ $t('main.developers') }}</h4>
			<router-link to="/changelog" class="item">{{ $t('main.changelog') }}</router-link>
			<a href="https://github.com/leek-wars/leek-wars" target="_blank" rel="noopener" class="item">
				GitHub <v-icon>mdi-open-in-new</v-icon>
			</a>
			<a href="https://github.com/leek-wars/leek-wars/issues" target="_blank" rel="noopener" class="item">
				Tickets <v-icon>mdi-open-in-new</v-icon>
			</a>
			<a href="https://github.com/leek-wars/leek-wars/pulls" target="_blank" rel="noopener" class="item">
				Pull requests <v-icon>mdi-open-in-new</v-icon>
			</a>
			<a href="https://leekscript.com" target="_blank" rel="noopener" class="item">
				LeekScript <v-icon>mdi-open-in-new</v-icon>
			</a>
		</div> -->
		<div class="column">
			<h4>{{ $t('main.partners') }}</h4>
			<a target="_blank" rel="noopener" href="https://www.esiea.fr/">
				<img class="color partner" src="/image/partner/esiea.png" title="ESIEA">
			</a>
			<router-link to="/contact" class="item">{{ $t('main.contact') }}</router-link>
			<router-link to="/press-kit" class="item">{{ $t('main.press-kit') }} <v-icon>mdi-package-variant-closed</v-icon></router-link>
			<router-link to="/help/api" class="item">API</router-link>
			<h4>Social</h4>
			<div class="icons">
				<!-- <a class="item" target="_blank" rel="noopener" href="https://github.com/leek-wars/leek-wars">
					<v-icon>mdi-github</v-icon>
				</a> -->
				<a target="_blank" rel="noopener" href="https://twitter.com/LeekWars">
					<v-icon>mdi-twitter</v-icon>
				</a>
				<a target="_blank" rel="noopener" href="https://www.facebook.com/LeekWars">
					<v-icon>mdi-facebook</v-icon>
				</a>
				<a target="_blank" rel="noopener" href="https://www.instagram.com/leekwars/">
					<v-icon>mdi-instagram</v-icon>
				</a>
				<a target="_blank" rel="noopener" href="https://www.linkedin.com/company/leek-wars">
					<v-icon>mdi-linkedin</v-icon>
				</a>
				<a target="_blank" rel="noopener" href="mailto:contact@leekwars.com">
					<v-icon>mdi-email-outline</v-icon>
				</a>
			</div>
		</div>
		<div class="column">
			<h4>{{ $t('main.legal') }}</h4>
			<router-link to="/about" class="item">{{ $t('main.about') }}</router-link>
			<router-link to="/legal" class="item">{{ $t('main.legal') }}</router-link>
			<router-link to="/conditions" class="item">{{ $t('main.conditions') }}</router-link>
			<span class="item">
				<span class="color cookie-button" @click="throwCookies">🍪</span> {{ $t('main.no_cookies') }}
			</span>
			<span class="item"><span class="color">🇫🇷</span> {{ $t('main.made_in_france') }}</span>
			<span class="item">Copyright © 2013 - 3012</span>
		</div>

		<img class="leek" src="/image/big_leek_1_white.webp" loading="lazy">
		<div class="cookies">
			<div v-for="(cookie, c) in cookies" :key="c" class="cookie" :style="{left: cookie[0] + 'px', top: cookie[1] + 'px', 'font-size': cookie[2] + 'px', 'transform': 'rotate(' + cookie[3] + 'deg)'}">🍪</div>
		</div>
	</footer>
</template>

<script lang="ts">
	import { locale } from '@/locale'
	import { LeekWars } from '@/model/leekwars'
	import { Component, Vue } from 'vue-property-decorator'
	const Didactitiel = () => import(/* webpackChunkName: "[request]" */ `@/component/didactitiel/didactitiel.${locale}.i18n`)

	@Component({ name: 'lw-footer', components: { Didactitiel } })
	export default class Footer extends Vue {

		didactitiel: boolean = false
		didactitiel_enabled: boolean = false
		didactitiel_new_enabled: boolean = false
		cookies: any[] = []

		created() {
			// this.throwCookies()
			// LeekWars.didactitial = true
		}

		throwCookies() {
			for (let i = 0; i < 10; ++i) {
				this.cookies.push([-50 + Math.random() * (window.innerWidth + 100), -100 - Math.random() * 100, 20 + Math.random() * 60, Math.random() * 360])
			}
			setTimeout(() => document.querySelectorAll(".cookies .cookie").forEach(e => e.classList.add("fall")), 100)
		}
	}
</script>

<style lang="scss" scoped>
	#app.app .footer {
		display: none;
	}
	.footer {
		padding-left: 45px;
		padding-right: 20px;
		padding-top: 20px;
		padding-bottom: 20px;
		position: relative;
		display: flex;
		color: #666;
		a, h4, .item, .v-icon {
			color: #666;
			transition: color 0.15s ease;
			.v-icon {
				font-size: 16px;
				// transition: none;
				vertical-align: top;
			}
		}
		h4.version {
			color: #999;
		}
		a {
			font-weight: 500;
			cursor: pointer;
		}
		h4 {
			font-weight: normal;
		}
		.color {
			opacity: 0.25;
			transition: opacity 0.15s ease;
		}
	}
	.column {
		flex: 1;
		display: flex;
		flex-direction: column;
		padding: 10px 8px;
		h4 {
			margin-bottom: 10px;
			font-size: 15px;
			&:not(:first-child) {
				margin-top: 4px;
			}
		}
		.item {
			padding: 8px 0;
			font-size: 14px;
		}
	}
	.footer:hover {
		.color {
			opacity: 1;
		}
		h4 {
			color: #999;
		}
		.item, .v-icon {
			color: #ccc;
		}
		a {
			color: #ccc;
			&:hover {
				color: #5fad1b;
			}
		}
	}
	.copy {
		font-size: 12px;
	}
	.leek {
		position: absolute;
		bottom: 0;
		left: calc(50% - 115px);
		z-index: -1;
		opacity: 0.07;
		height: 230px;
		width: 250px;
		object-fit: cover;
		object-position: top;
	}
	.cookie-button {
		cursor: pointer;
		user-select: none;
	}
	.cookie {
		position: fixed;
		margin-top: 0;
		font-size: 50px;
		z-index: 100;
		transition: margin-top ease-in-out 0.7s;
		pointer-events: none;
		&.fall {
			margin-top: 105vh;
		}
	}
	.partner {
		height: 32px;
		margin-bottom: 4px;
	}
	.icons {
		display: flex;
		gap: 10px;
		a .v-icon {
			font-size: 20px;
		}
	}
</style>