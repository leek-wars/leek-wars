import { computed, ref } from 'vue'

// Compteur d'usage des emojis (issue #4269) : chaque réaction posée et chaque
// emoji inséré dans un message incrémente son compteur. Les plus utilisés
// deviennent les « favoris », affichés en tête de la barre de réaction rapide
// et dans le premier onglet du panneau emoji. Purement client, persisté en
// localStorage (pas de synchronisation serveur entre appareils).
//
// Forme canonique des clés : celle de Emojis.categories / Emojis.custom, où
// `<` est écrit `&lt;` (ex : "&lt;3" pour le cœur custom). Les points d'entrée
// reçoivent souvent la forme brute ("<3") — trackEmojiUsage normalise.

const STORAGE_KEY = 'chat/emoji-usage'
// Garde-fou : on ne laisse pas le compteur grossir sans borne (drapeaux,
// variantes…). Au-delà, les moins utilisés sont abandonnés à la sauvegarde.
const MAX_ENTRIES = 200

function load(): { [emoji: string]: number } {
	try {
		const raw = localStorage.getItem(STORAGE_KEY)
		if (!raw) { return {} }
		const parsed = JSON.parse(raw) as unknown
		if (parsed && typeof parsed === 'object') {
			const result: { [emoji: string]: number } = {}
			for (const [emoji, count] of Object.entries(parsed as { [emoji: string]: unknown })) {
				if (typeof count === 'number' && count > 0 && emoji.length > 0 && emoji.length <= 30) {
					result[emoji] = count
				}
			}
			return result
		}
	} catch { /* stockage corrompu ou indisponible : on repart de zéro */ }
	return {}
}

const counts = ref<{ [emoji: string]: number }>(load())

function save() {
	try {
		let entries = Object.entries(counts.value)
		if (entries.length > MAX_ENTRIES) {
			entries = entries.sort((a, b) => b[1] - a[1]).slice(0, MAX_ENTRIES)
			counts.value = Object.fromEntries(entries)
		}
		localStorage.setItem(STORAGE_KEY, JSON.stringify(counts.value))
	} catch { /* quota plein : les favoris de la session restent en mémoire */ }
}

// Forme brute → forme canonique ("<3" → "&lt;3"). Sans effet sur les emojis
// unicode et les autres smileys custom, qui ne contiennent pas de `<`.
function normalizeEmoji(emoji: string): string {
	return emoji.replace(/</g, '&lt;')
}

// Forme canonique → forme brute, celle qui est réellement postée en réaction
// ou insérée dans un message (même remplacement que le pick du panneau emoji).
function unescapeEmoji(emoji: string): string {
	return emoji.replace(/&lt;/g, '<')
}

// À appeler au moment où l'emoji est réellement utilisé : réaction ajoutée
// (pas retirée) ou emoji inséré dans un message. Accepte les deux formes.
function trackEmojiUsage(emoji: string) {
	const key = normalizeEmoji(emoji)
	if (!key) { return }
	counts.value[key] = (counts.value[key] || 0) + 1
	save()
}

// Emojis favoris, du plus utilisé au moins utilisé, en forme canonique.
// Le tri est stable (ES2019+) : à égalité, le premier adopté reste devant,
// la barre ne se réordonne pas au gré des égalités.
const favoriteEmojis = computed(() => {
	return Object.entries(counts.value)
		.sort((a, b) => b[1] - a[1])
		.map(e => e[0])
})

export { favoriteEmojis, normalizeEmoji, trackEmojiUsage, unescapeEmoji }
