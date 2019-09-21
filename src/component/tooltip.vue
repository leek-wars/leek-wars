<template lang="html">
	<v-tooltip :open-delay="0" :close-delay="0" bottom :disabled="disabled" @input="open()">
		<slot name="activator" slot="activator"></slot>
		<slot v-if="content_created"></slot>
	</v-tooltip>
</template>

<script lang="ts">
	import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
	@Component({ name: "tooltip" })
	export default class Tooltip extends Vue {
		@Prop() disabled!: boolean
		content_created: boolean = false
		open() {
			this.content_created = true
		}
	}
</script>