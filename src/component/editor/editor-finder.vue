<template lang="html">
	<div v-if="value" class="finder" @click.stop>
		<input ref="input" v-model="query" class="input" type="text" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" @change="change" @keydown="keydown">
		<div ref="list" class="results">
			<div v-for="(result, r) of results" :key="result.ai.id" class="result active" :class="{selected: selected === r}" @click="go(result.ai)">
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
				<!-- <v-icon class="icon">mdi-close</v-icon> -->
			</div>
			<div v-if="results.length === 0" class="result">Aucun résultat</div>
		</div>
	</div>
</template>

<script lang="ts">
	import { AI } from '@/model/ai'
	import { i18n } from '@/model/i18n'
	import { LeekWars } from '@/model/leekwars'
	import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
	import EditorAI from './editor-ai.vue'
	import { Folder, AIItem } from './editor-item'
	import { explorer } from './explorer'
	import { fileSystem } from '@/model/filesystem'

	@Component({ name: 'editor-finder', components: { } })
	export default class EditorFinder extends Vue {
		@Prop({required: true}) active!: {[key: number]: AI}
		query: string = ''
		value: boolean = false
		selected: number = 0

		get results() {
			let result = []
			const queryLower = this.query.toLocaleLowerCase()

			if (this.query.length === 0) {
				for (const id in this.active) {
					const ai = this.active[id]
					result.push({ai, score: 0, name: [ai.name], type: 1})
				}
			} else {
				for (const path in fileSystem.aiByFullPath) {
					const ai = fileSystem.aiByFullPath[path]
					const s = this.score(path, ai.name, this.query, queryLower)
					if (s.score < 9999) {
						if (ai.id in this.active) { s.score *= 0.25 }
						result.push({ai, score: s.score, name: s.parts, type: s.type})
					}
				}
			}
			result.sort((a, b) => a.score - b.score)
			return result
		}

		open() {
			this.value = true
			this.query = ''
			setTimeout(() => (this.$refs.input as HTMLElement).focus(), 20)
		}
		close() {
			this.value = false
		}

		go(ai: AI) {
			if (this.$route.path !== '/editor/' + ai.id) {
				this.$router.push('/editor/' + ai.id)
			}
			this.value = false
		}

		keydown(event: KeyboardEvent) {
			if (event.which === 40) {
				this.selected = (this.selected + 1) % this.results.length
			} else if (event.which === 38) {
				this.selected--
				if (this.selected < 0) { this.selected = this.results.length - 1 }
			} else if (event.which === 13) {
				this.go(this.results[this.selected].ai)
				this.value = false
			}
			Vue.nextTick(() => {
				const height = 30
				if (this.$refs.list.scrollTop < (this.selected - 8) * height) {
					this.$refs.list.scrollTop = (this.selected - 8) * height
				} else if (this.$refs.list.scrollTop > (this.selected - 2) * height) {
					this.$refs.list.scrollTop = (this.selected - 2) * height
				}
			})
		}

		change() {
			setTimeout(() => {
				this.selected = 0
			}, 20)
		}

		score(path: string, file: string, query: string, query_lower: string) {
			const X = 0.05
			const s1 = this.score_aux(path, query, query_lower)
			s1.score *= (1 + X)
			const s2 = this.score_aux(file, query, query_lower)
			s2.type = 1
			const s3 = this.score_separators(path, query, query_lower)
			s3.score *= (1 + 3 * X)
			const s4 = this.score_separators(file, query, query_lower)
			s4.type = 1
			s4.score *= (1 + 2 * X)
			return [s1, s2, s3, s4].reduce((min, s) => s.score < min.score ? s : min, {score: 999999, parts: [], type: 0})
		}

		score_aux(str: string, query: string, query_lower: string) {
			const str_lower = str.toLocaleLowerCase()
			let index = 0
			let parts = []
			let score = 0
			let fullUpper = str.toLocaleUpperCase() === str
			for (let q = 0; q < query.length; ++q) {
				const i = str_lower.indexOf(query_lower[q], index)
				if (i === -1) { return {score: 9999, parts, type: 0} }
				parts.push(str.substring(index, i))
				parts.push(str.substring(i, i + 1))
				let distance = i - index
				if (q == 0) {
					distance /= 500
				}
				if (str[i - 1] === '_' || str[i - 1] === '/' || str[i - 1] === ' ' || str[i - 1] === '-' || str[i - 1] === '.' || (!fullUpper && this.isUpper(str[i]))) {
					distance /= 1000
				}
				if (str[i] != query[q]) { distance += 0.001 }
				score = (score + distance) / Math.max(1, q)
				index = i + 1
			}
			parts.push(str.substring(index))
			return {score, parts, type: 0}
		}

		score_separators(str: string, query: string, query_lower: string) {
			const s = this.separators(str)
			const str_lower = str.toLocaleLowerCase()
			let parts = []
			let score = 0
			let index = 0
			for (let q = 0; q < query.length; ++q) {
				const i = s.lower_chars.indexOf(query_lower[q], index)
				if (i === -1) { return {score: 9999, parts, type: 0} }
				parts.push(str.substring(s.pos[index - 1] + 1, s.pos[i]))
				parts.push(str.substring(s.pos[i], s.pos[i] + 1))
				let distance = i - index
				if (q == 0) { distance /= 500 }
				if (s.chars[i] != query[q]) { distance += 0.001 }
				score = (score + distance) // / Math.max(1, q)
				index = i + 1
			}
			score += 0.001 * (s.chars.length - query.length)
			parts.push(str.substring(s.pos[index - 1] + 1))
			return {score, parts, type: 0}
		}

		isUpper(str: string) {
			return str >= 'A' && str <= 'Z'
		}

		separators(str: string) {
			let chars = ""
			let lower_chars = ""
			let pos = []
			let fullUpper = str.toLocaleUpperCase() === str
			for (let i = 0; i < str.length; ++i) {
				if (i === 0 || str[i - 1] === '_' || str[i - 1] === '/' || str[i - 1] === ' ' || str[i - 1] === '-' || str[i - 1] === '.' || (!fullUpper && this.isUpper(str[i]))) {
					chars += str[i]
					lower_chars += str[i].toLocaleLowerCase()
					pos.push(i)
				}
			}
			return {chars, lower_chars, pos}
		}
	}
</script>

<style lang="scss" scoped>
    .finder {
		position: absolute;
		top: 36px;
		left: calc(50% - 250px);
		width: 500px;
		background: #f2f2f2;
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
		border-bottom: 1px solid #ddd;
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
		color: #444;
		display: flex;
		align-items: center;
		.fill {
			flex: 1
		}
		.v-icon {
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
				background: white;
			}
		}
		&.selected {
			background: #ddd;
		}
		.path {
			color: #888;
			padding-left: 10px;
		}
		b {
			color: black;
		}
	}
</style>