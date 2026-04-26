<template lang="html">
	<div class="page">
		<div class="page-header page-bar">
			<h1>{{ $t('main.press-kit') }}</h1>
			<div class="tabs">
				<router-link to="/changelog">
					<div class="tab">
						<v-icon>mdi-format-list-bulleted-square</v-icon>
						<span>{{ $t('main.changelog') }}</span>
					</div>
				</router-link>
				<router-link to="/statistics">
					<div class="tab">
						<v-icon>mdi-chart-timeline-variant</v-icon>
						<span>{{ $t('main.stats') }}</span>
					</div>
				</router-link>
				<a href="https://github.com/leek-wars/leek-wars" target="_blank" rel="noopener">
					<div class="tab action">
						<img src="/image/github_white.png">
						<span>GitHub <v-icon>mdi-open-in-new</v-icon></span>
					</div>
				</a>
			</div>
		</div>

		<panel class="first">
			<div class="center">

				<div class="icon">📦</div>

				<div>
					<v-menu offset-y>
						<template #activator="{ props }">
							<div v-bind="props" v-ripple class="language-button">
								<flag :code="language.country" />
								{{ language.name }}
								<v-icon>mdi-chevron-down</v-icon>
							</div>
						</template>
						<v-list :dense="true">
							<v-list-item v-for="(language, i) in LeekWars.languages" :key="i" class="language" @click="setLanguage(language)">
								<flag :code="language.country" />
								<span class="name">{{ language.name }}</span>
							</v-list-item>
						</v-list>
					</v-menu>
				</div>

				<a href="/leek-wars-press-kit.zip">
					<v-btn><v-icon>mdi-download</v-icon> {{ $t('download') }} (50,0Mo)</v-btn>
				</a>
			</div>
		</panel>

		<panel v-for="(category, c) in items" :key="c" :title="$t(category.name)" :icon="category.icon">
			<div class="grid">
				<div v-for="(item, i) in category.items" :key="i" class="item">
					<iframe v-if="item.type === 'video'" width="500" height="315" :src="'https://www.youtube.com/embed/' + item.name" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
					<object class="card" v-else-if="item.type === 'text'" :data="'/press-kit/' + (item.localized ? language.code + '/' : '') + item.name + '.' + item.formats[0]" color-scheme="dark"></object>
					<a v-else :href="'/press-kit/' + (item.localized ? language.code + '/' : '') + item.name + '.' + item.formats[0]" target="_blank">
						<img :src="'/press-kit/' + (item.localized ? language.code + '/' : '') + item.name + '.' + item.formats[0]" :class="{alpha: item.alpha}">
					</a>
					<div class="legend">{{ item.legends ? item.legends[language.code] : item.legend }} <a v-for="format of item.formats" :key="format" :href="'/press-kit/' + (item.localized ? language.code + '/' : '') + item.name + '.' + format" target="_blank" class="format">{{ format }}</a></div>
				</div>
			</div>
		</panel>

		<panel :title="$t('links')" icon="mdi-link">
			<ul>
				<li><router-link to="/about" class="green">{{ $t('main.about') }}</router-link></li>
				<li><router-link to="/statistics" class="green">{{ $t('main.statistics') }}</router-link></li>
				<li><router-link to="/changelog" class="green">{{ $t('main.changelog') }}</router-link></li>
				<li><router-link to="/ranking/fun" class="green">{{ $t('main.fun_ranking') }}</router-link></li>
				<li><router-link to="/conditions" class="green">{{ $t('main.conditions') }}</router-link></li>
				<li><router-link to="/legal" class="green">{{ $t('main.legal') }}</router-link></li>
				<li><router-link to="/app" class="green">{{ $t('main.app') }}</router-link></li>
				<li><a class="green" target="_blank" href="https://openclassrooms.com/forum/sujet/jeu-html5-php-leek-wars-programmation-d-ia">{{ $t('original_topic') }}</a></li>
			</ul>
		</panel>
	</div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { mixins } from '@/model/i18n'
import RichTooltipFarmer from '@/component/rich-tooltip/rich-tooltip-farmer.vue'
import { type Language, LeekWars } from '@/model/leekwars'

defineOptions({ name: 'press-kit', i18n: {}, mixins: [...mixins] })

const { locale } = useI18n()

