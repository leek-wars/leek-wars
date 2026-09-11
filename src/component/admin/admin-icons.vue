<template>
	<div class="page">
		<div class="page-header page-bar">
			<div class="page-title">
				<page-icon name="admin" fallback="mdi-security" />
				<div class="page-title-text">
					<h1><breadcrumb :items="[{name: 'Administration', link: '/admin'}, {name: 'Icônes', link: '/admin/icons'}]" :raw="true" /></h1>
				</div>
			</div>
		</div>

		<panel class="first" icon="mdi-shape" title="Le vocabulaire">
			<template #content>
				<div class="icons-page">
					<p class="hint">
						Un concept du jeu = <b>un seul glyphe</b>, partout où il apparaît : menu, barres de page,
						onglets, boutons, tooltips, widgets de l'accueil, et notifications. Document de référence :
						<b>ICONS.md</b> à la racine du dépôt client — cette page en est le rendu.
						Cliquer sur une carte copie le nom du glyphe.
					</p>

					<div v-if="missing.length" class="warning-box">
						<v-icon>mdi-alert</v-icon>
						<div>
							<b>{{ missing.length }} glyphe(s) absent(s) du registre</b> — ils s'affichent en blanc tant
							que <code class="single">node scripts/generate-mdi-icons.mjs</code> n'a pas été relancé :
							{{ missing.join(', ') }}
						</div>
					</div>

					<div v-for="group in VOCABULARY" :key="group.title" class="group">
						<h4>{{ group.title }}</h4>
						<div class="cards">
							<div v-for="entry in group.entries" :key="entry.concept" v-ripple class="icon-card" @click="copy(entry.icon)">
								<v-icon class="glyph" :class="{unknown: !known(entry.icon)}">{{ entry.icon }}</v-icon>
								<div class="text">
									<div class="concept">{{ entry.concept }}</div>
									<code class="single">{{ entry.icon }}</code>
									<div v-if="entry.note" class="note">{{ entry.note }}</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</template>
		</panel>

		<panel icon="mdi-alert-outline" title="Les pièges">
			<template #content>
				<div class="icons-page">
					<p class="hint">
						Les glyphes qui se disputent un concept, ou qui se ressemblent trop pour cohabiter.
						Chacun est rendu <b>aux tailles où il sert vraiment</b> — c'est à 14 et 18 px que deux
						glyphes voisins se confondent, pas à 30.
					</p>
					<div v-for="trap in TRAPS" :key="trap.title" class="trap">
						<div class="trap-title">{{ trap.title }}</div>
						<div class="trap-text">{{ trap.text }}</div>
						<div class="trap-row">
							<div v-for="entry in trap.entries" :key="entry.icon + entry.meaning" class="trap-entry" :class="{taken: entry.taken}">
								<div class="sizes">
									<v-icon v-for="size in SIZES" :key="size" :size="size">{{ entry.icon }}</v-icon>
								</div>
								<code class="single">{{ entry.icon }}</code>
								<div class="meaning">{{ entry.meaning }}</div>
							</div>
						</div>
					</div>
				</div>
			</template>
		</panel>

		<panel icon="mdi-help-circle-outline" title="Reste à trancher">
			<template #content>
				<div class="icons-page">
					<p class="hint">
						La convention est appliquée dans le code depuis le 28/08/2026 (le détail est dans
						<b>ICONS.md</b>). Il reste deux décisions, qui ne sont pas les miennes.
					</p>
					<div class="trap">
						<div class="trap-title">La couronne, partagée entre le boss et la grosse victoire</div>
						<div class="trap-text">
							<code class="single">notif-bigwin</code> utilise la couronne du boss. La rangée bigwin est
							déjà reconnaissable à sa teinte bleue et à son halo, elle n'a pas besoin du glyphe —
							<code class="single">mdi-medal</code> lui irait. Rien n'a été touché.
						</div>
						<div class="trap-row">
							<div class="trap-entry">
								<div class="sizes"><v-icon v-for="size in SIZES" :key="size" :size="size">mdi-crown</v-icon></div>
								<code class="single">mdi-crown</code>
								<div class="meaning">Boss</div>
							</div>
							<div class="trap-entry taken">
								<div class="sizes"><v-icon v-for="size in SIZES" :key="size" :size="size">mdi-crown</v-icon></div>
								<code class="single">mdi-crown</code>
								<div class="meaning">Grosse victoire (à déplacer)</div>
							</div>
							<div class="trap-entry">
								<div class="sizes"><v-icon v-for="size in SIZES" :key="size" :size="size">mdi-medal</v-icon></div>
								<code class="single">mdi-medal</code>
								<div class="meaning">Piste pour la grosse victoire</div>
							</div>
						</div>
					</div>
					<div class="trap">
						<div class="trap-title">Les seize PNG de notifications, désormais sans usage</div>
						<div class="trap-text">
							<code class="single">public/image/notif/</code> n'est plus référencé par le code. À supprimer
							une fois vérifié qu'aucune notification en base ne les pointe encore.
						</div>
					</div>
				</div>
			</template>
		</panel>

		<panel class="last" icon="mdi-bell-outline" title="Notifications">
			<template #content>
				<div class="icons-page">
					<p class="hint">
						Une notification montre le glyphe de son concept. <b>Plus aucune n'utilise de PNG</b> :
						les seize types qui en gardaient un sont passés au glyphe. Au passage, les distinctions
						qu'un PNG partagé ne pouvait pas porter apparaissent — <code class="single">tournament_fail</code>
						servait au tournoi ET à l'arène, <code class="single">garden</code> au combat ET à la sortie
						du potager.
					</p>
					<table class="notifs">
						<tr>
							<th>Glyphe</th>
							<th>Concept</th>
							<th>Types</th>
						</tr>
						<tr v-for="n in NOTIFICATIONS" :key="n.icon + n.concept">
							<td class="to"><v-icon>{{ n.icon }}</v-icon> <code class="single">{{ n.icon }}</code></td>
							<td class="concept">{{ n.concept }}</td>
							<td class="types">{{ n.types }}</td>
						</tr>
					</table>
				</div>
			</template>
		</panel>
	</div>
