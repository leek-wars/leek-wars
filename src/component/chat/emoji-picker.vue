<template>
	<v-menu ref="menu" v-model="shown" :close-on-content-click="false" :width="width" location="top" offset-y content-class="emoji-picker-menu">
		<template #activator="{ props }">
			<div v-ripple class="chat-input-emoji" v-bind="props">
				<div :class="{'emoji-font': !LeekWars.nativeEmojis}"><slot></slot></div>
			</div>
		</template>
		<v-card>
			<lw-input v-model="query" class="search" prepend-inner-icon="mdi-magnify" :placeholder="$t('main.search')" clearable @keydown.stop />
			<!-- v-show sur un <div> et non sur <v-tabs> : la racine de VTabs est un
			     fragment, une directive posée dessus est ignorée (avertissement Vue). -->
			<div v-show="!query">
				<v-tabs :key="categories.length" v-model="activeTab" class="tabs" grow :show-arrows="false">
					<v-tab v-for="(category, c) in categories" :key="c" :value="'tab-' + c" class="tab" :title="category.favorites ? $t('main.emoji_favorites') : undefined">
						<span v-html="formatEmojisText(category.icon)"></span>
					</v-tab>
				</v-tabs>
			</div>
			<v-tabs-window v-model="activeTab">
				<v-tabs-window-item v-for="(category, c) in displayed" :key="c" v-autostopscroll :value="'tab-' + c" class="content">
					<div class="grid">
						<template v-for="(emoji, e) in category.emojis" :key="e">
							<img v-if="Emojis.custom[emoji]" :src="'/image/emoji/' + Emojis.custom[emoji] + '.png'" :title="emoji" class="emoji classic" @click="pick(emoji)">
							<div v-else :class="{'emoji-font': !LeekWars.nativeEmojis}" class="emoji" @click="pick(emoji)">{{ emoji }}</div>
						</template>
					</div>
					<div v-if="query && !category.emojis.length" class="no-result">{{ $t('main.emoji_no_result') }}</div>
				</v-tabs-window-item>
			</v-tabs-window>
		</v-card>
	</v-menu>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { favoriteEmojis } from '@/model/emoji-usage'
import { loadEmojiKeywords, searchEmojis } from '@/model/emoji-search'
import { Emojis, formatEmojisText } from '@/model/emojis'

interface EmojiCategory {
	icon: string
	emojis: string[]
	favorites?: boolean
}

const props = defineProps<{
	closeOnSelected?: boolean
}>()

const emit = defineEmits<{
	pick: [emoji: string]
}>()

const width = 352
const shown = ref(false)
const activeTab = ref('tab-0')
const query = ref('')

// Onglet « Favoris » (issue #4269) : les emojis les plus utilisés du joueur, en
// tête du panneau. Figé à l'ouverture du menu (et pas un computed sur l'usage) :
// picorer plusieurs emojis d'affilée ne doit pas réordonner la grille sous le
// curseur. Sans historique d'usage, le panneau reste identique à l'ancien.
const favoriteCategory = ref<EmojiCategory | null>(null)
watch(shown, (open) => {
	if (open) {
		const favorites = favoriteEmojis.value.slice(0, 30)
		favoriteCategory.value = favorites.length ? { icon: '⭐', emojis: favorites, favorites: true } : null
		activeTab.value = 'tab-0'
		query.value = ''
	}
})
const categories = computed<EmojiCategory[]>(() => favoriteCategory.value ? [favoriteCategory.value, ...Emojis.categories] : Emojis.categories)

// Recherche par nom (issue #4269) : tant que le champ est vide, le panneau ne
// bouge pas d'un pixel. Dès la première frappe, les mots-clés de la langue du
// joueur sont chargés (import dynamique, ~30 Ko), puis la grille montre les
// résultats à la place des catégories — la barre d'onglets s'efface, mais reste
// montée pour revenir telle quelle quand le champ est vidé.
const keywordsLoaded = ref(false)
const results = computed<string[]>(() => {
	void keywordsLoaded.value // dépendance explicite : la fin du chargement doit relancer le calcul
	return searchEmojis(query.value)
})
const displayed = computed<EmojiCategory[]>(() => query.value ? [{ icon: '🔍', emojis: results.value }] : categories.value)
watch(query, (value) => {
	activeTab.value = 'tab-0'
	// Les smileys maison répondent sans rien charger : la grille se remplit tout
	// de suite, les emojis unicode arrivent au retour de la promesse.
	if (value && !keywordsLoaded.value) { loadEmojiKeywords().then(() => keywordsLoaded.value = true) }
})

function pick(emoji: string) {
	emit('pick', emoji.replace('&lt;', '<'))
	if (props.closeOnSelected) shown.value = false
}
</script>

<style lang="scss" scoped>
	.chat-input-emoji {
		width: 40px;
		height: 40px;
		padding: 8px;
		cursor: pointer;
		div {
			font-size: 20px;
		}
	}
	.search {
		padding: 6px 6px 0;
	}
	.no-result {
		padding: 24px 8px;
		text-align: center;
		color: var(--text-color-secondary);
	}
	.tab :deep(.emoji) {
		font-size: 20px;
	}
	.indicator {
		background: var(--primary-surface);
	}
	.tabs {
		// height: 264px;
	}
	.tabs :deep(.v-slide-group) {
		height: 38px;
	}
	.tabs :deep(.v-tabs__items) {
		background: #f5f5f5;
	}
	.tab {
		font-size: 20px;
	}
	.tabs :deep(.v-tab) {
		min-width: 20px !important;
		width: 20px;
		// Les 10 onglets (⭐ + les 9 groupes d'Unicode) doivent tenir dans les
		// 352px du panneau, qui n'affiche pas de flèches de défilement : les 3px
		// de marge par défaut de chaque côté les poussaient à 380px.
		margin: 0;
	}
	.content {
		overflow: auto;
		background: var(--background);
	}
	.grid {
		padding: 8px;
		height: 226px;
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(32px, 1fr));
		grid-auto-rows: minmax(min-content, max-content);
	}
	.v-menu--inline {
		display: block;
	}
	.emoji {
		border-radius: var(--radius-tiny);
		cursor: pointer;
		padding: 2px;
		vertical-align: middle;
		font-size: 22px;
		line-height: 28px;
		text-align: center;
	}
	.emoji.classic {
		width: 32px;
		height: 32px;
		padding: 4px;
	}
	.emoji:hover {
		// Le survol officiel du design : la surface de rangée, qui suit le
		// thème. --grey-11 est un gris de l'échelle claire jamais redéfini en
		// sombre — le survol y posait un carré presque blanc.
		background: var(--background-row);
	}
</style>