const language = ref<any>(null)
const items: any[] = [
			{ name: 'logos', icon: 'mdi-image', items: [
				{ name: 'leekwars_logo_dark', formats: ['svg', 'png'], alpha: true, legends: {
					fr: 'Logo Leek Wars sombre',
					en: 'Dark Leek Wars logo'
				}},
				{ name: 'leekwars_logo', formats: ['svg', 'png'], alpha: true, legends: {
					fr: 'Logo Leek Wars',
					en: 'Leek Wars logo'
				}},
				{ name: 'leekwars_logo_with_icon_dark', legend: 'Logo Leek Wars sombre avec icône', formats: ['svg', 'png'], alpha: true },
				{ name: 'leekwars_logo_with_icon', legend: 'Logo Leek Wars avec icône', formats: ['svg', 'png'], alpha: true },
				{ name: 'icon', legend: 'Icône Leek Wars', formats: ['svg', 'png'], alpha: true },
				{ name: 'icon_round', legend: 'Icône Leek Wars rond', formats: ['png'], alpha: true },
				{ name: 'leek_1_front', legend: 'Poireau 1', formats: ['svg', 'png'], alpha: true },
				{ name: 'leek_5_front_angry', legend: 'Poireau 80', formats: ['svg', 'png'], alpha: true },
				{ name: 'leek_11_front_angry', legend: 'Poireau 301', formats: ['svg', 'png'], alpha: true },
			]},
			{ name: 'presentations', icon: 'mdi-text', items: [
				{ name: 'general_presentation', type: 'text', localized: true, formats: ['txt'], legends: {
					fr: "Présentation générale",
					en: "General presentation"
				}},
				{ name: 'code', type: 'text', localized: true, formats: ['txt'], legends: {
					fr: "Programmation des IA",
					en: "IA programming"
				}},
				{ name: 'characteristics_and_equipment', type: 'text', localized: true, formats: ['txt'], legends: {
					fr: "Caractéritiques et équipement",
					en: "Characteristics and equipment"
				}},
				{ name: 'tournaments_ranking_trophies', type: 'text', localized: true, formats: ['txt'], legends: {
					fr: "Tournois, trophées et classements",
					en: "Tournaments, trophies and rankings"
				}},
				{ name: 'customization', type: 'text', localized: true, formats: ['txt'], legends: {
					fr: "Personnalisation",
					en: "Customization"
				}},
				{ name: 'community', type: 'text', localized: true, formats: ['txt'], legends: {
					fr: "Communauté",
					en: "Community"
				}},
			]},
			{ name: 'banners', icon: 'mdi-image', items: [
				{ name: 'banner_factory', formats: ['png'], legends: {
					fr: "Bannière combat",
					en: "Banner fight",
				}},
				{ name: 'banner_code', formats: ['png'], legends: {
					fr: "Bannière code",
					en: "Banner code",
				}},
			]},
			{ name: 'screenshots', icon: 'mdi-image', items: [
				{ name: 'leek_page', formats: ['png'], localized: true, legends: {
					fr: "Page d'un poireau",
					en: "Page of a leek",
				}},
				{ name: 'team_fight_factory', formats: ['png'], localized: true, legends: {
					fr: "Combat d'équipe sur la carte Usine",
					en: "Team fight on the Factory map",
				}},
				{ name: 'editor_page', formats: ['png'], localized: true, legends: {
					fr: "Page éditeur pour modifier son IA",
					en: "Editor page to edit its AI",
				}},
				{ name: 'fight_battle_royale_glacier', formats: ['png'], localized: true, legends: {
					fr: "Combat en Battle Royale sur la carte Glacier",
					en: "Battle Royale fight on the Glacier map"
				}},
				{ name: 'garden_page', formats: ['png'], localized: true, legends: {
					fr: "Page potager pour lancer ses combats",
					en: "Garden page to start its fights",
				}},
				{ name: 'market_page', formats: ['png'], localized: true, legends: {
					fr: "Page marché",
					en: "Market page",
				}},
				{ name: 'documentation_page', formats: ['png'], localized: true, legends: {
					fr: "Documentation des fonctions LeekScript",
					en: "Documentation of LeekScript functions",
				}},
				{ name: 'farmer_fight_forest', formats: ['png'], localized: true, legends: {
					fr: "Combat d'éleveur sur la carte Forêt",
					en: "Farmer fight on the Forest map",
				}},
				{ name: 'ranking_page', formats: ['png'], localized: true, legends: {
					fr: "Page classement",
					en: "Ranking page",
				}},
				{ name: 'solo_fight_beach', formats: ['png'], localized: true, legends: {
					fr: "Combat solo sur la carte Plage",
					en: "Solo fight on the Beach map"
				}},
				{ name: 'trophies_page', formats: ['png'], localized: true, legends: {
					fr: "Page des trophées",
					en: "Trophies page",
				}},
				{ name: 'desert_farmer_fight', formats: ['png'], localized: true, legends: {
					fr: "Combat d'éleveur sur la carte Désert",
					en: "Farmer fight on the Desert map"
				}},
				{ name: 'solo_tournament_page', formats: ['png'], localized: true, legends: {
					fr: "Tournoi solo",
					en: "Solo tournament",
				}},
				{ name: 'farmer_tournament_fight_temple', formats: ['png'], localized: true, legends: {
					fr: "Combat de tournoi d'éleveur sur la carte Temple",
					en: "Farmer's tournament fight on the Temple map",
				}},
				{ name: 'fight_report_page', formats: ['png'], localized: true, legends: {
					fr: "Page rapport de combat",
					en: "Fight report page",
				}},
			]},
			{ name: 'chronology', icon: 'mdi-calendar-clock', items: [
				{ name: 'chronology', type: 'text', localized: true, formats: ['txt'], legends: {
					fr: "Chronologie",
					en: "Chronology"
				}},
			]},
			{ name: 'videos', icon: 'mdi-video', items: [
				{ type: 'video', name: '3y2ahAvV6XY', legend: "Apprenez à programmer en jouant [Leek Wars]" },
				{ type: 'video', name: 'rGJYhkASxZs', legend: 'Atelier Leek Wars — Next Decision' },
				{ type: 'video', name: 'uKZuEGlXOUg', legend: "APPRENDS EN T'AMUSANT : LEEK WARS [ACTE I]" },
				{ type: 'video', name: '9DXQfRH_2FM', legend: "As-tu toujours rêvé de créer un IA pour te battre avec un poireau?" },
				{ type: 'video', name: 'EBI5IYuECvk', legend: "[Leek Wars] - Bataille de poireaux !" },
				{ type: 'video', name: 'wmZB4fEhTBo', legend: "UN JEU DE PROGRAMMATION ?! - Leek Wars" },
		]}
]

