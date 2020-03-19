<template lang="html">
	<div>
		<div class="page-bar page-header">
			<h1>{{ $t('title') }}</h1>
			<div class="tabs">
				<div class="tab" @click="show_didactitiel">
					<v-icon>mdi-play</v-icon> {{ $t('rewatch_didactitiel') }}
				</div>
			</div>
		</div>
		<div class="flex-container">
			<div class="column6">
				<panel v-ripple class="first">
					<router-link to="/help/general">
						<div>
							<h2>Leek Wars</h2>
							<img src="/image/help/help_general.png">
							<br>
							<span class="description">{{ $t('general_help') }}</span>
						</div>
					</router-link>
				</panel>
			</div>
			<div class="column6">
				<panel v-ripple>
					<router-link to="/help/tutorial">
						<div>
							<h2>{{ $t('tutorial') }}</h2>
							<img src="/image/help/interface.png">
							<br>
							<span class="description" v-html="$t('tutorial_desc')"></span>
						</div>
					</router-link>
				</panel>
			</div>
		</div>
		<div class="flex-container">
			<div class="column6">
				<panel v-ripple>
					<router-link to="/help/documentation">
						<div>
							<h2>{{ $t('documentation') }}</h2>
							<img src="/image/help/presentation.png">
							<br>
							<span class="description" v-html="$t('documentation_desc')"></span>
						</div>
					</router-link>
				</panel>
			</div>
			<div class="column6">
				<panel v-ripple>
					<a href="http://leekwarswiki.net/" target="_blank" rel="noopener">
						<div>
							<h2>{{ $t('wiki') }} <i class="material-icons">launch</i></h2>
							<img src="/image/help/wiki.png">
						</div>
						<span class="description">{{ $t('wiki_desc') }}</span>
					</a>
					<!--
					<router-link to="/encyclopedia/Guide_du_débutant">
						<div v-ripple class="card">
							<h2>{{ $t('wiki') }} <span class="label-beta">bêta <i class="material-icons">info</i></span></h2>
							<img src="/image/help/wiki.png">
						</div>
					</router-link>
					-->
				</panel>
			</div>
		</div>
		<center>
			<div class="advanced-button" @click="advanced = !advanced">
				<span>Avancé</span>
				<i v-if="advanced" class="material-icons">expand_less</i>
				<i v-else class="material-icons">expand_more</i>
			</div>
		</center>
		<div v-if="advanced" class="flex-container advanced">
			<div class="column6">
				<panel title="Leek Wars API">
					<router-link to="/help/api">
						<h2>API documentation</h2>
						<img src="/image/help/advanced.png">
						<br>
						<span class="description">Complete API services documentation</span>
					</router-link>
				</panel>
			</div>
			<div class="column6">
				<panel title="Line Of Sight" class="last">
					<router-link to="/help/line-of-sight">
						<h2>Line Of Sight</h2>
						<i class="bigicon material-icons">grid_on</i>
						<br>
						<span class="description">Little demo for line of sight function</span>
					</router-link>
				</panel>
			</div>
		</div>
		<didactitiel v-if="didactitiel_enabled" v-model="didactitiel" />
	</div>
</template>

<script lang="ts">
	import { locale } from '@/locale'
	import { LeekWars } from '@/model/leekwars'
	import { Component, Vue } from 'vue-property-decorator'
	const Didactitiel = () => import(/* webpackChunkName: "[request]" */ `@/component/didactitiel/didactitiel.${locale}.i18n`)
	
	@Component({ name: 'help', i18n: {}, components: { Didactitiel } })
	export default class Help extends Vue {
		advanced: boolean = false
		didactitiel: boolean = false
		didactitiel_enabled: boolean = false

		created() {
			LeekWars.setTitle(this.$t('help.title'))
			LeekWars.setActions([{icon: 'contact_support', click: () => this.$router.push('/about')}])
		}

		show_didactitiel() {
			this.didactitiel_enabled = true
			Vue.nextTick(() => {
				this.didactitiel = true
			})
		}
	}
</script>

<style lang="scss" scoped>
	.panel {
		text-align: center;
		.content {
			height: 100%;
		}
	}
	.description {
		font-size: 15px;
		color: #555;
	}
	img {
		width: 90px;
	}
	i.bigicon {
		font-size: 55px;
		color: #228b22;
		margin: 5px;
	}
	h2 i {
		vertical-align: bottom;
		padding-bottom: 2px;
	}
	.advanced-button {
		color: white;
		background: rgba(150, 150, 150, 0.2);
		padding: 2px 12px;
		display: inline-flex;
		margin: 15px;
		line-height: 26px;
		cursor: pointer;
		img {
			width: 16px;
			margin-left: 6px;
		}
	}
	.card {
		display: inline-block;
		padding: 5px;
		padding-bottom: 0;
		margin: 0 10px;
		margin-bottom: 10px;
		width: 150px;
	}
	.label-beta {
		margin-bottom: 2px;
		vertical-align: middle;
	}
</style>