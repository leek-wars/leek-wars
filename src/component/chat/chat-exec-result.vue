<template lang="html">
	<div class="exec">
		<!-- Exécution lancée, résultat pas encore revenu (paquet CHAT_EXEC_RESULT). -->
		<div v-if="exec.pending" class="pending">
			<v-progress-circular indeterminate size="13" width="2" />
		</div>
		<template v-else>
			<div v-for="(log, l) in logs" :key="l" class="log" :class="LeekWars.logClass(log)" :style="{color: LeekWars.logColor(log)}">{{ LeekWars.logText(log) }}</div>
			<!-- Deux origines d'erreur : un code LeekScript traduit avec ses paramètres (compilation
			     et exécution, comme dans la console), ou un message déjà formaté (polyglot, refus). -->
			<div v-if="exec.error !== undefined" class="line error">{{ $t('leekscript.error_' + exec.error, exec.params ?? [], { escapeParameter: false }) }}</div>
			<div v-else-if="exec.message" class="line error">{{ exec.message }}</div>
			<div v-else-if="exec.result !== undefined" class="line">
				<v-icon class="arrow">mdi-chevron-right</v-icon>
				<lw-code :code="exec.result" single :language="language" />
			</div>
			<!-- « ops » n'est pas traduit, comme dans la console : c'est le nom de l'unité. -->
			<span v-if="exec.ops" class="ops">{{ LeekWars.formatNumber(exec.ops) }} ops</span>
		</template>
	</div>
</template>

<script setup lang="ts">
import type { ChatExec } from '@/model/chat'
import { LeekWars } from '@/model/leekwars'
import { computed } from 'vue'
import LwCode from '../app/code.vue'

defineOptions({ name: 'ChatExecResult', components: { 'lw-code': LwCode } })

const props = defineProps<{
	exec: ChatExec
}>()

// Jeton serveur -> langage de coloration (cf console.vue). Un `/exec` sans langage est du LeekScript.
const LANGUAGES: {[lang: string]: string} = {
	leekscript: 'leekscript',
	js: 'javascript',
	ts: 'typescript',
	python: 'python',
}
const language = computed(() => LANGUAGES[props.exec.lang ?? 'leekscript'] ?? 'leekscript')

const logs = computed(() => props.exec.logs ?? [])
</script>

<style lang="scss" scoped>
	.exec {
		font-family: monospace;
		font-size: 14px;
		margin-top: 2px;
		padding-left: 6px;
		border-left: 2px solid var(--border);
		white-space: pre-wrap;
		word-break: break-word;
	}
	.pending {
		color: var(--text-color-secondary);
		padding: 2px 0;
	}
	// inline-flex, pas flex : la valeur et son coût en opérations restent sur la MÊME ligne
	// (comme dans la console), et passent à la ligne d'eux-mêmes si la bulle est trop étroite.
	.line {
		display: inline-flex;
		align-items: center;
		gap: 2px;
		font-weight: 500;
		vertical-align: middle;
	}
	.arrow {
		font-size: 17px;
		color: var(--text-color);
		opacity: 0.4;
	}
	.error {
		color: var(--error);
	}
	.log.warning {
		color: var(--warning);
	}
	.log.error {
		color: var(--error);
	}
	.ops {
		font-size: 12px;
		color: var(--text-color-secondary);
		margin-left: 8px;
		white-space: nowrap;
	}
	.exec:deep(code) {
		border: none;
		padding: 0;
		background: transparent;
		pre, .pre {
			background: transparent;
		}
	}
</style>
