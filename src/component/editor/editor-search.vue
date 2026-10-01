<template lang="html">
	<div class="editor-search">
		<div class="search-form">
			<div class="search-field">
				<input ref="input" v-model="query" :placeholder="$t('placeholder')" class="search-input" type="text" spellcheck="false" @keyup.stop @keydown.enter="run" @keydown.esc="query = ''">
				<span :class="{active: caseSensitive}" :title="$t('match_case')" class="option" @click="toggle('case')"><v-icon>mdi-format-letter-case</v-icon></span>
				<span :class="{active: wholeWord}" :title="$t('whole_word')" class="option" @click="toggle('word')"><v-icon>mdi-format-letter-matches</v-icon></span>
				<span :class="{active: regex}" :title="$t('regex')" class="option" @click="toggle('regex')"><v-icon>mdi-regex</v-icon></span>
			</div>
			<!-- Allumé quand une option du menu s'écarte du réglage par défaut : sinon on
			oublierait qu'elle change les résultats. -->
			<v-menu location="bottom end" offset="4">
				<template #activator="{ props: p }">
					<span v-bind="p" :class="{active: includeClosed}" :title="$t('options')" class="option"><v-icon>mdi-dots-vertical</v-icon></span>
				</template>
				<v-list density="compact">
					<v-list-item @click="includeClosed = !includeClosed">
						<template #prepend><v-icon>{{ includeClosed ? 'mdi-checkbox-marked' : 'mdi-checkbox-blank-outline' }}</v-icon></template>
						<v-list-item-title>{{ $t('include_closed') }}</v-list-item-title>
					</v-list-item>
				</v-list>
			</v-menu>
		</div>

		<div class="summary">
			<span v-if="error" class="error">{{ $t('invalid_regex') }}</span>
			<template v-else-if="loading">
				<loader :size="14" />
				<span v-if="progress">{{ $t('loading', [progress.done, progress.total]) }}</span>
			</template>
			<template v-else-if="searched">
				<span v-if="!results.length">{{ $t('no_results') }}</span>
				<span v-else>{{ $t('n_matches', matchCount) }} · {{ $t('n_files', results.length) }}</span>
				<span v-if="truncated" class="warning">{{ $t('truncated', [MAX_MATCHES]) }}</span>
				<span v-if="failed" class="error">{{ $t('load_error') }}</span>
				<span v-if="skipped" :title="$t('skipped_desc')">{{ $t('skipped', skipped) }}</span>
			</template>
		</div>

		<div v-autostopscroll class="results">
			<div v-for="result in results" :key="result.ai.path" class="result">
				<div class="file" :title="result.ai.path" @click="collapsed[result.ai.path] = !collapsed[result.ai.path]">
					<v-icon class="chevron">{{ collapsed[result.ai.path] ? 'mdi-chevron-right' : 'mdi-chevron-down' }}</v-icon>
					<span class="name">{{ result.ai.name }}</span>
					<span class="folder ellipsis">{{ result.ai.folderpath }}</span>
					<span class="count">{{ result.matches.length }}</span>
				</div>
				<template v-if="!collapsed[result.ai.path]">
					<div v-for="(m, i) in result.matches" :key="i" :title="$t('line', [m.line])" class="match" @click="emit('jump', result.ai, m.line, m.column, m.length)">
						<span class="text">{{ m.before }}<mark>{{ m.match }}</mark>{{ m.after }}</span>
					</div>
				</template>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { AI } from '@/model/ai'
import { mixins } from '@/model/i18n'
import { setLocalStorageSafe } from '@/model/storage'
import { nextTick, reactive, ref, shallowRef, useTemplateRef, watch } from 'vue'
import { buildSearchRegExp, searchText, type SearchMatch } from './search'
import { loadSources, searchableAIs } from './search-sources'

defineOptions({ name: 'EditorSearch', i18n: {}, mixins: [...mixins] })

const emit = defineEmits<{
	'jump': [ai: AI, line: number, column: number, length: number]
}>()

// Au-delà, on arrête de chercher : un seul caractère sur une grosse IA donnerait des
// dizaines de milliers de lignes à afficher.
const MAX_MATCHES = 5000

const input = useTemplateRef<HTMLInputElement>('input')
const query = ref('')
const caseSensitive = ref(localStorage.getItem('editor/search/case') === 'true')
const wholeWord = ref(localStorage.getItem('editor/search/word') === 'true')
const regex = ref(localStorage.getItem('editor/search/regex') === 'true')
const includeClosed = ref(localStorage.getItem('editor/search/include-closed') === 'true')

const results = shallowRef<{ ai: AI, matches: SearchMatch[] }[]>([])
const matchCount = ref(0)
const collapsed = reactive<{[path: string]: boolean}>({})
const loading = ref(false)
const progress = ref<{ done: number, total: number } | null>(null)
const searched = ref(false)
const truncated = ref(false)
const failed = ref(false)
const skipped = ref(0)
const error = ref(false)

// Chaque recherche porte un numéro : une recherche plus ancienne qui finit de charger
// après une plus récente n'écrase pas ses résultats.
let runId = 0
let debounce: ReturnType<typeof setTimeout> | null = null

