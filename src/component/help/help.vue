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
		<div class="container grid large">
			<panel v-ripple class="first">
				<router-link slot="content" to="/help/general">
					<h2>Leek Wars</h2>
					<img src="/image/help/help_general.png">
					<br>
					<span class="description">{{ $t('general_help') }}</span>
				</router-link>
			</panel>

			<panel v-ripple>
				<router-link slot="content" to="/help/tutorial">
					<h2>{{ $t('tutorial') }}</h2>
					<img src="/image/help/interface.png">
					<br>
					<span class="description" v-html="$t('tutorial_desc')"></span>
				</router-link>
			</panel>

			<panel v-ripple>
				<router-link slot="content" to="/help/documentation">
					<h2>{{ $t('documentation') }}</h2>
					<img src="/image/help/presentation.png">
					<br>
					<span class="description" v-html="$t('documentation_desc')"></span>
				</router-link>
			</panel>

			<panel v-ripple>
				<router-link slot="content" to="/encyclopedia">
					<h2>Encyclopédie</h2>
					<v-icon class="bigicon">mdi-book-open-page-variant</v-icon>
					<br>
					<span class="description">Encyclopédie de Leek Wars</span>
				</router-link>
			</panel>

		</div>
		<center>
			<div class="advanced-button" @click="advanced = !advanced">
				<span>Avancé</span>
				<v-icon v-if="advanced">mdi-chevron-up</v-icon>
				<v-icon v-else>mdi-chevron-down</v-icon>
			</div>
		</center>

		<div v-if="advanced" class="container grid large advanced">

			<panel v-ripple>
				<a slot="content" href="http://leekwarswiki.net/" target="_blank" rel="noopener">
					<h2>{{ $t('wiki') }} <v-icon>mdi-open-in-new</v-icon></h2>
					<img src="/image/help/wiki.png">
					<br>
					<span class="description">{{ $t('wiki_desc') }}</span>
				</a>
			</panel>

			<panel v-ripple>
				<router-link slot="content" to="/help/api">
					<h2>API documentation</h2>
					<v-icon class="bigicon">mdi-api</v-icon>
					<br>
					<span class="description">Complete API services documentation</span>
				</router-link>
			</panel>

			<panel v-ripple class="last">
				<router-link slot="content" to="/help/line-of-sight">
					<h2>Line Of Sight</h2>
					<v-icon class="bigicon">mdi-grid</v-icon>
					<br>
					<span class="description">Little demo for line of sight function</span>
				</router-link>
			</panel>

			<panel v-ripple>
				<router-link slot="content" to="/help/advanced-fight-description">
					<h2>Fight Description</h2>
					<v-icon class="bigicon">mdi-sword-cross</v-icon>
					<br>
					<span class="description">Advanced description of combat rules and order.</span>
				</router-link>
			</panel>

			<panel v-ripple>
				<router-link slot="content" to="/help/items">
					<h2>Items</h2>
					<v-icon class="bigicon">mdi-chip</v-icon>
					<br>
					<span class="description">Items</span>
				</router-link>
			</panel>

			<panel v-ripple>
				<router-link slot="content" to="/talent">
					<h2>Talents</h2>
					<v-icon class="bigicon">mdi-chart-line</v-icon>
					<br>
					<span class="description">Talents</span>
				</router-link>
			</panel>

		</div>
		<didactitiel v-if="didactitiel_enabled" v-model="didactitiel" />
	</div>
</template>

<script lang="ts">
	import { locale } from '@/locale'
	import { mixins } from '@/model/i18n'
	import { LeekWars } from '@/model/leekwars'
	import { Component, Vue } from 'vue-property-decorator'
	const Didactitiel = () => import(/* webpackChunkName: "[request]" */ `@/component/didactitiel/didactitiel.${locale}.i18n`)

	@Component({ name: 'help', i18n: {}, mixins, components: { Didactitiel } })
	export default class Help extends Vue {
		advanced: boolean = false
		didactitiel: boolean = false
		didactitiel_enabled: boolean = false

		created() {
			LeekWars.setTitle(this.$t('title'))
			LeekWars.setActions([{icon: 'mdi-information-variant', click: () => this.$router.push('/about')}])
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
		a {
			padding: 15px;
		}
		h2 {
			color: #444;
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
		font-size: 74px;
		color: #228b22;
		margin: 10px;
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