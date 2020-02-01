<template lang="html">
	<fast-tooltip :open-delay="0" :close-delay="0" :disabled="disabled" bottom @input="open()">
		<template v-slot:activator="{ on }">
			<span v-on="on">
				<slot name="activator"></slot>
			</span>
		</template>
		<slot></slot>
	</fast-tooltip>
</template>

<script lang="ts">
	import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
	@Component({ name: "tooltip" })
	export default class Tooltip extends Vue {
		@Prop() disabled!: boolean
		content_created: boolean = true
		open() {
			this.content_created = true
		}
	}
</script>