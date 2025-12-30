<template lang="html">
	<div class="console v-dialog draggable" :style="{top: consoleY + 'px', left: consoleX + 'px'}">
		<div class="title" @mousedown="consoleMouseDown">
			{{ $t('main.console') }}
			<v-menu v-if="$refs.console" offset-y :close-on-content-click="false">
				<template v-slot:activator="{ props }">
					<v-chip v-bind="props" size="small">LS {{ $refs.console.version }} {{ $refs.console.strict ? 'strict' : '' }} <v-icon>mdi-chevron-down</v-icon></v-chip>
				</template>
				<v-list :dense="true" class="version-menu">
					<v-list-item v-ripple @click="$refs.console.setVersion(4)">
						<v-icon v-if="$refs.console.version === 4" class="list-icon">mdi-star</v-icon>
						<v-icon v-else class="list-icon">mdi-star-outline</v-icon>
						<v-list-item-content>
							<v-list-item-title>LeekScript 4</v-list-item-title>
							<v-list-item-subtitle>
								<ul v-if="$i18n.locale === 'fr'">
									<li>Séparation entre Array et Map et nouvelles fonctions.</li>
									<li>Entiers sur 64 bits au lieu de 32, nouvelles fonctions sur les nombres.</li>
									<li>Fonctions flèches, paramètres par défaut.</li>
								</ul>
								<router-link class="link" to="/encyclopedia/LeekScript_4"><v-icon>mdi-book-open-page-variant</v-icon> {{ $t('leekscript.all_info_ls', ['LeekScript 4']) }}</router-link>
							</v-list-item-subtitle>
						</v-list-item-content>
					</v-list-item>
					<v-list-item v-ripple @click="$refs.console.setVersion(3)">
						<v-icon v-if="$refs.console.version === 3" class="list-icon">mdi-star</v-icon>
						<v-icon v-else class="list-icon">mdi-star-outline</v-icon>
						<v-list-item-content>
							<v-list-item-title>LeekScript 3</v-list-item-title>
							<v-list-item-subtitle>
								<ul v-if="$i18n.locale === 'fr'">
									<li>Littéraux d'objets <code>{a: 12}</code></li>
									<li>Classes de base : Number, Integer, Boolean, Object, Array, Function etc.</li>
									<li>Nouveaux mots-clés réservés.</li>
								</ul>
								<router-link class="link" to="/encyclopedia/LeekScript_3"><v-icon>mdi-book-open-page-variant</v-icon> {{ $t('leekscript.all_info_ls', ['LeekScript 3']) }}</router-link>
							</v-list-item-subtitle>
						</v-list-item-content>
					</v-list-item>
					<v-list-item v-ripple @click="$refs.console.setVersion(2)">
						<v-icon v-if="$refs.console.version === 2" class="list-icon">mdi-star</v-icon>
						<v-icon v-else class="list-icon">mdi-star-outline</v-icon>
						<v-list-item-content>
							<v-list-item-title>LeekScript 2</v-list-item-title>
							<v-list-item-subtitle>
								<ul v-if="$i18n.locale === 'fr'">
									<li>Ajout des classes et objets.</li>
									<li>Passage par référence par défaut pour les valeurs non-primitives dans les fonctions, les boucles foreach et les tableaux.</li>
									<li>Corrections mineures (arrayFilter, opérateur ^=, et autres).</li>
								</ul>
								<router-link class="link" to="/encyclopedia/LeekScript_2"><v-icon>mdi-book-open-page-variant</v-icon> {{ $t('leekscript.all_info_ls', ['LeekScript 2']) }}</router-link>
							</v-list-item-subtitle>
						</v-list-item-content>
					</v-list-item>

					<v-list-item v-ripple @click="$refs.console.setVersion(1)">
						<v-icon v-if="$refs.console.version === 1" class="list-icon">mdi-star</v-icon>
						<v-icon v-else class="list-icon">mdi-star-outline</v-icon>
						<v-list-item-content>
							<v-list-item-title>LeekScript 1</v-list-item-title>
							<v-list-item-subtitle>
								<ul>
									<li>{{ $t('leekscript.intial_version') }}</li>
								</ul>
							</v-list-item-subtitle>
						</v-list-item-content>
					</v-list-item>
					<v-divider></v-divider>
					<v-list-item v-ripple @click="$refs.console.toggleStrictMode()" @click.stop>
						<v-checkbox v-model="$refs.console.strict" :hide-details="true" @click.stop />
						<v-list-item-content>
							<v-list-item-title>{{ $t('leekscript.strict_mode') }}</v-list-item-title>
							<v-list-item-subtitle>
								<ul v-if="$i18n.locale === 'fr'">
									<li>Les variables initialisées avec une valeur gardent un type fixe.</li>
									<li>Les accès en dehors d'un tableau causent une erreur au lieu de renvoyer null.</li>
									<li>Davantage d'avertissements sur les types sont renvoyés.</li>
								</ul>
							</v-list-item-subtitle>
						</v-list-item-content>
					</v-list-item>
				</v-list>
			</v-menu>
			<v-chip v-if="$refs.console && !$refs.console.isEmpty()" @click="$refs.console.clear()" size="small"><v-icon>mdi-cancel</v-icon></v-chip>
			<div class="spacer"></div>
			<div class="options">

				<div class="option" @click="$refs.console.toggleTheme()"><v-icon>mdi-weather-night</v-icon></div>
				<!-- <div class="option" @click="consoleRandom"><img src="/image/icon/dice.png"></div> -->
				<div class="option" @click="consolePopup"><v-icon>mdi-open-in-new</v-icon></div>
				<div class="option" @click="$emit('close')"><v-icon>mdi-close</v-icon></div>
			</div>
		</div>
		<console ref="console" class="window" />
	</div>