</template>

<script setup lang="ts">
	import { LeekWars } from '@/model/leekwars'
	import { store } from '@/model/store'
	import { mixins } from '@/model/i18n'
	import { mdiIcons } from '@/model/mdi-icons'
	import Breadcrumb from '@/component/forum/breadcrumb.vue'
	import router from '@/router'

	defineOptions({ name: 'AdminIcons', i18n: {}, mixins: [...mixins], components: { Breadcrumb } })

	if (!store.getters.admin) router.replace('/')
	LeekWars.setTitle("Icônes")

	/** Les tailles auxquelles une icône sert vraiment sur le site : entrée de menu,
	 *  onglet de barre de page, bouton de panneau, barre du haut. */
	const SIZES = [14, 18, 22, 26]

	const VOCABULARY = [
		{
			title: 'Poireau & progression',
			entries: [
				{ concept: 'Poireau', icon: 'mdi-leek', note: "Un poireau PRÉCIS garde sa vignette de tête, qui le distingue de ses frères." },
				{ concept: 'Trophée', icon: 'mdi-trophy', note: "La coupe." },
				{ concept: 'Trophée non débloqué', icon: 'mdi-trophy-outline', note: "Le contour = un état négatif, jamais un autre concept." },
				{ concept: 'Classement', icon: 'mdi-podium', note: '' },
			],
		},
		{
			title: 'Combattre',
			entries: [
				{ concept: 'Potager', icon: 'mdi-sword-cross', note: "Deux épées : le lieu, et le compteur de combats." },
				{ concept: 'Combat', icon: 'mdi-sword', note: "Une épée : un combat, un rapport, une ligne d'historique." },
				{ concept: 'Défi', icon: 'mdi-flag-outline', note: "Le drapeau qu'on plante pour provoquer. Contour par exception : le plein dit déjà « signalement »." },
				{ concept: 'Signalement', icon: 'mdi-flag', note: "Le drapeau qu'on lève sur quelqu'un. Sert aussi à l'avertissement reçu." },
				{ concept: 'Arme', icon: 'mdi-pistol', note: "Le dialogue de choix d'armes." },
				{ concept: 'Potion', icon: 'mdi-flask', note: "La fiole d'ICONS.md (2026-08-28) : dialogues de potion et de skin, bouton Potions, marché." },
				{ concept: 'Arène (BR, évènements de groupe)', icon: 'mdi-stadium', note: "Déjà le glyphe de la catégorie de trophées « arène »." },
				{ concept: 'Boss', icon: 'mdi-crown', note: "Les boss de Leek Wars sont des rois. Déjà en place dans l'historique, la tooltip de combat et le menu." },
				{ concept: 'Tournoi', icon: 'mdi-tournament', note: "L'arbre à branches — l'objet lui-même." },
				{ concept: 'Victoire en tournoi', icon: 'mdi-trophy', note: "Exception assumée : ce qu'on annonce est une récompense obtenue, pas un arbre." },
			],
		},
		{
			title: 'Collectif',
			entries: [
				{ concept: 'Équipe', icon: 'mdi-shield', note: "Le blason — les équipes ont un emblème." },
				{ concept: 'Composition', icon: 'mdi-shield-sword', note: "Le blason ET l'épée : l'escouade de l'équipe qui va au combat." },
				{ concept: 'Groupes privés', icon: 'mdi-account-group', note: "Des gens, pas un blason : c'est ce qui le sépare de l'équipe." },
			],
		},
		{
			title: 'Parler',
			entries: [
				{ concept: 'Forum', icon: 'mdi-forum', note: "Les deux bulles." },
				{ concept: 'Chat (salon public)', icon: 'mdi-chat', note: "La bulle simple." },
				{ concept: 'Message privé', icon: 'mdi-email-outline', note: "Seule entorse au « plein par défaut » : le glyphe plein est trop lourd à 26 px dans le bandeau." },
				{ concept: 'Mention', icon: 'mdi-at', note: '' },
				{ concept: 'Commentaire', icon: 'mdi-message', note: "La bulle pleine et muette : commentaire de combat, de tournoi." },
			],
		},
		{
			title: 'Le reste de la coquille',
			entries: [
				{ concept: 'Marché', icon: 'mdi-store', note: '' },
				{ concept: 'Potion', icon: 'mdi-flask', note: 'Remplace le PNG noir du bouton « Potions »' },
				{ concept: 'Inventaire', icon: 'mdi-treasure-chest', note: '' },
				{ concept: 'Éditeur', icon: 'mdi-code-braces', note: '' },
				{ concept: 'Modération', icon: 'mdi-gavel', note: '' },
				{ concept: 'Administration', icon: 'mdi-security', note: '' },
				{ concept: 'Réglages', icon: 'mdi-cog', note: 'Titre de la page réglages' },
			],
		},
	]

	const TRAPS = [
		{
			title: "La coupe était réclamée par trois concepts",
			text: "C'est de là que vient l'essentiel de l'incohérence actuelle : trophée, tournoi et arène affichaient la même coupe. Seul le trophée la garde.",
			entries: [
				{ icon: 'mdi-trophy', meaning: 'Trophée', taken: true },
				{ icon: 'mdi-tournament', meaning: 'Tournoi', taken: false },
				{ icon: 'mdi-stadium', meaning: 'Arène', taken: false },
			],
		},
		{
			title: "Le crâne n'est pas au boss",
			text: "mdi-skull-outline veut dire DÉFAITE dans l'historique de combats, le rapport et la tooltip de combat. Le boss a la couronne — ne pas lui remettre un crâne au motif qu'il fait peur.",
			entries: [
				{ icon: 'mdi-skull-outline', meaning: 'Défaite (déjà en place)', taken: true },
				{ icon: 'mdi-crown', meaning: 'Boss', taken: false },
			],
		},
		{
			title: "Le drapeau plein et le drapeau creux ne disent pas la même chose",
			text: "Plein = signalement, creux = défi. C'est la seconde entorse au « plein par défaut », et elle vient du code : le défi est sur le contour dans une douzaine d'endroits. Le damier (premier du classement) et le drapeau de priorité du forum sont encore autre chose.",
			entries: [
				{ icon: 'mdi-flag-outline', meaning: 'Défi', taken: false },
				{ icon: 'mdi-flag', meaning: 'Signalement, avertissement', taken: false },
				{ icon: 'mdi-flag-checkered', meaning: 'Premier du classement', taken: true },
			],
		},
		{
			// Pas de « ≠ » dans un titre : la police pixel ne l'a pas et le repli le rend en « =/ ».
			title: "Une épée simple n'est pas deux épées croisées",
			text: "La seule chose qui les sépare est leur nombre. Ne pas les intervertir.",
			entries: [
				{ icon: 'mdi-sword-cross', meaning: 'Potager', taken: false },
				{ icon: 'mdi-sword', meaning: 'Un combat', taken: false },
			],
		},
		{
			title: "Plein contre contour",
			text: "Le contour n'est pas une nuance de goût : il veut dire « pas encore obtenu / vide / inactif ». Il ne sert jamais à distinguer deux concepts — c'est ce qui a mené le widget « En direct » à opposer trophée plein et trophée creux pour dire « trophée » et « tournoi ».",
			entries: [
				{ icon: 'mdi-trophy', meaning: 'Trophée débloqué', taken: false },
				{ icon: 'mdi-trophy-outline', meaning: 'Trophée non débloqué', taken: false },
			],
		},
		{
			title: "La couronne dit « boss », et rien d'autre — une collision reste",
			text: "notif-bigwin (la notification de grosse victoire) utilise la couronne elle aussi. À trancher : la rangée bigwin est déjà reconnaissable à sa teinte bleue et à son halo, elle n'a pas besoin du glyphe du boss. mdi-medal conviendrait. Ne pas s'en servir non plus pour un premier de classement — celui-là a une couleur (--rank-first), pas un glyphe.",
			entries: [
				{ icon: 'mdi-crown', meaning: 'Boss', taken: false },
				{ icon: 'mdi-crown', meaning: 'Grosse victoire (à déplacer)', taken: true },
				{ icon: 'mdi-medal', meaning: 'Piste pour la grosse victoire', taken: false },
			],
		},
		{
			title: "Une famille cohérente prime sur la variante",
			text: "Les icônes de catégories de trophées (LeekWars.trophyCategoriesIcons) sont TOUTES en contour : c'est un jeu qui se lit ensemble, pas onze concepts isolés, et la règle « plein par défaut » ne s'y applique pas. Ce qui compte est le choix du glyphe — et là elle est déjà juste, sauf le tournoi.",
			entries: [
				{ icon: 'mdi-crown-outline', meaning: 'Boss (catégorie de trophées)', taken: false },
				{ icon: 'mdi-trophy-outline', meaning: 'Tournoi — le seul faux du jeu', taken: true },
			],
		},
	]

	/** Le glyphe porté par chaque type de notification, tel qu'il est construit dans
	 *  `notification-builder.ts`. Regroupé par glyphe : c'est le concept qui compte,
	 *  pas le type. */
	const NOTIFICATIONS = [
		{ icon: 'mdi-sword', concept: 'Combat', types: 'FIGHT_REPORT, FARMER_FIGHT_REPORT, BATTLE_ROYALE_REPORT, WAR_REPORT, CHEST_HUNT_REPORT, COLOSSUS_REPORT, COLOSSUS_OWN_REPORT' },
		{ icon: 'mdi-sword-cross', concept: 'Potager', types: 'GIVE_FIGHTS, FARMER_AUTO_EXIT_GARDEN' },
		{ icon: 'mdi-shield-sword', concept: 'Composition', types: 'COMPOSITION_FIGHT_REPORT' },
		{ icon: 'mdi-shield', concept: 'Équipe', types: 'TEAM_BANNED, TEAM_NEW_CANDIDACY, TEAM_NEW_FARMER, CANDIDACY_ACCEPTED, CANDIDACY_REFUSED, TEAM_INVITATION, TEAM_INVITATION_ACCEPTED' },
		{ icon: 'mdi-tournament', concept: 'Tournoi', types: 'TOURNAMENT_END, FARMER_TOURNAMENT_END, TEAM_TOURNAMENT_END, NO_TOURNAMENT, NO_TOURNAMENT_FARMER, NO_TOURNAMENT_TEAM' },
		{ icon: 'mdi-trophy', concept: 'Récompense obtenue', types: 'TROPHY_UNLOCKED (repli), TOURNAMENT_WINNER, FARMER_TOURNAMENT_WIN, TEAM_TOURNAMENT_WIN' },
		{ icon: 'mdi-stadium', concept: 'Arène', types: 'BATTLE_ROYALE_STARTED, NO_BR, LEEK_AUTO_EXIT_ARENA' },
		{ icon: 'mdi-crown', concept: 'Boss', types: 'BOSS_STARTED' },
		{ icon: 'mdi-forum', concept: 'Forum', types: 'NEW_MESSAGE, FORUM_TOPIC' },
		{ icon: 'mdi-gavel', concept: 'Modération', types: 'REPORTING_PROCESSED' },
		{ icon: 'mdi-account-supervisor', concept: 'Parrainage', types: 'NEW_GODSON, GODFATHER_REQUEST, GODFATHER_REQUEST_ACCEPTED, GODFATHER_REQUEST_REFUSED' },
		{ icon: 'mdi-message', concept: 'Commentaire', types: 'FIGHT_COMMENT, TOURNAMENT_COMMENT' },
		{ icon: 'mdi-at', concept: 'Mention', types: 'CHAT_MENTION' },
		{ icon: 'mdi-flag-outline', concept: 'Défi', types: 'CHALLENGE, FARMER_CHALLENGE' },
		{ icon: 'mdi-flag', concept: 'Avertissement', types: 'NEW_WARNING' },
		{ icon: 'mdi-transfer-up', concept: 'Montée de niveau', types: 'UP_LEVEL' },
		{ icon: 'mdi-gift-outline', concept: 'Don d\'objet', types: 'GIVE_ITEM' },
		{ icon: 'mdi-hand-coin-outline', concept: 'Don d\'habs', types: 'GIVE_MONEY' },
		{ icon: 'mdi-thumb-up', concept: 'Vote du forum', types: 'FORUM_VOTE_UP, FORUM_VOTE_DOWN (mdi-thumb-down)' },
	]

	/** Un nom absent du registre généré ne rend RIEN (le composant d'icône avertit en
	 *  console mais la page reste muette) : on le dit ici plutôt que de laisser un blanc. */
	function known(icon: string) {
		return icon in mdiIcons
	}
	const missing = [...new Set([
		...VOCABULARY.flatMap(g => g.entries.map(e => e.icon)),
		...TRAPS.flatMap(t => t.entries.map(e => e.icon)),
		...NOTIFICATIONS.map(n => n.icon),
	])].filter(i => !known(i)).sort()

	function copy(icon: string) {
		navigator.clipboard?.writeText(icon).then(() => LeekWars.toast(icon + ' copié')).catch(() => {})
	}
