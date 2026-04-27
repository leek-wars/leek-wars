<template lang="html">
	<div class="problems-details">
		<div class="filter-bar">
			<span v-if="analyzer.error_count" :class="['filter-btn', 'error', { active: filterErrors }]" @click="toggleFilter(0)">
				<v-icon>mdi-close-circle-outline</v-icon> {{ analyzer.error_count }}
			</span>
			<span v-if="analyzer.warning_count" :class="['filter-btn', 'warning', { active: filterWarnings }]" @click="toggleFilter(1)">
				<v-icon>mdi-alert-circle-outline</v-icon> {{ analyzer.warning_count }}
			</span>
			<span v-if="analyzer.todo_count" :class="['filter-btn', 'todo', { active: filterTodos }]" @click="toggleFilter(2)">
				<v-icon>mdi-format-list-checks</v-icon> {{ analyzer.todo_count }}
			</span>
		</div>
		<div v-for="(ais, entrypoint) in analyzer.problems" :key="entrypoint">
			<div v-for="(problems, ai) in ais" :key="ai">
				<template v-if="filteredCount(problems) && getAI(ai)">
					<div class="file" @click="toggleProblemFile(entrypoint + ai)">
						<v-icon>{{ problemsCollapsed[entrypoint + ai] ? 'mdi-chevron-right' : 'mdi-chevron-down' }}</v-icon>
						<span v-if="getAI(ai)!.entrypoints.length > 1 && fileSystem.ais[entrypoint]">{{ fileSystem.ais[entrypoint].name }} {{ ' ➞ ' }}</span>
						{{ ai }}
						<span v-if="filterErrors && getAI(ai)!.errors" class="count error">{{ getAI(ai)!.errors }}</span>
						<span v-if="filterWarnings && getAI(ai)!.warnings" class="count warning">{{ getAI(ai)!.warnings }}</span>
						<span v-if="filterTodos && getAI(ai)!.todos" class="count todo">{{ getAI(ai)!.todos }}</span>
					</div>
					<div v-if="!problemsCollapsed[entrypoint + ai]">
						<div v-for="(problem, p) in filteredProblems(problems)" :key="p" class="problem" @click="jumpProblem(ai, problem)">
							<v-icon v-if="problem.level === 0" class="error">mdi-close-circle-outline</v-icon>
							<v-icon v-else-if="problem.level === 1" class="warning">mdi-alert-circle-outline</v-icon>
							<v-icon v-else class="todo">mdi-format-list-checks</v-icon>
							{{ problem.info }}
							<span class="line">ligne {{ problem.start_line }} [{{ problem.start_column }} : {{ problem.end_column }}]</span>
						</div>
					</div>
				</template>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { AI } from '@/model/ai'
import { fileSystem } from '@/model/filesystem'
import { mixins } from '@/model/i18n'
import { reactive, ref } from 'vue'
import { analyzer } from './analyzer'

defineOptions({ name: 'editor-problems', i18n: {}, mixins: [...mixins] })

const emit = defineEmits<{
	'jump': [ai: AI, line: number, column: number]
}>()

const problemsCollapsed = reactive<{[key: string]: boolean}>({})
const filterErrors = ref(localStorage.getItem('editor/filter-errors') !== 'false')
const filterWarnings = ref(localStorage.getItem('editor/filter-warnings') !== 'false')
const filterTodos = ref(localStorage.getItem('editor/filter-todos') !== 'false')

function toggleProblemFile(ai: string) {
	problemsCollapsed[ai] = !problemsCollapsed[ai]
}

function toggleFilter(level: number) {
	if (level === 0) {
		filterErrors.value = !filterErrors.value
		localStorage.setItem('editor/filter-errors', '' + filterErrors.value)
	} else if (level === 1) {
		filterWarnings.value = !filterWarnings.value
		localStorage.setItem('editor/filter-warnings', '' + filterWarnings.value)
	} else {
		filterTodos.value = !filterTodos.value
		localStorage.setItem('editor/filter-todos', '' + filterTodos.value)
	}
}

function filteredProblems(problems: any[]) {
	return problems.filter(p =>
		(p.level === 0 && filterErrors.value) ||
		(p.level === 1 && filterWarnings.value) ||
		(p.level === 2 && filterTodos.value)
	)
}

function filteredCount(problems: any[]) {
	return filteredProblems(problems).length
}

function getAI(path: string): AI | undefined {
	return fileSystem.ais[path]
}

function jumpProblem(path: string, problem: any) {
	const ai = getAI(path)
	if (ai) {
		emit('jump', ai, problem.start_line, problem.start_column)
	}
}
</script>

<style lang="scss" scoped>
.problems-details {
	background: var(--background);;
	border-top: 1px solid var(--border);
	overflow-y: auto;
	position: relative;
	height: 100%;
	.filter-bar {
		display: flex;
		gap: 4px;
		padding: 4px 6px;
		border-bottom: 1px solid var(--border);
		.filter-btn {
			display: flex;
			align-items: center;
			gap: 3px;
			padding: 2px 8px;
			border-radius: 10px;
			font-size: 13px;
			font-weight: 500;
			cursor: pointer;
			user-select: none;
			opacity: 0.35;
			border: 1px solid transparent;
			.v-icon { font-size: 16px; color: inherit; }
			&.active { opacity: 1; border-color: currentColor; }
			&.error { color: red; }
			&.warning { color: #ff9100; }
			&.todo { color: #0099ff; }
		}
	}
	.v-icon {
		font-size: 20px;
		color: var(--text-color);
	}
	.file {
		display: flex;
		align-items: center;
		padding: 5px 0;
		cursor: pointer;
		user-select: none;
		&:hover {
			background: var(--pure-white);
		}
		.count {
			padding: 1px 6px;
			margin-left: 5px;
			border-radius: 10px;
			font-size: 13px;
			border-width: 1px;
			border-style: solid;
			font-weight: 500;
		}
	}
	.problem {
		display: flex;
		align-items: center;
		padding: 5px 0;
		padding-left: 20px;
		cursor: pointer;
		&:hover {
			background: var(--pure-white);
		}
		.line {
			padding-left: 6px;
			color: #999;
			user-select: none;
			flex-shrink: 0;
			padding-right: 8px;
		}
	}
	.error {
		color: red;
		margin-right: 4px;
	}
	.warning {
		color: #ff9100;
		margin-right: 4px;
	}
	.todo {
		color: #0099ff;
		margin-right: 4px;
	}
}
</style>