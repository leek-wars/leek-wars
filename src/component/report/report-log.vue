<template>
	<pre v-if="leeks[log[0]]" :l="action" :i="index" :class="LeekWars.logClass(log)" :style="{color: LeekWars.logColor(log)}">[<leek :leek="leeks[log[0]]" :dark="false" />] <span class="help" v-if="log[3] === 113">{{ $t('fight.help_page') }} <router-link :to="'/encyclopedia/' + LeekWars.logHelpPage(log)">📖 {{ LeekWars.logText(log) }}</router-link></span><span v-else>{{ LeekWars.logText(log) }}</span> <span v-if="lines && log[4] && fileSystem.ais[log[4]]" class="ai" @click="emit('goToAI', log[4], log[5], log)">[{{ fileSystem.ais[log[4]].path }}:{{ log[5] }}]</span></pre>
</template>

<script lang="ts">
	import { Options, Prop, Vue } from 'vue-property-decorator'
	import ActionLeekElement from './action-leek.vue'
	import { fileSystem } from '@/model/filesystem'

	@Options({ components: { leek: ActionLeekElement } })
	export default class ActionLog extends Vue {
		@Prop({required: true}) leeks!: {[key: number]: any}
		@Prop({required: true}) log!: any
		@Prop({required: true}) action!: number
		@Prop({required: true}) index!: number
		@Prop({required: true}) lines!: boolean

		fileSystem = fileSystem
	}
</script>