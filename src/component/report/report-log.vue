<template functional>
	<pre :l="props.action" :i="props.index" :class="parent.LeekWars.logClass(props.log)" :style="{color: parent.LeekWars.logColor(props.log)}">[<leek :leek="props.leeks[props.log[0]]" :dark="false" />] <span class="help" v-if="props.log[3] === 113">{{ parent.$t('fight.help_page') }} <router-link :to="'/encyclopedia/' + parent.LeekWars.logHelpPage(props.log)">📖 {{ parent.LeekWars.logText(props.log) }}</router-link></span><span v-else>{{ parent.LeekWars.logText(props.log) }}</span> <span v-if="props.lines && props.log[4] && parent.fileSystem.ais[props.log[4]]" class="ai" @click="parent.goToAI(props.log[4], props.log[5], props.log)">[{{ parent.fileSystem.ais[props.log[4]].path }}:{{ props.log[5] }}]</span></pre>
</template>

<script lang="ts">
	import { Component, Prop, Vue } from 'vue-property-decorator'

	@Component({})
	export default class ActionLog extends Vue {
		@Prop({required: true}) leeks!: {[key: number]: any}
		@Prop({required: true}) log!: any
		@Prop({required: true}) action!: number
		@Prop({required: true}) index!: number
		@Prop({required: true}) lines!: boolean
	}
</script>