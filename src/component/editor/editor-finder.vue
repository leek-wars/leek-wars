<template lang="html">
	<div v-if="value" class="finder" @click.stop>
		<input v-if="search" ref="input" v-model="query" class="input" type="text" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" @keyup.stop @change="change" @keydown="keydown">
		<div ref="list" class="results">
			<div v-for="(result, r) of results" :key="result.ai.path" class="result active" :class="{selected: selected === r}" @click="go(result.ai)">
				<v-icon v-if="result.ai.errors" class="icon error">mdi-close-circle</v-icon>
				<v-icon v-else-if="result.ai.warnings" class="icon warning">mdi-alert-circle</v-icon>
				<v-icon v-else class="icon valid">mdi-check-bold</v-icon>
				<!-- {{ result.score.toFixed(5) }} -->
				<span v-for="(part, i) of result.name" :key="i">
					<b v-if="i % 2">{{ part }}</b>
					<span v-else>{{ part }}</span>
				</span>
				<span v-if="result.type === 1" class="path">{{ result.ai.folderpath }}</span>
				<div class="fill"></div>
				<v-icon v-if="result.ai.modified" class="modified">mdi-record</v-icon>
				<!-- <v-icon class="icon">mdi-close</v-icon> -->
			</div>
			<div v-if="results.length === 0" class="result">Aucun résultat</div>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { AI } from '@/model/ai'
	import { fileSystem } from '@/model/filesystem'
	import { computed, nextTick, ref } from 'vue'
	import { useRoute, useRouter } from 'vue-router'

	defineOptions({ name: 'editor-finder' })

	const props = defineProps<{
		active: {[key: number]: AI}
		history: AI[]
	}>()

	const route = useRoute()
	const router = useRouter()

	const search = ref(true)
	const query = ref('')
	const value = ref(false)
	const selected = ref(0)
	const input = ref<HTMLElement | null>(null)
	const list = ref<HTMLElement | null>(null)

	const results = computed(() => {
		const result = []
		const queryLower = query.value.toLocaleLowerCase()

		if (query.value.length === 0) {
			for (const ai of props.history) {
				if (fileSystem.isInBin(ai.folder)) { continue } // Exclude recycle bin AIs
				if (isClosed(ai)) continue // Closed folder
				result.push({ai, score: 0, name: [ai.name], type: 1})
			}
		} else {
			for (const path in fileSystem.aiByFullPath) {
				const ai = fileSystem.aiByFullPath[path]
				if (fileSystem.isInBin(ai.folder)) { continue } // Exclude recycle bin AIs
				if (isClosed(ai)) continue // Closed folder
				const s = score(path, ai.name, query.value, queryLower)
				if (s.score < 9999) {
					if (ai.path in props.active) { s.score *= 0.25 }
					result.push({ai, score: s.score, name: s.parts, type: s.type})
				}
			}
		}
		result.sort((a, b) => a.score - b.score)
		return result
	})

	function isClosed(ai: AI) {
		let folder = fileSystem.folderById[ai.folder]
		while (folder && folder.id != 0) {
			if (folder.closed) return true
			folder = fileSystem.folderById[folder.parent]
		}
		return false
	}

	function open() {
		value.value = true
		query.value = ''
		if (search.value) {
			setTimeout(() => (input.value as HTMLElement).focus(), 20)
		}
	}
	function close() {
		value.value = false
		selected.value = 0
	}

	function go(ai: AI) {
		if (route.path !== '/editor/' + ai.path) {
			router.push('/editor/' + ai.path)
		}
		close()
	}

	function keydown(event: KeyboardEvent) {
		if (event.which === 40) {
			selected.value = (selected.value + 1) % results.value.length
		} else if (event.which === 38) {
			selected.value--
			if (selected.value < 0) { selected.value = results.value.length - 1 }
		} else if (event.which === 13) {
			go(results.value[selected.value].ai)
			value.value = false
		}
		updateScroll()
	}

	function change() {
		setTimeout(() => {
			selected.value = 0
		}, 20)
	}

	function previous() {
		selected.value = (selected.value + 1) % results.value.length
		updateScroll()
	}

	function next() {
		selected.value--
		if (selected.value < 0) { selected.value = results.value.length - 1 }
		updateScroll()
	}

	function updateScroll() {
		nextTick(() => {
			const height = 30
			const l = list.value as HTMLElement
			if (l) {
				if (l.scrollTop < (selected.value - 8) * height) {
					l.scrollTop = (selected.value - 8) * height
				} else if (l.scrollTop > (selected.value - 2) * height) {
					l.scrollTop = (selected.value - 2) * height
				}
			}
		})
	}

	function score(path: string, file: string, query: string, query_lower: string) {
		const X = 0.05
		const s1 = score_aux(path, query, query_lower)
		s1.score *= (1 + X)
		const s2 = score_aux(file, query, query_lower)
		s2.type = 1
		const s3 = score_separators(path, query, query_lower)
		s3.score *= (1 + 3 * X)
		const s4 = score_separators(file, query, query_lower)
		s4.type = 1
		s4.score *= (1 + 2 * X)
		return [s1, s2, s3, s4].reduce((min, s) => s.score < min.score ? s : min, {score: 999999, parts: [], type: 0})
	}

	function score_aux(str: string, query: string, query_lower: string) {
		const str_lower = str.toLocaleLowerCase()
		let index = 0
		const parts = []
		let score = str.length / 100
		const fullUpper = str.toLocaleUpperCase() === str
		for (let q = 0; q < query.length; ++q) {
			const i = str_lower.indexOf(query_lower[q], index)
			if (i === -1) { return {score: 9999, parts, type: 0} }
			parts.push(str.substring(index, i))
			parts.push(str.substring(i, i + 1))
			let distance = i - index
			if (q === 0) {
				distance /= 500
			}
			if (str[i - 1] === '_' || str[i - 1] === '/' || str[i - 1] === ' ' || str[i - 1] === '-' || str[i - 1] === '.' || (!fullUpper && isUpper(str[i]))) {
				distance /= 1000
			}
			if (str[i] !== query[q]) { distance += 0.001 }
			score = (score + distance) / Math.max(1, q)
			index = i + 1
		}
		parts.push(str.substring(index))
		return {score, parts, type: 0}
	}

	function score_separators(str: string, query: string, query_lower: string) {
		const s = separators(str)
		const parts = []
		let score = 0
		let index = 0
		for (let q = 0; q < query.length; ++q) {
			const i = s.lower_chars.indexOf(query_lower[q], index)
			if (i === -1) { return {score: 9999, parts, type: 0} }
			parts.push(str.substring(s.pos[index - 1] + 1, s.pos[i]))
			parts.push(str.substring(s.pos[i], s.pos[i] + 1))
			let distance = i - index
			if (q === 0) { distance /= 500 }
			if (s.chars[i] !== query[q]) { distance += 0.001 }
			score = (score + distance)
			index = i + 1
		}
		score += 0.001 * (s.chars.length - query.length)
		parts.push(str.substring(s.pos[index - 1] + 1))
		return {score, parts, type: 0}
	}

	function isUpper(str: string) {
		return str >= 'A' && str <= 'Z'
	}

	function separators(str: string) {
		let chars = ""
		let lower_chars = ""
		const pos = []
		const fullUpper = str.toLocaleUpperCase() === str
		for (let i = 0; i < str.length; ++i) {
			if (i === 0 || str[i - 1] === '_' || str[i - 1] === '/' || str[i - 1] === ' ' || str[i - 1] === '-' || str[i - 1] === '.' || (!fullUpper && isUpper(str[i]))) {
				chars += str[i]
				lower_chars += str[i].toLocaleLowerCase()
				pos.push(i)
			}
		}
		return {chars, lower_chars, pos}
	}

	defineExpose({ open, close, previous, next })
