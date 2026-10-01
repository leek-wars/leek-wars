import { ref, watch } from 'vue'

/*
 * Filtre du panneau « En direct ».
 *
 * Le panneau agrège une douzaine de types d'événements ; tout le monde ne veut
 * pas les mêmes. Le filtre est un confort d'AFFICHAGE et non une ACL : le
 * serveur envoie tout, on cache ici. C'est aussi pour ça qu'il vit dans le
 * client et nulle part ailleurs — aucun aller-retour, la liste se retrie sous
 * la main.
 *
 * Les types sont rangés en CATÉGORIES, et pas proposés un par un : « décocher
 * les trophées » est une intention, « décocher les seuils de victoires, les
 * seuils de boss, les seuils de tournois et les entrées de classement » n'en est
 * pas une. La correspondance type → catégorie est écrite ici, une fois.
 */

export type LiveCategory = 'trophies' | 'milestones' | 'forum' | 'farmers' | 'teams' | 'game'

// L'ordre du menu, du plus fréquent au plus rare.
export const LIVE_CATEGORIES: LiveCategory[] = ['trophies', 'milestones', 'forum', 'farmers', 'teams', 'game']

// Le glyphe de chaque catégorie dans le menu. Un concept = un glyphe.
export const LIVE_CATEGORY_ICONS: Record<LiveCategory, string> = {
	trophies: 'mdi-trophy',
	milestones: 'mdi-podium',
	forum: 'mdi-forum',
	farmers: 'mdi-account',
	teams: 'mdi-shield',
	game: 'mdi-clover',
}

const TYPE_CATEGORIES: Record<string, LiveCategory> = {
	trophy: 'trophies',
	threshold: 'milestones',
	rank: 'milestones',
	topic: 'forum',
	leek: 'farmers',
	anniversary: 'farmers',
	avatar: 'farmers',
	team: 'teams',
	emblem: 'teams',
	clover: 'game',
	tournaments: 'game',
	tournaments_start: 'game',
	tournaments_round: 'game',
	tournament_winners: 'game',
	arena: 'game',
}

// Un type que ce client ne connaît pas encore (serveur déployé avant lui) reste
// visible : mieux vaut une ligne qu'on n'a pas su ranger qu'une ligne disparue.
export function categoryOf(type: string): LiveCategory | null {
	return TYPE_CATEGORIES[type] ?? null
}

const STORAGE_KEY = 'live-filters'

/*
 * On mémorise les catégories MASQUÉES, et pas celles qu'on montre : une
 * catégorie ajoutée plus tard apparaît alors chez tout le monde, au lieu de
 * rester invisible chez ceux qui avaient enregistré leur liste avant elle.
 */
function load(): LiveCategory[] {
	try {
		const raw = localStorage.getItem(STORAGE_KEY)
		if (!raw) return []
		return sanitizeCategories(JSON.parse(raw)) ?? []
	} catch (_e) {
		return []
	}
}

// Une liste relue d'ailleurs (stockage local, disposition de l'accueil) : `null`
// si ce n'en est pas une, sinon ses seules catégories connues.
export function sanitizeCategories(value: unknown): LiveCategory[] | null {
	if (!Array.isArray(value)) return null
	return value.filter(c => LIVE_CATEGORIES.includes(c))
}

const hidden = ref<LiveCategory[]>(load())

watch(hidden, value => {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
	} catch (_e) {
		// Stockage refusé (navigation privée) : le filtre vit le temps de l'onglet.
	}
}, { deep: true })

// L'état partagé par le menu et les panneaux qui n'ont pas de filtre à eux : la
// page d'équipe, et un widget de l'accueil enregistré avant qu'ils en aient un.
// Les widgets de l'accueil portent chacun le leur dans la disposition, pour
// qu'on puisse en poser plusieurs, filtrés différemment.
export const hiddenCategories = hidden

export function toggleCategory(category: LiveCategory) {
	hidden.value = toggledCategories(hidden.value, category)
}

export function toggledCategories(list: LiveCategory[], category: LiveCategory): LiveCategory[] {
	return list.includes(category) ? list.filter(c => c !== category) : [...list, category]
}

export function isEventVisible(type: string, list: LiveCategory[] = hidden.value): boolean {
	const category = categoryOf(type)
	return category === null || !list.includes(category)
}
