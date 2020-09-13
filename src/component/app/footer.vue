<template lang="html">
	<div class="footer">
		<div class="column">
			<h4 class="version">Leek Wars {{ LeekWars.smart_version }}</h4>
			<router-link to="/about" class="item">{{ $t('main.about') }}</router-link>
			<router-link to="/statistics" class="item">{{ $t('main.statistics') }}</router-link>
			<router-link to="/ranking/fun" class="item">Classements fun</router-link>
			<router-link to="/app" class="item">{{ $t('main.app') }}</router-link>
			<router-link to="/bank" class="item">
				Faire un don <v-icon>mdi-currency-eur</v-icon>
			</router-link>
		</div>
		<div class="column">
			<h4>Ressources et aide</h4>
			<router-link to="/help/general" class="item">Découverte</router-link>
			<router-link to="/help/tutorial" class="item">Tutoriel</router-link>
			<router-link to="/help/documentation" class="item">Documentation</router-link>
			<a class="item" @click="show_didactitiel">Didactitiel <v-icon>mdi-dock-window</v-icon></a>
			<a href="https://leekwarswiki.net" target="_blank" rel="noopener" class="item">Wiki <v-icon>mdi-open-in-new</v-icon></a>
		</div>
		<div class="column">
			<h4>Développeurs</h4>
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
		</div>
		<div class="column">
			<h4>Social</h4>
			<a class="item" target="_blank" rel="noopener" href="https://twitter.com/LeekWars">
				<v-icon>mdi-twitter</v-icon> Twitter
			</a>
			<a class="item" target="_blank" rel="noopener" href="https://www.facebook.com/LeekWars">
				<v-icon>mdi-facebook</v-icon> Facebook
			</a>
			<a class="item" target="_blank" rel="noopener" href="https://www.instagram.com/leekwars/">
				<v-icon>mdi-instagram</v-icon> Instagram
			</a>
			<a class="item" target="_blank" rel="noopener" href="https://www.linkedin.com/company/43355938">
				<v-icon>mdi-linkedin</v-icon> LinkedIn
			</a>
			<a class="item" target="_blank" rel="noopener" href="mailto:contact@leekwars.com">
				<v-icon>mdi-email-outline</v-icon> E-mail
			</a>
		</div>
		<div class="column">
			<h4>Légal</h4>
			<router-link to="/legal" class="item">{{ $t('main.legal') }}</router-link>
			<router-link to="/conditions" class="item">{{ $t('main.conditions') }}</router-link>
			<span class="item">
				<span class="color cookie-button" @click="throwCookies">🍪</span> Pas de cookies tiers
			</span>
			<span class="item"><span class="color">🇫🇷</span> Fait en France</span>
			<span class="item">Copyright © 2013 - 3012</span>
		</div>
		<!--
		<table><tr>
			<td width="50%">
				<router-link to="/"><h4>Leek Wars {{ LeekWars.version }}</h4></router-link>
				<br>
				<div class="social">

					<a target="_blank" rel="noopener" href="https://www.facebook.com/LeekWars" title="Facebook">
						<img src="/image/footer/facebook.png">
					</a>
					<a target="_blank" rel="noopener" href="https://twitter.com/LeekWars">
						<img src="/image/footer/twitter.png" title="Twitter">
					</a>
					<a target="_blank" rel="noopener" href="https://github.com/leek-wars" title="GitHub">
						<img src="/image/footer/github.png">
					</a>
				</div>
			</td>
			<td><img src="/image/footer_leek.png"></td>
			<td width="50%" align="right">
				<router-link to="/legal">{{ $t('main.legal') }}</router-link> -
				<router-link to="/conditions">{{ $t('main.conditions') }}</router-link><br>
				<span class="copy">Copyright © 2013 - 3012</span>
			</td>
		</tr></table>
		-->
		<img class="leek" src="/image/big_leek_1_white.png">
		<didactitiel v-if="didactitiel_enabled" v-model="didactitiel" />
		<div class="cookies">
			<div v-for="(cookie, c) in cookies" :key="c" class="cookie" :style="{left: cookie[0] + 'px', top: cookie[1] + 'px', 'font-size': cookie[2] + 'px', 'transform': 'rotate(' + cookie[3] + 'deg)'}">🍪</div>
		</div>
	</div>
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
		cookies: any[] = []

		created() {
			// this.throwCookies()
		}

		show_didactitiel() {
			this.didactitiel_enabled = true
			Vue.nextTick(() => {
				this.didactitiel = true
			})
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
		a, h4, .item {
			color: #666;
			transition: color 0.15s ease;
			.v-icon {
				font-size: 16px;
				transition: none;
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
			opacity: 0.2;
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
		.item {
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
	.social {
		font-size: 12px;
		margin-top: 8px;
	}
	.social img {
		opacity: 0.3;
		width: 32px;
		margin-right: 7px;
		filter: grayscale(100%);
	}
	.social img:hover {
		opacity: 1;
		filter: none;
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
</style>