</template>

<script lang="ts">

import { LeekWars } from '@/model/leekwars'
import { Component, Vue } from 'vue-property-decorator'
import Console from './console.vue'

@Component({ components: { 'console': Console } })
export default class ConsoleWindow extends Vue {

	consoleX: number = 0
	consoleY: number = 0
	consoleDown: boolean = false
	consoleStartx: number = 0
	consoleStarty: number = 0
	consoleDragx: number = 0
	consoleDragy: number = 0
	theme: string = 'leekwars'

	open() {
		this.consoleX = window.innerWidth / 2 - 300
		this.consoleY = window.innerHeight / 2 - 200
		// console.log("open", this.consoleX, this.consoleY)
		setTimeout(() => {
			(this.$refs.console as Console).focus()
		}, 100)
	}

	consoleMouseDown(e: MouseEvent) {
		if (e.button === 2) { return false }
		this.consoleDragx = e.pageX
		this.consoleDragy = e.pageY
		this.consoleStartx = this.consoleX
		this.consoleStarty = this.consoleY
		this.consoleDown = true
		e.preventDefault()
		return false
	}

	consoleMouseMove(e: MouseEvent) {
		if (!this.consoleDown) { return null }
		this.consoleX = this.consoleStartx + (e.pageX - this.consoleDragx)
		if (this.consoleX < -15) { this.consoleX = -15 }
		this.consoleY = this.consoleStarty + (e.pageY - this.consoleDragy)
		if (this.consoleY < -15) { this.consoleY = -15 }
	}

	consoleMouseUp(e: MouseEvent) {
		this.consoleDown = false
	}

	consolePopup() {
		LeekWars.popupWindow("/full-console", "title", 600, 320)
		this.$emit('close')
	}
}

</script>

<style lang="scss" scoped>

.v-dialog.console {
	position: fixed;
	top: calc(50% - 200px);
	left: calc(50% - 300px);
	width: 700px;
	z-index: 10;
	transition: none;
	overflow: visible;
	margin: 0;
	animation: hithere 0.2s ease 1;
}
@keyframes hithere {
	0% { transform: scale(0.5); opacity: 0; }
	100% { transform: scale(1); opacity: 1; }
}

.title {
	gap: 8px;
	.v-chip {
		margin-top: -2px;
	}
}

.version-menu {
	.list-icon {
		margin-right: 12px;
	}
	.v-list-item__subtitle {
		white-space: initial;
		font-weight: 400;
		> ul {
			padding-left: 20px;
		}
		ul {
			margin: 4px 0;
		}
	}
	.green {
		background: #5fad1b;
		color: white;
		padding: 0 6px;
		border-radius: 20px;
		margin-left: 4px;
	}
	.link {
		padding: 5px;
		color: #5fad1b;
		font-weight: 500;
		display: block;
		i {
			font-size: 14px;
			vertical-align: top;
		}
		&:hover {
			text-decoration: underline;
		}
	}
}
</style>