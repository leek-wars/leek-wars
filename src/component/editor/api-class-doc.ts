// Descriptions courtes des classes de l'API de combat (API 100% objet), affichées au survol du NOM
// de classe dans l'éditeur (LeekScript et Python). Les membres, eux, ont déjà leur fiche de doc
// (resolvePolyglotSymbol -> DocumentationFunction/DocumentationConstant) ; seule la classe elle-même
// n'avait rien.
//
// Pourquoi un module TS et pas l'i18n : le namespace `doc.*` (fonctions/constantes) vient des game
// data SERVEUR et ne contient rien pour les classes ; et le client n'a PAS de `fallbackLocale` (une
// seule locale chargée à la fois, cf. i18n.ts) -> une clé absente s'afficherait en brut dans les
// langues non traduites. Ici le repli sur l'anglais est explicite, donc jamais de clé nue.
//
// Pour traduire : ajouter la langue à l'entrée voulue (`de: '...'`). `en` est obligatoire (repli).

// `en` obligatoire (repli) ; toute autre locale est optionnelle -> index signature.
interface ClassDoc { en: string, [locale: string]: string | undefined }

// Clé = nom de classe / singleton de l'API objet (cf. buildObjectApiModel : singletons + classes).
const CLASS_DOC: Record<string, ClassDoc> = {
	Fight: {
		en: 'The current fight: turn, entities in play, obstacles and general state of the battle.',
		fr: 'Le combat en cours : tour, entités en jeu, obstacles et état général de la bataille.',
	},
	Field: {
		en: 'The battlefield: cells, coordinates, distances, lines of sight and pathfinding.',
		fr: 'Le terrain : cellules, coordonnées, distances, lignes de vue et recherche de chemin.',
	},
	Debug: {
		en: 'Logging and on-field debug display: messages, marks and coloured cells, visible in the fight report.',
		fr: 'Journalisation et affichage de debug sur le terrain : messages, marqueurs et cellules colorées, visibles dans le rapport de combat.',
	},
	System: {
		en: 'Runtime information: operations used, remaining budget and timing of your AI.',
		fr: "Informations d'exécution : opérations consommées, budget restant et temps de votre IA.",
	},
	Color: {
		en: 'Colour constants and helpers, used for debug marks and drawings.',
		fr: 'Constantes et utilitaires de couleur, utilisés pour les marqueurs et dessins de debug.',
	},
	Network: {
		en: 'Communication between the leeks of your team: send and receive messages during the fight.',
		fr: 'Communication entre les poireaux de votre équipe : envoyer et recevoir des messages pendant le combat.',
	},
	Registers: {
		en: 'Persistent registers: key/value storage kept from one fight to the next.',
		fr: "Registres persistants : stockage clé/valeur conservé d'un combat à l'autre.",
	},
	Entity: {
		en: 'An entity in the fight (leek, turret, bulb, mob…): stats, position, effects and actions.',
		fr: 'Une entité du combat (poireau, tourelle, bulbe, monstre…) : caractéristiques, position, effets et actions.',
	},
	Me: {
		en: 'Your own entity: everything from Entity, plus the actions you can perform this turn.',
		fr: 'Votre propre entité : tout ce que propose Entity, plus les actions que vous pouvez effectuer ce tour.',
	},
	Leek: {
		en: 'A leek: an entity controlled by a player.',
		fr: 'Un poireau : une entité contrôlée par un joueur.',
	},
	Turret: {
		en: 'A turret: a fixed entity that defends a base.',
		fr: 'Une tourelle : une entité fixe qui défend une base.',
	},
	Bulb: {
		en: 'A bulb: an entity summoned during the fight by a summon chip.',
		fr: 'Un bulbe : une entité invoquée pendant le combat par une puce d’invocation.',
	},
	Chest: {
		en: 'A chest: a neutral entity that can be opened for a reward.',
		fr: 'Un coffre : une entité neutre qui peut être ouverte pour obtenir une récompense.',
	},
	Mob: {
		en: 'A mob: a hostile entity controlled by the game.',
		fr: 'Un monstre : une entité hostile contrôlée par le jeu.',
	},
	Item: {
		en: 'An item of the game (weapon or chip): shared base of Weapon and Chip.',
		fr: 'Un objet du jeu (arme ou puce) : base commune de Weapon et Chip.',
	},
	Weapon: {
		en: 'A weapon: cost, range, area of effect and the effects it applies.',
		fr: "Une arme : coût, portée, zone d'effet et effets qu'elle applique.",
	},
	Chip: {
		en: 'A chip: cost, range, cooldown and the effects it applies.',
		fr: "Une puce : coût, portée, temps de rechargement et effets qu'elle applique.",
	},
	Cell: {
		en: 'A cell of the battlefield: coordinates, content and neighbourhood.',
		fr: 'Une cellule du terrain : coordonnées, contenu et voisinage.',
	},
	Effect: {
		en: 'An effect applied to an entity (damage, heal, shield, aftereffect…), with its caster and duration.',
		fr: 'Un effet appliqué à une entité (dégâts, soin, bouclier, séquelle…), avec son lanceur et sa durée.',
	},
	Feature: {
		en: 'A feature of a weapon or chip: effect type, min/max values, duration and targets.',
		fr: "Une caractéristique d'une arme ou d'une puce : type d'effet, valeurs min/max, durée et cibles.",
	},
	Message: {
		en: 'A message received through Network: its author, type and parameters.',
		fr: 'Un message reçu via Network : son auteur, son type et ses paramètres.',
	},
}

/** Description localisée d'une classe de l'API, ou undefined si la classe n'est pas documentée.
 *  Repli explicite sur l'anglais (pas de fallbackLocale côté i18n). */
export function getClassDoc(name: string, locale: string): string | undefined {
	const entry = CLASS_DOC[name]
	if (!entry) return undefined
	return entry[locale] ?? entry.en
}