</script>

<style lang="scss" scoped>
	.icons-page {
		padding: 12px;
	}
	.hint {
		margin: 0 0 16px;
		color: var(--text-color-secondary);
		font-size: 14px;
		line-height: 1.5;
	}
	// `code` est en `display: flex` dans global.scss (blocs de code du forum et de
	// l'encyclopédie) : c'est la variante `.single` qui est en ligne. On n'ajuste
	// que la taille, le reste vient d'elle.
	code.single {
		font-size: 12px;
	}
	.warning-box {
		display: flex;
		gap: 10px;
		align-items: flex-start;
		border: 1px solid var(--warning);
		background: var(--background-secondary);
		padding: 10px 12px;
		margin-bottom: 16px;
		font-size: 14px;
		.v-icon {
			color: var(--warning);
		}
	}
	.group {
		margin-bottom: 20px;
		h4 {
			margin: 0 0 8px;
			color: var(--text-color-secondary);
			font-size: 13px;
			text-transform: uppercase;
			letter-spacing: 0.06em;
		}
	}
	.cards {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(270px, 1fr));
		gap: 8px;
	}
	.icon-card {
		display: flex;
		gap: 12px;
		align-items: flex-start;
		padding: 10px 12px;
		border: 1px solid var(--border);
		background: var(--background-secondary);
		cursor: pointer;
		&:hover {
			border-color: var(--primary);
		}
		.glyph {
			font-size: 30px;
			flex: none;
			margin-top: 2px;
			// Un glyphe absent du registre ne dessine rien : on marque la case vide.
			&.unknown {
				outline: 1px dashed var(--warning);
				outline-offset: 2px;
			}
		}
		.text {
			min-width: 0;
		}
		.concept {
			font-weight: 500;
			margin-bottom: 3px;
		}
		.note {
			margin-top: 5px;
			font-size: 12px;
			line-height: 1.4;
			color: var(--text-color-secondary);
		}
	}
	.trap {
		border-left: 3px solid var(--border-strong);
		padding-left: 14px;
		margin-bottom: 22px;
		.trap-title {
			font-weight: 500;
			margin-bottom: 3px;
		}
		.trap-text {
			font-size: 13px;
			line-height: 1.5;
			color: var(--text-color-secondary);
			margin-bottom: 10px;
		}
	}
	.trap-row {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}
	.trap-entry {
		border: 1px solid var(--border);
		background: var(--background-secondary);
		padding: 8px 12px;
		min-width: 190px;
		// Glyphe déjà attribué à un autre concept : il ne se prend pas.
		&.taken {
			border-color: var(--error);
		}
		.sizes {
			display: flex;
			align-items: baseline;
			gap: 10px;
			height: 30px;
			margin-bottom: 6px;
		}
		.meaning {
			margin-top: 5px;
			font-size: 12px;
			color: var(--text-color-secondary);
		}
	}
	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 14px;
		th {
			text-align: left;
			font-weight: 500;
			font-size: 12px;
			text-transform: uppercase;
			letter-spacing: 0.06em;
			color: var(--text-color-secondary);
			padding: 0 10px 6px;
		}
		td {
			padding: 8px 10px;
			border-top: 1px solid var(--border);
			vertical-align: top;
		}
		.concept, .types {
			font-weight: 500;
		}
		.types {
			font-size: 12px;
			font-family: ui-monospace, 'SF Mono', 'Cascadia Mono', monospace;
			font-weight: 400;
		}
		.to .v-icon {
			vertical-align: middle;
			margin-right: 6px;
		}
	}
</style>
