<template functional>
	<pre :class="parent.LeekWars.logClass(props.log)" :style="{color: parent.LeekWars.logColor(props.log)}">[<leek :leek="props.leeks[props.log[0]]" :dark="false" />] <span class="help" v-if="props.log[3] === 113">{{ parent.$t('fight.help_page') }} <router-link :to="'/encyclopedia/' + parent.LeekWars.logHelpPage(props.log)">📖 {{ parent.LeekWars.logText(props.log) }}</router-link></span><span v-else>{{ parent.LeekWars.logText(props.log) }}</span></pre>
</template>

<script lang="ts">
	import { Component, Prop, Vue } from 'vue-property-decorator'

	@Component({})
	export default class ActionLog extends Vue {
		@Prop({required: true}) leeks!: {[key: number]: any}
		@Prop({required: true}) log!: any
	}
</script>