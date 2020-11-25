<template lang="html">
	<div class="problems-details">
		<div v-for="(ais, entrypoint) in LeekWars.analyzer.problems" :key="entrypoint">
			<div v-for="(problems, ai) in ais" v-if="problems.length" :key="ai">
				<div class="file" @click="toggleProblemFile(entrypoint + ai)">
					<v-icon>{{ problemsCollapsed[entrypoint + ai] ? 'mdi-chevron-right' : 'mdi-chevron-down' }}</v-icon>
					<span v-if="fileSystem.aiByFullPath[ai].entrypoints.length > 1">{{ fileSystem.ais[entrypoint].name }} {{ ' ➞ ' }}</span>
					{{ ai }}
					<span v-if="fileSystem.aiByFullPath[ai].errors" class="count error">{{ fileSystem.aiByFullPath[ai].errors }}</span>
					<span v-if="fileSystem.aiByFullPath[ai].warnings" class="count warning">{{ fileSystem.aiByFullPath[ai].warnings }}</span>
					<span v-if="fileSystem.aiByFullPath[ai].todos" class="count todo">{{ fileSystem.aiByFullPath[ai].todos }}</span>
				</div>
				<div v-if="!problemsCollapsed[entrypoint + ai]">
					<div v-for="(problem, p) in problems" :key="p" class="problem" @click="jumpProblem(ai, problem)">
						<v-icon v-if="problem[4] === 0" class="error">mdi-close-circle-outline</v-icon>
						<v-icon v-else-if="problem[4] === 1" class="warning">mdi-alert-circle-outline</v-icon>
						<v-icon v-else class="todo">mdi-format-list-checks</v-icon>
						<!-- {{ $t('ls_error.' + problem[5], problem[6]) }} -->
						{{ problem[5] }}
						<span class="line">ligne {{ problem[0] }} [{{ problem[1] }} : {{ problem[3] }}]</span>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script lang="ts">
	import { AI } from '@/model/ai'
	import { fileSystem } from '@/model/filesystem'
	import { i18n, mixins } from '@/model/i18n'
	import { LeekWars } from '@/model/leekwars'
	import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
	import EditorFolder from './editor-folder.vue'
	import { Folder } from './editor-item'

	@Component({ name: 'editor-problems', i18n: {}, mixins })
	export default class Explorer extends Vue {

		problemsCollapsed: {[key: string]: boolean} = {}

		toggleProblemFile(ai: string) {
			Vue.set(this.problemsCollapsed, ai, !this.problemsCollapsed[ai])
		}
	}
</script>

<style lang="scss" scoped>
.problems-details {
	background: white;
	border-top: 1px solid #ddd;
	overflow-y: auto;
	position: relative;
	height: 100%;
	.v-icon {
		font-size: 20px;
	}
	.file {
		display: flex;
		align-items: center;
		padding: 5px 0;
		cursor: pointer;
		user-select: none;
		&:hover {
			background: #eee;
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
			background: #eee;
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