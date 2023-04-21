<template lang="html">
	<div class="page">
		<div class="page-bar page-header">
			<h1>{{ $t('title') }}</h1>
		</div>
		<panel class="first">

			<div class="intro">
				<h2>Crééz votre groupe privé Leek wars</h2>

				Leek Wars offre la possibilité de <b>créer et gérer un groupe de joueurs</b> avec des fonctionnalités plus poussées que le jeu de base.
				<br>Idéal si vous êtes :
			</div>

			<div class="targets">
				<div class="target card">
					<div class="image">
						<leek-image :leek="{level: 200, hat: 7}" :scale="0.6" />
						<leek-image :leek="{level: 20, hat: 31}" :scale="0.52" :invert="true" />
						<leek-image :leek="{level: 20, hat: 31}" :scale="0.52" :invert="true" />
						<leek-image :leek="{level: 20, hat: 31}" :scale="0.52" :invert="true" />
					</div>
					<div class="title">Education</div>
					Un professeur avec des étudiants, pour un cours ou une activité.
				</div>
				<div class="target card">
					<div class="image">
						<leek-image :leek="{level: 300, hat: 2, skin: 12}" :scale="0.43" />
						<leek-image :leek="{level: 200, hat: 7, skin: 43}" :scale="0.42" />
						<leek-image :leek="{level: 250, hat: 35, skin: 17}" :scale="0.43" :invert="true" />
						<leek-image :leek="{level: 200, hat: 7, skin: 20}" :scale="0.42" :invert="true" />
					</div>
					<div class="title">Entreprise</div>
					Une entreprise pour une activité entre collaborateurs.
				</div>
				<div class="target card">
					<div class="image">
						<leek-image :leek="{level: 200, skin: 2, hat: 10}" :scale="0.44" />
						<leek-image :leek="{level: 200, skin: 3, hat: 17}" :scale="0.44" />
						<leek-image :leek="{level: 200, skin: 4, hat: 6}" :scale="0.44" :invert="true" />
						<leek-image :leek="{level: 200, skin: 5, hat: 8}" :scale="0.44" :invert="true" />
					</div>
					<div class="title">Joueurs</div>
					Un groupe de joueurs pour un évènement avec un tournoi privé.
				</div>
			</div>

			<h2>Fonctionnalités</h2>
			<div class="features">
				<div class="feature card">
					<v-icon>mdi-account-group</v-icon>
					<div>Page privée de groupe</div>
				</div>
				<div class="feature card">
					<v-icon>mdi-account-edit</v-icon>
					<div>Création et gestion des participants</div>
				</div>
				<div class="feature card">
					<v-icon>mdi-chat</v-icon>
					<div>Chat de discussion privé</div>
				</div>
				<div class="feature card">
					<v-icon>mdi-sword</v-icon>
					<div>Équipement et caractéristiques imposé</div>
				</div>
				<div class="feature card">
					<v-icon>mdi-finance</v-icon>
					<div>Statistiques détaillées des participants et API</div>
				</div>
				<div class="feature card">
					<v-icon>mdi-trophy</v-icon>
					<div>Tournois privés jusqu'à 64 joueurs</div>
				</div>
				<div class="feature card">
					<v-icon>mdi-sword-cross</v-icon>
					<div>Battle Royales privés</div>
				</div>
				<div class="feature card">
					<v-icon>mdi-cogs</v-icon>
					<div>Options pour personnaliser l'interface</div>
				</div>
			</div>

			<h2>Offres</h2>
			<div class="offers">
				<div class="offer card">
					<div class="title">🥈 Platine</div>
					<div class="item"><v-icon>mdi-check</v-icon> Création et gestion d'un groupe privé</div>
					<div class="item"><v-icon>mdi-check</v-icon> Possibilité d'imposer équipement et caractéristiques</div>
					<div class="item"><v-icon>mdi-check</v-icon> Lancement de Tournois et Battle Royales</div>
					<div class="item"><v-icon>mdi-check</v-icon> <span>Argent de 10 000 000 <span class="hab"></span> par participant</span></div>
					<div class="spacer"></div>
					<div class="price">299 €/groupe</div>
					<a href="mailto:contact@leekwars.com?subject=Demande d'informations groupe privé Platine" target="_blank">
						<v-btn color="primary">Contactez-nous</v-btn>
					</a>
				</div>
				<div class="offer card">
					<div class="title">💎 Diamant</div>
					<div class="item"><v-icon>mdi-check</v-icon> Toutes les fonctionnalités <b>Platine</b></div>
					<div class="plus">+</div>
					<div class="item"><v-icon>mdi-check</v-icon> <span>Argent de 100 000 000 <span class="hab"></span> par participant</span></div>
					<div class="item"><v-icon>mdi-check</v-icon> Accès aux codes des participants par le superviseur</div>
					<div class="item"><v-icon>mdi-check</v-icon> Ajout de fonctionnalités sur mesure</div>
					<div class="item"><v-icon>mdi-check</v-icon> Support personnalisé</div>
					<div class="spacer"></div>
					<div class="price">799 €/groupe</div>
					<a href="mailto:contact@leekwars.com?subject=Demande d'informations groupe privé Diamant" target="_blank">
						<v-btn color="primary">Contactez-nous</v-btn>
					</a>
				</div>
			</div>
			<!-- <div class="small">¹ Un jour de support offert, 49€ par jour supplémentaire</div> -->
		</panel>
	</div>
</template>

<script lang="ts">
	import { mixins } from '@/model/i18n'
	import { LeekWars } from '@/model/leekwars'
	import { Component, Vue } from 'vue-property-decorator'

	@Component({ name: 'groups', i18n: {}, mixins: [...mixins] })
	export default class Groups extends Vue {
		created() {
			LeekWars.setTitle(this.$t('title'))
		}
	}
</script>

<style lang="scss" scoped>
.panel {
	padding: 15px;
}
#app.app .panel {
	padding: 0;
}

.intro {
	font-size: 16px;
	line-height: 1.5;
}
h2 {
	font-weight: 500;
	font-size: 28px;
	margin-bottom: 10px;
	// color: #5fad1b;
}
.targets {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
	gap: 30px;
	margin-top: 15px;
	margin-bottom: 30px;
	.target {
		padding: 20px;
		display: flex;
		flex-direction: column;
		justify-content: flex-end;
		.image {
			margin-bottom: 10px;
		}
		.title {
			font-size: 20px;
			font-weight: 500;
			margin-bottom: 5px;
			color: #5fad1b;
		}
	}
}

.features {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
	gap: 15px;
	margin-top: 15px;
	margin-bottom: 30px;
	.feature {
		display: flex;
		gap: 12px;
		padding: 15px;
		align-items: center;
		.v-icon {
			font-size: 30px;
			color: #555;
		}
	}
}

.offers {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
	gap: 30px;
	margin-top: 15px;
	margin-bottom: 30px;
	.offer {
		padding: 20px;
		border-radius: 4px;
		display: flex;
		flex-direction: column;
		border: 1px solid #aaa;
		.title {
			font-size: 21px;
			font-weight: 500;
			margin-bottom: 15px;
		}
		.item {
			display: flex;
			align-items: center;
			gap: 5px;
			font-size: 15px;
			margin: 5px 0;
			.v-icon {
				color: #5fad1b;
			}
		}
		.price {
			text-align: right;
			font-size: 19px;
			margin-top: 10px;
			font-weight: 500;
		}
		.plus {
			font-size: 30px;
			text-align: center;
		}
		a {
			width: 100%;
		}
		.v-btn {
			width: 100%;
			margin-top: 30px;
		}
	}
}
</style>