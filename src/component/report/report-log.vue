<template>
	<pre v-if="leeks[log[0]]" :l="action" :i="index" :class="LeekWars.logClass(log)" :style="{color: LeekWars.logColor(log)}">[<leek :leek="leeks[log[0]]" :dark="false" />] <span class="help" v-if="log[3] === 113">{{ $t('fight.help_page') }} <router-link :to="'/encyclopedia/' + LeekWars.logHelpPage(log)">📖 {{ LeekWars.logText(log) }}</router-link></span><span v-else>{{ LeekWars.logText(log) }}</span> <span v-if="lines && logAI" class="ai" @click="$emit('goToAI', log[4], log[5], log)">[{{ logAI.path }}:{{ log[5] }}]</span></pre>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Leek from './action-leek.vue'
import { fileSystem } from '@/model/filesystem'

const props = defineProps<{
	leeks: {[key: number]: any}
	log: any
	action: number
	index: number
	lines: boolean
}>()

defineEmits<{
	goToAI: [ai: any, line: any, log: any]
}>()

const logAI = computed(() => fileSystem.ais[props.log[4]])
</script>