function toggle(option: 'case' | 'word' | 'regex') {
	const r = option === 'case' ? caseSensitive : option === 'word' ? wholeWord : regex
	r.value = !r.value
	setLocalStorageSafe('editor/search/' + option, '' + r.value)
}

watch(includeClosed, value => setLocalStorageSafe('editor/search/include-closed', '' + value))

watch([query, caseSensitive, wholeWord, regex, includeClosed], () => {
	if (debounce) { clearTimeout(debounce) }
	debounce = setTimeout(run, 250)
})

function clear() {
	results.value = []
	matchCount.value = 0
	searched.value = false
	truncated.value = false
	failed.value = false
	skipped.value = 0
	loading.value = false
	progress.value = null
}

async function run() {
	if (debounce) { clearTimeout(debounce); debounce = null }
	const id = ++runId
	error.value = false
	let re: RegExp | null
	try {
		re = buildSearchRegExp({ query: query.value, caseSensitive: caseSensitive.value, wholeWord: wholeWord.value, regex: regex.value })
	} catch {
		clear()
		error.value = true
		return
	}
	if (!re) { clear(); return }

	const ais = searchableAIs(includeClosed.value)
	loading.value = true
	progress.value = null
	const loaded = await loadSources(ais, (done, total) => {
		if (id === runId) { progress.value = { done, total } }
	}, () => id !== runId)
	if (id !== runId) { return }

	const found: { ai: AI, matches: SearchMatch[] }[] = []
	let count = 0
	for (const ai of ais) {
		const code = loaded.sources.get(ai.path)
		if (code === undefined) { continue }
		const matches = searchText(code, re, MAX_MATCHES - count)
		if (matches.length) {
			found.push({ ai, matches })
			count += matches.length
			if (count >= MAX_MATCHES) { break }
		}
	}
	results.value = found
	matchCount.value = count
	truncated.value = count >= MAX_MATCHES
	failed.value = loaded.failed
	skipped.value = loaded.skipped
	searched.value = true
	loading.value = false
	progress.value = null
}

/**
 * Donne le focus au champ, pré-rempli avec la sélection de l'éditeur s'il y en a une
 * (comme VS Code). Appelé par editor.vue à l'ouverture de l'onglet et par Ctrl+Shift+F,
 * jamais au montage : un rechargement sur l'onglet Recherche laisse le focus au code.
 */
function focus(selection?: string) {
	if (selection) {
		query.value = selection
	}
	// Après le rendu : sélectionner avant que v-model ait écrit le texte pré-rempli dans le
	// champ ne sélectionnerait rien, et la frappe suivante s'ajouterait au lieu de remplacer.
	nextTick(() => {
		input.value?.focus()
		input.value?.select()
	})
}

defineExpose({ focus })
</script>

<style lang="scss" scoped>
.editor-search {
	display: flex;
	flex-direction: column;
	min-height: 0;
	flex: 1;
	font-size: 13px;
}
.search-form {
	padding: 8px;
	display: flex;
	align-items: center;
	gap: 2px;
}
.search-field {
	flex: 1;
	min-width: 0;
	display: flex;
	align-items: center;
	border: 1px solid var(--border);
	border-radius: var(--radius);
	background: var(--pure-white);
	padding-right: 2px;
	&:focus-within {
		border-color: var(--primary);
	}
}
.search-input {
	flex: 1;
	min-width: 0;
	border: none;
	outline: none;
	background: transparent;
	color: var(--text-color);
	padding: 5px 6px;
	font-size: 13px;
}
.option {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 22px;
	height: 22px;
	border-radius: var(--radius);
	cursor: pointer;
	opacity: 0.45;
	border: 1px solid transparent;
	.v-icon {
		font-size: 17px;
		color: var(--text-color);
	}
	&:hover {
		opacity: 0.8;
	}
	&.active {
		opacity: 1;
		border-color: var(--primary);
	}
}
.summary {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 4px 8px;
	padding: 0 8px 6px;
	color: var(--text-color-secondary);
	.error {
		color: red;
	}
	.warning {
		color: #ff9100;
	}
}
.results {
	flex: 1;
	min-height: 0;
	overflow-y: auto;
	overflow-x: hidden;
}
.file {
	display: flex;
	align-items: center;
	gap: 4px;
	padding: 3px 6px 3px 2px;
	cursor: pointer;
	user-select: none;
	&:hover {
		background: var(--pure-white);
	}
	.chevron {
		font-size: 18px;
		color: var(--text-color);
	}
	.name {
		font-weight: 500;
		white-space: nowrap;
	}
	.folder {
		flex: 1;
		min-width: 0;
		color: var(--text-color-secondary);
		font-size: 12px;
	}
	.count {
		padding: 0 6px;
		border-radius: var(--radius-large);
		background: var(--background-secondary);
		color: var(--text-color-secondary);
		font-size: 12px;
	}
}
.match {
	padding: 2px 6px 2px 24px;
	cursor: pointer;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	&:hover {
		background: var(--pure-white);
	}
	.text {
		font-family: monospace;
		white-space: pre;
	}
	mark {
		background: rgba(255, 170, 0, 0.35);
		color: inherit;
		border-radius: 2px;
	}
}
</style>
