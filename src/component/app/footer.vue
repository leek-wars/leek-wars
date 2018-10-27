<template lang="html">
	<div class="footer-wrapper">
		<div class="footer">
			<table><tr>
				<td width="50%">
					<router-link to="/"><h4>Leek Wars {{ LeekWars.version }}</h4></router-link>
					<br>
					<router-link to="/about">{{ $t('main.about') }}</router-link> - <router-link to="/statistics">{{ $t('main.statistics') }}</router-link> - <router-link to="/changelog">{{ $t('main.changelog') }}</router-link> - <router-link to="/app">{{ $t('main.app') }}</router-link>
					<div class="social">

						<a target="_blank" href="https://www.facebook.com/LeekWars" title="Facebook">
							<img src="/image/footer/facebook.png">
						</a>
						<a target="_blank" href="https://twitter.com/LeekWars">
							<img src="/image/footer/twitter.png" title="Twitter">
						</a>
						<a target="_blank" href="https://plus.google.com/100933820796987863661" rel="publisher" title="Google+">
							<img src="/image/footer/googleplus.png">
						</a>
						<a target="_blank" href="https://github.com/leek-wars" title="GitHub">
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
		</div>
	</div>
</template>

<script lang="ts">
	import { Component, Vue } from 'vue-property-decorator'
	@Component({ name: 'lw-footer' })
	export default class Footer extends Vue {}
</script>

<style lang="scss" scoped>
	.footer-wrapper {
		background: rgba(0,0,0,0.4);
		border-top: 2px solid #333;
		height: 150px;
	}
	#app.app .footer-wrapper {
		display: none;
	}
	.footer-wrapper.connected {
		padding-left: 170px;
	}
	.footer {
		padding: 0 20px;
	}
	#app.menu-collapsed:not(.app) .footer {
		margin-left: 68px;
	}
	#app.connected .footer {
		margin-left: 170px;
	}
	table {
		border-collapse: collapse;
		max-width: 1100px;
		margin: 0 auto;
		color: #666;
	}
	.footer a {
		color: #888;
	}
	.footer a:hover {
		color: #aaa;
	}
	h3 {
		font-size: 20px;
		color: #999;
		display: inline-block;
		margin-bottom: 6px;
	}
	h3:hover {
		color: #ccc;
	}
	td {
		padding: 15px;
	}
	img {
		vertical-align: bottom;
		opacity: 0.3;
	}
	h4 {
		margin-bottom: 6px;
		display: inline-block;
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
	@media screen and (min-width: 1600px) {
		#app.connected:not(.social-collapsed):not(.app) .footer {
			margin-right: 400px;
		}
		#app.connected.social-collapsed .footer {
			margin-right: 30px;
		}
	}
	@media screen and (max-width: 599px) {
		#app.connected .footer {
			margin-left: 0;
		}
		.footer {
			padding: 0;
		}
	}
</style>