const lang = localStorage.getItem('forum/chat-language') || (locale.value as string)
language.value = LeekWars.languages[lang]

function setLanguage(l: Language) {
	language.value = l
	localStorage.setItem('forum/chat-language', l.code)
}
</script>

<style lang="scss" scoped>
	.item {
		max-width: 500px;
		text-align: center;
		img {
			max-width: 100%;
			max-height: 230px;
			background: repeating-conic-gradient(#bbb 0% 25%, #777 0% 50%) 50% / 15px 15px;
			&.alpha {
				padding: 15px;
			}
		}
	}
	.legend {
		text-align: center;
		font-weight: 500;
		color: #555;
		font-size: 16px;
		padding-top: 5px;
	}
	.grid {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-around;
		gap: 15px;
	}
	.icon {
		font-size: 120px;
		margin-bottom: 5px;
	}
	.format {
		padding: 0 4px;
		background: #fff;
		margin-right: 4px;
		border: 1px solid #aaa;
	}
	.language-button {
		cursor: pointer;
		height: 36px;
		max-height: 36px;
		max-width: none;
		padding: 5px 8px;
		margin-left: 4px;
		margin-right: -10px;
		vertical-align: bottom;
		display: inline-flex;
		gap: 8px;
		align-items: center;
		margin-bottom: 10px;
		border: 1px solid #aaa;
		border-radius: 4px;
	}
	.flag {
		max-width: 30px;
		max-height: 20px;
	}
	.language {
		display: flex;
		align-items: center;
	}
	.language .name {
		padding-left: 8px;
	}
	object {
		background: white;
		color: black;
	}
	.item:only-of-type object {
		width: 500px;
		height: 240px;
	}
	.panel .green {
		color: #5fad1b;
	}
</style>