</script>

<style lang="scss" scoped>
    .finder {
		position: absolute;
		top: 36px;
		left: calc(50% - 250px);
		width: 500px;
		background: var(--background-secondary);
		border-radius: 5px;
		box-shadow: 0px 3px 5px -1px rgba(0, 0, 0, 0.2), 0px 5px 8px 0px rgba(0, 0, 0, 0.14), 0px 1px 14px 0px rgba(0, 0, 0, 0.12);
		z-index: 10;
		max-height: 395px;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}
	.input {
		width: 100%;
		padding: 8px;
		flex: 36px 0 0;
		border: none;
		border-bottom: 1px solid var(--border);
		border-top-left-radius: 5px;
		border-top-right-radius: 5px;
	}
	.results {
		overflow-y: auto;
		height: 100%;
	}
	.result {
		padding: 6px;
		padding-left: 10px;
		display: flex;
		align-items: center;
		.fill {
			flex: 1
		}
		.v-icon {
			color: var(--text-color);
			font-size: 14px;
			margin-right: 6px;
			&.valid {
				color: #5fad1b;
			}
			&.error {
				color: red
			}
			&.warning {
				color: #ff9100;
			}
		}
		&.active {
			cursor: pointer;
			&:hover {
				background: var(--pure-white);
			}
		}
		&.selected {
			background: var(--pure-white);
		}
		.path {
			color: var(--text-color-secondary);
			padding-left: 10px;
		}
		b {
			color: var(--pure-black);
		}
	}
</style>
